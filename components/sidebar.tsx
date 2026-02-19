"use client"

import { LayoutDashboard, Users, FileText, Settings, BarChart3, HelpCircle, ChevronLeft, ChevronRight, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface SidebarProps {
    activeView: string
    onViewChange: (view: string) => void
    isCollapsed: boolean
    toggleSidebar: () => void
}

export function Sidebar({ activeView, onViewChange, isCollapsed, toggleSidebar }: SidebarProps) {

    const menuItems = [
        { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
        { id: "leads", label: "Leads Detalhados", icon: Users },
        { id: "reports", label: "Relatórios", icon: FileText },
        { id: "insights", label: "Analytics", icon: BarChart3 },
    ]

    const bottomItems = [
        { id: "updates", label: "Novidades", icon: Sparkles },
        { id: "settings", label: "Configurações", icon: Settings },
        { id: "help", label: "Ajuda", icon: HelpCircle },
    ]

    return (
        <aside className={cn(
            "h-full border-r bg-card flex flex-col transition-all duration-300",
            isCollapsed ? "w-20" : "w-64"
        )}>
            {/* Logo Area */}
            <div className={cn("flex h-16 items-center border-b px-6", isCollapsed ? "justify-center px-2" : "")}>
                <BarChart3 className="h-6 w-6 text-primary flex-shrink-0" />
                {!isCollapsed && <span className="ml-2 text-lg font-bold tracking-tight">Leads Monitor</span>}
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto py-6 px-3 space-y-6">

                {/* Section: Gestão */}
                <div>
                    {!isCollapsed && (
                        <h2 className="mb-2 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
                            Gestão
                        </h2>
                    )}
                    <nav className="space-y-1">
                        {menuItems.map((item) => (
                            <Button
                                key={item.id}
                                variant={activeView === item.id ? "secondary" : "ghost"}
                                onClick={() => onViewChange(item.id)}
                                title={isCollapsed ? item.label : undefined}
                                className={cn(
                                    "w-full gap-3 text-sm font-medium transition-all",
                                    isCollapsed ? "justify-center px-2" : "justify-start",
                                    activeView === item.id
                                        ? "bg-primary/10 text-primary hover:bg-primary/20"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <item.icon className="h-4 w-4 flex-shrink-0" />
                                {!isCollapsed && <span>{item.label}</span>}
                            </Button>
                        ))}
                    </nav>
                </div>

                {/* Section: Sistema */}
                <div>
                    {!isCollapsed && (
                        <h2 className="mb-2 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
                            Sistema
                        </h2>
                    )}
                    <nav className="space-y-1">
                        {bottomItems.map((item) => (
                            <Button
                                key={item.id}
                                variant={activeView === item.id ? "secondary" : "ghost"}
                                onClick={() => onViewChange(item.id)}
                                title={isCollapsed ? item.label : undefined}
                                className={cn(
                                    "w-full gap-3 text-sm font-medium transition-all",
                                    isCollapsed ? "justify-center px-2" : "justify-start",
                                    activeView === item.id
                                        ? "bg-primary/10 text-primary hover:bg-primary/20"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <item.icon className="h-4 w-4 flex-shrink-0" />
                                {!isCollapsed && <span>{item.label}</span>}
                            </Button>
                        ))}
                    </nav>
                </div>
            </div>

            {/* Footer / Toggle Button */}
            <div className="border-t p-3 flex justify-end">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleSidebar}
                    className="ml-auto"
                >
                    {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                </Button>
            </div>
        </aside>
    )
}
