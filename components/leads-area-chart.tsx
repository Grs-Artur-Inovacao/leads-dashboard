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

interface LeadsAreaChartProps {
    timeRange: string
    viewMode: "total" | "connected"
    selectedAgents: string[]
    interactionThreshold: number
    agentNames: Record<string, string>
}

interface ChartDataPoint {
    date: string
    [key: string]: number | string
}

// Paleta de cores em diferentes tons de azul
const COLORS = [
    "#2563eb", // blue-600
    "#3b82f6", // blue-500
    "#60a5fa", // blue-400
    "#1d4ed8", // blue-700
    "#93c5fd", // blue-300
    "#1e40af", // blue-800
    "#bfdbfe", // blue-200
    "#1e3a8a", // blue-900
    "#dbeafe", // blue-100
    "#0f172a", // slate-900 (dark navy)
]

export function LeadsAreaChart({
    timeRange,
    viewMode,
    selectedAgents,
    interactionThreshold,
    agentNames
}: LeadsAreaChartProps) {
    const [chartData, setChartData] = useState<ChartDataPoint[]>([])

    // Gerar config do gráfico dinamicamente com base nos agentes selecionados
    const chartConfig = useMemo(() => {
        const config: ChartConfig = {}
        selectedAgents.forEach((agentId, index) => {
            config[agentId] = {
                label: agentNames[agentId] || agentId,
                color: COLORS[index % COLORS.length],
            }
        })
        return config
    }, [selectedAgents, agentNames])

    useEffect(() => {
        const fetchLeadsData = async () => {
            let queryStart = new Date()
            let isAllTime = false

            switch (timeRange) {
                case "7d": queryStart.setDate(queryStart.getDate() - 7); break;
                case "15d": queryStart.setDate(queryStart.getDate() - 15); break;
                case "30d": queryStart.setDate(queryStart.getDate() - 30); break;
                case "60d": queryStart.setDate(queryStart.getDate() - 60); break;
                case "90d": queryStart.setDate(queryStart.getDate() - 90); break;
                case "all": isAllTime = true; break;
                default: queryStart.setDate(queryStart.getDate() - 90);
            }

            // Selecionar campos necessários
            let query = supabase
                .from('info_lead')
                .select('created_at, id_agent, contador_interacoes')
                .not('id_agent', 'is', null) // Garantir que tem agente
                .order('created_at', { ascending: true })

            if (!isAllTime) {
                query = query.gte('created_at', queryStart.toISOString())
            }

            if (selectedAgents.length > 0) {
                query = query.in('id_agent', selectedAgents)
            }

            const { data, error } = await query

            if (error) {
                console.error('Erro ao buscar leads:', error)
                return
            }

            // Agrupar por data e agente
            const leadsByDate = new Map<string, { [key: string]: number }>()

            data?.forEach(lead => {
                // Verificar filtro de conectados usando o threshold dinâmico
                if (viewMode === "connected" && (lead.contador_interacoes || 0) <= interactionThreshold) {
                    return
                }

                const date = new Date(lead.created_at)
                const dateStr = date.toLocaleDateString('pt-BR') // dd/mm/yyyy

                const currentCounts = leadsByDate.get(dateStr) || {}
                const agentKey = lead.id_agent

                currentCounts[agentKey] = (currentCounts[agentKey] || 0) + 1
                leadsByDate.set(dateStr, currentCounts)
            })

            // Converter para array e ordenar
            const sortedEntries = Array.from(leadsByDate.entries()).sort((a, b) => {
                const [d1, m1, y1] = a[0].split('/').map(Number)
                const [d2, m2, y2] = b[0].split('/').map(Number)
                return new Date(y1, m1 - 1, d1).getTime() - new Date(y2, m2 - 1, d2).getTime()
            })

            const formattedData: ChartDataPoint[] = sortedEntries.map(([date, counts]) => ({
                date,
                ...counts
            }))

            setChartData(formattedData)
        }

        fetchLeadsData()
    }, [timeRange, viewMode, selectedAgents, interactionThreshold])

    return (
        <Card className="bg-zinc-900 border-zinc-800 text-white">
            <CardHeader className="flex flex-col items-stretch space-y-0 border-b border-zinc-800 p-0 sm:flex-row">
                <div className="flex flex-1 flex-col justify-center gap-1 px-6 py-5 sm:py-6">
                    <CardTitle>Evolução Temporal</CardTitle>
                    <CardDescription className="text-zinc-400">
                        {viewMode === "total"
                            ? "Total de novos leads por dia"
                            : `Leads conectados (>${interactionThreshold} interações) por dia`}
                    </CardDescription>
                </div>
            </CardHeader>
            <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
                <ChartContainer
                    config={chartConfig}
                    className="aspect-auto h-[350px] w-full"
                >
                    <AreaChart data={chartData}>
                        <defs>
                            {selectedAgents.map((agentId) => (
                                <linearGradient
                                    key={agentId}
                                    id={`fill-${agentId}`}
                                    x1="0"
                                    y1="0"
                                    x2="0"
                                    y2="1"
                                >
                                    <stop
                                        offset="5%"
                                        stopColor={chartConfig[agentId]?.color}
                                        stopOpacity={0.8}
                                    />
                                    <stop
                                        offset="95%"
                                        stopColor={chartConfig[agentId]?.color}
                                        stopOpacity={0.1}
                                    />
                                </linearGradient>
                            ))}
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
                        <YAxis
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                        />
                        <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent indicator="dot" />}
                        />

                        {selectedAgents.map((agentId) => (
                            <Area
                                key={agentId}
                                dataKey={agentId}
                                type="monotone"
                                fill={`url(#fill-${agentId})`}
                                stroke={chartConfig[agentId]?.color}
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
    )
}
