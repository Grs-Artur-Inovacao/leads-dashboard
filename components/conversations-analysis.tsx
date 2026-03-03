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
    const [loading, setLoading] = useState(true)
    const [kpis, setKpis] = useState({
        today: 0,
        month: 0,
        lifetime: 0,
        todayPrev: 0,
        monthPrev: 0,
        totalPeriod: 0
    })
    const [dailyKpis, setDailyKpis] = useState<{ date: string, connected: number, total: number }[]>([])
    const [date, setDate] = useState<DateRange | undefined>(undefined)
    const [hourlyData, setHourlyData] = useState<any[]>([])
    const [stateDistribution, setStateDistribution] = useState<{ state: string, count: number, connectedCount: number, percentage: number, connectivityRate: number }[]>([])
    const [selectedAgents, setSelectedAgents] = useState<string[]>([])
    const [availableAgents, setAvailableAgents] = useState<string[]>([])
    const [agentNames, setAgentNames] = useState<Record<string, string>>({})
    const [settings, setSettings] = useState({
        threshold: 3,
        totalLeadsTarget: 100,
        connectivityTarget: 30
    })

    useEffect(() => {
        const fetchSettings = async () => {
            const data = await settingsService.getSettings()
            if (data) {
                setSettings({
                    threshold: data.interaction_threshold || 3,
                    totalLeadsTarget: data.total_leads_target || 100,
                    connectivityTarget: data.connectivity_target || 30
                })
                setAgentNames(data.agent_names || {})
            }
        }
        fetchSettings()
    }, [])

    useEffect(() => {
        const fetchAgents = async () => {
            const { data, error } = await supabase
                .from('info_lead')
                .select('agent_id')
                .not('agent_id', 'is', null)

            if (error) return

            const uniqueAgents = Array.from(new Set(data?.map((d: any) => d.agent_id).filter(Boolean) || [])) as string[]
            setAvailableAgents(uniqueAgents)
            if (selectedAgents.length === 0) setSelectedAgents(uniqueAgents)
        }
        fetchAgents()
    }, [])

    const fetchData = async () => {
        setLoading(true)
        try {
            const now = new Date()
            const fromDate = date?.from
            const toDate = date?.to

            const todayStart = startOfDay(now).toISOString()
            const todayEnd = endOfDay(now).toISOString()
            const yesterdayStart = startOfDay(subDays(now, 1)).toISOString()
            const yesterdayEnd = endOfDay(subDays(now, 1)).toISOString()

            const monthStart = fromDate ? fromDate.toISOString() : startOfMonth(now).toISOString()
            const monthEnd = toDate ? toDate.toISOString() : endOfMonth(now).toISOString()

            // Calculate previous month based on selection
            let prevMonthStart: string
            let prevMonthEnd: string

            if (fromDate && toDate) {
                const durationInDays = differenceInDays(toDate, fromDate) + 1
                prevMonthStart = subDays(fromDate, durationInDays).toISOString()
                prevMonthEnd = subDays(toDate, durationInDays).toISOString()
            } else {
                // If no date range, comparison is vs previous calendar month
                prevMonthStart = startOfMonth(subDays(startOfMonth(now), 1)).toISOString()
                prevMonthEnd = endOfMonth(subDays(startOfMonth(now), 1)).toISOString()
            }

            // 1. Fetch KPI counts (Connected Leads only)
            const buildKpiQuery = () => {
                let q = supabase.from('info_lead').select('*', { count: 'exact', head: true })
                q = q.gt('contador_interacoes', settings.threshold)
                if (selectedAgents.length > 0) {
                    q = q.in('agent_id', selectedAgents)
                }
                return q
            }

            // Total Leads Query (Lifetime if no date, Range if date)
            const buildTotalLeadsQuery = () => {
                let q = supabase.from('info_lead').select('*', { count: 'exact', head: true })
                if (selectedAgents.length > 0) q = q.in('agent_id', selectedAgents)
                if (fromDate && toDate) {
                    q = q.gte('created_at', monthStart).lte('created_at', monthEnd)
                }
                return q
            }

            const [
                todayRes,
                yesterdayRes,
                monthRes,
                prevMonthRes,
                totalRes
            ] = await Promise.all([
                buildKpiQuery().gte('created_at', todayStart).lte('created_at', todayEnd),
                buildKpiQuery().gte('created_at', yesterdayStart).lte('created_at', yesterdayEnd),
                buildKpiQuery().gte('created_at', monthStart).lte('created_at', monthEnd),
                buildKpiQuery().gte('created_at', prevMonthStart).lte('created_at', prevMonthEnd),
                buildTotalLeadsQuery()
            ])

            setKpis({
                today: todayRes.count || 0,
                month: monthRes.count || 0,
                lifetime: 0,
                todayPrev: yesterdayRes.count || 0,
                monthPrev: prevMonthRes.count || 0,
                totalPeriod: totalRes.count || 0
            })

            // 2. Fetch data for Charts (Peak Hours & Sparklines)
            let leadsQuery = supabase.from('info_lead')
                .select('created_at, contador_interacoes, agent_id')
                .order('created_at', { ascending: false })
                .limit(2000) // Increase limit for general view

            if (fromDate && toDate) {
                leadsQuery = leadsQuery.gte('created_at', monthStart).lte('created_at', monthEnd)
            }
            if (selectedAgents.length > 0) {
                leadsQuery = leadsQuery.in('agent_id', selectedAgents)
            }

            const { data: leadsData, error: leadsError } = await leadsQuery
            if (leadsError) console.error("Error fetching leads for charts:", leadsError)

            // Group by hour for Peak Hours
            const hours: any = {}
            for (let i = 0; i < 24; i++) {
                const h = i.toString().padStart(2, '0') + ':00'
                hours[i] = { hour: h, messages: 0, connected: 0 }
            }

            const dailyData: Record<string, { connected: number, total: number }> = {}

            leadsData?.forEach(lead => {
                // Robust date parsing
                const dateObj = new Date(lead.created_at)
                if (isNaN(dateObj.getTime())) return

                // Group for Peak Hours
                const hour = dateObj.getHours()
                const interactions = lead.contador_interacoes || 0

                hours[hour].messages++
                if (interactions > settings.threshold) {
                    hours[hour].connected++
                }

                // Group for Sparklines
                const dateStr = format(dateObj, 'yyyy-MM-dd')
                if (!dailyData[dateStr]) dailyData[dateStr] = { connected: 0, total: 0 }
                dailyData[dateStr].total++
                if (interactions > settings.threshold) {
                    dailyData[dateStr].connected++
                }
            })

            const sortedByHour = Object.values(hours)
            setHourlyData(sortedByHour)

            const sortedDaily = Object.entries(dailyData)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([date, counts]) => ({ date, ...counts }))
            setDailyKpis(sortedDaily)

            // 3. Geographic Distribution
            let geoQuery = supabase.from('info_lead').select('phone, contador_interacoes, agent_id')
                .order('created_at', { ascending: false })
                .limit(2000)

            if (fromDate && toDate) {
                geoQuery = geoQuery.gte('created_at', monthStart).lte('created_at', monthEnd)
            }
            if (selectedAgents.length > 0) {
                geoQuery = geoQuery.in('agent_id', selectedAgents)
            }

            const { data: geoData, error: geoError } = await geoQuery
            if (geoError) console.error("Error fetching geo data:", geoError)

            const counts: Record<string, { total: number, connected: number }> = {}
            let totalPhones = 0

            geoData?.forEach(lead => {
                if (!lead.phone) return
                // Extract DDD
                const phoneDigits = lead.phone.replace(/\D/g, '')
                const ddd = phoneDigits.startsWith('55') ? phoneDigits.substring(2, 4) : phoneDigits.substring(0, 2)
                const state = DDD_TO_STATE[ddd] || 'Outros'

                if (!counts[state]) counts[state] = { total: 0, connected: 0 }
                counts[state].total++
                if ((lead.contador_interacoes || 0) > settings.threshold) {
                    counts[state].connected++
                }
                totalPhones++
            })

            const distArray = Object.entries(counts)
                .map(([state, data]) => ({
                    state,
                    count: data.total,
                    connectedCount: data.connected,
                    percentage: totalPhones > 0 ? (data.total / totalPhones) * 100 : 0,
                    connectivityRate: data.total > 0 ? (data.connected / data.total) * 100 : 0
                }))
                .sort((a, b) => b.count - a.count)

            setStateDistribution(distArray)

        } catch (error) {
            console.error("Error fetching analysis data:", error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [settings.threshold, selectedAgents, date])

    const agentLabel = useMemo(() => {
        if (selectedAgents.length === 0 || selectedAgents.length === availableAgents.length) return "Todos os agentes"
        if (selectedAgents.length === 1) return agentNames[selectedAgents[0]] || selectedAgents[0]
        return `${selectedAgents.length} Agentes`
    }, [selectedAgents, availableAgents, agentNames])

    const calculatedMonthlyGoal = useMemo(() => {
        return Math.round(settings.totalLeadsTarget * (settings.connectivityTarget / 100))
    }, [settings.totalLeadsTarget, settings.connectivityTarget])

    const calculatedDailyGoal = useMemo(() => {
        return Math.round(calculatedMonthlyGoal / 22) // Estimativa baseada em dias úteis
    }, [calculatedMonthlyGoal])

    const chartConfig = {
        messages: {
            label: "Iniciaram Conversa",
            color: "#3b82f6",
        },
        connected: {
            label: "Leads Conectados",
            color: "#10b981",
        },
    } satisfies ChartConfig

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-col gap-1">
                    <h2 className="text-2xl font-bold tracking-tight">Análise de Engajamento</h2>
                    <p className="text-muted-foreground text-sm">Visão detalhada do volume de interações e comportamento temporal.</p>
                </div>

                <div className="flex items-center gap-2">
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                id="date"
                                variant={"outline"}
                                className={cn(
                                    "w-[260px] justify-start text-left font-normal bg-background",
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

                    <AgentSelector
                        agents={availableAgents}
                        selectedAgents={selectedAgents}
                        onChange={setSelectedAgents}
                        isLoading={loading && availableAgents.length === 0}
                        namesMap={agentNames}
                    />
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <KpiCard
                    title="Conectados Hoje"
                    value={kpis.today}
                    currentValue={kpis.today}
                    previousValue={kpis.todayPrev}
                    goal={calculatedDailyGoal}
                    description="Leads que atingiram o limiar de engajamento nas últimas 24 horas."
                    icon={<MessageSquare className="h-5 w-5" />}
                    secondaryMetric={{
                        label: "Taxa Diária",
                        value: kpis.today > 0 ? "Ativo" : "Pendente"
                    }}
                />
                <KpiCard
                    title={date?.from ? "Conectados no Período" : "Conectados no Mês"}
                    value={kpis.month}
                    currentValue={kpis.month}
                    previousValue={kpis.monthPrev}
                    goal={calculatedMonthlyGoal}
                    description={date?.from ? "Volume de leads qualificados no período selecionado." : "Volume de leads qualificados no mês atual."}
                    icon={<CalendarIcon className="h-5 w-5" />}
                    secondaryMetric={{
                        label: "Evolução Conexões",
                        value: `${((kpis.month / (kpis.totalPeriod || 1)) * 100).toFixed(1)}%`
                    }}
                />
                <KpiCard
                    title={date?.from ? "Leads no Período" : "Total de Leads (Geral)"}
                    value={kpis.totalPeriod}
                    currentValue={kpis.totalPeriod}
                    description={date?.from ? `Soma de todos os leads recebidos no período selecionado pelo ${agentLabel}.` : `Soma histórica de todos os leads recebidos pelo ${agentLabel}.`}
                    icon={<Users className="h-5 w-5" />}
                    secondaryMetric={{
                        label: "Fluxo de Leads",
                        value: "Volume"
                    }}
                />
            </div>

            {/* Bottom Section: Charts & Distribution */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Peak Hours Chart */}
                <Card className="shadow-lg border-muted xl:col-span-2">
                    <CardHeader className="flex flex-col gap-1 pb-4">
                        <CardTitle className="text-xl font-bold text-white">Horários de Pico</CardTitle>
                        <CardDescription>
                            Identificação dos momentos de maior atividade, analisando o comportamento temporal dos leads.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-2">
                        <ChartContainer config={chartConfig} className="aspect-auto h-[400px] w-full">
                            <BarChart data={hourlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <CartesianGrid vertical={false} strokeDasharray="3 3" strokeOpacity={0.1} />
                                <XAxis
                                    dataKey="hour"
                                    tickLine={false}
                                    axisLine={false}
                                    tickMargin={10}
                                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                                />
                                <YAxis
                                    tickLine={false}
                                    axisLine={false}
                                    tickMargin={10}
                                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                                />
                                <ChartTooltip content={<ChartTooltipContent />} />
                                <Legend
                                    verticalAlign="top"
                                    height={36}
                                    iconType="circle"
                                    wrapperStyle={{ fontSize: '12px', paddingBottom: '20px' }}
                                />
                                <Bar
                                    dataKey="messages"
                                    name="Iniciaram"
                                    fill="#3b82f6"
                                    radius={[4, 4, 0, 0]}
                                    barSize={40}
                                />
                                <Bar
                                    dataKey="connected"
                                    name="Conectados"
                                    fill="#10b981"
                                    radius={[4, 4, 0, 0]}
                                    barSize={40}
                                />
                            </BarChart>
                        </ChartContainer>

                        {/* Insights Footer */}
                        <div className="mt-6 flex flex-wrap gap-6 items-center border-t border-muted pt-6">
                            <div className="flex items-center gap-2 bg-muted/30 px-3 py-2 rounded-lg">
                                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                <span className="text-xs text-muted-foreground font-medium uppercase">Taxa de Conexão Geral: </span>
                                <span className="text-sm font-bold">
                                    {hourlyData.reduce((acc, curr) => acc + curr.messages, 0) > 0
                                        ? ((hourlyData.reduce((acc, curr) => acc + curr.connected, 0) / hourlyData.reduce((acc, curr) => acc + curr.messages, 0)) * 100).toFixed(1)
                                        : 0}%
                                </span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Geographic Distribution */}
                <Card className="shadow-lg border-muted xl:col-span-1 flex flex-col">
                    <CardHeader className="flex flex-row items-center justify-between pb-4">
                        <div className="flex flex-col gap-1">
                            <CardTitle className="text-xl font-bold text-white">Origem dos Leads</CardTitle>
                            <CardDescription>Distribuição por Estado (UF)</CardDescription>
                        </div>

                        <Dialog>
                            <DialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <ExternalLink className="h-4 w-4" />
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col bg-[#0a0a0a] border-muted">
                                <DialogHeader className="pb-4 border-b border-muted">
                                    <DialogTitle className="text-xl font-bold flex items-center gap-2">
                                        <MapPin className="h-5 w-5 text-blue-500" />
                                        Distribuição Geográfica Completa
                                    </DialogTitle>
                                    <p className="text-sm text-muted-foreground">Detalhamento de volume e taxa de engajamento por estado.</p>
                                </DialogHeader>
                                <div className="overflow-auto pr-2 mt-4 custom-scrollbar">
                                    <Table>
                                        <TableHeader className="bg-muted/30">
                                            <TableRow className="border-muted hover:bg-transparent">
                                                <TableHead className="w-[100px] text-white">Estado</TableHead>
                                                <TableHead className="text-right text-white">Volume Total</TableHead>
                                                <TableHead className="text-right text-white">Market Share</TableHead>
                                                <TableHead className="text-right text-white">Conectados</TableHead>
                                                <TableHead className="text-right text-white">Taxa de Conexão</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {stateDistribution.map((item) => (
                                                <TableRow key={item.state} className="border-muted hover:bg-white/5 transition-colors">
                                                    <TableCell className="font-bold text-white">{item.state}</TableCell>
                                                    <TableCell className="text-right font-mono">{item.count}</TableCell>
                                                    <TableCell className="text-right text-muted-foreground">
                                                        {item.percentage.toFixed(1)}%
                                                    </TableCell>
                                                    <TableCell className="text-right font-mono text-white/70">
                                                        {item.connectedCount}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <span className="font-bold text-white">
                                                                {item.connectivityRate.toFixed(1)}%
                                                            </span>
                                                            <div className="w-12 h-1.5 bg-muted rounded-full overflow-hidden hidden sm:block">
                                                                <div
                                                                    className="h-full bg-white transition-all duration-500"
                                                                    style={{ width: `${Math.min(item.connectivityRate, 100)}%` }}
                                                                />
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col gap-6">
                        <div className="space-y-4">
                            {stateDistribution.slice(0, 10).map((item, index) => (
                                <div key={item.state} className="group flex flex-col gap-1">
                                    <div className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-white w-6">{item.state}</span>
                                            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{item.count} leads</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <span className="text-[10px] text-muted-foreground">Conexão:</span>
                                            <span className="font-bold text-white">
                                                {item.connectivityRate.toFixed(1)}%
                                            </span>
                                        </div>
                                    </div>
                                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden relative">
                                        <div
                                            className="h-full bg-white transition-all duration-500"
                                            style={{
                                                width: `${item.connectivityRate}%`,
                                                opacity: 1 - (index * 0.15)
                                            }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>

                        {stateDistribution.length > 10 && (
                            <div className="mt-auto pt-6 border-t border-muted border-dashed">
                                <p className="text-xs text-muted-foreground italic text-center">
                                    E mais {stateDistribution.length - 10} estados detectados no AllConnect.
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
