"use client"

import { useEffect, useState, useMemo, useRef } from 'react'
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { supabase } from "@/lib/supabaseClient"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    ChartConfig,
    ChartContainer,
    ChartLegend,
    ChartLegendContent,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart"
import { Button } from "@/components/ui/button"
import { AgentSelector } from "./agent-selector"
import { Users, MessageSquare, Activity, Settings, HelpCircle } from "lucide-react"

// --- Configurações Visuais ---

// Paleta de tons de azul
const BLUE_PALETTE = [
    "#3b82f6", // Vivid Blue
    "#ffffff", // White
    "#1e40af", // Deep Blue
    "#94a3b8", // Slate 400 (Grey-Blue)
    "#60a5fa", // Light Blue
    "#cbd5e1", // Slate 300 (Light Grey)
    "#172554", // Dark Navy
    "#bfdbfe", // Pale Blue
    "#f1f5f9", // Off-white
    "#2563eb", // Royal Blue
]

export function LeadsAreaChart() {
    // --- Estados de Dados ---
    const [chartData, setChartData] = useState<any[]>([])
    const [availableAgents, setAvailableAgents] = useState<string[]>([])
    const [selectedAgents, setSelectedAgents] = useState<string[]>([])

    // --- Estados de Controle ---
    const [loading, setLoading] = useState(true)
    const [timeRange, setTimeRange] = useState("90d")
    const [metricType, setMetricType] = useState<"total" | "connected" | "comparison">("connected")

    // --- Configurações Personalizáveis ---
    const [interactionThreshold, setInteractionThreshold] = useState(3)
    const [connectivityTarget, setConnectivityTarget] = useState(30) // %
    const [totalLeadsTarget, setTotalLeadsTarget] = useState(100)
    const [connectedLeadsTarget, setConnectedLeadsTarget] = useState(50)
    const [agentNames, setAgentNames] = useState<Record<string, string>>({})
    const [isLoaded, setIsLoaded] = useState(false)

    // --- Efeito: Carregar Configurações e Ouvir Mudanças ---
    useEffect(() => {
        const loadSettings = () => {
            try {
                const savedTotal = localStorage.getItem('leads-dashboard-total-target')
                const savedConnected = localStorage.getItem('leads-dashboard-connected-target')
                const savedThreshold = localStorage.getItem('leads-dashboard-threshold')
                const savedTarget = localStorage.getItem('leads-dashboard-target')
                const savedNames = localStorage.getItem('leads-dashboard-names')

                if (savedTotal) setTotalLeadsTarget(Number(savedTotal))
                if (savedConnected) setConnectedLeadsTarget(Number(savedConnected))
                if (savedThreshold) setInteractionThreshold(Number(savedThreshold))
                if (savedTarget) setConnectivityTarget(Number(savedTarget))
                if (savedNames) setAgentNames(JSON.parse(savedNames))
            } catch (e) {
                console.error("Erro ao carregar configurações", e)
            } finally {
                setIsLoaded(true)
            }
        }

        // Carregar inicialmente
        loadSettings()

        // Ouvir mudanças de outras abas/componentes
        window.addEventListener('storage', loadSettings)
        return () => window.removeEventListener('storage', loadSettings)
    }, [])

    // --- KPIs ---
    const [kpis, setKpis] = useState({
        totalLeads: 0,
        connectedLeads: 0,
        avgConnectivity: 0
    })

    // --- Config do Gráfico ---
    const chartConfig = useMemo(() => {
        const config: ChartConfig = {}
        selectedAgents.forEach((agentId: string, index: number) => {
            config[agentId] = {
                label: agentNames[agentId] || agentId,
                color: BLUE_PALETTE[index % BLUE_PALETTE.length],
            }
        })
        return config
    }, [selectedAgents, agentNames])

    // --- Efeito: Buscar Lista de Agentes ---
    useEffect(() => {
        const fetchAgents = async () => {
            const { data, error } = await supabase
                .from('info_lead')
                .select('agent_id')
                .not('agent_id', 'is', null)

            if (error) {
                console.error('Erro ao buscar agentes:', error)
                return
            }

            const uniqueAgents = Array.from(new Set(data?.map(d => d.agent_id).filter(Boolean) || []))
            setAvailableAgents(uniqueAgents)

            // Auto-select all
            if (selectedAgents.length === 0 && uniqueAgents.length > 0) {
                setSelectedAgents(uniqueAgents)
            }
        }
        fetchAgents()
    }, [])

    // --- Função: Buscar Dados ---
    const fetchLeadsData = async () => {
        try {
            setLoading(true)
            const endDate = new Date()
            const startDate = new Date()
            let isAllTime = false

            switch (timeRange) {
                case "7d": startDate.setDate(endDate.getDate() - 7); break;
                case "15d": startDate.setDate(endDate.getDate() - 15); break;
                case "30d": startDate.setDate(endDate.getDate() - 30); break;
                case "60d": startDate.setDate(endDate.getDate() - 60); break;
                case "90d": startDate.setDate(endDate.getDate() - 90); break;
                case "all": isAllTime = true; break;
                default: startDate.setDate(endDate.getDate() - 90);
            }

            let query = supabase
                .from('info_lead')
                .select('created_at, agent_id, contador_interacoes')
                .order('created_at', { ascending: true })

            if (!isAllTime) {
                query = query.gte('created_at', startDate.toISOString())
            }

            if (selectedAgents.length > 0) {
                query = query.in('agent_id', selectedAgents)
            } else {
                setChartData([])
                setKpis({ totalLeads: 0, connectedLeads: 0, avgConnectivity: 0 })
                setLoading(false)
                return
            }

            const { data, error } = await query

            if (error) {
                console.error('Erro ao buscar leads:', error)
                setLoading(false)
                return
            }

            // --- Processamento ---
            let totalLeadsCount = 0
            let connectedLeadsCount = 0
            const leadsByDate = new Map<string, any>()

            // 1. Inicializar todas as datas do intervalo
            let fillStart = startDate
            if (isAllTime) {
                if (data && data.length > 0) {
                    fillStart = new Date(data[0].created_at)
                } else {
                    fillStart = new Date()
                    fillStart.setDate(fillStart.getDate() - 30)
                }
            }

            for (let d = new Date(fillStart); d <= endDate; d.setDate(d.getDate() + 1)) {
                const dateStr = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
                if (!leadsByDate.has(dateStr)) {
                    const initialData: any = { date: dateStr, fullDate: new Date(d) }
                    selectedAgents.forEach((agent: string) => {
                        initialData[agent] = 0 // Total
                        initialData[`${agent}_connected`] = 0 // Conectado
                    })
                    initialData['total'] = 0
                    initialData['connected'] = 0
                    leadsByDate.set(dateStr, initialData)
                }
            }

            // 2. Preencher com dados reais
            data?.forEach((lead: any) => {
                const dateObj = new Date(lead.created_at)
                const dateStr = dateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })

                if (!leadsByDate.has(dateStr)) {
                    const initialData: any = { date: dateStr, fullDate: dateObj }
                    selectedAgents.forEach((agent: string) => {
                        initialData[agent] = 0
                        initialData[`${agent}_connected`] = 0
                    })
                    initialData['total'] = 0
                    initialData['connected'] = 0
                    leadsByDate.set(dateStr, initialData)
                }

                const dayData = leadsByDate.get(dateStr)
                const agent = lead.agent_id
                const isConnected = (lead.contador_interacoes || 0) > interactionThreshold

                totalLeadsCount++
                if (isConnected) connectedLeadsCount++

                if (selectedAgents.includes(agent)) {
                    // Contagem Total por Agente
                    dayData[agent] = (dayData[agent] || 0) + 1

                    // Contagem Conectados por Agente
                    if (isConnected) {
                        dayData[`${agent}_connected`] = (dayData[`${agent}_connected`] || 0) + 1
                    }

                    // Totais Globais (para Modo Comparativo)
                    dayData['total'] = (dayData['total'] || 0) + 1
                    if (isConnected) {
                        dayData['connected'] = (dayData['connected'] || 0) + 1
                    }
                }
            })

            // 3. Ordenar e Setar
            const sortedData = Array.from(leadsByDate.values()).sort((a, b) =>
                a.fullDate.getTime() - b.fullDate.getTime()
            )

            setChartData(sortedData)
            setKpis({
                totalLeads: totalLeadsCount,
                connectedLeads: connectedLeadsCount,
                avgConnectivity: totalLeadsCount > 0 ? (connectedLeadsCount / totalLeadsCount) * 100 : 0
            })
            setLoading(false)

        } catch (err) {
            console.error('Erro:', err)
            setLoading(false)
        }
    }

    // --- Efeitos ---
    useEffect(() => {
        if (selectedAgents.length > 0 || availableAgents.length > 0) {
            fetchLeadsData()
        }
    }, [timeRange, selectedAgents, metricType, interactionThreshold])

    useEffect(() => {
        const channel = supabase
            .channel('info-leads-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'info_lead' }, () => {
                fetchLeadsData()
            })
            .subscribe()
        return () => { supabase.removeChannel(channel) }
    }, [timeRange, selectedAgents, metricType, interactionThreshold])


    // --- Render ---
    return (
        <div className="space-y-4 relative">
            {/* Header & Filtros */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-foreground">Performance de Leads</h2>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <AgentSelector
                        agents={availableAgents}
                        selectedAgents={selectedAgents}
                        onChange={setSelectedAgents}
                        isLoading={loading && availableAgents.length === 0}
                        namesMap={agentNames}
                    />

                    <div className="flex items-center bg-muted/30 p-1 rounded-lg border shadow-sm">
                        {['7d', '15d', '30d', '60d', '90d', 'all'].map((range) => (
                            <Button
                                key={range}
                                variant="ghost"
                                size="sm"
                                onClick={() => setTimeRange(range)}
                                className={`
                                    h-7 px-3 text-xs font-medium rounded-none first:rounded-l-md last:rounded-r-md border-r border-transparent 
                                    hover:bg-transparent hover:text-foreground
                                    ${timeRange === range
                                        ? "bg-background text-foreground shadow-sm z-20 font-semibold ring-1 ring-border"
                                        : "text-muted-foreground/70 hover:bg-background/50"
                                    }
                                `}
                            >
                                {range === 'all' ? 'Tudo' : range}
                            </Button>
                        ))}
                    </div>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <div className="flex items-center gap-2">
                            <CardTitle className="text-sm font-medium">Total de Leads</CardTitle>
                            <div title="Total de leads únicos recebidos no período selecionado.">
                                <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help opacity-70 hover:opacity-100" />
                            </div>
                        </div>
                        <div className="flex items-center gap-1 bg-emerald-500/10 text-emerald-500 text-xs font-bold px-2 py-0.5 rounded-full">
                            Meta: {totalLeadsTarget}
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{kpis.totalLeads}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Leads únicos recebidos no período
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <div className="flex items-center gap-2">
                            <CardTitle className="text-sm font-medium">Leads Conectados</CardTitle>
                            <div title={`Leads com mais de ${interactionThreshold} interações, considerados 'Validados'.`}>
                                <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help opacity-70 hover:opacity-100" />
                            </div>
                        </div>
                        <div className="flex items-center gap-1 bg-emerald-500/10 text-emerald-500 text-xs font-bold px-2 py-0.5 rounded-full">
                            Meta: {connectedLeadsTarget}
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{kpis.connectedLeads}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Leads com mais de {interactionThreshold} interações
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <div className="flex items-center gap-2">
                            <CardTitle className="text-sm font-medium">Taxa de Conectividade</CardTitle>
                            <div title={`Porcentagem de leads que se tornaram conectados. Meta: ${connectivityTarget}%.`}>
                                <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help opacity-70 hover:opacity-100" />
                            </div>
                        </div>
                        <div className={`flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${kpis.avgConnectivity >= connectivityTarget ? "bg-emerald-500/10 text-emerald-500" : "bg-yellow-500/10 text-yellow-500"}`}>
                            Meta: {connectivityTarget}%
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-baseline gap-2">
                            <div className="text-2xl font-bold">{kpis.avgConnectivity.toFixed(1)}%</div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Leads totais vs Leads Conectados
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Chart */}
            <Card>
                <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
                    <div className="grid flex-1 gap-1 text-center sm:text-left">
                        <CardTitle>Evolução Temporal</CardTitle>
                        <CardDescription>
                            {metricType === 'comparison'
                                ? "Comparativo: Total vs Conectados"
                                : `Comparando performance (${metricType === 'total' ? 'Total' : 'Conectados'})`
                            }
                        </CardDescription>
                    </div>
                    {/* Seletor de Métrica do Gráfico */}
                    <div className="flex items-center gap-2 rounded-md border p-1 bg-muted/50">
                        <button
                            onClick={() => setMetricType("total")}
                            className={`px-3 py-1 text-xs rounded-sm transition-colors ${metricType === 'total' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:bg-background/50'}`}
                        >
                            Total Leads
                        </button>
                        <button
                            onClick={() => setMetricType("connected")}
                            className={`px-3 py-1 text-xs rounded-sm transition-colors ${metricType === 'connected' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:bg-background/50'}`}
                        >
                            Conectados
                        </button>
                        <button
                            onClick={() => setMetricType("comparison")}
                            className={`px-3 py-1 text-xs rounded-sm transition-colors ${metricType === 'comparison' ? 'bg-background shadow-sm text-foreground font-medium text-blue-500' : 'text-muted-foreground hover:bg-background/50'}`}
                        >
                            Comparativo VS
                        </button>
                    </div>
                </CardHeader>
                <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
                    <ChartContainer
                        config={chartConfig}
                        className="aspect-auto h-[350px] w-full"
                    >
                        <AreaChart data={chartData}>
                            <defs>
                                <linearGradient id="fillTotal" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05} />
                                </linearGradient>
                                <linearGradient id="fillConnected" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.5} />
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.1} />
                                </linearGradient>
                                {selectedAgents.map((agent: string, index: number) => (
                                    <linearGradient key={agent} id={`fill${agent}`} x1="0" y1="0" x2="0" y2="1">
                                        <stop
                                            offset="5%"
                                            stopColor={chartConfig[agent]?.color}
                                            stopOpacity={0.8}
                                        />
                                        <stop
                                            offset="95%"
                                            stopColor={chartConfig[agent]?.color}
                                            stopOpacity={0.1}
                                        />
                                    </linearGradient>
                                ))}
                            </defs>
                            <CartesianGrid vertical={false} strokeDasharray="3 3" strokeOpacity={0.2} />
                            <XAxis
                                dataKey="date"
                                tickLine={false}
                                axisLine={false}
                                tickMargin={8}
                                minTickGap={32}
                            />
                            <YAxis
                                tickLine={false}
                                axisLine={false}
                                tickMargin={8}
                                width={30}
                            />
                            <ChartTooltip
                                cursor={false}
                                content={<ChartTooltipContent indicator="dot" />}
                            />

                            {metricType === 'comparison' ? (
                                <>
                                    <Area
                                        dataKey="total"
                                        name="Total"
                                        type="monotone"
                                        fill="url(#fillTotal)"
                                        stroke="#3b82f6"
                                        fillOpacity={1}
                                        strokeWidth={2}
                                    />
                                    <Area
                                        dataKey="connected"
                                        name="Conectados"
                                        type="monotone"
                                        fill="url(#fillConnected)"
                                        stroke="#10b981"
                                        fillOpacity={1}
                                        strokeWidth={2}
                                    />
                                </>
                            ) : (
                                selectedAgents.map((agent: string, index: number) => (
                                    <Area
                                        key={agent}
                                        dataKey={metricType === 'connected' ? `${agent}_connected` : agent}
                                        name={chartConfig[agent]?.label}
                                        type="monotone"
                                        fill={`url(#fill${agent})`}
                                        stroke={chartConfig[agent]?.color}
                                        fillOpacity={0.4}
                                        strokeWidth={2}
                                    />
                                ))
                            )}
                            <ChartLegend content={<ChartLegendContent />} />
                        </AreaChart>
                    </ChartContainer>
                </CardContent>
            </Card>
