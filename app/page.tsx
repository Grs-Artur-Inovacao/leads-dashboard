"use client"

import { useState } from "react"
import { LeadsAreaChart } from "@/components/leads-area-chart"
import { Sidebar } from "@/components/sidebar"
import { LeadsListView } from "@/components/leads-list-view"
import { SettingsView } from "@/components/settings-view"
import { HelpView } from "@/components/help-view"

export default function Home() {
    const [currentView, setCurrentView] = useState("dashboard")
    const [isCollapsed, setIsCollapsed] = useState(false)

    return (
        <div className="flex min-h-screen bg-background">
            {/* Sidebar Fixa */}
            <div className={`flex-none hidden md:block border-r bg-card/40 backdrop-blur-xl transition-all duration-300 ${isCollapsed ? "w-20" : "w-64"}`}>
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

                    {currentView === "leads" && <LeadsListView />}

                    {currentView === "reports" && (
                        <div className="flex items-center justify-center h-[50vh] text-muted-foreground">
                            Em breve: Relatórios Avançados
                        </div>
                    )}

                    {currentView === "analytics" && (
                        <div className="flex items-center justify-center h-[50vh] text-muted-foreground">
                            Em breve: Analytics & Conversão
                        </div>
                    )}

                    {currentView === "settings" && <SettingsView />}

                    {currentView === "help" && <HelpView />}

                </div>
            </main>
        </div>
    )
}
