"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import { AgentSelector } from "@/components/agent-selector"
import { LeadsAreaChart } from "@/components/leads-area-chart"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Activity, Users, Zap, Settings, ChevronDown, ChevronUp } from "lucide-react"

// Default IDs mapping based on previous knowledge
const DEFAULT_AGENT_NAMES: Record<string, string> = {
    '+554797081463': 'Renata Original',
    '+554796621550': 'Renata Cardoso'
}

export default function Home() {
    const [agents, setAgents] = useState<string[]>([])
    const [selectedAgents, setSelectedAgents] = useState<string[]>([])
    const [timeRange, setTimeRange] = useState("90d")
    const [viewMode, setViewMode] = useState<"total" | "connected">("total")

    // Configurações
    const [showSettings, setShowSettings] = useState(false)
    const [interactionThreshold, setInteractionThreshold] = useState(3)
    const [connectivityTarget, setConnectivityTarget] = useState(30) // Meta em %
    const [agentNames, setAgentNames] = useState<Record<string, string>>(DEFAULT_AGENT_NAMES)

    const [kpiData, setKpiData] = useState({
        totalLeads: 0,
        connectedLeads: 0,
        connectionRate: 0
    })

    // Fetch unique agents on mount
    useEffect(() => {
        const fetchAgents = async () => {
            const { data, error } = await supabase
                .from('info_lead')
                .select('id_agent')
                .not('id_agent', 'is', null)

            if (!error && data) {
                // Get unique agents
                const uniqueAgents = Array.from(new Set(data.map(item => item.id_agent))).sort()
                setAgents(uniqueAgents)
                // Select all by default or specific ones if needed
                if (uniqueAgents.length > 0) {
                    setSelectedAgents(uniqueAgents)
                }
            }
        }
        fetchAgents()
    }, [])

    // Fetch KPIs when filters change
    useEffect(() => {
        const fetchKPIs = async () => {
            // Calculate start date
            let queryStart = new Date()
            let isAllTime = false

            switch (timeRange) {
                case "7d": queryStart.setDate(queryStart.getDate() - 7); break;
                case "15d": queryStart.setDate(queryStart.getDate() - 15); break;
                case "30d": queryStart.setDate(queryStart.getDate() - 30); break;
                case "60d": queryStart.setDate(queryStart.getDate() - 60); break;
                case "90d": queryStart.setDate(queryStart.getDate() - 90); break;
                case "all": isAllTime = true; break;
                default: queryStart.setDate(queryStart.getDate() - 90);
            }

            let query = supabase
                .from('info_lead')
                .select('contador_interacoes, created_at, id_agent', { count: 'exact' })

            if (!isAllTime) {
                query = query.gte('created_at', queryStart.toISOString())
            }

            if (selectedAgents.length > 0) {
                query = query.in('id_agent', selectedAgents)
            }

            const { data, error, count } = await query

            if (!error && data) {
                const total = data.length
                // Usa o threshold configurável
                const connected = data.filter(lead => (lead.contador_interacoes || 0) > interactionThreshold).length
                const rate = total > 0 ? (connected / total) * 100 : 0

                setKpiData({
                    totalLeads: total,
                    connectedLeads: connected,
                    connectionRate: rate
                })
            }
        }

        if (selectedAgents.length > 0) {
            fetchKPIs()
        }
    }, [selectedAgents, timeRange, interactionThreshold]) // Recalcula quando threshold muda

    const handleAgentNameChange = (id: string, newName: string) => {
        setAgentNames(prev => ({
            ...prev,
            [id]: newName
        }))
    }

    return (
        <main className="flex min-h-screen flex-col items-center p-8 bg-black text-white">
            <div className="w-full max-w-6xl space-y-8">
                {/* Header */}
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight text-white">Dashboard de Leads</h2>
                        <p className="text-gray-400">Acompanhamento de performance e conexões</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowSettings(!showSettings)}
                            className="flex items-center gap-2 px-3 py-2 rounded-md bg-zinc-900 border border-zinc-800 text-sm hover:bg-zinc-800 transition-colors"
                        >
                            <Settings className="h-4 w-4" />
                            Configurações
                            {showSettings ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                        </button>
                        <Select value={timeRange} onValueChange={setTimeRange}>
                            <SelectTrigger className="w-[180px] bg-zinc-900 border-zinc-800 text-white">
                                <SelectValue placeholder="Período" />
                            </SelectTrigger>
                            <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                                <SelectItem value="7d">Últimos 7 dias</SelectItem>
                                <SelectItem value="15d">Últimos 15 dias</SelectItem>
                                <SelectItem value="30d">Últimos 30 dias</SelectItem>
                                <SelectItem value="60d">Últimos 60 dias</SelectItem>
                                <SelectItem value="90d">Últimos 90 dias</SelectItem>
                                <SelectItem value="all">Todo o período</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Settings Panel */}
                {showSettings && (
                    <Card className="bg-zinc-900/50 border-zinc-800 text-white">
                        <CardHeader>
                            <CardTitle className="text-lg">Configurações Avançadas</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid gap-6 md:grid-cols-2">
                                <div className="space-y-4">
                                    <h3 className="text-sm font-medium text-zinc-400">Parâmetros de KPI</h3>
                                    <div className="grid gap-2">
                                        <label className="text-sm">Mínimo de Interações para Conexão</label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="number"
                                                min="1"
                                                value={interactionThreshold}
                                                onChange={(e) => setInteractionThreshold(Number(e.target.value))}
                                                className="w-20 rounded-md border border-zinc-700 bg-zinc-800 px-3 py-1 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                            <span className="text-xs text-zinc-500">mensagens</span>
                                        </div>
                                    </div>
                                    <div className="grid gap-2">
                                        <label className="text-sm">Meta de Taxa de Conexão</label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="number"
                                                min="1"
                                                max="100"
                                                value={connectivityTarget}
                                                onChange={(e) => setConnectivityTarget(Number(e.target.value))}
                                                className="w-20 rounded-md border border-zinc-700 bg-zinc-800 px-3 py-1 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                            <span className="text-xs text-zinc-500">%</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <h3 className="text-sm font-medium text-zinc-400">Nomes dos Agentes</h3>
                                    <div className="max-h-40 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                                        {agents.map(agentId => (
                                            <div key={agentId} className="grid grid-cols-[1fr,2fr] gap-2 items-center">
                                                <span className="text-xs text-zinc-500 truncate" title={agentId}>{agentId}</span>
                                                <input
                                                    type="text"
                                                    value={agentNames[agentId] || ''}
                                                    placeholder="Nome do Agente"
                                                    onChange={(e) => handleAgentNameChange(agentId, e.target.value)}
                                                    className="rounded-md border border-zinc-700 bg-zinc-800 px-3 py-1 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>
                                        ))}
                                        {agents.length === 0 && <p className="text-xs text-zinc-500">Nenhum agente carregado ainda.</p>}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Filters */}
                <div className="flex flex-col gap-4 md:flex-row md:items-center">
                    <AgentSelector
                        agents={agents}
                        selectedAgents={selectedAgents}
                        onChange={setSelectedAgents}
                        namesMap={agentNames}
                    />
                    <div className="flex bg-zinc-900 p-1 rounded-lg border border-zinc-800">
                        <button
                            onClick={() => setViewMode("total")}
                            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${viewMode === "total"
                                    ? "bg-zinc-800 text-white shadow-sm"
                                    : "text-zinc-400 hover:text-white"
                                }`}
                        >
                            Total de Leads
                        </button>
                        <button
                            onClick={() => setViewMode("connected")}
                            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${viewMode === "connected"
                                    ? "bg-zinc-800 text-white shadow-sm"
                                    : "text-zinc-400 hover:text-white"
                                }`}
                        >
                            Leads Conectados
                        </button>
                    </div>
                </div>

                {/* KPIs */}
                <div className="grid gap-4 md:grid-cols-3">
                    <Card className="bg-zinc-900 border-zinc-800 text-white">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total de Leads</CardTitle>
                            <Users className="h-4 w-4 text-zinc-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{kpiData.totalLeads}</div>
                            <p className="text-xs text-zinc-400">
                                No período selecionado
                            </p>
                        </CardContent>
                    </Card>
                    <Card className="bg-zinc-900 border-zinc-800 text-white">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Leads Conectados</CardTitle>
                            <Zap className="h-4 w-4 text-emerald-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-emerald-500">{kpiData.connectedLeads}</div>
                            <p className="text-xs text-zinc-400">
                                {">"} {interactionThreshold} interações
                            </p>
                        </CardContent>
                    </Card>
                    <Card className="bg-zinc-900 border-zinc-800 text-white">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Taxa de Conexão</CardTitle>
                            <Activity className="h-4 w-4 text-blue-500" />
                        </CardHeader>
                        <CardContent>
                            <div className={`text-2xl font-bold ${kpiData.connectionRate >= connectivityTarget ? 'text-green-500' : 'text-yellow-500'}`}>
                                {kpiData.connectionRate.toFixed(1)}%
                            </div>
                            <p className="text-xs text-zinc-400">
                                Meta: {connectivityTarget}%
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Chart */}
                <div className="grid gap-4 md:grid-cols-1">
                    <LeadsAreaChart
                        timeRange={timeRange}
                        viewMode={viewMode}
                        selectedAgents={selectedAgents}
                        interactionThreshold={interactionThreshold}
                        agentNames={agentNames}
                    />
                </div>
            </div>
        </main>
    )
}
