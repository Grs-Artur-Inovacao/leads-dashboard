
"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Save } from "lucide-react"
import { supabase } from "@/lib/supabaseClient"

export function SettingsView() {
    const [interactionThreshold, setInteractionThreshold] = useState(3)
    const [connectivityTarget, setConnectivityTarget] = useState(30)
    const [totalLeadsTarget, setTotalLeadsTarget] = useState(100)
    const [connectedLeadsTarget, setConnectedLeadsTarget] = useState(50)
    const [agentNames, setAgentNames] = useState<Record<string, string>>({})
    const [availableAgents, setAvailableAgents] = useState<string[]>([])
    const [isLoaded, setIsLoaded] = useState(false)
    const [saved, setSaved] = useState(false)

    // Load settings
    useEffect(() => {
        try {
            const savedTotal = localStorage.getItem('leads-dashboard-total-target')
            const savedConnected = localStorage.getItem('leads-dashboard-connected-target')
            const savedThreshold = localStorage.getItem('leads-dashboard-threshold')
            const savedTarget = localStorage.getItem('leads-dashboard-target')
            const savedNames = localStorage.getItem('leads-dashboard-names')

            if (savedTotal) setTotalLeadsTarget(Number(savedTotal))
            if (savedConnected) setConnectedLeadsTarget(Number(savedConnected))
            if (savedThreshold) setInteractionThreshold(Number(savedThreshold))
            if (savedTarget) setConnectivityTarget(Number(savedTarget))
            if (savedNames) setAgentNames(JSON.parse(savedNames))

            setIsLoaded(true)
        } catch (e) {
            console.error("Erro ao carregar configurações", e)
        }
    }, [])

    // Fetch agents for renaming
    useEffect(() => {
        const fetchAgents = async () => {
            const { data, error } = await supabase
                .from('info_lead')
                .select('agent_id')
                .not('agent_id', 'is', null)

            if (error) {
                console.error('Erro ao buscar agentes:', error)
                return
            }

            const uniqueAgents = Array.from(new Set(data?.map((d: any) => d.agent_id).filter(Boolean) || [])) as string[]
            setAvailableAgents(uniqueAgents)
        }
        fetchAgents()
    }, [])

    const handleSave = () => {
        localStorage.setItem('leads-dashboard-total-target', String(totalLeadsTarget))
        localStorage.setItem('leads-dashboard-connected-target', String(connectedLeadsTarget))
        localStorage.setItem('leads-dashboard-threshold', String(interactionThreshold))
        localStorage.setItem('leads-dashboard-target', String(connectivityTarget))
        localStorage.setItem('leads-dashboard-names', JSON.stringify(agentNames))

        setSaved(true)
        setTimeout(() => setSaved(false), 2000)

        // Dispatch storage event manually for other components in same tab
        window.dispatchEvent(new Event("storage"))
    }

    if (!isLoaded) return <div className="p-8">Carregando configurações...</div>

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold tracking-tight">Configurações do Sistema</h2>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Metas e KPIs</CardTitle>
                        <CardDescription>Defina os objetivos para as métricas do dashboard.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-2">
                            <label className="text-sm font-medium">Meta Total de Leads (Mensal)</label>
                            <input
                                type="number"
                                min="1"
                                value={totalLeadsTarget}
                                onChange={(e) => setTotalLeadsTarget(Number(e.target.value))}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            />
                            <p className="text-xs text-muted-foreground">Alvo numérico para total de leads.</p>
                        </div>

                        <div className="grid gap-2">
                            <label className="text-sm font-medium">Meta Leads Conectados (Mensal)</label>
                            <input
                                type="number"
                                min="1"
                                value={connectedLeadsTarget}
                                onChange={(e) => setConnectedLeadsTarget(Number(e.target.value))}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            />
                            <p className="text-xs text-muted-foreground">Alvo numérico para leads validados.</p>
                        </div>

                        <div className="grid gap-2">
                            <label className="text-sm font-medium">Meta de Conectividade (%)</label>
                            <input
                                type="number"
                                min="1" max="100"
                                value={connectivityTarget}
                                onChange={(e) => setConnectivityTarget(Number(e.target.value))}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            />
                            <p className="text-xs text-muted-foreground">Porcentagem alvo de conversão em conectados.</p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Definições de Negócio</CardTitle>
                        <CardDescription>Critérios de classificação e nomes.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-2">
                            <label className="text-sm font-medium">Mínimo de Interações</label>
                            <input
                                type="number"
                                min="1"
                                value={interactionThreshold}
                                onChange={(e) => setInteractionThreshold(Number(e.target.value))}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            />
                            <p className="text-xs text-muted-foreground">Número de mensagens para considerar um lead "Conectado".</p>
                        </div>

                        <div className="space-y-2 pt-4 border-t">
                            <h4 className="text-sm font-medium">Renomear Agentes (Apelidos)</h4>
                            <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
                                {availableAgents.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">Nenhum agente encontrado.</p>
                                ) : (
                                    availableAgents.map(agent => (
                                        <div key={agent} className="grid gap-1">
                                            <label className="text-xs text-muted-foreground truncate" title={agent}>
                                                {agent}
                                            </label>
                                            <input
                                                type="text"
                                                placeholder={`Apelido para ${agent}`}
                                                value={agentNames[agent] || ""}
                                                onChange={(e) => setAgentNames(prev => ({ ...prev, [agent]: e.target.value }))}
                                                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                            />
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="flex justify-end">
                <button
                    onClick={handleSave}
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-8 py-2"
                >
                    <Save className="mr-2 h-4 w-4" />
                    {saved ? "Cofigurações Salvas!" : "Salvar Alterações"}
                </button>
            </div>
        </div>
    )
}
