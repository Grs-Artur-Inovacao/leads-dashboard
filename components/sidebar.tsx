"use client"

import { LayoutDashboard, Users, FileText, Settings, BarChart3, HelpCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

interface SidebarProps {
    activeView: string
    onViewChange: (view: string) => void
}

export function Sidebar({ activeView, onViewChange }: SidebarProps) {

    const menuItems = [
        { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
        { id: "leads", label: "Leads Detalhados", icon: Users },
        { id: "reports", label: "Relatórios", icon: FileText },
        { id: "analytics", label: "Analytics", icon: BarChart3 },
    ]

    const bottomItems = [
        { id: "settings", label: "Configurações", icon: Settings },
        { id: "help", label: "Ajuda", icon: HelpCircle },
    ]

    return (
        <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r bg-card flex flex-col">
            {/* Logo Area */}
            <div className="flex h-16 items-center border-b px-6">
                <BarChart3 className="mr-2 h-6 w-6 text-primary" />
                <span className="text-lg font-bold tracking-tight">Leads Monitor</span>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto py-6 px-3 space-y-6">

                {/* Section: Gestão */}
                <div>
                    <h2 className="mb-2 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
                        Gestão
                    </h2>
                    <nav className="space-y-1">
                        {menuItems.map((item) => (
                            <Button
                                key={item.id}
                                variant={activeView === item.id ? "secondary" : "ghost"}
                                onClick={() => onViewChange(item.id)}
                                className={`w-full justify-start gap-3 text-sm font-medium ${activeView === item.id
                                    ? "bg-primary/10 text-primary hover:bg-primary/20"
                                    : "text-muted-foreground hover:text-foreground"
                                    }`}
                            >
                                <item.icon className="h-4 w-4" />
                                {item.label}
                            </Button>
                        ))}
                    </nav>
                </div>

                {/* Section: Sistema */}
                <div>
                    <h2 className="mb-2 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
                        Sistema
                    </h2>
                    <nav className="space-y-1">
                        {bottomItems.map((item) => (
                            <Button
                                key={item.id}
                                variant={activeView === item.id ? "secondary" : "ghost"}
                                onClick={() => onViewChange(item.id)}
                                className={`w-full justify-start gap-3 text-sm font-medium ${activeView === item.id
                                    ? "bg-primary/10 text-primary hover:bg-primary/20"
                                    : "text-muted-foreground hover:text-foreground"
                                    }`}
                            >
                                <item.icon className="h-4 w-4" />
                                {item.label}
                            </Button>
                        ))}
                    </nav>
                </div>
            </div>
        </aside>
    )
}
