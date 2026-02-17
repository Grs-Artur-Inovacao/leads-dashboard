"use client"

import { useState } from "react"
import { LeadsAreaChart } from "@/components/leads-area-chart"
import { Sidebar } from "@/components/sidebar"
import { SettingsView } from "@/components/settings-view"
import { HelpView } from "@/components/help-view"

export default function Home() {
    const [currentView, setCurrentView] = useState("dashboard")

    return (
        <div className="flex min-h-screen bg-background">
            {/* Sidebar Fixa */}
            <div className="w-64 flex-none hidden md:block border-r bg-card/40 backdrop-blur-xl">
                <Sidebar activeView={currentView} onViewChange={setCurrentView} />
            </div>

            {/* Conteúdo Principal */}
            <main className="flex-1 w-full transition-all duration-300">
                <div className="container mx-auto p-6 md:p-8 max-w-[1600px] space-y-8">

                    {currentView === "dashboard" && <LeadsAreaChart />}

                    {currentView === "leads" && (
                        <div className="flex items-center justify-center h-[50vh] text-muted-foreground">
                            Em breve: Visualização Detalhada de Leads
                        </div>
                    )}

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
