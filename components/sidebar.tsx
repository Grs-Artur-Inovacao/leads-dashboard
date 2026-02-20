"use client"

import { LayoutDashboard, Users, FileText, Settings, BarChart3, HelpCircle, ChevronLeft, ChevronRight, Bell, LogOut, ChevronsUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useSession, signOut } from "next-auth/react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface SidebarProps {
    activeView: string
    onViewChange: (view: string) => void
    isCollapsed: boolean
    toggleSidebar: () => void
}

export function Sidebar({ activeView, onViewChange, isCollapsed, toggleSidebar }: SidebarProps) {
    const { data: session } = useSession()
    const user = session?.user

    const menuItems = [
        { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
        // { id: "insights", label: "Analytics", icon: BarChart3 },
        { id: "leads", label: "Leads Detalhados", icon: Users },
        // { id: "reports", label: "Relatórios", icon: FileText },
    ]



    const bottomItems = [
        { id: "updates", label: "Novidades", icon: Bell },
        { id: "settings", label: "Configurações", icon: Settings },
        { id: "help", label: "Ajuda", icon: HelpCircle },
    ]

    return (
        <aside className={cn(
            "h-full border-r bg-card flex flex-col transition-all duration-300",
            isCollapsed ? "w-20" : "w-64"
        )}>
            {/* Logo Area */}
            <div className={cn("flex h-16 items-center border-b px-4", isCollapsed ? "justify-center" : "justify-between")}>
                <div className="flex items-center gap-2 min-w-0">
                    <BarChart3 className="h-6 w-6 text-primary flex-shrink-0" />
                    {!isCollapsed && <span className="text-lg font-bold tracking-tight truncate">Leads Monitor</span>}
                </div>
                {!isCollapsed && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={toggleSidebar}
                        className="h-8 w-8 text-muted-foreground hover:text-foreground shrink-0"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                )}
                {isCollapsed && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={toggleSidebar}
                        className="absolute -right-4 top-14 h-8 w-8 rounded-full border bg-background shadow-md flex items-center justify-center z-50 hover:bg-accent"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                )}
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

            {/* Footer / User Profile */}
            <div className="mt-auto border-t p-2">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            className={cn(
                                "w-full justify-start gap-2 px-2 py-2 h-auto hover:bg-muted",
                                isCollapsed && "justify-center px-0"
                            )}
                        >
                            <Avatar className="h-8 w-8 rounded-lg shrink-0">
                                <AvatarImage src={user?.image || ""} alt={user?.name || "User"} />
                                <AvatarFallback className="rounded-lg bg-primary/10 text-primary">
                                    {user?.name?.charAt(0).toUpperCase() || "U"}
                                </AvatarFallback>
                            </Avatar>
                            {!isCollapsed && (
                                <div className="flex flex-1 flex-col items-start min-w-0 text-left text-xs leading-tight">
                                    <span className="truncate font-semibold w-full text-foreground">{user?.name || "Usuário"}</span>
                                    <span className="truncate text-[10px] text-muted-foreground w-full">{user?.email || "usuario@alltech.com.br"}</span>
                                </div>
                            )}
                            {!isCollapsed && <ChevronsUpDown className="ml-auto h-3 w-3 shrink-0 text-muted-foreground" />}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        className="w-[240px] p-2"
                        side={isCollapsed ? "right" : "bottom"}
                        align="end"
                        sideOffset={8}
                    >
                        <DropdownMenuLabel className="p-0 font-normal">
                            <div className="flex items-center gap-2 px-2 py-1.5 text-left text-sm">
                                <Avatar className="h-8 w-8 rounded-lg">
                                    <AvatarImage src={user?.image || ""} alt={user?.name || "User"} />
                                    <AvatarFallback className="rounded-lg bg-primary/10 text-primary">
                                        {user?.name?.charAt(0).toUpperCase() || "U"}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="grid flex-1 text-left text-sm leading-tight min-w-0">
                                    <span className="truncate font-semibold">{user?.name || "Usuário"}</span>
                                    <span className="truncate text-xs text-muted-foreground">{user?.email || "usuario@alltech.com.br"}</span>
                                </div>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            className="text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer"
                            onClick={() => signOut({ callbackUrl: "/login" })}
                        >
                            <LogOut className="mr-2 h-4 w-4" />
                            <span>Sair da conta</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </aside>
    )
}
