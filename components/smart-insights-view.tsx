"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { AlertCircle, ArrowRight, CheckCircle2, TrendingUp, RefreshCcw, Calendar as CalendarIcon, Check, MoreVertical, ArrowUpIcon, ArrowDownIcon, MinusIcon, HelpCircle, Activity } from "lucide-react"
import { cn } from "@/lib/utils"
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format, subDays } from "date-fns"
import { ptBR } from "date-fns/locale"
import { DateRange } from "react-day-picker"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { AlertTriangle, Info, BadgeCheck, ChevronDown, ListTodo } from "lucide-react"
import { DataTable } from "@/components/ui/data-table"
import { ColumnDef } from "@tanstack/react-table"


// Tipos 
type KpiStatus = "healthy" | "warning" | "critical"
type QualityStatus = "excellent" | "good" | "bad"

interface KpiData {
    id: string
    label: string
    description: string // Descrição explicativa do KPI
    value: number // Porcentagem atual (Taxa)
    absoluteValue: number // Valor absoluto (ex: Leads parados)
    totalBase: number // Base total (ex: Total de Leads)
    threshold: number // Limite para alerta (em %)
    status: KpiStatus
    trend: number // Comparação com semana anterior
    impact: string
    action: string
    actionType: "process" | "script" | "audience" | "cta"
    history: { date: string; value: number; absoluteValue: number; totalBase: number }[]
}

interface QualityKpiData {
    id: string
    label: string
    status: QualityStatus
    impact: string
    action: string
}

export function SmartInsightsView() {
    const [isLoading, setIsLoading] = useState(false)
    const [kpis, setKpis] = useState<KpiData[]>([])
    const [qualityKpi, setQualityKpi] = useState<QualityKpiData>({
        id: "quality_meta",
        label: "Qualidade na Meta",
        status: "good",
        impact: "Processo (Fluxo de Cadência)",
        action: "Alterar o Processo de FUP"
    })

    // Date filter state (same default as LeadsAreaChart)
    const [date, setDate] = useState<DateRange | undefined>({
        from: subDays(new Date(), 7),
        to: new Date(),
    })

    // Função auxiliar para gerar datas baseadas no filtro
    const getDates = (days: number) => {
        const dates = []
        for (let i = days - 1; i >= 0; i--) {
            const date = new Date()
            date.setDate(date.getDate() - i)
            dates.push(date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }))
        }
        return dates
    }

    // Função para gerar dados aleatórios (Simulação)
    const generateSimulatedData = () => {
        setIsLoading(true)

        setTimeout(() => {
            const dates = getDates(7) // Últimos 7 dias fixos para simulação visual

            const createKpi = (id: string, label: string, description: string, threshold: number, impact: string, action: string, type: "process" | "script" | "audience" | "cta") => {
                const history = dates.map(date => {
                    const totalBase = Math.floor(Math.random() * 50) + 50 // 50 a 100 leads
                    // Gera um valor absoluto baseado numa porcentagem aleatória entre 10% e 60%
                    const percent = (Math.random() * 0.5) + 0.1
                    const absoluteValue = Math.floor(totalBase * percent)
                    const value = Math.round((absoluteValue / totalBase) * 100)

                    return {
                        date,
                        value,
                        absoluteValue,
                        totalBase
                    }
                })

                const currentData = history[history.length - 1]
                const previousData = history[history.length - 2]

                const currentValue = currentData.value
                const previousValue = previousData.value
                const trend = Math.round(((currentValue - previousValue) / previousValue) * 100)

                let status: KpiStatus = "healthy"
                if (currentValue > threshold) status = "critical"
                else if (currentValue > threshold * 0.7) status = "warning"

                return {
                    id,
                    label,
                    description,
                    value: currentValue,
                    absoluteValue: currentData.absoluteValue,
                    totalBase: currentData.totalBase,
                    threshold,
                    status,
                    trend,
                    impact,
                    action,
                    actionType: type,
                    history
                }
            }

            const newKpis: KpiData[] = [
                createKpi("stopped_responding", "Parou de Responder", "Leads que engajaram inicialmente mas pararam de responder.", 40, "Performance (Prompt da Renatinha)", "Mudar o Script da Renatinha", "script"),
                createKpi("wrong_demographic", "Fora do Demográfico", "Leads desqualificados por não atenderem aos critérios de perfil (idade, cargo, etc).", 30, "Fit Público (Target)", "Mudar o Público da Campanha", "audience"),
                createKpi("wrong_need", "Sem Interesse / Fit", "Leads que responderam negativamente ou não tem a dor que o produto resolve.", 30, "Fit Produto (Oferta)", "Mudar a CTA da Campanha", "cta")
            ]

            // Randomize Quality Status
            const qualityStatuses: QualityStatus[] = ["excellent", "good", "bad"]
            const randomStatus = qualityStatuses[Math.floor(Math.random() * qualityStatuses.length)]

            setQualityKpi(prev => ({ ...prev, status: randomStatus }))
            setKpis(newKpis)
            setIsLoading(false)
        }, 600)
    }

    useEffect(() => {
        generateSimulatedData()
    }, [date]) // Refetch on date change (simulated)

    // Coletar todas as ações (dos KPIs numéricos + KPI de qualidade)
    const allActions = []

    // 1. Ação do KPI de Qualidade (se não for excelente)
    if (qualityKpi.status !== "excellent") {
        allActions.push({
            id: qualityKpi.id,
            label: qualityKpi.label,
            action: qualityKpi.action,
            impact: qualityKpi.impact,
            priority: qualityKpi.status === "bad" ? "critical" : "warning"
        })
    }

    // 2. Ações dos KPIs numéricos
    kpis.forEach(kpi => {
        if (kpi.status !== "healthy") {
            allActions.push({
                id: kpi.id,
                label: kpi.label,
                action: kpi.action,
                impact: kpi.impact,
                priority: kpi.status === "critical" ? "critical" : "warning"
            })
        }
    })

    // Ordenar ações: Críticas primeiro
    allActions.sort((a, b) => (a.priority === "critical" ? -1 : 1))

    const columns: ColumnDef<any>[] = [
        {
            accessorKey: "priority",
            header: "Prioridade",
            cell: ({ row }) => {
                const action = row.original
                return (
                    <div className="flex justify-center">
                        <div className={cn(
                            "inline-flex p-1.5 rounded-full ring-1 ring-inset",
                            action.priority === 'critical'
                                ? "bg-red-500/10 text-red-500 ring-red-500/20"
                                : "bg-amber-500/10 text-amber-500 ring-amber-500/20"
                        )}>
                            {action.priority === 'critical' ? (
                                <AlertTriangle className="h-4 w-4" />
                            ) : (
                                <Info className="h-4 w-4" />
                            )}
                        </div>
                    </div>
                )
            },
        },
        {
            accessorKey: "action",
            header: "Diagnóstico & Ação",
            cell: ({ row }) => {
                const action = row.original
                return (
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <Badge variant="outline" className={cn(
                                "h-5 px-1.5 text-[10px] uppercase font-bold tracking-wider",
                                action.priority === 'critical' ? "border-red-500/30 text-red-500 bg-red-500/5" : "border-amber-500/30 text-amber-500 bg-amber-500/5"
                            )}>
                                {action.priority === 'critical' ? 'Crítico' : 'Atenção'}
                            </Badge>
                            <span className="text-[10px] text-muted-foreground uppercase font-medium">
                                Impacto: {action.impact}
                            </span>
                        </div>
                        <p className="text-sm font-semibold text-foreground leading-snug">
                            {action.action}
                        </p>
                        <p className="text-xs text-muted-foreground leading-tight">
                            <span className="font-medium text-foreground/70">Problema:</span> {action.label}
                        </p>
                    </div>
                )
            },
        },
        {
            id: "actions",
            header: () => <div className="text-right">Ação</div>,
            cell: ({ row }) => {
                return (
                    <div className="text-right">
                        <Button size="sm" variant="outline" className="h-8 gap-2 hover:bg-primary hover:text-primary-foreground group">
                            Executar
                            <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                        </Button>
                    </div>
                )
            },
        },
    ]

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-10">
            {/* Header com Filtros */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Analytics</h2>
                    <p className="text-muted-foreground">Monitoramento inteligente de gargalos e sugestões automáticas.</p>
                </div>

                <div className="flex items-center gap-2">
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

                    <Button variant="ghost" size="icon" onClick={generateSimulatedData} disabled={isLoading} title="Simular Novos Dados">
                        <RefreshCcw className={cn("h-4 w-4", isLoading && "animate-spin")} />
                    </Button>
                </div>
            </div>

            {/* Mini Dashboard de Topo (Expansível) */}
            <div className="flex flex-wrap items-center gap-4">
                <QualityWidget data={qualityKpi} />

                {/* Exemplo de placeholder para futuros widgets */}
                {/* <div className="h-14 w-32 border border-dashed rounded-md flex items-center justify-center text-xs text-muted-foreground">Novo KPI</div> */}
            </div>

            {/* Layout Principal */}
            <div className="space-y-8">
                {/* Seção de KPIs */}
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                            <Activity className="h-5 w-5 text-primary" />
                            Indicadores de Performance
                        </h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {kpis.map((kpi) => (
                            <InsightCard key={kpi.id} data={kpi} />
                        ))}
                    </div>
                </div>

                {/* Seção de Plano de Ação - Fora do Card e como DataTable */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <h3 className="text-xl font-bold flex items-center gap-2">
                                <ListTodo className="h-5 w-5 text-primary" />
                                Plano de Ação Sugerido
                            </h3>
                            <p className="text-sm text-muted-foreground">
                                Ações recomendadas baseadas na análise automática dos KPIs.
                            </p>
                        </div>
                        <Badge variant="secondary" className="px-3 py-1 bg-primary/10 text-primary border-primary/20">
                            {allActions.length} Pendentes
                        </Badge>
                    </div>

                    <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
                        <DataTable
                            columns={columns}
                            data={allActions}
                        />
                    </div>
                </div>
            </div>

        </div>
    )
}

function QualityWidget({ data }: { data: QualityKpiData }) {
    const isCritical = data.status === 'bad'

    const style = isCritical ? {
        color: "text-red-500",
        bg: "bg-red-500/10",
        border: "border-red-500/20",
        label: "Crítico"
    } : {
        color: "text-muted-foreground",
        bg: "bg-muted/30",
        border: "border-border",
        label: data.status === 'excellent' ? "Excelente" : "Bom"
    }

    return (
        <div className={cn(
            "inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full border transition-all cursor-default select-none",
            style.bg, style.border
        )} title={data.impact}>
            <BadgeCheck className={cn("h-5 w-5", style.color)} />
            <span className={cn("font-medium text-sm", style.color)}>
                Qualidade da Meta: <span className="font-bold">{style.label}</span>
            </span>
        </div>
    )
}


// Helper para cor do gráfico
function getChartColor(status: KpiStatus) {
    if (status === 'critical') return '#ef4444' // red-500
    if (status === 'warning') return '#eab308' // yellow-500
    return '#22c55e' // green-500
}

function InsightCard({ data }: { data: KpiData }) {
    // Logic for negative metrics (lower is better)
    const isGoalMet = data.value <= data.threshold

    // Trend logic (Positive trend = Increase in 'Bad' metric = Bad/Red)
    // If trend is positive (increasing bad metric), it's BAD -> Red.
    // If trend is negative (decreasing bad metric) or zero, it's Neutral -> Gray.
    const isTrendBad = data.trend > 0
    const TrendIcon = data.trend === 0 ? MinusIcon : (data.trend > 0 ? ArrowUpIcon : ArrowDownIcon)
    const trendColor = isTrendBad ? "text-red-500" : "text-muted-foreground"

    // Chart Color: Binary (Neutral if Met, Red if Not Met)
    const chartColor = isGoalMet ? "#71717a" : "#ef4444"

    return (
        <Card className="flex flex-col h-full shadow-sm hover:shadow-md transition-all border-muted">
            <CardContent className="p-6 flex-1 flex flex-col justify-between">
                <div>
                    {/* Header: Title and Goal Box */}
                    <div className="flex justify-between items-start mb-2">
                        <div className="max-w-[65%]">
                            <h3 className="text-lg font-bold tracking-tight text-foreground/80 uppercase leading-tight" title={data.label}>
                                {data.label}
                            </h3>
                        </div>

                        {/* Goal Box (Top Right) */}
                        <div className={cn(
                            "flex flex-col items-end px-2.5 py-1 rounded-md border",
                            isGoalMet ? "bg-muted/30 border-muted text-muted-foreground" : "bg-red-500/10 border-red-500/20 text-red-600"
                        )}>
                            <span className="text-xs font-bold uppercase">
                                Meta: &le;{data.threshold}%
                            </span>
                        </div>
                    </div>

                    {/* Main Value (Absolute) */}
                    <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-5xl font-extrabold tracking-tighter text-foreground">
                            {data.absoluteValue}
                        </span>
                        <span className="text-sm font-medium text-muted-foreground">
                            leads
                        </span>
                    </div>

                    {/* Sub-metric: Rate relative to total leads */}
                    <div className="flex items-center mt-1 mb-2">
                        <span className="text-sm font-medium text-foreground mr-1">
                            {data.value}%
                        </span>
                        <span className="text-xs text-muted-foreground">
                            de {data.totalBase} leads analisados
                        </span>
                    </div>

                    {/* Growth Indicator */}
                    <div className="flex items-center gap-2">
                        <div className={cn("flex items-center text-xs font-semibold px-1.5 py-0.5 rounded-md bg-muted/50", trendColor)}>
                            <TrendIcon className="h-3 w-3 mr-1" />
                            {Math.abs(data.trend)}%
                        </div>
                        <span className="text-[10px] text-muted-foreground uppercase">
                            vs. período anterior
                        </span>
                    </div>
                </div>

                {/* Mini Chart Integration (Middle Section) */}
                <div className="h-[80px] w-full mt-4 mb-2 opacity-80 hover:opacity-100 transition-opacity">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data.history}>
                            <defs>
                                <linearGradient id={`gradient-${data.id}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={chartColor} stopOpacity={0.2} />
                                    <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <Tooltip
                                content={({ active, payload, label }) => {
                                    if (active && payload && payload.length) {
                                        const item = payload[0].payload;
                                        return (
                                            <div className="rounded-lg border bg-background p-2 shadow-sm text-xs">
                                                <div className="mb-1 font-semibold">{item.date}</div>
                                                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                                                    <span className="text-muted-foreground">Ocorrências:</span>
                                                    <span className="font-bold text-foreground text-right">{item.absoluteValue}</span>
                                                    <span className="text-muted-foreground">Taxa:</span>
                                                    <span className="font-bold text-foreground text-right">{item.value}%</span>
                                                    <span className="text-muted-foreground">Base:</span>
                                                    <span className="font-medium text-foreground text-right">{item.totalBase} leads</span>
                                                </div>
                                            </div>
                                        );
                                    }
                                    return null;
                                }}
                            />
                            <Area
                                type="monotone"
                                dataKey="value"
                                stroke={chartColor}
                                fill={`url(#gradient-${data.id})`}
                                strokeWidth={2}
                                isAnimationActive={false}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* Footer Description & Action */}
                <div className="pt-3 border-t border-dashed border-muted-foreground/30 flex flex-col gap-2">
                    <p className="text-[11px] text-muted-foreground leading-tight">
                        {data.description}
                    </p>
                    <div className="flex items-center gap-2">
                        <Activity className="h-3 w-3 text-primary/70" />
                        <p className="text-xs font-medium text-foreground leading-tight">
                            {data.action}
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
