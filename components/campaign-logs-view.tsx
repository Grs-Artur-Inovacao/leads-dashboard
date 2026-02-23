"use client"

import { useState, useEffect, useMemo } from "react"
import { supabase } from "@/lib/supabaseClient"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import {
    Megaphone,
    RefreshCw,
    Search,
    TrendingUp,
    PieChart as PieChartIcon,
    BarChart3
} from "lucide-react"
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
    PieChart,
    Pie,
    Legend
} from "recharts"

// --- Tipos ---
interface CampaignLog {
    id: string
    created_at: string
    phone: string
    utm_campaign?: string
    camping?: string
    campaign_name?: string
    "camping name"?: string
    display_campaign?: string
}

const COLORS = ['#3b82f6', '#ffffff']

export function CampaignLogsView() {
    const [loading, setLoading] = useState(true)
    const [logs, setLogs] = useState<CampaignLog[]>([])
    const [searchTerm, setSearchTerm] = useState("")

    const extractCampaignName = (campaign: string | undefined): string => {
        if (!campaign || campaign.trim() === "") return "Direto / Orgânico"

        const matches = campaign.match(/\[([^\]]+)\]/g)
        if (matches && matches.length >= 7) {
            return matches[6].replace(/[\[\]]/g, '').replace(/\+/g, ' ')
        }

        if (campaign.startsWith('[') && matches && matches.length > 0) {
            return matches[matches.length - 1].replace(/[\[\]]/g, '').replace(/\+/g, ' ')
        }

        return campaign.replace(/\+/g, ' ')
    }

    const fetchLogs = async () => {
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('campaign_log')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(500)

            if (error) throw error

            const enrichedLogs = data.map(log => {
                const campaignValue =
                    log.utm_campaign ||
                    log.camping ||
                    log.campaign_name ||
                    log["camping name"] ||
                    ""

                return {
                    ...log,
                    display_campaign: extractCampaignName(campaignValue)
                }
            })

            setLogs(enrichedLogs)
        } catch (error) {
            console.error("Erro ao buscar logs de campanha:", error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchLogs()
    }, [])

    const filteredLogs = useMemo(() => {
        return logs.filter(log =>
            log.display_campaign?.toLowerCase().includes(searchTerm.toLowerCase())
        )
    }, [logs, searchTerm])

    const chartData = useMemo(() => {
        const counts: Record<string, number> = {}
        filteredLogs.forEach(log => {
            if (log.display_campaign) {
                counts[log.display_campaign] = (counts[log.display_campaign] || 0) + 1
            }
        })

        return Object.entries(counts)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
    }, [filteredLogs])

    // Top 8 for charts to avoid clutter
    const topChartData = useMemo(() => chartData.slice(0, 8), [chartData])

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header com Filtro */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="space-y-1">
                    <h2 className="text-3xl font-bold tracking-tight text-white">Analytics de Campanhas</h2>
                    <p className="text-muted-foreground text-sm">
                        Distribuição e volume de cliques por origem e campanha.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Filtrar campanhas..."
                            className="pl-10 w-[240px] bg-zinc-900/50 border-zinc-800 h-9 text-xs"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={fetchLogs}
                        disabled={loading}
                        className="h-9 w-9 border-zinc-800 hover:bg-zinc-800"
                    >
                        <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <Card className="bg-card border-zinc-800 shadow-xl overflow-hidden min-h-[520px] flex flex-col">
                    <CardHeader className="pb-4 pt-6 px-6">
                        <CardTitle className="text-xl font-extrabold flex items-center gap-2 uppercase tracking-tighter text-white">
                            <PieChartIcon className="h-5 w-5 text-primary" />
                            Composição de Entradas
                        </CardTitle>
                        <CardDescription className="text-sm text-muted-foreground/70">Proporção de engajamento por campanha ativa.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 pb-8">
                        {loading ? (
                            <div className="h-full flex items-center justify-center">
                                <RefreshCw className="h-8 w-8 text-zinc-800 animate-spin" />
                            </div>
                        ) : topChartData.length === 0 ? (
                            <div className="h-full flex items-center justify-center text-muted-foreground italic">
                                Nenhum dado encontrado.
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={topChartData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={80}
                                        outerRadius={130}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {topChartData.map((entry, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={COLORS[index % COLORS.length]}
                                                stroke="rgba(0,0,0,0.2)"
                                            />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '8px' }}
                                        itemStyle={{ color: '#fff' }}
                                    />
                                    <Legend
                                        verticalAlign="bottom"
                                        height={48}
                                        formatter={(value) => <span className="text-xs text-zinc-400 font-medium">{value}</span>}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>

                <Card className="bg-card border-zinc-800 shadow-xl overflow-hidden min-h-[520px] flex flex-col">
                    <CardHeader className="pb-4 pt-6 px-6">
                        <CardTitle className="text-xl font-extrabold flex items-center gap-2 uppercase tracking-tighter text-white">
                            <BarChart3 className="h-5 w-5 text-white" />
                            Volume Total de Cliques
                        </CardTitle>
                        <CardDescription className="text-sm text-muted-foreground/70">Ranking absoluto das campanhas mais acessadas no período.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 pb-8 pr-8">
                        {loading ? (
                            <div className="h-full flex items-center justify-center">
                                <RefreshCw className="h-8 w-8 text-zinc-800 animate-spin" />
                            </div>
                        ) : topChartData.length === 0 ? (
                            <div className="h-full flex items-center justify-center text-muted-foreground italic">
                                Nenhum dado encontrado.
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={topChartData} layout="vertical" margin={{ left: 10 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={false} />
                                    <XAxis type="number" hide />
                                    <YAxis
                                        dataKey="name"
                                        type="category"
                                        width={140}
                                        tick={{ fontSize: 11, fill: '#a1a1aa', fontWeight: 500 }}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <Tooltip
                                        cursor={{ fill: '#27272a', opacity: 0.4 }}
                                        content={({ active, payload }) => {
                                            if (active && payload && payload.length) {
                                                return (
                                                    <div className="bg-zinc-950 border border-zinc-800 p-2.5 rounded-lg shadow-2xl text-[10px]">
                                                        <p className="font-bold text-white mb-1 uppercase opacity-70 tracking-wider">Clique Identificado</p>
                                                        <p className="text-primary font-bold text-lg">{payload[0].value}</p>
                                                    </div>
                                                )
                                            }
                                            return null
                                        }}
                                    />
                                    <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={24}>
                                        {topChartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>
            </div>

        </div>
    )
}
