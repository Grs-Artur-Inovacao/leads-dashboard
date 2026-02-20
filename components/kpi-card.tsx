import { Card, CardContent } from "@/components/ui/card"
import { ArrowUpIcon, ArrowDownIcon, MinusIcon, HelpCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface KpiCardProps {
    title: string
    value: number | string
    goal: number | string
    currentValue: number // used for goal calculation
    previousValue?: number // used for growth calculation
    secondaryMetric?: {
        label: string
        value: string | number
        goal?: number // optional goal for secondary metric
    }
    description: string
    icon?: React.ReactNode
    isPlaceholder?: boolean
}

export function KpiCard({
    title,
    value,
    goal,
    currentValue,
    previousValue,
    secondaryMetric,
    description,
    icon,
    isPlaceholder = false
}: KpiCardProps) {
    // Calcular porcentagem da meta principal
    const numericGoal = typeof goal === 'number' ? goal : 0
    const goalPercentage = numericGoal > 0 ? (currentValue / numericGoal) * 100 : 0
    const isGoalMet = goalPercentage >= 100

    // Calcular crescimento vs período anterior
    let growthPercentage = 0
    let growthLabel = "0.0%"
    let GrowthIcon = MinusIcon
    let growthColor = "text-muted-foreground"

    if (previousValue !== undefined && previousValue !== 0) {
        growthPercentage = ((currentValue - previousValue) / previousValue) * 100
        growthLabel = `${Math.abs(growthPercentage).toFixed(1)}%`
        if (growthPercentage > 0) {
            GrowthIcon = ArrowUpIcon
            growthColor = "text-emerald-500"
        } else if (growthPercentage < 0) {
            GrowthIcon = ArrowDownIcon
            growthColor = "text-rose-500"
        }
    } else if (currentValue > 0 && (previousValue === 0 || previousValue === undefined)) {
        growthLabel = "100%"
        GrowthIcon = ArrowUpIcon
        growthColor = "text-emerald-500"
    }

    return (
        <Card className="flex flex-col h-full shadow-md border-muted">
            <CardContent className="p-6 flex-1 flex flex-col justify-between">
                <div>
                    {/* Header: Title and Goal Box */}
                    <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                            <h3 className="text-lg font-bold tracking-tight text-foreground/80 uppercase">{title}</h3>
                            {description && (
                                <div title={description} className="cursor-help">
                                    <HelpCircle className="h-4 w-4 text-muted-foreground/50" />
                                </div>
                            )}
                        </div>

                        {/* Goal Box (Top Right) - Meta Principal */}
                        <div className={cn(
                            "flex flex-col items-end px-3 py-1.5 rounded-lg border bg-muted/30",
                            isGoalMet && !isPlaceholder ? "border-emerald-500/30 bg-emerald-500/5" : "border-muted"
                        )}>
                            <span className={cn(
                                "text-sm font-bold",
                                isGoalMet && !isPlaceholder ? "text-emerald-600" : "text-muted-foreground"
                            )}>
                                {isPlaceholder ? "..." : `${goalPercentage.toFixed(1)}%`}
                            </span>
                            <span className="text-[10px] text-muted-foreground uppercase font-semibold">
                                Meta: {isPlaceholder ? "..." : goal}
                            </span>
                        </div>
                    </div>

                    {/* Main Value */}
                    <div className="mt-2">
                        <span className="text-5xl font-extrabold tracking-tighter text-foreground">
                            {isPlaceholder ? "..." : value}
                        </span>

                    </div>

                    {/* Growth Indicator */}
                    <div className="flex items-center mt-2 gap-2">
                        <div className={cn("flex items-center text-sm font-semibold", isPlaceholder ? "text-muted-foreground" : growthColor)}>
                            {isPlaceholder ? <MinusIcon className="h-4 w-4 mr-1" /> : <GrowthIcon className="h-4 w-4 mr-1" />}
                            {isPlaceholder ? "..." : growthLabel}
                        </div>
                        <span className="text-xs text-muted-foreground">
                            vs. período anterior
                        </span>
                    </div>
                </div>

                {/* Secondary Metric (Middle Section) */}
                {secondaryMetric && (
                    <div className="mt-6 py-3 border-t border-dashed border-muted-foreground/30">
                        <p className="text-xs text-muted-foreground uppercase font-medium mb-1">
                            {secondaryMetric.label}
                        </p>
                        <div className="flex items-baseline gap-2">
                            <span className="text-xl font-bold text-foreground/90">
                                {isPlaceholder ? "..." : secondaryMetric.value}
                            </span>

                            {/* Alteração: Mostrar Meta direto, sem cálculo de % batida */}
                            {(secondaryMetric.goal !== undefined || isPlaceholder) && (
                                <span className={cn(
                                    "text-xs font-medium px-2 py-0.5 rounded-full border",
                                    "bg-muted/50 text-muted-foreground border-muted-foreground/20"
                                )}>
                                    {isPlaceholder ? "Meta: ..." : `Meta: ${secondaryMetric.goal}%`}
                                </span>
                            )}
                        </div>
                    </div>
                )}

                {/* Footer Description / Separator */}
                <div className="mt-4 pt-3 border-t border-primary/20">
                    <p className="text-xs text-muted-foreground italic leading-relaxed">
                        {description}
                    </p>
                </div>

            </CardContent>
        </Card>
    )
}
