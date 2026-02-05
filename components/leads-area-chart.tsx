"use client"

import { useEffect, useState } from 'react'
import { Area, AreaChart, CartesianGrid, XAxis, Tooltip, ResponsiveContainer } from "recharts"
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
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart"

// Configuração do gráfico
const chartConfig = {
    leads: {
        label: "Leads",
        color: "hsl(var(--chart-1))",
    },
} satisfies ChartConfig

interface ChartDataPoint {
    date: string
    leads: number
    fullDate: Date
}

export function LeadsAreaChart() {
    const [chartData, setChartData] = useState<ChartDataPoint[]>([])
    const [loading, setLoading] = useState(true)
    const [todayCount, setTodayCount] = useState(0)

    // Função para buscar dados históricos
    const fetchLeadsData = async () => {
        try {
            // Buscar leads dos últimos 90 dias
            const ninetyDaysAgo = new Date()
            ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

            const { data, error } = await supabase
                .from('leads')
                .select('created_at')
                .gte('created_at', ninetyDaysAgo.toISOString())
                .is('deleted_at', null)
                .order('created_at', { ascending: true })

            if (error) {
                console.error('Erro ao buscar leads:', error)
                return
            }

            // Processar dados para contar leads por dia
            // Usar Map para garantir ordem e unicidade
            const leadsByDate = new Map<string, number>()

            data?.forEach(lead => {
                const dateObj = new Date(lead.created_at)
                const dateStr = dateObj.toLocaleDateString('pt-BR') // dd/mm/yyyy
                leadsByDate.set(dateStr, (leadsByDate.get(dateStr) || 0) + 1)
            })

            // Converter para array e ordenar cronologicamente
            // Precisamos converter 'dd/mm/yyyy' de volta para Date para ordenar corretamente
            const sortedEntries = Array.from(leadsByDate.entries()).sort((a, b) => {
                const [dayA, monthA, yearA] = a[0].split('/').map(Number)
                const [dayB, monthB, yearB] = b[0].split('/').map(Number)
                return new Date(yearA, monthA - 1, dayA).getTime() - new Date(yearB, monthB - 1, dayB).getTime()
            })

            const formattedData: ChartDataPoint[] = sortedEntries.map(
                ([date, count]) => {
                    const [day, month, year] = date.split('/').map(Number)
                    return {
                        date,
                        leads: count,
                        fullDate: new Date(year, month - 1, day)
                    }
                }
            )

            setChartData(formattedData)

            // Calcular leads de hoje
            const todayStr = new Date().toLocaleDateString('pt-BR')
            const todayData = formattedData.find(d => d.date === todayStr)
            setTodayCount(todayData ? todayData.leads : 0)

            setLoading(false)
        } catch (err) {
            console.error('Erro:', err)
            setLoading(false)
        }
    }

    // Subscrever a mudanças em tempo real
    useEffect(() => {
        fetchLeadsData()

        // Configurar realtime subscription
        const channel = supabase
            .channel('leads-changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'leads',
                },
                (payload) => {
                    console.log('Mudança detectada:', payload)
                    // Recarregar dados quando houver mudanças
                    fetchLeadsData()
                }
            )
            .subscribe()

        // Cleanup
        return () => {
            supabase.removeChannel(channel)
        }
    }, [])

    if (loading) {
        return <div className="p-4">Carregando dados...</div>
    }

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle>Leads Hoje: {todayCount}</CardTitle>
                <CardDescription>
                    Total de leads recebidos nos últimos 90 dias
                </CardDescription>
            </CardHeader>
            <CardContent>
                <ChartContainer config={chartConfig} className="aspect-auto h-[300px] w-full">
                    <AreaChart
                        data={chartData}
                        margin={{
                            left: 12,
                            right: 12,
                            top: 12,
                            bottom: 12
                        }}
                    >
                        <CartesianGrid vertical={false} />
                        <XAxis
                            dataKey="date"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            tickFormatter={(value) => {
                                const [day, month] = value.split('/')
                                return `${day}/${month}`
                            }}
                        />
                        <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent indicator="dot" hideLabel />}
                        />
                        <defs>
                            <linearGradient id="fillLeads" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="var(--color-leads)" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="var(--color-leads)" stopOpacity={0.1} />
                            </linearGradient>
                        </defs>
                        <Area
                            dataKey="leads"
                            type="monotone"
                            fill="url(#fillLeads)"
                            fillOpacity={0.4}
                            stroke="var(--color-leads)"
                            strokeWidth={2}
                        />
                    </AreaChart>
                </ChartContainer>
            </CardContent>
        </Card>
    )
}
