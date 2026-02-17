"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
    PaginationEllipsis
} from "@/components/ui/pagination"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input" // Assuming Input exists or use standard input
import { AgentSelector } from "./agent-selector"
import { RefreshCw, Search, MessageSquare, Calendar, User } from "lucide-react"

// --- Tipos ---
type Lead = {
    created_at: string
    agent_id: string
    contador_interacoes: number
    // Campos potencias que vamos tentar mostrar se existirem
    id?: string
    nome?: string
    ultimo_mensagem?: string
}

export function LeadsListView() {
    // --- Estados de Controle ---
    const [loading, setLoading] = useState(true)
    const [leads, setLeads] = useState<Lead[]>([])
    const [count, setCount] = useState(0)

    // Filtros
    const [timeRange, setTimeRange] = useState("30d")
    const [selectedAgents, setSelectedAgents] = useState<string[]>([])
    const [availableAgents, setAvailableAgents] = useState<string[]>([])
    const [statusFilter, setStatusFilter] = useState<"all" | "connected" | "cold">("all")

    // Paginação
    const [currentPage, setCurrentPage] = useState(1)
    const pageSize = 10

    // Configurações
    const [interactionThreshold, setInteractionThreshold] = useState(3)
    const [agentNames, setAgentNames] = useState<Record<string, string>>({})

    // --- Carregar Configurações (Mesma lógica do chart) ---
    useEffect(() => {
        const loadSettings = () => {
            const savedThreshold = localStorage.getItem('leads-dashboard-threshold')
            const savedNames = localStorage.getItem('leads-dashboard-names')

            if (savedThreshold) setInteractionThreshold(Number(savedThreshold))
            if (savedNames) setAgentNames(JSON.parse(savedNames))
        }
        loadSettings()
        window.addEventListener('storage', loadSettings)
        return () => window.removeEventListener('storage', loadSettings)
    }, [])

    // --- Carregar Agentes Disponíveis ---
    useEffect(() => {
        const fetchAgents = async () => {
            const { data, error } = await supabase
                .from('info_lead')
                .select('agent_id')
                .not('agent_id', 'is', null)

            if (!error && data) {
                const uniqueAgents = Array.from(new Set(data.map(d => d.agent_id).filter(Boolean)))
                setAvailableAgents(uniqueAgents)
                if (selectedAgents.length === 0) setSelectedAgents(uniqueAgents)
            }
        }
        fetchAgents()
    }, [])

    // --- Buscar Leads ---
    const fetchLeads = async () => {
        setLoading(true)
        try {
            let query = supabase
                .from('info_lead')
                .select('*', { count: 'exact' })

            // Filtro de Data
            const now = new Date()
            let startDate = new Date()
            if (timeRange !== 'all') {
                const days = Number(timeRange.replace('d', ''))
                startDate.setDate(now.getDate() - days)
                query = query.gte('created_at', startDate.toISOString())
            }

            // Filtro de Agentes
            if (selectedAgents.length > 0) {
                query = query.in('agent_id', selectedAgents)
            }

            // ORDENAÇÃO
            query = query.order('created_at', { ascending: false })

            // (Nota: Filtrar por status 'conectado' via SQL é complexo se 'contador_interacoes' for numérico simples,
            // mas faremos no client ou SQL raw se necessário. Para simplificar e performar, faremos paginado e
            // o filtro de status aplicaremos SOBRE a página ou idealmente no SQL. 
            // Como 'contador_interacoes' é uma coluna, podemos filtrar direto!)
            if (statusFilter === 'connected') {
                query = query.gt('contador_interacoes', interactionThreshold)
            } else if (statusFilter === 'cold') {
                query = query.lte('contador_interacoes', interactionThreshold)
            }

            // PAGINAÇÃO
            const from = (currentPage - 1) * pageSize
            const to = from + pageSize - 1
            query = query.range(from, to)

            const { data, count, error } = await query

            if (error) throw error

            setLeads(data || [])
            setCount(count || 0)

        } catch (error) {
            console.error("Erro ao buscar leads:", error)
        } finally {
            setLoading(false)
        }
    }

    // Refresh ao mudar filtros
    useEffect(() => {
        // Resetar para página 1 se filtros mudarem (exceto paginação)
        setCurrentPage(1)
    }, [timeRange, selectedAgents, statusFilter])

    useEffect(() => {
        fetchLeads()
    }, [currentPage, timeRange, selectedAgents, statusFilter, interactionThreshold])


    // --- Helpers ---
    const totalPages = Math.ceil(count / pageSize)

    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        return new Intl.DateTimeFormat('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date)
    }

    const getAgentName = (id: string) => agentNames[id] || id

    const getStatus = (interactions: number) => {
        if (interactions > interactionThreshold) return { label: 'Conectado', variant: 'success' }
        if (interactions > 0) return { label: 'Em Progresso', variant: 'warning' } // Opcional
        return { label: 'Novo / Frio', variant: 'neutral' }
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header & Controls */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Leads Detalhados</h2>
                    <p className="text-muted-foreground">
                        Total de {count} leads encontrados.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <Button variant="outline" size="sm" onClick={fetchLeads} disabled={loading}>
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    </Button>

                    {/* Status Filter */}
                    <div className="flex bg-muted p-1 rounded-md">
                        {[
                            { id: 'all', label: 'Todos' },
                            { id: 'connected', label: 'Conectados' },
                            { id: 'cold', label: 'Frios' }
                        ].map(s => (
                            <button
                                key={s.id}
                                onClick={() => setStatusFilter(s.id as any)}
                                className={`px-3 py-1 text-xs rounded-sm transition-all ${statusFilter === s.id ? 'bg-background shadow font-medium' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                                {s.label}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center bg-muted/50 p-1 rounded-lg border">
                        {['7d', '15d', '30d', 'all'].map((range) => (
                            <button
                                key={range}
                                onClick={() => setTimeRange(range)}
                                className={`px-3 py-1 text-xs rounded-sm transition-all ${timeRange === range ? 'bg-background shadow text-foreground font-medium' : 'text-muted-foreground hover:bg-background/50'}`}
                            >
                                {range === 'all' ? 'Tudo' : range}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Agent Selector Bar */}
            <div className="flex items-center gap-2">
                <AgentSelector
                    agents={availableAgents}
                    selectedAgents={selectedAgents}
                    onChange={setSelectedAgents}
                    namesMap={agentNames}
                />
                {/* Search Placeholder */}
                <div className="relative max-w-sm flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <input
                        type="search"
                        placeholder="Buscar ID..."
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 pl-9 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                        disabled // Disabled for now as per plan
                    />
                </div>
            </div>

            {/* Table */}
            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[180px]">Data</TableHead>
                                <TableHead>Agente</TableHead>
                                <TableHead className="text-center">Interações</TableHead>
                                <TableHead>Status</TableHead>
                                {/* <TableHead>Detalhes</TableHead> */}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                // Loading State
                                Array.from({ length: 5 }).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell><div className="h-4 w-24 bg-muted animate-pulse rounded" /></TableCell>
                                        <TableCell><div className="h-4 w-32 bg-muted animate-pulse rounded" /></TableCell>
                                        <TableCell><div className="h-4 w-8 mx-auto bg-muted animate-pulse rounded" /></TableCell>
                                        <TableCell><div className="h-6 w-20 bg-muted animate-pulse rounded-full" /></TableCell>
                                    </TableRow>
                                ))
                            ) : leads.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center">
                                        Nenhum lead encontrado com os filtros atuais.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                leads.map((lead, idx) => {
                                    const { label, variant } = getStatus(lead.contador_interacoes)
                                    return (
                                        <TableRow key={lead.id || idx}>
                                            <TableCell className="font-medium text-muted-foreground">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="h-3 w-3" />
                                                    {formatDate(lead.created_at)}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <User className="h-3 w-3 opacity-50" />
                                                    {getAgentName(lead.agent_id)}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <div className="flex items-center justify-center gap-1 font-mono">
                                                    <MessageSquare className="h-3 w-3 text-muted-foreground" />
                                                    {lead.contador_interacoes}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={variant as any}>
                                                    {label}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    )
                                })
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <Pagination>
                    <PaginationContent>
                        <PaginationItem>
                            <PaginationPrevious
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                            />
                        </PaginationItem>

                        {/* Simple Page Indicator */}
                        <div className="flex items-center gap-1 mx-4 text-sm font-medium">
                            Página {currentPage} de {totalPages}
                        </div>

                        <PaginationItem>
                            <PaginationNext
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                            />
                        </PaginationItem>
                    </PaginationContent>
                </Pagination>
            )}
        </div>
    )
}
