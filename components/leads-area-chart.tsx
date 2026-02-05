"use client"

import { useEffect, useState } from 'react'
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"
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

// Configuração do gráfico
const chartConfig = {
    renataOriginal: {
        label: "Renata Original",
        color: "hsl(var(--chart-1))",
    },
    renataCardoso: {
        label: "Renata Cardoso",
        color: "hsl(var(--chart-2))",
    },
    outros: {
        label: "Outros",
        color: "hsl(var(--chart-3))",
    },
} satisfies ChartConfig

interface ChartDataPoint {
    date: string
    renataOriginal: number
    renataCardoso: number
    outros: number
    fullDate: Date
}

export function LeadsAreaChart() {
    const [chartData, setChartData] = useState<ChartDataPoint[]>([])
    const [loading, setLoading] = useState(true)
    const [timeRange, setTimeRange] = useState("90d")

    // Função para buscar dados históricos
    const fetchLeadsData = async () => {
        try {
            setLoading(true)
            let queryStart = new Date()
            let isAllTime = false

            switch (timeRange) {
                case "7d":
                    queryStart.setDate(queryStart.getDate() - 7)
                    break
                case "15d":
                    queryStart.setDate(queryStart.getDate() - 15)
                    break
                case "30d":
                    queryStart.setDate(queryStart.getDate() - 30)
                    break
                case "60d":
                    queryStart.setDate(queryStart.getDate() - 60)
                    break
                case "90d":
                    queryStart.setDate(queryStart.getDate() - 90)
                    break
                case "all":
                    isAllTime = true
                    break
                default:
                    queryStart.setDate(queryStart.getDate() - 90)
            }

            let query = supabase
                .from('leads')
                .select('created_at, id_agent')
                .is('deleted_at', null)
                .order('created_at', { ascending: true })

            if (!isAllTime) {
                query = query.gte('created_at', queryStart.toISOString())
            }

            const { data, error } = await query

            if (error) {
                console.error('Erro ao buscar leads:', error)
                setLoading(false)
                return
            }

            // Helper to parse date string
            const parseDate = (dateStr: string) => {
                const date = new Date(dateStr);
                return date.toLocaleDateString('pt-BR');
            };

            // Processar dados agrupando por data e agente
            const leadsByDate = new Map<string, { renataOriginal: number, renataCardoso: number, outros: number }>()

            data?.forEach(lead => {
                const dateStr = parseDate(lead.created_at);
                const currentCounts = leadsByDate.get(dateStr) || { renataOriginal: 0, renataCardoso: 0, outros: 0 };

                const agentId = lead.id_agent;

                if (agentId === '+554797081463') {
                    currentCounts.renataOriginal++;
                } else if (agentId === '+554796621550') {
                    currentCounts.renataCardoso++;
                } else {
                    currentCounts.outros++;
                }

                leadsByDate.set(dateStr, currentCounts);
            })

            // Converter e ordenar
            const sortedEntries = Array.from(leadsByDate.entries()).sort((a, b) => {
                const [dayA, monthA, yearA] = a[0].split('/').map(Number)
                const [dayB, monthB, yearB] = b[0].split('/').map(Number)
                return new Date(yearA, monthA - 1, dayA).getTime() - new Date(yearB, monthB - 1, dayB).getTime()
            })

            const formattedData: ChartDataPoint[] = sortedEntries.map(
                ([date, counts]) => {
                    const [day, month, year] = date.split('/').map(Number)
                    return {
                        date,
                        ...counts,
                        fullDate: new Date(year, month - 1, day)
                    }
                }
            )

            setChartData(formattedData)
            setLoading(false)
        } catch (err) {
            console.error('Erro:', err)
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchLeadsData()
    }, [timeRange])

    // Subscrever a mudanças em tempo real
    useEffect(() => {
        const channel = supabase
            .channel('leads-changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'leads',
                },
                () => {
                    fetchLeadsData()
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [timeRange])

    return (
        <Card>
            <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
                <div className="grid flex-1 gap-1 text-center sm:text-left">
                    <CardTitle>Desempenho por Agente</CardTitle>
                    <CardDescription>
                        Comparativo de leads: Renata Original vs Renata Cardoso
                    </CardDescription>
                </div>
                <Select value={timeRange} onValueChange={setTimeRange}>
                    <SelectTrigger
                        className="w-[160px] rounded-lg sm:ml-auto"
                        aria-label="Selecione o período"
                    >
                        <SelectValue placeholder="Últimos 3 meses" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                        <SelectItem value="7d" className="rounded-lg">
                            Últimos 7 dias
                        </SelectItem>
                        <SelectItem value="15d" className="rounded-lg">
                            Últimos 15 dias
                        </SelectItem>
                        <SelectItem value="30d" className="rounded-lg">
                            Últimos 30 dias
                        </SelectItem>
                        <SelectItem value="60d" className="rounded-lg">
                            Últimos 60 dias
                        </SelectItem>
                        <SelectItem value="90d" className="rounded-lg">
                            Últimos 90 dias
                        </SelectItem>
                        <SelectItem value="all" className="rounded-lg">
                            Todo o período
                        </SelectItem>
                    </SelectContent>
                </Select>
            </CardHeader>
            <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
                <ChartContainer
                    config={chartConfig}
                    className="aspect-auto h-[250px] w-full"
                >
                    <AreaChart data={chartData}>
                        <defs>
                            <linearGradient id="fillRenataOriginal" x1="0" y1="0" x2="0" y2="1">
                                <stop
                                    offset="5%"
                                    stopColor="var(--color-renataOriginal)"
                                    stopOpacity={0.8}
                                />
                                <stop
                                    offset="95%"
                                    stopColor="var(--color-renataOriginal)"
                                    stopOpacity={0.1}
                                />
                            </linearGradient>
                            <linearGradient id="fillRenataCardoso" x1="0" y1="0" x2="0" y2="1">
                                <stop
                                    offset="5%"
                                    stopColor="var(--color-renataCardoso)"
                                    stopOpacity={0.8}
                                />
                                <stop
                                    offset="95%"
                                    stopColor="var(--color-renataCardoso)"
                                    stopOpacity={0.1}
                                />
                            </linearGradient>
                            <linearGradient id="fillOutros" x1="0" y1="0" x2="0" y2="1">
                                <stop
                                    offset="5%"
                                    stopColor="var(--color-outros)"
                                    stopOpacity={0.8}
                                />
                                <stop
                                    offset="95%"
                                    stopColor="var(--color-outros)"
                                    stopOpacity={0.1}
                                />
                            </linearGradient>
                        </defs>
                        <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.1)" />
                        <XAxis
                            dataKey="date"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            minTickGap={32}
                            tickFormatter={(value) => {
                                const [day, month] = value.split('/')
                                return `${day}/${month}`
                            }}
                        />
                        <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent indicator="dot" />}
                        />
                        <Area
                            dataKey="outros"
                            type="natural"
                            fill="url(#fillOutros)"
                            stroke="var(--color-outros)"
                            fillOpacity={0.4}
                            strokeWidth={2}
                            stackId="a"
                        />
                        <Area
                            dataKey="renataCardoso"
                            type="natural"
                            fill="url(#fillRenataCardoso)"
                            stroke="var(--color-renataCardoso)"
                            fillOpacity={0.4}
                            strokeWidth={2}
                            stackId="a"
                        />
                        <Area
                            dataKey="renataOriginal"
                            type="natural"
                            fill="url(#fillRenataOriginal)"
                            stroke="var(--color-renataOriginal)"
                            fillOpacity={0.4}
                            strokeWidth={2}
                            stackId="a"
                        />
                        <ChartLegend content={<ChartLegendContent />} />
                    </AreaChart>
                </ChartContainer>
            </CardContent>
        </Card>
    )
}
