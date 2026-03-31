"use client"

import { useEffect, useState, useMemo } from 'react'
import {
    Bar,
    BarChart,
    CartesianGrid,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    Legend,
    Line,
    LineChart
} from "recharts"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
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
import { KpiCard } from "./kpi-card"
import { MessageSquare, Calendar as CalendarIcon, History, TrendingUp, Clock, MousePointer2, CheckCircle2, MapPin, ExternalLink, Users } from "lucide-react"
import { startOfDay, endOfDay, startOfMonth, endOfMonth, subDays, format, parseISO, differenceInDays } from "date-fns"
import { ptBR } from "date-fns/locale"
import { DateRange } from "react-day-picker"
import { settingsService } from "@/lib/settings-service"
import { useDashboard } from "@/lib/dashboard-context"
import { AgentSelector } from "./agent-selector"
import { cn } from "@/lib/utils"

const DDD_TO_STATE: Record<string, string> = {
    '11': 'SP', '12': 'SP', '13': 'SP', '14': 'SP', '15': 'SP', '16': 'SP', '17': 'SP', '18': 'SP', '19': 'SP',
    '21': 'RJ', '22': 'RJ', '24': 'RJ',
    '27': 'ES', '28': 'ES',
    '31': 'MG', '32': 'MG', '33': 'MG', '34': 'MG', '35': 'MG', '37': 'MG', '38': 'MG',
    '41': 'PR', '42': 'PR', '43': 'PR', '44': 'PR', '45': 'PR', '46': 'PR',
    '47': 'SC', '48': 'SC', '49': 'SC',
    '51': 'RS', '53': 'RS', '54': 'RS', '55': 'RS',
    '61': 'DF',
    '62': 'GO', '64': 'GO',
    '63': 'TO',
    '65': 'MT', '66': 'MT',
    '67': 'MS',
    '68': 'AC',
    '69': 'RO',
    '71': 'BA', '73': 'BA', '74': 'BA', '75': 'BA', '77': 'BA',
    '79': 'SE',
    '81': 'PE', '87': 'PE',
    '82': 'AL',
    '83': 'PB',
    '84': 'RN',
    '85': 'CE', '88': 'CE',
    '86': 'PI', '89': 'PI',
    '91': 'PA', '92': 'AM', '93': 'PA', '94': 'PA',
    '95': 'RR',
    '96': 'AP',
    '97': 'AM',
    '98': 'MA', '99': 'MA'
}

export function ConversationsAnalysis() {
    const { settings: ctxSettings, settingsLoaded, availableAgents, agentsLoaded } = useDashboard()
    const [loading, setLoading] = useState(true)
    const [kpis, setKpis] = useState({ today: 0, month: 0, lifetime: 0, todayPrev: 0, monthPrev: 0, totalPeriod: 0 })
    const [dailyKpis, setDailyKpis] = useState<{ date: string, connected: number, total: number }[]>([])
    const [date, setDate] = useState<DateRange | undefined>(undefined)
    const [hourlyData, setHourlyData] = useState<any[]>([])
    const [stateDistribution, setStateDistribution] = useState<{ state: string, count: number, connectedCount: number, percentage: number, connectivityRate: number }[]>([])
    const [selectedAgents, setSelectedAgents] = useState<string[]>([])
    const [agentNames, setAgentNames] = useState<Record<string, string>>({})
    const [settings, setSettings] = useState({ threshold: 3, totalLeadsTarget: 100, connectivityTarget: 30 })

    useEffect(() => {
        if (settingsLoaded) {
            setSettings({ threshold: ctxSettings.interaction_threshold || 3, totalLeadsTarget: ctxSettings.total_leads_target || 100, connectivityTarget: ctxSettings.connectivity_target || 30 })
            setAgentNames(ctxSettings.agent_names || {})
        }
    }, [ctxSettings, settingsLoaded])

    useEffect(() => {
        if (agentsLoaded && availableAgents.length > 0 && selectedAgents.length === 0) setSelectedAgents(availableAgents)
    }, [agentsLoaded, availableAgents])

    const fetchData = async () => {
        setLoading(true)
        try {
            const now = new Date()
            const fromDate = date?.from
            const toDate = date?.to
            const todayStart = startOfDay(now).toISOString(), todayEnd = endOfDay(now).toISOString()
            const yesterdayStart = startOfDay(subDays(now, 1)).toISOString(), yesterdayEnd = endOfDay(subDays(now, 1)).toISOString()
            const monthStart = fromDate ? fromDate.toISOString() : startOfMonth(now).toISOString()
            const monthEnd = toDate ? toDate.toISOString() : endOfMonth(now).toISOString()

            let prevMonthStart: string, prevMonthEnd: string
            if (fromDate && toDate) {
                const durationInDays = differenceInDays(toDate, fromDate) + 1
                prevMonthStart = subDays(fromDate, durationInDays).toISOString()
                prevMonthEnd = subDays(toDate, durationInDays).toISOString()
            } else {
                prevMonthStart = startOfMonth(subDays(startOfMonth(now), 1)).toISOString()
                prevMonthEnd = endOfMonth(subDays(startOfMonth(now), 1)).toISOString()
            }

            const buildKpiQuery = () => {
                let q = supabase.from('info_lead').select('*', { count: 'exact', head: true }).gt('contador_interacoes', settings.threshold)
                if (selectedAgents.length > 0) q = q.in('agent_id', selectedAgents)
                return q
            }

            const buildTotalLeadsQuery = () => {
                let q = supabase.from('info_lead').select('*', { count: 'exact', head: true })
                if (selectedAgents.length > 0) q = q.in('agent_id', selectedAgents)
                if (fromDate && toDate) q = q.gte('created_at', monthStart).lte('created_at', monthEnd)
                return q
            }

            const [todayRes, yesterdayRes, monthRes, prevMonthRes, totalRes] = await Promise.all([
                buildKpiQuery().gte('created_at', todayStart).lte('created_at', todayEnd),
                buildKpiQuery().gte('created_at', yesterdayStart).lte('created_at', yesterdayEnd),
                buildKpiQuery().gte('created_at', monthStart).lte('created_at', monthEnd),
                buildKpiQuery().gte('created_at', prevMonthStart).lte('created_at', prevMonthEnd),
                buildTotalLeadsQuery()
            ])

            setKpis({ today: todayRes.count || 0, month: monthRes.count || 0, lifetime: 0, todayPrev: yesterdayRes.count || 0, monthPrev: prevMonthRes.count || 0, totalPeriod: totalRes.count || 0 })

            // Paginação para leads (horários + daily)
            let allLeadsData: any[] = []
            let leadsPage = 0
            const PAGE_SIZE = 1000
            let leadsHasMore = true

            while (leadsHasMore) {
                let leadsQuery = supabase.from('info_lead').select('created_at, contador_interacoes, agent_id').order('created_at', { ascending: false }).range(leadsPage * PAGE_SIZE, (leadsPage + 1) * PAGE_SIZE - 1)
                if (fromDate && toDate) leadsQuery = leadsQuery.gte('created_at', monthStart).lte('created_at', monthEnd)
                if (selectedAgents.length > 0) leadsQuery = leadsQuery.in('agent_id', selectedAgents)
                const { data } = await leadsQuery
                if (data && data.length > 0) {
                    allLeadsData = [...allLeadsData, ...data]
                    leadsHasMore = data.length === PAGE_SIZE
                    leadsPage++
                } else {
                    leadsHasMore = false
                }
            }

            const hours: any = {}
            for (let i = 0; i < 24; i++) hours[i] = { hour: i.toString().padStart(2, '0') + ':00', messages: 0, connected: 0 }
            const dailyData: Record<string, { connected: number, total: number }> = {}

            allLeadsData.forEach(lead => {
                const dateObj = new Date(lead.created_at)
                if (isNaN(dateObj.getTime())) return
                const hour = dateObj.getHours(), interactions = lead.contador_interacoes || 0
                hours[hour].messages++; if (interactions > settings.threshold) hours[hour].connected++
                const dateStr = format(dateObj, 'yyyy-MM-dd')
                if (!dailyData[dateStr]) dailyData[dateStr] = { connected: 0, total: 0 }
                dailyData[dateStr].total++; if (interactions > settings.threshold) dailyData[dateStr].connected++
            })
            setHourlyData(Object.values(hours))
            setDailyKpis(Object.entries(dailyData).sort(([a], [b]) => a.localeCompare(b)).map(([date, counts]) => ({ date, ...counts })))

            // Paginação para geo
            let allGeoData: any[] = []
            let geoPage = 0
            let geoHasMore = true

            while (geoHasMore) {
                let geoQuery = supabase.from('info_lead').select('phone, contador_interacoes, agent_id').order('created_at', { ascending: false }).range(geoPage * PAGE_SIZE, (geoPage + 1) * PAGE_SIZE - 1)
                if (fromDate && toDate) geoQuery = geoQuery.gte('created_at', monthStart).lte('created_at', monthEnd)
                if (selectedAgents.length > 0) geoQuery = geoQuery.in('agent_id', selectedAgents)
                const { data } = await geoQuery
                if (data && data.length > 0) {
                    allGeoData = [...allGeoData, ...data]
                    geoHasMore = data.length === PAGE_SIZE
                    geoPage++
                } else {
                    geoHasMore = false
                }
            }

            const countsMap: Record<string, { total: number, connected: number }> = {}
            let totalPhones = 0
            allGeoData.forEach(lead => {
                if (!lead.phone) return
                const phoneDigits = lead.phone.replace(/\D/g, ''), ddd = phoneDigits.startsWith('55') ? phoneDigits.substring(2, 4) : phoneDigits.substring(0, 2), state = DDD_TO_STATE[ddd] || 'Outros'
                if (!countsMap[state]) countsMap[state] = { total: 0, connected: 0 }
                countsMap[state].total++; if ((lead.contador_interacoes || 0) > settings.threshold) countsMap[state].connected++; totalPhones++
            })
            setStateDistribution(Object.entries(countsMap).map(([state, data]) => ({ state, count: data.total, connectedCount: data.connected, percentage: totalPhones > 0 ? (data.total / totalPhones) * 100 : 0, connectivityRate: data.total > 0 ? (data.connected / data.total) * 100 : 0 })).sort((a, b) => b.count - a.count))
        } catch (error) {
            console.error("Error fetching analysis data:", error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { fetchData() }, [settings.threshold, selectedAgents, date])

    const agentLabel = useMemo(() => {
        if (selectedAgents.length === 0 || selectedAgents.length === availableAgents.length) return "Todos os agentes"
        if (selectedAgents.length === 1) return agentNames[selectedAgents[0]] || selectedAgents[0]
        return `${selectedAgents.length} Agentes`
    }, [selectedAgents, availableAgents, agentNames])

    const calculatedMonthlyGoal = Math.round(settings.totalLeadsTarget * (settings.connectivityTarget / 100))
    const calculatedDailyGoal = Math.round(calculatedMonthlyGoal / 22)

    const chartConfig = { messages: { label: "Iniciaram Conversa", color: "#3b82f6" }, connected: { label: "Leads Conectados", color: "#10b981" } } satisfies ChartConfig

    return (
        <div className="flex flex-col h-full gap-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between flex-shrink-0">
                <div className="flex flex-col gap-0.5">
                    <h2 className="text-lg font-bold tracking-tight">Análise de Engajamento</h2>
                    <p className="text-muted-foreground text-xs">Visão detalhada do volume de interações e comportamento temporal.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Popover>
                        <PopoverTrigger asChild><Button id="date" variant={"outline"} className={cn("w-[260px] justify-start text-left font-normal bg-background", !date && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{date?.from ? (date.to ? <>{format(date.from, "dd 'de' MMM", { locale: ptBR })} - {format(date.to, "dd 'de' MMM", { locale: ptBR })}</> : format(date.from, "dd 'de' MMM, yyyy", { locale: ptBR })) : <span>Selecione uma data</span>}</Button></PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="end"><Calendar initialFocus mode="range" defaultMonth={date?.from} selected={date} onSelect={setDate} numberOfMonths={2} locale={ptBR} /></PopoverContent>
                    </Popover>
                    <AgentSelector agents={availableAgents} selectedAgents={selectedAgents} onChange={setSelectedAgents} isLoading={loading && availableAgents.length === 0} namesMap={agentNames} />
                </div>
            </div>

            <div className="grid gap-3 md:grid-cols-3 flex-shrink-0">
                <KpiCard title="Conectados Hoje" value={kpis.today} currentValue={kpis.today} previousValue={kpis.todayPrev} goal={calculatedDailyGoal} description="Leads que atingiram o limiar de engajamento nas últimas 24 horas." icon={<MessageSquare className="h-5 w-5" />} secondaryMetric={{ label: "Taxa Diária", value: kpis.today > 0 ? "Ativo" : "Pendente" }} />
                <KpiCard title={date?.from ? "Conectados no Período" : "Conectados no Mês"} value={kpis.month} currentValue={kpis.month} previousValue={kpis.monthPrev} goal={calculatedMonthlyGoal} description={date?.from ? "Volume de leads qualificados no período selecionado." : "Volume de leads qualificados no mês atual."} icon={<CalendarIcon className="h-5 w-5" />} secondaryMetric={{ label: "Evolução Conexões", value: `${((kpis.month / (kpis.totalPeriod || 1)) * 100).toFixed(1)}%` }} />
                <KpiCard title={date?.from ? "Leads no Período" : "Total de Leads (Geral)"} value={kpis.totalPeriod} goal={0} goalLabel="Meta" currentValue={kpis.totalPeriod} description={date?.from ? `Soma de todos os leads recebidos no período selecionado pelo ${agentLabel}.` : `Soma histórica de todos os leads recebidos pelo ${agentLabel}.`} icon={<Users className="h-5 w-5" />} secondaryMetric={{ label: "Fluxo de Leads", value: "Volume" }} />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-3 flex-1 min-h-0">
                <Card className="shadow-lg border-muted xl:col-span-2 flex flex-col min-h-0">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 flex-shrink-0">
                        <CardTitle className="text-lg font-semibold tracking-tight text-foreground/80 uppercase">Horários de Pico</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col pt-2 min-h-0">
                        <ChartContainer config={chartConfig} className="aspect-auto flex-1 min-h-0 w-full">
                            <BarChart data={hourlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <CartesianGrid vertical={false} strokeDasharray="3 3" strokeOpacity={0.1} />
                                <XAxis dataKey="hour" tickLine={false} axisLine={false} tickMargin={10} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                                <YAxis tickLine={false} axisLine={false} tickMargin={10} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                                <ChartTooltip content={<ChartTooltipContent />} />
                                <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', paddingBottom: '20px' }} />
                                <Bar dataKey="messages" name="Iniciaram" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
                                <Bar dataKey="connected" name="Conectados" fill="#10b981" radius={[4, 4, 0, 0]} barSize={40} />
                            </BarChart>
                        </ChartContainer>
                        <div className="mt-auto pt-2 border-t border-primary/20 flex-shrink-0">
                            <p className="text-xs text-muted-foreground italic leading-relaxed text-center">Identificação dos momentos de maior atividade, analisando o comportamento temporal dos leads.</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="shadow-lg border-muted xl:col-span-1 flex flex-col min-h-0">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 flex-shrink-0">
                        <CardTitle className="text-lg font-semibold tracking-tight text-foreground/80 uppercase">Origem dos Leads</CardTitle>
                        <Dialog>
                            <DialogTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><ExternalLink className="h-4 w-4" /></Button></DialogTrigger>
                            <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col bg-[#0a0a0a] border-muted">
                                <DialogHeader className="pb-4 border-b border-muted"><DialogTitle className="text-xl font-bold flex items-center gap-2"><MapPin className="h-5 w-5 text-blue-500" />Distribuição Geográfica Completa</DialogTitle></DialogHeader>
                                <div className="overflow-auto pr-2 mt-4 custom-scrollbar">
                                    <Table>
                                        <TableHeader className="bg-muted/30"><TableRow className="border-muted hover:bg-transparent"><TableHead className="w-[100px] text-white">Estado</TableHead><TableHead className="text-right text-white">Volume Total</TableHead><TableHead className="text-right text-white">Market Share</TableHead><TableHead className="text-right text-white">Conectados</TableHead><TableHead className="text-right text-white">Taxa de Conexão</TableHead></TableRow></TableHeader>
                                        <TableBody>{stateDistribution.map((i) => <TableRow key={i.state} className="border-muted hover:bg-white/5 transition-colors"><TableCell className="font-bold text-white">{i.state}</TableCell><TableCell className="text-right font-mono">{i.count}</TableCell><TableCell className="text-right text-muted-foreground">{i.percentage.toFixed(1)}%</TableCell><TableCell className="text-right font-mono text-white/70">{i.connectedCount}</TableCell><TableCell className="text-right"><div className="flex items-center justify-end gap-2"><span className="font-bold text-white">{i.connectivityRate.toFixed(1)}%</span></div></TableCell></TableRow>)}</TableBody>
                                    </Table>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col gap-3 min-h-0 overflow-y-auto custom-scrollbar">
                        <div className="space-y-3">
                            {stateDistribution.slice(0, 10).map((i, idx) => (
                                <div key={i.state} className="group flex flex-col gap-1">
                                    <div className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-2"><span className="font-bold text-white w-6">{i.state}</span><span className="text-[10px] text-muted-foreground uppercase tracking-wider">{i.count} leads</span></div>
                                        <div className="flex items-center gap-2"><span className="font-bold text-white">{i.connectivityRate.toFixed(1)}%</span></div>
                                    </div>
                                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden relative"><div className="h-full bg-white transition-all duration-500" style={{ width: `${i.percentage}%`, opacity: 1 - (idx * 0.08) }} /></div>
                                </div>
                            ))}
                        </div>
                        <div className="mt-auto pt-2 border-t border-primary/20 flex-shrink-0">
                            <p className="text-xs text-muted-foreground italic leading-relaxed text-center">Distribuição por Estado (UF) {stateDistribution.length > 10 ? `— E mais ${stateDistribution.length - 10} estados detectados.` : ''}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
