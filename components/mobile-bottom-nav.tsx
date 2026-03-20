"use client"

import { LayoutDashboard, Users, FileText, Bell, Settings, HelpCircle } from "lucide-react"
import { useSession } from "next-auth/react"
import { cn } from "@/lib/utils"

interface MobileBottomNavProps {
    activeView: string
    onViewChange: (view: string) => void
}

export function MobileBottomNav({ activeView, onViewChange }: MobileBottomNavProps) {
    const { data: session } = useSession()
    const user = session?.user
    const userRole = ((user as any)?.role || '').toLowerCase()
    const isAdmin = userRole === 'admin'
    const isReader = userRole === 'reader'

    let items = [
        { id: "dashboard", label: "Início", icon: LayoutDashboard },
        { id: "leads", label: "Leads", icon: Users },
        { id: "agentes", label: "Agentes", icon: FileText },
        { id: "updates", label: "Updates", icon: Bell },
        ...(isAdmin ? [{ id: "settings", label: "Config", icon: Settings }] : [{ id: "help", label: "Ajuda", icon: HelpCircle }]),
    ]

    if (isReader) {
        items = [
            { id: "leads", label: "Leads", icon: Users },
            { id: "help", label: "Ajuda", icon: HelpCircle },
        ]
    }

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t bg-card/95 backdrop-blur-lg">
            <div className="flex items-center justify-around h-16 px-2">
                {items.map(({ id, label, icon: Icon }) => {
                    const isActive = activeView === id
                    return (
                        <button
                            key={id}
                            onClick={() => onViewChange(id)}
                            className={cn(
                                "flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-all duration-200",
                                isActive ? "text-primary" : "text-muted-foreground"
                            )}
                        >
                            <div className={cn(
                                "relative flex items-center justify-center w-10 h-6 rounded-full transition-all duration-200",
                                isActive && "bg-primary/15"
                            )}>
                                <Icon className={cn(
                                    "h-5 w-5 transition-all duration-200",
                                    isActive && "scale-110"
                                )} />
                                {isActive && (
                                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                                )}
                            </div>
                            <span className={cn(
                                "text-[10px] font-medium transition-all duration-200",
                                isActive ? "text-primary" : "text-muted-foreground/70"
                            )}>
                                {label}
                            </span>
                        </button>
                    )
                })}
            </div>
            {/* Safe area para iPhones com notch/barra home */}
            <div className="h-[env(safe-area-inset-bottom)] bg-card/95" />
        </nav>
    )
}
