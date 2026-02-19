"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Save, User, Settings, CheckCircle2, AlertCircle, Target, Users, Zap, Shield, HelpCircle, Bell, Share2, Sparkles, BarChart3 } from "lucide-react"
import { supabase } from "@/lib/supabaseClient"
import { settingsService } from "@/lib/settings-service"

export function SettingsView() {
    const [interactionThreshold, setInteractionThreshold] = useState(3)
    const [connectivityTarget, setConnectivityTarget] = useState(30)
    const [totalLeadsTarget, setTotalLeadsTarget] = useState(100)
    const [connectedLeadsTarget, setConnectedLeadsTarget] = useState(50)
    const [mqlTarget, setMqlTarget] = useState(10)
    const [agentNames, setAgentNames] = useState<Record<string, string>>({})
    const [availableAgents, setAvailableAgents] = useState<string[]>([])
    const [isLoaded, setIsLoaded] = useState(false)
    const [saved, setSaved] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Load settings
    useEffect(() => {
        const loadSettings = async () => {
            try {
                const settings = await settingsService.getSettings()

                if (settings) {
                    setTotalLeadsTarget(settings.total_leads_target || 100)
                    setConnectedLeadsTarget(settings.connected_leads_target || 50)
                    setInteractionThreshold(settings.interaction_threshold || 3)
                    setConnectivityTarget(settings.connectivity_target || 30)
                    setMqlTarget(settings.mql_target || 10)
                    setAgentNames(settings.agent_names || {})
                }

                setIsLoaded(true)
            } catch (e) {
                console.error("Erro ao carregar configurações", e)
                setError("Falha ao carregar configurações do servidor.")
            }
        }

        loadSettings()
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

    const handleSave = async () => {
        setSaved(false)
        setError(null)

        try {
            await settingsService.updateSettings({
                total_leads_target: totalLeadsTarget,
                connected_leads_target: connectedLeadsTarget,
                interaction_threshold: interactionThreshold,
                connectivity_target: connectivityTarget,
                mql_target: mqlTarget,
                agent_names: agentNames
            })

            setSaved(true)
            setTimeout(() => setSaved(false), 3000)

        } catch (err: any) {
            console.error("Erro ao salvar", err)
            setError(`Erro ao salvar: ${err.message}.`)
        }
    }

    if (!isLoaded) return (
        <div className="flex items-center justify-center h-[50vh]">
            <div className="flex flex-col items-center gap-2">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                <p className="text-muted-foreground text-sm">Carregando configurações...</p>
            </div>
        </div>
    )

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-10">
            {/* Header Section */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Configurações</h2>
                    <p className="text-muted-foreground">Gerencie as metas, parâmetros e preferências do sistema.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="hidden sm:flex">
                        <HelpCircle className="mr-2 h-4 w-4" />
                        Documentação
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={saved}
                        className={saved ? "bg-green-600 hover:bg-green-700 text-white" : ""}
                    >
                        {saved ? (
                            <>
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                Salvo com Sucesso
                            </>
                        ) : (
                            <>
                                <Save className="mr-2 h-4 w-4" />
                                Salvar Alterações
                            </>
                        )}
                    </Button>
                </div>
            </div>

            {error && (
                <div className="flex items-center gap-2 p-4 text-sm text-red-800 rounded-lg bg-red-50 dark:bg-red-900/20 dark:text-red-400 border border-red-200 dark:border-red-900/50">
                    <AlertCircle className="h-4 w-4" />
                    <span>{error}</span>
                </div>
            )}

            {/* Main Grid Layout - 3 Columns */}
            <div className="grid gap-6 lg:grid-cols-3 items-start">

                {/* Column 1: Performance Goals */}
                <div className="space-y-6">
                    <Card className="shadow-sm border-muted h-full">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <CardTitle className="flex items-center gap-2 text-base">
                                        <Target className="h-5 w-5 text-primary" />
                                        Metas de Performance
                                    </CardTitle>
                                    <CardDescription className="text-xs">Objetivos mensais para o time.</CardDescription>
                                </div>
                                <Badge variant="secondary" className="bg-primary/10 text-primary text-[10px] px-1.5 h-5">Mensal</Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-5">
                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none">
                                    Meta Total de Leads
                                </label>
                                <Input
                                    type="number"
                                    value={totalLeadsTarget}
                                    onChange={(e) => setTotalLeadsTarget(Number(e.target.value))}
                                    className="font-mono bg-muted/30"
                                />
                                <p className="text-[11px] text-muted-foreground">Alvo de leads brutos recebidos.</p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none">
                                    Meta Leads Conectados
                                </label>
                                <Input
                                    type="number"
                                    value={connectedLeadsTarget}
                                    onChange={(e) => setConnectedLeadsTarget(Number(e.target.value))}
                                    className="font-mono bg-muted/30"
                                />
                                <p className="text-[11px] text-muted-foreground">Alvo de leads qualificados/engajados.</p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none">
                                    Taxa de Conectividade (%)
                                </label>
                                <div className="relative">
                                    <Input
                                        type="number"
                                        max="100"
                                        value={connectivityTarget}
                                        onChange={(e) => setConnectivityTarget(Number(e.target.value))}
                                        className="font-mono bg-muted/30 pr-8"
                                    />
                                    <span className="absolute right-3 top-2.5 text-xs text-muted-foreground">%</span>
                                </div>
                                <p className="text-[11px] text-muted-foreground">Conversão de recebidos para conectados.</p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none">
                                    Taxa de MQL (%)
                                </label>
                                <div className="relative">
                                    <Input
                                        type="number"
                                        max="100"
                                        value={mqlTarget}
                                        onChange={(e) => setMqlTarget(Number(e.target.value))}
                                        className="font-mono bg-muted/30 pr-8"
                                    />
                                    <span className="absolute right-3 top-2.5 text-xs text-muted-foreground">%</span>
                                </div>
                                <p className="text-[11px] text-muted-foreground">Conversão de conectados para MQL.</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Column 2: Future & System Parameters */}
                <div className="space-y-6">

                    {/* Future Features (Places First) */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between px-1">
                            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Em breve</h3>
                        </div>

                        {/* KPI Launch Alert */}
                        <Card className="shadow-sm border border-primary/20 bg-primary/5">
                            <CardHeader className="pb-2 pt-4">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="flex items-center gap-2 text-sm text-primary">
                                        <BarChart3 className="h-4 w-4" />
                                        Novo Motor de KPIs
                                    </CardTitle>
                                    <Badge className="text-[9px] h-4 bg-primary text-primary-foreground">Novo</Badge>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <p className="text-[10px] text-muted-foreground leading-relaxed">
                                    Estamos lançando o novo motor de métricas. As metas definidas aqui calibrarão automaticamente os relatórios da aba Analytics.
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="shadow-sm border-dashed border-muted bg-muted/20 opacity-75 hover:opacity-100 transition-opacity">
                            <CardHeader className="pb-2 pt-4">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Share2 className="h-4 w-4" />
                                        Integrações
                                    </CardTitle>
                                    <Badge variant="outline" className="text-[9px] h-4">Abril</Badge>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <p className="text-[10px] text-muted-foreground/80">
                                    Conexão nativa com Salesforce.
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    <Card className="shadow-sm border-muted h-fit">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Settings className="h-4 w-4 text-primary" />
                                Parâmetros do Sistema
                            </CardTitle>
                            <CardDescription className="text-xs">Critérios técnicos e de lógica.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none">
                                    Limiar de Conexão
                                </label>
                                <div className="flex items-center gap-2">
                                    <Input
                                        type="number"
                                        min="1"
                                        max="50"
                                        value={interactionThreshold}
                                        onChange={(e) => setInteractionThreshold(Number(e.target.value))}
                                        className="w-20 font-mono text-center"
                                    />
                                    <span className="text-sm text-muted-foreground">msgs</span>
                                </div>
                                <p className="text-[11px] text-muted-foreground leading-tight">
                                    Mínimo de mensagens para considerar um lead como "Conectado".
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Column 3: Agent Management (Right Side) */}
                <div className="space-y-6">
                    <Card className="shadow-sm border-muted h-full">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <CardTitle className="flex items-center gap-2 text-base">
                                        <Users className="h-5 w-5 text-primary" />
                                        Agentes
                                    </CardTitle>
                                    <CardDescription className="text-xs">Gerencie os apelidos de exibição.</CardDescription>
                                </div>
                                <Badge variant="secondary" className="bg-primary/10 text-primary text-[10px] px-1.5 h-5">Total: {availableAgents.length}</Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-5">
                            {availableAgents.length === 0 ? (
                                <div className="flex flex-col items-center justify-center p-6 text-center bg-muted/20 rounded-lg border border-dashed my-4">
                                    <User className="h-6 w-6 text-muted-foreground/40 mb-2" />
                                    <p className="text-xs font-medium text-muted-foreground">Nenhum agente.</p>
                                </div>
                            ) : (
                                availableAgents.map(agent => (
                                    <div key={agent} className="space-y-2">
                                        <label className="text-sm font-medium leading-none truncate block" title={agent}>
                                            {agent}
                                        </label>
                                        <Input
                                            type="text"
                                            placeholder="Definir apelido..."
                                            value={agentNames[agent] || ""}
                                            onChange={(e) => setAgentNames(prev => ({ ...prev, [agent]: e.target.value }))}
                                            className="font-mono bg-muted/30"
                                        />
                                    </div>
                                ))
                            )}
                        </CardContent>
                    </Card>
                </div>

            </div>
        </div>
    )
}
