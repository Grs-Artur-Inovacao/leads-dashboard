"use client"

import { useEffect, useState, useMemo } from 'react'
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { AgentSelector } from "./agent-selector"
import { Users, MessageSquare, Activity } from "lucide-react"

// Cores para os gráficos (padrão shadcn)
const CHART_COLORS = [
    "hsl(var(--chart-1))",
    "hsl(var(--chart-2))",
    "hsl(var(--chart-3))",
    "hsl(var(--chart-4))",
    "hsl(var(--chart-5))",
]

export function LeadsAreaChart() {
    // Estados de dados
    const [chartData, setChartData] = useState<any[]>([])
    const [availableAgents, setAvailableAgents] = useState<string[]>([])
    const [selectedAgents, setSelectedAgents] = useState<string[]>([])

    // Estados de controle
    const [loading, setLoading] = useState(true)
    const [timeRange, setTimeRange] = useState("90d")
    const [metricType, setMetricType] = useState<"total" | "connected">("connected")

    // KPIs
    const [kpis, setKpis] = useState({
        totalLeads: 0,
        connectedLeads: 0,
        avgConnectivity: 0
    })

    // Configuração dinâmica do gráfico baseada nos agentes selecionados
    const chartConfig = useMemo(() => {
        const config: ChartConfig = {}
        selectedAgents.forEach((agent, index) => {
            config[agent] = {
                label: agent || "Desconhecido", // Poderíamos aplicar formatação de nome aqui
                color: CHART_COLORS[index % CHART_COLORS.length],
            }
        })
        return config
    }, [selectedAgents])

    // Buscar lista de agentes disponíveis
    useEffect(() => {
        const fetchAgents = async () => {
            const { data, error } = await supabase
                .from('info_lead')
                .select('agent_id')
                .not('agent_id', 'is', null) // Ignorar nulos se houver

            if (error) {
                console.error('Erro ao buscar agentes:', error)
                return
            }

            // Filtrar únicos e remover vazios
            const uniqueAgents = Array.from(new Set(data?.map(d => d.agent_id).filter(Boolean) || []))
            setAvailableAgents(uniqueAgents)

            // Selecionar todos por padrão na primeira carga se nenhum estiver selecionado
            if (selectedAgents.length === 0 && uniqueAgents.length > 0) {
                setSelectedAgents(uniqueAgents)
            }
        }

        fetchAgents()
    }, []) // Executa apenas na montagem

    // Função principal de busca de dados
    const fetchLeadsData = async () => {
        try {
            setLoading(true)
            let queryStart = new Date()
            let isAllTime = false

            // Configurar filtro de data
            switch (timeRange) {
                case "7d": queryStart.setDate(queryStart.getDate() - 7); break;
                case "15d": queryStart.setDate(queryStart.getDate() - 15); break;
                case "30d": queryStart.setDate(queryStart.getDate() - 30); break;
                case "60d": queryStart.setDate(queryStart.getDate() - 60); break;
                case "90d": queryStart.setDate(queryStart.getDate() - 90); break;
                case "all": isAllTime = true; break;
                default: queryStart.setDate(queryStart.getDate() - 90);
            }

            // Construir Query
            let query = supabase
                .from('info_lead')
                .select('created_at, agent_id, contador_interacoes')
                .order('created_at', { ascending: true })

            // Aplicar filtros
            if (!isAllTime) {
                query = query.gte('created_at', queryStart.toISOString())
            }

            if (selectedAgents.length > 0) {
                query = query.in('agent_id', selectedAgents)
            } else {
                // Se nenhum agente selecionado, não retornar dados
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

            // --- Processamento dos Dados ---

            let totalLeadsCount = 0
            let connectedLeadsCount = 0

            // Mapa para agrupar por data
            // Chave: Data (dd/mm), Valor: Objeto com contadores por agente
            const leadsByDate = new Map<string, any>()

            data?.forEach(lead => {
                // Parse date
                const dateObj = new Date(lead.created_at)
                const dateStr = dateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) // dd/mm

                // Inicializar objeto do dia se não existir
                if (!leadsByDate.has(dateStr)) {
                    // Inicializar contadores zerados para todos os agentes selecionados
                    const initialData: any = { date: dateStr, fullDate: dateObj }
                    selectedAgents.forEach(agent => {
                        initialData[agent] = 0
                    })
                    leadsByDate.set(dateStr, initialData)
                }

                const dayData = leadsByDate.get(dateStr)
                const agent = lead.agent_id

                // Verificar conectividade
                const isConnected = (lead.contador_interacoes || 0) > 3

                // Atualizar KPIs globais
                totalLeadsCount++
                if (isConnected) connectedLeadsCount++

                // Atualizar dados do gráfico baseado na métrica selecionada
                if (metricType === 'total') {
                    if (selectedAgents.includes(agent)) {
                        dayData[agent] = (dayData[agent] || 0) + 1
                    }
                } else {
                    // connected
                    if (isConnected && selectedAgents.includes(agent)) {
                        dayData[agent] = (dayData[agent] || 0) + 1
                    }
                }
            })

            // Converter para array e ordenar cronologicamente
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

    // Recarregar dados quando filtros mudam
    useEffect(() => {
        if (selectedAgents.length > 0 || availableAgents.length > 0) {
            fetchLeadsData()
        }
    }, [timeRange, selectedAgents, metricType])

    // Realtime subscription
    useEffect(() => {
        const channel = supabase
            .channel('info-leads-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'info_lead' }, () => {
                fetchLeadsData()
            })
            .subscribe()

        return () => { supabase.removeChannel(channel) }
    }, [timeRange, selectedAgents, metricType])


    return (
        <div className="space-y-4">
            {/* --- Filtros e Controles Superiores --- */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-white">Análise de Performance</h2>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <AgentSelector
                        agents={availableAgents}
                        selectedAgents={selectedAgents}
                        onChange={setSelectedAgents}
                        isLoading={loading && availableAgents.length === 0}
                    />

                    <Select value={timeRange} onValueChange={setTimeRange}>
                        <SelectTrigger className="w-[140px] rounded-lg">
                            <SelectValue placeholder="Período" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                            <SelectItem value="7d">Últimos 7 dias</SelectItem>
                            <SelectItem value="15d">Últimos 15 dias</SelectItem>
                            <SelectItem value="30d">Últimos 30 dias</SelectItem>
                            <SelectItem value="60d">Últimos 60 dias</SelectItem>
                            <SelectItem value="90d">Últimos 90 dias</SelectItem>
                            <SelectItem value="all">Todo o período</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* --- KPI Cards --- */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total de Leads</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{kpis.totalLeads}</div>
                        <p className="text-xs text-muted-foreground">
                            No período selecionado
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Leads Conectados</CardTitle>
                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{kpis.connectedLeads}</div>
                        <p className="text-xs text-muted-foreground">
                            {">"} 3 interações
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Taxa de Conectividade</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{kpis.avgConnectivity.toFixed(1)}%</div>
                        <p className="text-xs text-muted-foreground">
                            Eficiência geral
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* --- Chart --- */}
            <Card>
                <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
                    <div className="grid flex-1 gap-1 text-center sm:text-left">
                        <CardTitle>Evolução por Agente</CardTitle>
                        <CardDescription>
                            Comparando performance ao longo do tempo ({metricType === 'total' ? 'Total' : 'Conectados'})
                        </CardDescription>
                    </div>
                    {/* Seletor de Métrica do Gráfico */}
                    <div className="flex items-center gap-2 rounded-md border p-1 bg-background/50">
                        <button
                            onClick={() => setMetricType("total")}
                            className={`px-3 py-1 text-xs rounded-sm transition-colors ${metricType === 'total' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
                        >
                            Total Leads
                        </button>
                        <button
                            onClick={() => setMetricType("connected")}
                            className={`px-3 py-1 text-xs rounded-sm transition-colors ${metricType === 'connected' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
                        >
                            Conectados 🔥
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
                                {selectedAgents.map((agent, index) => (
                                    <linearGradient key={agent} id={`fill${agent}`} x1="0" y1="0" x2="0" y2="1">
                                        <stop
                                            offset="5%"
                                            stopColor={`var(--color-${agent})`}
                                            stopOpacity={0.8}
                                        />
                                        <stop
                                            offset="95%"
                                            stopColor={`var(--color-${agent})`}
                                            stopOpacity={0.1}
                                        />
                                    </linearGradient>
                                ))}
                            </defs>
                            <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.05)" />
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

                            {selectedAgents.map((agent, index) => (
                                <Area
                                    key={agent}
                                    dataKey={agent} // Deve corresponder à chave no config e nos dados
                                    type="natural"
                                    fill={`url(#fill${agent})`}
                                    stroke={`var(--color-${agent})`} // ChartContainer define --color-{key}
                                    fillOpacity={0.4}
                                    strokeWidth={2}
                                    stackId="a"
                                />
                            ))}
                            <ChartLegend content={<ChartLegendContent />} />
                        </AreaChart>
                    </ChartContainer>
                </CardContent>
            </Card>
        </div>
    )
}
