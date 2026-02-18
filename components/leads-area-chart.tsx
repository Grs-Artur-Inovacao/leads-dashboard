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
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { AgentSelector } from "./agent-selector"
import { KpiCard } from "./kpi-card"
import { Users, MessageSquare, Activity, Settings, HelpCircle, Calendar as CalendarIcon } from "lucide-react"
import { format, subDays, differenceInDays, getDaysInMonth, eachDayOfInterval } from "date-fns"
import { ptBR } from "date-fns/locale"
import { DateRange } from "react-day-picker"
import { cn } from "@/lib/utils"
import { settingsService } from "@/lib/settings-service"

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
    // --- Estados de Controle ---
    const [loading, setLoading] = useState(true)
    const [date, setDate] = useState<DateRange | undefined>({
        from: subDays(new Date(), 7),
        to: new Date(),
    })
    const [metricType, setMetricType] = useState<"total" | "connected" | "comparison">("connected")

    // --- Configurações Personalizáveis ---
    const [interactionThreshold, setInteractionThreshold] = useState(3)
    const [connectivityTarget, setConnectivityTarget] = useState(30) // %
    const [totalLeadsTarget, setTotalLeadsTarget] = useState(100)
    const [connectedLeadsTarget, setConnectedLeadsTarget] = useState(50)
    const [mqlTarget, setMqlTarget] = useState(10) // Novo estado para Meta MQL
    const [agentNames, setAgentNames] = useState<Record<string, string>>({})
    const [isLoaded, setIsLoaded] = useState(false)


    // --- Efeito: Carregar Configurações e Ouvir Mudanças ---
    useEffect(() => {
        const loadSettings = async () => {
            try {
                const settings = await settingsService.getSettings()

                if (settings) {
                    setTotalLeadsTarget(settings.total_leads_target || 100)
                    setConnectedLeadsTarget(settings.connected_leads_target || 50)
                    setInteractionThreshold(settings.interaction_threshold || 3)
                    setConnectivityTarget(settings.connectivity_target || 30)
                    setMqlTarget(settings.mql_target || 10)
                    setAgentNames(settings.agent_names || {})
                }
            } catch (e) {
                console.error("Erro ao carregar configurações", e)
            } finally {
                setIsLoaded(true)
            }
        }

        // Carregar inicialmente
        loadSettings()

        // Ouvir mudanças em tempo real via Supabase
        const subscription = settingsService.subscribeToSettings((newSettings) => {
            setTotalLeadsTarget(newSettings.total_leads_target)
            setConnectedLeadsTarget(newSettings.connected_leads_target)
            setInteractionThreshold(newSettings.interaction_threshold)
            setConnectivityTarget(newSettings.connectivity_target)
            setMqlTarget(newSettings.mql_target)
            setAgentNames(newSettings.agent_names || {})
        })

        return () => {
            subscription.unsubscribe()
        }
    }, [])

    // --- KPIs ---
    const [kpis, setKpis] = useState({
        totalLeads: 0,
        connectedLeads: 0,
        avgConnectivity: 0
    })

    const [previousKpis, setPreviousKpis] = useState({
        totalLeads: 0,
        connectedLeads: 0,
        avgConnectivity: 0
    })

    // Função para calcular meta proporcional ao período selecionado
    const calculateProportionalTarget = (monthlyTarget: number, dateRange: DateRange | undefined) => {
        if (!dateRange?.from) return monthlyTarget
        const end = dateRange.to || dateRange.from

        try {
            const days = eachDayOfInterval({ start: dateRange.from, end })
            let totalTarget = 0
            days.forEach(day => {
                const daysInMonth = getDaysInMonth(day)
                if (daysInMonth > 0) {
                    totalTarget += (monthlyTarget / daysInMonth)
                }
            })
            return Math.round(totalTarget)
        } catch (e) {
            return monthlyTarget
        }
    }

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

            const fromDate = date?.from || subDays(new Date(), 7)
            const toDate = date?.to || new Date()

            // Adjust to end of day
            const queryEndDate = new Date(toDate)
            queryEndDate.setHours(23, 59, 59, 999)

            // --- Período Anterior (Comparação) ---
            const durationInDays = differenceInDays(queryEndDate, fromDate) + 1
            const previousFromDate = subDays(fromDate, durationInDays)
            const previousToDate = subDays(queryEndDate, durationInDays)

            // Query Atual
            let query = supabase
                .from('info_lead')
                .select('created_at, agent_id, contador_interacoes')
                .order('created_at', { ascending: true })
                .gte('created_at', fromDate.toISOString())
                .lte('created_at', queryEndDate.toISOString())

            // Query Anterior
            let previousQuery = supabase
                .from('info_lead')
                .select('created_at, agent_id, contador_interacoes')
                .gte('created_at', previousFromDate.toISOString())
                .lte('created_at', previousToDate.toISOString())


            if (selectedAgents.length > 0) {
                query = query.in('agent_id', selectedAgents)
                previousQuery = previousQuery.in('agent_id', selectedAgents)
            } else {
                setChartData([])
                setKpis({ totalLeads: 0, connectedLeads: 0, avgConnectivity: 0 })
                setPreviousKpis({ totalLeads: 0, connectedLeads: 0, avgConnectivity: 0 })
                setLoading(false)
                return
            }

            const [currentResult, previousResult] = await Promise.all([
                query,
                previousQuery
            ])

            if (currentResult.error) throw currentResult.error
            if (previousResult.error) throw previousResult.error

            const data = currentResult.data
            const previousData = previousResult.data

            // --- Processamento Período Anterior ---
            let prevTotal = 0
            let prevConnected = 0

            previousData?.forEach((lead: any) => {
                const isConnected = (lead.contador_interacoes || 0) > interactionThreshold
                prevTotal++
                if (isConnected) prevConnected++
            })

            setPreviousKpis({
                totalLeads: prevTotal,
                connectedLeads: prevConnected,
                avgConnectivity: prevTotal > 0 ? (prevConnected / prevTotal) * 100 : 0
            })

            // --- Processamento ---
            let totalLeadsCount = 0
            let connectedLeadsCount = 0
            const leadsByDate = new Map<string, any>()

            // 1. Inicializar todas as datas do intervalo
            let fillStart = new Date(fromDate)

            for (let d = new Date(fillStart); d <= toDate; d.setDate(d.getDate() + 1)) {
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
    }, [date, selectedAgents, metricType, interactionThreshold])

    useEffect(() => {
        const channel = supabase
            .channel('info-leads-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'info_lead' }, () => {
                fetchLeadsData()
            })
            .subscribe()
        return () => { supabase.removeChannel(channel) }
    }, [date, selectedAgents, metricType, interactionThreshold])


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

                    <div className="flex items-center gap-2">
                        <div className="grid gap-2">
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        id="date"
                                        variant={"outline"}
                                        className={cn(
                                            "w-[260px] justify-start text-left font-normal",
                                            !date && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {date?.from ? (
                                            date.to ? (
                                                <>
                                                    {format(date.from, "dd 'de' MMM", { locale: ptBR })} -{" "}
                                                    {format(date.to, "dd 'de' MMM", { locale: ptBR })}
                                                </>
                                            ) : (
                                                format(date.from, "dd 'de' MMM, yyyy", { locale: ptBR })
                                            )
                                        ) : (
                                            <span>Selecione uma data</span>
                                        )}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="end">
                                    <Calendar
                                        initialFocus
                                        mode="range"
                                        defaultMonth={date?.from}
                                        selected={date}
                                        onSelect={setDate}
                                        numberOfMonths={2}
                                        locale={ptBR}
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <KpiCard
                    title="Leads Totais"
                    value={kpis.totalLeads}
                    goal={calculateProportionalTarget(totalLeadsTarget, date)}
                    currentValue={kpis.totalLeads}
                    previousValue={previousKpis.totalLeads}
                    description={`Total de leads únicos recebidos no período (${format(date?.from || new Date(), "dd/MM")} - ${format(date?.to || new Date(), "dd/MM")}).`}
                />
                <KpiCard
                    title="Leads Conectados"
                    value={kpis.connectedLeads}
                    goal={calculateProportionalTarget(connectedLeadsTarget, date)}
                    currentValue={kpis.connectedLeads}
                    previousValue={previousKpis.connectedLeads}
                    description={`Leads que tiveram mais de ${interactionThreshold} interações.`}
                    secondaryMetric={{
                        label: "Conversão (Lead → Conectado)",
                        value: `${kpis.avgConnectivity.toFixed(1)}%`,
                        goal: connectivityTarget
                    }}
                />
                <KpiCard
                    title="Leads MQL"
                    value="..."
                    goal={0}
                    currentValue={0}
                    previousValue={0}
                    description="Leads qualificados pelo time de pré-vendas."
                    isPlaceholder={true}
                    secondaryMetric={{
                        label: "Conversão (Conectado → MQL)",
                        value: "...",
                        goal: mqlTarget
                    }}
                />
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
                                        name={(chartConfig[agent]?.label as string) || agent}
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
        </div>
    )
}
