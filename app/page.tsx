"use client"

import { LeadsAreaChart } from "@/components/leads-area-chart"
import { Sidebar } from "@/components/sidebar"

export default function Home() {
    return (
        <div className="flex min-h-screen bg-background">
            {/* Sidebar Fixa */}
            <div className="w-64 flex-none hidden md:block border-r bg-card/40 backdrop-blur-xl"> {/* Ajustado para não quebrar em mobile, mas idealmente seria responsive */}
                <Sidebar />
            </div>

            {/* Conteúdo Principal */}
            <main className="flex-1 w-full transition-all duration-300">
                <div className="container mx-auto p-6 md:p-8 max-w-[1600px] space-y-8">
                    {/* Header Mobile se necessário */}
                    <LeadsAreaChart />
                </div>
            </main>
        </div>
    )
}
