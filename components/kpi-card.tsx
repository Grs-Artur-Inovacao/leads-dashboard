import { Card, CardContent } from "@/components/ui/card"
import { ArrowUpIcon, ArrowDownIcon, MinusIcon, HelpCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface KpiCardProps {
    title: string
    value: number | string
    goal?: number | string
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
    chart?: React.ReactNode // New prop for a detailed chart
    goalLabel?: string // Optional custom label for the goal box
    showReferencePoints?: boolean // Whether to show scale points in the chart
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
    chart,
    isPlaceholder = false,
    goalLabel = "Meta",
    showReferencePoints = false
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
        <Card className={cn(
            "flex flex-col h-full shadow-md border-muted",
            chart ? "min-h-[420px]" : "min-h-[290px]"
        )}>
            <CardContent className="p-6 flex-1 flex flex-col justify-between">
                <div>
                    {/* Header: Title and Goal Box */}
                    <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                            <h3 className="text-lg font-semibold tracking-tight text-foreground/80 uppercase">{title}</h3>
                            {description && (
                                <div title={description} className="cursor-help">
                                    <HelpCircle className="h-4 w-4 text-muted-foreground/50" />
                                </div>
                            )}
                        </div>

                        {/* Goal Box (Top Right) - Meta Principal */}
                        {goal !== undefined && (
                            <div className={cn(
                                "flex flex-col items-end px-3 py-1.5 rounded-lg border bg-muted/30",
                                isGoalMet && !isPlaceholder ? "border-emerald-500/30 bg-emerald-500/5" : "border-muted"
                            )}>
                                <span className={cn(
                                    "text-lg font-black",
                                    isGoalMet && !isPlaceholder ? "text-emerald-600" : "text-muted-foreground"
                                )}>
                                    {isPlaceholder ? "..." : `${goalPercentage.toFixed(1)}%`}
                                </span>
                                <span className="text-[12px] text-muted-foreground uppercase font-bold">
                                    {goalLabel}: {isPlaceholder ? "..." : goal}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Unified Value and Growth Area */}
                    <div className="mt-2 flex items-baseline gap-4 whitespace-nowrap overflow-visible">
                        <span className="text-7xl font-black tracking-tighter text-foreground leading-none">
                            {isPlaceholder ? "..." : value}
                        </span>

                        <div className={cn(
                            "flex items-center gap-1.5",
                            isPlaceholder ? "text-muted-foreground" : growthColor
                        )}>
                            <div className="flex items-center">
                                {isPlaceholder ? <MinusIcon className="h-5 w-5" /> : <GrowthIcon className="h-5 w-5" />}
                                <span className="text-xl font-black ml-0.5">{isPlaceholder ? "..." : growthLabel}</span>
                            </div>
                            <span className="text-sm text-muted-foreground font-semibold">
                                vs. período anterior
                            </span>
                        </div>
                    </div>
                </div>

                {/* Optional Detailed Chart */}
                {chart && (
                    <div className="flex-1 w-full min-h-[120px] max-h-[160px] my-4 overflow-hidden rounded-lg flex items-center justify-center">
                        {chart}
                    </div>
                )}

                {/* Secondary Metric (Middle Section) */}
                {secondaryMetric && (
                    <div className="mt-6 py-3 border-t border-dashed border-muted-foreground/30">
                        <p className="text-sm text-muted-foreground uppercase font-bold mb-1">
                            {secondaryMetric.label}
                        </p>
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-black text-foreground/90">
                                    {isPlaceholder ? "..." : secondaryMetric.value}
                                </span>

                                {(secondaryMetric.goal !== undefined || isPlaceholder) && (
                                    <span className={cn(
                                        "text-base font-bold px-3 py-1 rounded-full border",
                                        "bg-muted/50 text-muted-foreground border-muted-foreground/20"
                                    )}>
                                        {isPlaceholder ? "Meta: ..." : `Meta: ${secondaryMetric.goal}%`}
                                    </span>
                                )}
                            </div>
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
