"use client"

import { LeadsAreaChart } from "@/components/leads-area-chart"

export default function Home() {
    return (
        <main className="flex min-h-screen flex-col items-center bg-black text-white">
            <div className="w-full px-4 py-8 md:px-8 max-w-7xl mx-auto">
                {/* O LeadsAreaChart agora gerencia todo o dashboard (KPIs, Filtros, Gráfico) */}
                <LeadsAreaChart />
            </div>
        </main>
    )
}
