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
import { Zap } from "lucide-react"

export default function Home() {
    const [currentView, setCurrentView] = useState("dashboard")
    const [isCollapsed, setIsCollapsed] = useState(false)

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
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="bg-primary/10 p-2 rounded-lg">
                                <Zap className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold tracking-tight text-foreground">Leads Dashboard</h1>
                                <p className="text-xs text-muted-foreground font-medium">Gestão e Monitoramento de Performance em Tempo Real</p>
                            </div>
                        </div>
                    </div>

                    {currentView === "dashboard" && <LeadsAreaChart />}

                    {currentView === "insights" && <SmartInsightsView />}

                    {currentView === "leads" && <LeadsListView />}

                    {currentView === "reports" && (
                        <div className="flex items-center justify-center h-[50vh] text-muted-foreground">
                            Em breve: Relatórios Avançados
                        </div>
                    )}

                    {currentView === "settings" && <SettingsView />}

                    {currentView === "updates" && <UpdatesView />}

                    {currentView === "help" && <HelpView />}

                </div>
            </main>
        </div>
    )
}
