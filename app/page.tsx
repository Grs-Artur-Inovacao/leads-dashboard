import { LeadsAreaChart } from "@/components/leads-area-chart"

export default function Home() {
    return (
        <main className="flex min-h-screen flex-col items-center p-8 bg-black">
            <div className="w-full max-w-5xl space-y-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight text-white">Dashboard de Leads</h2>
                        <p className="text-gray-400">Acompanhamento de leads em tempo real</p>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-1">
                    <LeadsAreaChart />
                </div>
            </div>
        </main>
    )
}
