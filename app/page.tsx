"use client"

import { useState, useEffect } from "react"
import { Sidebar } from "@/components/sidebar"
import { LeadsListView } from "@/components/leads-list-view"
import { SettingsView } from "@/components/settings-view"
import { HelpView } from "@/components/help-view"
import { UpdatesView } from "@/components/updates-view"
import { AgentesView } from "@/components/agentes-view"
import { Button } from "@/components/ui/button"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

import { DashboardAdventure } from "@/components/dashboard-adventure"
import { MobileBottomNav } from "@/components/mobile-bottom-nav"
import { DashboardProvider } from "@/lib/dashboard-context"

export default function Home() {
    const { data: session, status } = useSession()
    const router = useRouter()
    const [currentView, setCurrentView] = useState("dashboard")
    const [isCollapsed, setIsCollapsed] = useState(false)

    useEffect(() => {
        if (status === 'authenticated') {
            const userRole = (session?.user as any)?.role
            const hasAccess = (session?.user as any)?.hasAccess

            // Admin sempre tem acesso, outros verificamos a flag hasAccess da tabela
            if (userRole !== 'admin' && !hasAccess) {
                router.push('/unauthorized')
            }
        }
    }, [session, status, router])

    if (status === 'loading') {
        return <div className="flex items-center justify-center min-h-screen bg-zinc-950 text-white">Carregando...</div>
    }

    return (
        <DashboardProvider>
        <>
            <div className="flex min-h-screen bg-background">
                {/* Sidebar Fixa — desktop only */}
                <div className={`sticky top-0 h-screen z-40 flex-none hidden md:block transition-all duration-300 ${isCollapsed ? "w-20" : "w-64"}`}>
                    <Sidebar
                        activeView={currentView}
                        onViewChange={setCurrentView}
                        isCollapsed={isCollapsed}
                        toggleSidebar={() => setIsCollapsed(!isCollapsed)}
                    />
                </div>

                {/* Conteúdo Principal */}
                <main className={cn(
                    "flex-1 w-full transition-all duration-300",
                    currentView === "dashboard" ? "h-screen overflow-hidden" : "min-h-screen overflow-y-auto pb-20 md:pb-0"
                )}>
                    <div className={cn(
                        "container mx-auto max-w-[1600px]",
                        currentView === "dashboard" ? "p-0 h-full" : "p-4 md:p-8 space-y-8"
                    )}>

                        {currentView === "dashboard" && <DashboardAdventure />}

                        {currentView === "leads" && <LeadsListView />}

                        {currentView === "settings" && (session?.user as any)?.role === 'admin' ? (
                            <SettingsView />
                        ) : currentView === "settings" ? (
                            <div className="flex flex-col items-center justify-center h-[50vh] space-y-4">
                                <p className="text-muted-foreground">Você não tem permissão para acessar esta área.</p>
                                <Button onClick={() => setCurrentView("dashboard")}>Voltar ao Dashboard</Button>
                            </div>
                        ) : null}

                        {currentView === "updates" && <UpdatesView />}

                        {currentView === "agentes" && <AgentesView />}

                        {currentView === "help" && <HelpView />}

                    </div>
                </main>
            </div>

            {/* Navegação mobile — visível apenas em telas pequenas */}
            <MobileBottomNav activeView={currentView} onViewChange={setCurrentView} />
        </>
        </DashboardProvider>
    )
}
