"use client"

import { useEffect, useState, useMemo, useRef } from 'react'
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { supabase } from "@/lib/supabaseClient"
import { useDashboard } from "@/lib/dashboard-context"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
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
import { Users, MessageSquare, Activity, Settings, HelpCircle, Calendar as CalendarIcon, PieChart as PieChartIcon, Search, RefreshCw, BarChart3, Target } from "lucide-react"
import { format, subDays, differenceInDays, getDaysInMonth, eachDayOfInterval, startOfMonth, endOfMonth, setMonth, setYear } from "date-fns"
import { ptBR } from "date-fns/locale"
import { DateRange } from "react-day-picker"
import { cn } from "@/lib/utils"
import { settingsService } from "@/lib/settings-service"
import {
    PieChart,
    Pie,
    Cell,
    Legend,
    BarChart,
    Bar,
    LineChart,
    Line,
    ResponsiveContainer,
    Tooltip as RechartsTooltip,
    ReferenceLine
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

// --- Configurações Visuais ---
const BLUE_PALETTE = [
    "#3b82f6", "#ffffff", "#1e40af", "#94a3b8", "#60a5fa", "#cbd5e1", "#172554", "#bfdbfe", "#f1f5f9", "#2563eb"
]

export function LeadsAreaChart() {
    const { settings, settingsLoaded, availableAgents, agentsLoaded } = useDashboard()
    const [chartData, setChartData] = useState<any[]>([])
    const [selectedAgents, setSelectedAgents] = useState<string[]>([])
    const [loading, setLoading] = useState(true)
    const [date, setDate] = useState<DateRange | undefined>(undefined)
    const [metricType, setMetricType] = useState<"total" | "connected" | "comparison">("comparison")
    const [campaignLogs, setCampaignLogs] = useState<CampaignLog[]>([])
    const [campaignLeadMap, setCampaignLeadMap] = useState<Map<string, { isLead: boolean, isConnected: boolean }>>(new Map())
    const [campaignLoading, setCampaignLoading] = useState(false)
    const [kpis, setKpis] = useState({ totalLeads: 0, connectedLeads: 0, mqlLeads: 0, avgConnectivity: 0 })
    const [previousKpis, setPreviousKpis] = useState({ totalLeads: 0, connectedLeads: 0, mqlLeads: 0, avgConnectivity: 0 })

    const interactionThreshold = settings.interaction_threshold
    const connectivityTarget = settings.connectivity_target
    const totalLeadsTarget = settings.total_leads_target
    const connectedLeadsTarget = settings.connected_leads_target
    const mqlTarget = settings.mql_target
    const agentNames = settings.agent_names || {}

    const calculateProportionalTarget = (monthlyTarget: number, dateRange: DateRange | undefined) => {
        if (!dateRange?.from) return Math.round(monthlyTarget * (7 / 30))
        const end = dateRange.to || dateRange.from
        try {
            const days = eachDayOfInterval({ start: dateRange.from, end })
            let totalTarget = 0
            days.forEach(day => {
                const daysInMonth = getDaysInMonth(day)
                if (daysInMonth > 0) totalTarget += (monthlyTarget / daysInMonth)
            })
            return Math.round(totalTarget)
        } catch (e) {
            return monthlyTarget
        }
    }

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

    const extractCampaignName = (campaign: string | undefined): string => {
        if (!campaign || campaign.trim() === "") return "Direto / Orgânico"
        const matches = campaign.match(/\[([^\]]+)\]/g)
        if (matches && matches.length >= 7) return matches[6].replace(/[\[\]]/g, '').replace(/\+/g, ' ')
        if (campaign.startsWith('[') && matches && matches.length > 0) return matches[matches.length - 1].replace(/[\[\]]/g, '').replace(/\+/g, ' ')
        return campaign.replace(/\+/g, ' ')
    }

    const fetchCampaignLogs = async () => {
        setCampaignLoading(true)
        try {
            const fromDate = date?.from || subDays(new Date(), 7)
            const toDate = date?.to || new Date()
            const queryEndDate = new Date(toDate)
            queryEndDate.setHours(23, 59, 59, 999)

            // Paginação: buscar todos os registros em batches de 1000
            let allData: any[] = []
            let page = 0
            const PAGE_SIZE = 1000
            let hasMore = true

            while (hasMore) {
                const { data, error } = await supabase
                    .from('campaign_log')
                    .select('*')
                    .gte('created_at', fromDate.toISOString())
                    .lte('created_at', queryEndDate.toISOString())
                    .order('created_at', { ascending: false })
                    .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

                if (error) throw error
                if (data && data.length > 0) {
                    allData = [...allData, ...data]
                    hasMore = data.length === PAGE_SIZE
                    page++
                } else {
                    hasMore = false
                }
            }

            const enrichedLogs = allData.map(log => {
                const campaignValue = log.utm_campaign || log.camping || log.campaign_name || log["camping name"] || ""
                return { ...log, display_campaign: extractCampaignName(campaignValue) }
            })
            setCampaignLogs(enrichedLogs)

            // Cross-reference: buscar info_lead para os telefones das campanhas
            const uniquePhones = Array.from(new Set(enrichedLogs.map(l => l.phone).filter(Boolean)))
            const leadMap = new Map<string, { isLead: boolean, isConnected: boolean }>()

            if (uniquePhones.length > 0) {
                // Buscar em batches de 100 phones (limite do filtro IN do Supabase)
                const PHONE_BATCH = 100
                for (let i = 0; i < uniquePhones.length; i += PHONE_BATCH) {
                    const phoneBatch = uniquePhones.slice(i, i + PHONE_BATCH)
                    const { data: leadData } = await supabase
                        .from('info_lead')
                        .select('phone, contador_interacoes')
                        .in('phone', phoneBatch)

                    leadData?.forEach(lead => {
                        if (lead.phone) {
                            const existing = leadMap.get(lead.phone)
                            const isConnected = (lead.contador_interacoes || 0) > interactionThreshold
                            if (existing) {
                                existing.isConnected = existing.isConnected || isConnected
                            } else {
                                leadMap.set(lead.phone, { isLead: true, isConnected })
                            }
                        }
                    })
                }
            }
            setCampaignLeadMap(leadMap)
        } catch (error) {
            console.error("Erro ao buscar logs de campanha:", error)
        } finally {
            setCampaignLoading(false)
        }
    }

    const campaignChartData = useMemo(() => {
        const counts: Record<string, { contacts: number, leads: number, connected: number }> = {}
        campaignLogs.forEach(log => {
            if (!log.display_campaign) return
            if (!counts[log.display_campaign]) counts[log.display_campaign] = { contacts: 0, leads: 0, connected: 0 }
            counts[log.display_campaign].contacts++
            const phoneInfo = log.phone ? campaignLeadMap.get(log.phone) : undefined
            if (phoneInfo?.isLead) counts[log.display_campaign].leads++
            if (phoneInfo?.isConnected) counts[log.display_campaign].connected++
        })
        return Object.entries(counts)
            .map(([name, data]) => ({ name, ...data }))
            .sort((a, b) => b.contacts - a.contacts)
            .slice(0, 8)
    }, [campaignLogs, campaignLeadMap])

    useEffect(() => {
        if (agentsLoaded && availableAgents.length > 0 && selectedAgents.length === 0) setSelectedAgents(availableAgents)
    }, [agentsLoaded, availableAgents])

    const fetchLeadsData = async () => {
        try {
            setLoading(true)
            const defaultFrom = subDays(new Date(), 7)
            const fromDate = date?.from || defaultFrom
            const toDate = date?.to || new Date()
            const queryEndDate = new Date(toDate)
            queryEndDate.setHours(23, 59, 59, 999)
            const durationInDays = differenceInDays(queryEndDate, fromDate) + 1
            const previousFromDate = subDays(fromDate, durationInDays)
            const previousToDate = subDays(queryEndDate, durationInDays)

            const agentFilter = selectedAgents.length > 0 ? selectedAgents : null

            if (!agentFilter) {
                setChartData([]); setKpis({ totalLeads: 0, connectedLeads: 0, mqlLeads: 0, avgConnectivity: 0 }); setPreviousKpis({ totalLeads: 0, connectedLeads: 0, mqlLeads: 0, avgConnectivity: 0 }); setLoading(false); return
            }

            // Helper de paginação
            const fetchAllPages = async (buildQuery: (page: number, pageSize: number) => any) => {
                let allData: any[] = []
                let page = 0
                const PAGE_SIZE = 1000
                let hasMore = true
                while (hasMore) {
                    const result = await buildQuery(page, PAGE_SIZE)
                    if (result.error) throw result.error
                    if (result.data && result.data.length > 0) {
                        allData = [...allData, ...result.data]
                        hasMore = result.data.length === PAGE_SIZE
                        page++
                    } else {
                        hasMore = false
                    }
                }
                return allData
            }

            const [data, previousData] = await Promise.all([
                fetchAllPages((page, size) => {
                    let q = supabase.from('info_lead').select('created_at, agent_id, contador_interacoes, is_mql').order('created_at', { ascending: true }).gte('created_at', fromDate.toISOString()).lte('created_at', queryEndDate.toISOString()).range(page * size, (page + 1) * size - 1)
                    if (agentFilter) q = q.in('agent_id', agentFilter)
                    return q
                }),
                fetchAllPages((page, size) => {
                    let q = supabase.from('info_lead').select('created_at, agent_id, contador_interacoes, is_mql').gte('created_at', previousFromDate.toISOString()).lte('created_at', previousToDate.toISOString()).range(page * size, (page + 1) * size - 1)
                    if (agentFilter) q = q.in('agent_id', agentFilter)
                    return q
                })
            ])

            let prevTotal = 0, prevConnected = 0, prevMql = 0
            previousData?.forEach((lead: any) => {
                const isConnected = (lead.contador_interacoes || 0) > interactionThreshold
                prevTotal++; if (isConnected) prevConnected++; if (lead.is_mql) prevMql++
            })
            setPreviousKpis({ totalLeads: prevTotal, connectedLeads: prevConnected, mqlLeads: prevMql, avgConnectivity: prevTotal > 0 ? (prevConnected / prevTotal) * 100 : 0 })

            let totalLeadsCount = 0, connectedLeadsCount = 0, mqlLeadsCount = 0
            const leadsByDate = new Map<string, any>()
            let fillStart = new Date(fromDate)
            for (let d = new Date(fillStart); d <= toDate; d.setDate(d.getDate() + 1)) {
                const dateStr = d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' }).replace('.', '')
                if (!leadsByDate.has(dateStr)) {
                    const initialData: any = { date: dateStr, fullDate: new Date(d), total: 0, connected: 0, mql: 0 }
                    selectedAgents.forEach((agent: string) => { initialData[agent] = 0; initialData[`${agent}_connected`] = 0; initialData[`${agent}_mql`] = 0 })
                    leadsByDate.set(dateStr, initialData)
                }
            }

            data?.forEach((lead: any) => {
                const dateObj = new Date(lead.created_at)
                const dateStr = dateObj.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' }).replace('.', '')
                if (!leadsByDate.has(dateStr)) {
                    const initialData: any = { date: dateStr, fullDate: dateObj, total: 0, connected: 0, mql: 0 }
                    selectedAgents.forEach((agent: string) => { initialData[agent] = 0; initialData[`${agent}_connected`] = 0 })
                    leadsByDate.set(dateStr, initialData)
                }
                const dayData = leadsByDate.get(dateStr)
                const agent = lead.agent_id
                const isConnected = (lead.contador_interacoes || 0) > interactionThreshold
                totalLeadsCount++; if (isConnected) connectedLeadsCount++; if (lead.is_mql) mqlLeadsCount++
                if (selectedAgents.includes(agent)) {
                    dayData[agent] = (dayData[agent] || 0) + 1
                    if (isConnected) dayData[`${agent}_connected`] = (dayData[`${agent}_connected`] || 0) + 1
                    if (lead.is_mql) dayData[`${agent}_mql`] = (dayData[`${agent}_mql`] || 0) + 1
                    dayData['total'] = (dayData['total'] || 0) + 1
                    if (isConnected) dayData['connected'] = (dayData['connected'] || 0) + 1
                    if (lead.is_mql) dayData['mql'] = (dayData['mql'] || 0) + 1
                }
            })
            const sortedData = Array.from(leadsByDate.values()).sort((a, b) => a.fullDate.getTime() - b.fullDate.getTime())
            setChartData(sortedData)
            setKpis({ totalLeads: totalLeadsCount, connectedLeads: connectedLeadsCount, mqlLeads: mqlLeadsCount, avgConnectivity: totalLeadsCount > 0 ? (connectedLeadsCount / totalLeadsCount) * 100 : 0 })
            setLoading(false)
        } catch (err) {
            console.error('Erro:', err); setLoading(false)
        }
    }

    useEffect(() => {
        if (selectedAgents.length > 0 || availableAgents.length > 0) { fetchLeadsData(); fetchCampaignLogs() }
    }, [date, selectedAgents, metricType, interactionThreshold])

    const fetchLeadsDataRef = useRef(fetchLeadsData)
    const fetchCampaignLogsRef = useRef(fetchCampaignLogs)
    useEffect(() => { fetchLeadsDataRef.current = fetchLeadsData })
    useEffect(() => { fetchCampaignLogsRef.current = fetchCampaignLogs })

    useEffect(() => {
        const infoLeadsChannel = supabase.channel('info-leads-changes').on('postgres_changes', { event: '*', schema: 'public', table: 'info_lead' }, () => { fetchLeadsDataRef.current() }).subscribe()
        const campaignLogsChannel = supabase.channel('campaign-logs-changes').on('postgres_changes', { event: '*', schema: 'public', table: 'campaign_log' }, () => { fetchCampaignLogsRef.current() }).subscribe()
        return () => { supabase.removeChannel(infoLeadsChannel); supabase.removeChannel(campaignLogsChannel) }
    }, [])

    return (
        <div className="flex flex-col h-full gap-3 relative">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between flex-shrink-0">
                <h2 className="text-lg font-bold text-foreground">Performance de Leads</h2>
                <div className="flex flex-wrap items-center gap-2">
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button id="date" variant={"outline"} className={cn("w-[260px] justify-start text-left font-normal", !date && "text-muted-foreground")}>
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {date?.from ? (date.to ? <>{format(date.from, "dd 'de' MMM", { locale: ptBR })} - {format(date.to, "dd 'de' MMM", { locale: ptBR })}</> : format(date.from, "dd 'de' MMM, yyyy", { locale: ptBR })) : <span>Selecione uma data</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="end">
                            <Calendar initialFocus mode="range" defaultMonth={date?.from} selected={date} onSelect={setDate} numberOfMonths={2} locale={ptBR} />
                        </PopoverContent>
                    </Popover>
                    <AgentSelector agents={availableAgents} selectedAgents={selectedAgents} onChange={setSelectedAgents} isLoading={loading && availableAgents.length === 0} namesMap={agentNames} />
                </div>
            </div>

            <div className="grid gap-3 md:grid-cols-3 flex-shrink-0 overflow-hidden" style={{ maxHeight: '42%' }}>
                <KpiCard title={!date?.from ? "Leads Totais da Semana" : "Leads Totais"} value={kpis.totalLeads} goal={0} currentValue={kpis.totalLeads} previousValue={previousKpis.totalLeads} goalLabel="Ponto" description={`Total de leads únicos recebidos no período.`} />
                <KpiCard title={!date?.from ? "Leads Conectados da Semana" : "Leads Conectados"} value={kpis.connectedLeads} goal={calculateProportionalTarget(connectedLeadsTarget, date)} currentValue={kpis.connectedLeads} previousValue={previousKpis.connectedLeads} description={`Leads que tiveram mais de ${interactionThreshold} interações.`} secondaryMetric={{ label: "Conversão", value: `${kpis.avgConnectivity.toFixed(1)}%`, goal: connectivityTarget }} chart={
                    <ChartContainer config={{ conversion: { label: "Conversão", color: "#3b82f6" } }} className="h-full w-full">
                        <LineChart data={chartData.map(d => ({ ...d, conversion: d.total > 0 ? (d.connected / d.total) * 100 : 0 }))} margin={{ left: 12, right: 12, top: 5, bottom: 5 }}>
                            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#333" />
                            <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} tick={{ fontSize: 10, fill: '#666' }} />
                            <YAxis domain={[0, 100]} width={30} tick={{ fontSize: 10, fill: '#666' }} ticks={[connectivityTarget]} axisLine={false} tickLine={false} />
                            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel formatter={(v) => `${Number(v).toFixed(1)}%`} />} />
                            <Line dataKey="conversion" type="monotone" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: "#3b82f6", strokeWidth: 2, stroke: "#000" }} activeDot={{ r: 6 }} />
                            <ReferenceLine y={connectivityTarget} stroke="#10b981" strokeDasharray="3 3" label={{ position: 'right', value: 'Meta', fontSize: 10, fill: '#10b981' }} />
                        </LineChart>
                    </ChartContainer>
                } />
                <KpiCard title="Leads MQL" value={kpis.mqlLeads} isPlaceholder={true} goal={calculateProportionalTarget(mqlTarget, date)} currentValue={kpis.mqlLeads} previousValue={previousKpis.mqlLeads} description="Leads qualificados pelo time de pré-vendas." secondaryMetric={{ label: "Conversão", value: kpis.connectedLeads > 0 ? `${((kpis.mqlLeads / kpis.connectedLeads) * 100).toFixed(1)}%` : "0%", goal: mqlTarget }} chart={
                    <ChartContainer config={{ conversion: { label: "Conversão", color: "#3b82f6" } }} className="h-full w-full">
                        <LineChart data={chartData.map(d => ({ ...d, conversion: d.connected > 0 ? (d.mql / d.connected) * 100 : 0 }))} margin={{ left: 12, right: 12, top: 5, bottom: 5 }}>
                            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#333" />
                            <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} tick={{ fontSize: 10, fill: '#666' }} />
                            <YAxis domain={[0, 100]} width={30} tick={{ fontSize: 10, fill: '#666' }} ticks={[mqlTarget]} axisLine={false} tickLine={false} />
                            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel formatter={(v) => `${Number(v).toFixed(1)}%`} />} />
                            <Line dataKey="conversion" type="monotone" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3, fill: "#3b82f6" }} />
                            <ReferenceLine y={mqlTarget} stroke="#10b981" strokeDasharray="3 3" />
                        </LineChart>
                    </ChartContainer>
                } />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-3 flex-1 min-h-0">
                <Card className="xl:col-span-2 flex flex-col min-h-0">
                    <CardHeader className="flex items-center gap-2 space-y-0 border-b py-3 sm:flex-row flex-shrink-0">
                        <div className="grid flex-1 gap-1 text-center sm:text-left">
                            <CardTitle className="text-lg font-semibold tracking-tight text-foreground/80 uppercase">Evolução Temporal</CardTitle>
                        </div>
                        <div className="flex items-center gap-2 rounded-md border p-1 bg-muted/50">
                            {["total", "connected", "comparison"].map((type) => (
                                <button key={type} onClick={() => setMetricType(type as any)} className={`px-3 py-1 text-xs rounded-sm transition-colors ${metricType === type ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:bg-background/50'}`}>
                                    {type === 'total' ? 'Total' : type === 'connected' ? 'Conectados' : 'Comparativo'}
                                </button>
                            ))}
                        </div>
                    </CardHeader>
                    <CardContent className="px-2 pt-2 sm:px-6 sm:pt-4 flex-1 min-h-0 flex flex-col">
                        <ChartContainer config={chartConfig} className="aspect-auto flex-1 min-h-0 w-full">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="fillTotal" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} /><stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05} /></linearGradient>
                                    <linearGradient id="fillConnected" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.5} /><stop offset="95%" stopColor="#10b981" stopOpacity={0.1} /></linearGradient>
                                    {selectedAgents.map(a => <linearGradient key={a} id={`fill${a}`} x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={chartConfig[a]?.color} stopOpacity={0.8} /><stop offset="95%" stopColor={chartConfig[a]?.color} stopOpacity={0.1} /></linearGradient>)}
                                </defs>
                                <CartesianGrid vertical={true} strokeDasharray="3 3" strokeOpacity={0.15} />
                                <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} minTickGap={32} tick={{ fontSize: 10, fill: '#888' }} />
                                <YAxis tickLine={false} axisLine={false} tickMargin={4} width={35} tick={{ fontSize: 10, fill: '#888' }} />
                                <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                                {metricType === 'comparison' ? (
                                    <>
                                        <Area dataKey="total" name="Total" type="monotone" fill="url(#fillTotal)" stroke="#3b82f6" fillOpacity={1} strokeWidth={2} />
                                        <Area dataKey="connected" name="Conectados" type="monotone" fill="url(#fillConnected)" stroke="#10b981" fillOpacity={1} strokeWidth={2} />
                                    </>
                                ) : selectedAgents.map(a => <Area key={a} dataKey={metricType === 'connected' ? `${a}_connected` : a} name={chartConfig[a]?.label as string} type="monotone" fill={`url(#fill${a})`} stroke={chartConfig[a]?.color} fillOpacity={0.4} strokeWidth={2} />)}
                                <ChartLegend content={<ChartLegendContent />} />
                            </AreaChart>
                        </ChartContainer>
                        <div className="mt-auto pt-2 border-t border-primary/20 flex-shrink-0">
                            <p className="text-xs text-muted-foreground italic leading-relaxed text-center">
                                {metricType === 'comparison' ? "Comparativo: Total vs Conectados" : `Comparando performance (${metricType === 'total' ? 'Total' : 'Conectados'})`}
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-card border-zinc-800 shadow-xl overflow-hidden flex flex-col xl:col-span-1 min-h-0">
                    <CardHeader className="pb-3 pt-4 px-6 border-b flex-shrink-0">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Target className="h-4 w-4 text-primary" />
                                <CardTitle className="text-lg font-semibold tracking-tight text-foreground/80 uppercase">Intermediação Ads → Wpp</CardTitle>
                            </div>
                            <span className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-full font-black border border-primary/20">RENATA V2</span>
                        </div>
                    </CardHeader>
                    <CardContent className="flex-1 pb-3 flex flex-col justify-between min-h-0">
                        {campaignLoading ? <div className="h-full flex items-center justify-center"><RefreshCw className="h-8 w-8 text-zinc-800 animate-spin" /></div> : campaignChartData.length === 0 ? <div className="h-full flex items-center justify-center text-muted-foreground italic text-sm">Nenhum dado encontrado.</div> : (
                            <div className="flex-1 min-h-0 flex flex-col gap-1.5 py-2 overflow-y-auto custom-scrollbar">
                                {/* Legenda */}
                                <div className="flex items-center gap-3 mb-1 flex-shrink-0">
                                    <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-500" /><span className="text-[9px] text-muted-foreground">Contatos</span></div>
                                    <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500" /><span className="text-[9px] text-muted-foreground">Leads</span></div>
                                    <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-amber-500" /><span className="text-[9px] text-muted-foreground">Conectados</span></div>
                                </div>
                                {campaignChartData.slice(0, 5).map((campaign) => {
                                    const maxValue = campaignChartData[0]?.contacts || 1
                                    return (
                                        <div key={campaign.name} className="flex flex-col gap-0.5">
                                            <span className="text-[10px] text-muted-foreground truncate" title={campaign.name}>{campaign.name}</span>
                                            <div className="flex flex-col gap-[2px]">
                                                {/* Barra 1: Contatos */}
                                                <div className="flex items-center gap-1.5">
                                                    <div className="flex-1 h-[6px] bg-muted/30 rounded-full overflow-hidden">
                                                        <div className="h-full rounded-full bg-blue-500 transition-all duration-500" style={{ width: `${(campaign.contacts / maxValue) * 100}%` }} />
                                                    </div>
                                                    <span className="text-[10px] font-bold text-blue-400 w-[28px] text-right flex-shrink-0">{campaign.contacts}</span>
                                                </div>
                                                {/* Barra 2: Leads */}
                                                <div className="flex items-center gap-1.5">
                                                    <div className="flex-1 h-[6px] bg-muted/30 rounded-full overflow-hidden">
                                                        <div className="h-full rounded-full bg-emerald-500 transition-all duration-500" style={{ width: `${(campaign.leads / maxValue) * 100}%` }} />
                                                    </div>
                                                    <span className="text-[10px] font-bold text-emerald-400 w-[28px] text-right flex-shrink-0">{campaign.leads}</span>
                                                </div>
                                                {/* Barra 3: Conectados */}
                                                <div className="flex items-center gap-1.5">
                                                    <div className="flex-1 h-[6px] bg-muted/30 rounded-full overflow-hidden">
                                                        <div className="h-full rounded-full bg-amber-500 transition-all duration-500" style={{ width: `${(campaign.connected / maxValue) * 100}%` }} />
                                                    </div>
                                                    <span className="text-[10px] font-bold text-amber-400 w-[28px] text-right flex-shrink-0">{campaign.connected}</span>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                        <div className="pt-2 border-t border-primary/20 flex-shrink-0">
                            <p className="text-xs text-muted-foreground italic leading-relaxed text-center">Funil por campanha — Contatos → Leads → Conectados.</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
