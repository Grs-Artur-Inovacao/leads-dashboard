"use client"

import { useState } from "react"
import dynamic from "next/dynamic"

const LeadsAreaChart = dynamic(
    () => import("@/components/leads-area-chart").then((mod) => mod.LeadsAreaChart),
    { ssr: false }
)
import { Sidebar } from "@/components/sidebar"
import { LeadsListView } from "@/components/leads-list-view"
import { SettingsView } from "@/components/settings-view"
import { HelpView } from "@/components/help-view"
import { UpdatesView } from "@/components/updates-view"
import { SmartInsightsView } from "@/components/smart-insights-view"
import { CampaignLogsView } from "@/components/campaign-logs-view"
import { Button } from "@/components/ui/button"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

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
        <div className="flex min-h-screen bg-background">
            {/* Sidebar Fixa */}
            <div className={`sticky top-0 h-screen z-40 flex-none hidden md:block transition-all duration-300 ${isCollapsed ? "w-20" : "w-64"}`}>
                <Sidebar
                    activeView={currentView}
                    onViewChange={setCurrentView}
                    isCollapsed={isCollapsed}
                    toggleSidebar={() => setIsCollapsed(!isCollapsed)}
                />
            </div>

            {/* Conteúdo Principal */}
            <main className="flex-1 w-full transition-all duration-300">
                <div className="container mx-auto p-6 md:p-8 max-w-[1600px] space-y-8">


                    {currentView === "dashboard" && <LeadsAreaChart />}

                    {currentView === "insights" && <SmartInsightsView />}

                    {currentView === "leads" && <LeadsListView />}

                    {currentView === "campaigns" && <CampaignLogsView />}

                    {currentView === "reports" && (
                        <div className="flex items-center justify-center h-[50vh] text-muted-foreground">
                            Em breve: Relatórios Avançados
                        </div>
                    )}

                    {currentView === "settings" && (session?.user as any)?.role === 'admin' ? (
                        <SettingsView />
                    ) : currentView === "settings" ? (
                        <div className="flex flex-col items-center justify-center h-[50vh] space-y-4">
                            <p className="text-muted-foreground">Você não tem permissão para acessar esta área.</p>
                            <Button onClick={() => setCurrentView("dashboard")}>Voltar ao Dashboard</Button>
                        </div>
                    ) : null}

                    {currentView === "updates" && <UpdatesView />}

                    {currentView === "help" && <HelpView />}

                </div>
            </main>
        </div>
    )
}
