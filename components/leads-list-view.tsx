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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AgentSelector } from "./agent-selector"
import { RefreshCw, Search, MessageSquare, Calendar, User, Briefcase, ShoppingBag, FileText, X } from "lucide-react"

// --- Tipos ---
type Lead = {
    id: string
    created_at: string
    agent_id: string
    contador_interacoes: number

    // Campos Enriquecidos
    first_name?: string
    last_name?: string
    company?: string
    product?: string
    summary?: string
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
    // Changed: default 'all' allows seeing everything, but user requested 'Conectados' behavior adjustments
    const [statusFilter, setStatusFilter] = useState<"all" | "connected" | "cold">("all")

    // Paginação
    const [currentPage, setCurrentPage] = useState(1)
    const pageSize = 10

    // Configurações
    const [interactionThreshold, setInteractionThreshold] = useState(3)
    const [agentNames, setAgentNames] = useState<Record<string, string>>({})

    // --- Carregar Configurações ---
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

    const isConnected = (interactions: number) => interactions > interactionThreshold

    const getLeadName = (lead: Lead) => {
        if (lead.first_name || lead.last_name) {
            return `${lead.first_name || ''} ${lead.last_name || ''}`.trim()
        }
        return 'Lead sem Nome'
    }

    const [selectedSummary, setSelectedSummary] = useState<Lead | null>(null)

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
                <div className="relative max-w-sm flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Buscar por ID..."
                        className="pl-9"
                        disabled
                    />
                </div>
            </div>

            {/* Table */}
            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[140px]">Data</TableHead>
                                <TableHead className="min-w-[200px]">Lead / Empresa</TableHead>
                                <TableHead className="min-w-[150px]">Interesse (Produto)</TableHead>
                                <TableHead className="text-center">Resumo</TableHead>
                                <TableHead className="text-center">Status</TableHead>
                                <TableHead className="text-right">Agente</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell><div className="h-4 w-24 bg-muted animate-pulse rounded" /></TableCell>
                                        <TableCell><div className="space-y-2"><div className="h-4 w-32 bg-muted animate-pulse rounded" /><div className="h-3 w-20 bg-muted animate-pulse rounded" /></div></TableCell>
                                        <TableCell><div className="h-4 w-24 bg-muted animate-pulse rounded" /></TableCell>
                                        <TableCell><div className="h-4 w-8 mx-auto bg-muted animate-pulse rounded" /></TableCell>
                                        <TableCell><div className="h-6 w-20 bg-muted animate-pulse rounded-full" /></TableCell>
                                        <TableCell><div className="h-4 w-20 bg-muted animate-pulse rounded ml-auto" /></TableCell>
                                    </TableRow>
                                ))
                            ) : leads.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center">
                                        Nenhum lead encontrado com os filtros atuais.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                leads.map((lead, idx) => {
                                    const connected = isConnected(lead.contador_interacoes)
                                    const leadName = getLeadName(lead)
                                    const hasName = lead.first_name || lead.last_name

                                    return (
                                        <TableRow key={lead.id || idx}>
                                            <TableCell className="font-medium text-muted-foreground text-xs">
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-1.5">
                                                        <Calendar className="h-3 w-3" />
                                                        {formatDate(lead.created_at).split(' ')[0]}
                                                    </div>
                                                    <span className="opacity-70 pl-4.5">
                                                        {formatDate(lead.created_at).split(' ')[1]}
                                                    </span>
                                                </div>
                                            </TableCell>

                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className={`font-medium ${hasName ? 'text-foreground' : 'text-muted-foreground italic'}`}>
                                                        {leadName}
                                                    </span>
                                                    {lead.company && (
                                                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                                                            <Briefcase className="h-3 w-3" />
                                                            {lead.company}
                                                        </div>
                                                    )}
                                                </div>
                                            </TableCell>

                                            <TableCell>
                                                {lead.product ? (
                                                    <div className="flex items-center gap-1.5 text-sm">
                                                        <ShoppingBag className="h-3 w-3 text-muted-foreground" />
                                                        <span className="truncate max-w-[150px]" title={lead.product}>
                                                            {lead.product}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground italic">-</span>
                                                )}
                                            </TableCell>

                                            {/* Resumo da Conversa (Botão) */}
                                            <TableCell className="text-center">
                                                <Dialog>
                                                    <DialogTrigger asChild>
                                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                            <FileText className={`h-4 w-4 ${lead.summary ? 'text-blue-500' : 'text-muted-foreground/30'}`} />
                                                            <span className="sr-only">Ver Resumo</span>
                                                        </Button>
                                                    </DialogTrigger>
                                                    <DialogContent>
                                                        <DialogHeader>
                                                            <DialogTitle>Resumo da Conversa</DialogTitle>
                                                            <DialogDescription>
                                                                Detalhes gerados pela IA sobre este lead.
                                                            </DialogDescription>
                                                        </DialogHeader>
                                                        <div className="mt-4 space-y-4">
                                                            <div className="grid grid-cols-2 gap-4 text-sm">
                                                                <div>
                                                                    <span className="text-muted-foreground block text-xs">Lead</span>
                                                                    <span className="font-medium">{leadName}</span>
                                                                </div>
                                                                <div>
                                                                    <span className="text-muted-foreground block text-xs">Empresa</span>
                                                                    <span className="font-medium">{lead.company || '-'}</span>
                                                                </div>
                                                            </div>

                                                            <div className="bg-muted/50 p-4 rounded-md text-sm leading-relaxed max-h-[300px] overflow-y-auto">
                                                                {lead.summary ? (
                                                                    <p>{lead.summary}</p>
                                                                ) : (
                                                                    <p className="text-muted-foreground italic">Nenhum resumo disponível para este lead.</p>
                                                                )}
                                                            </div>

                                                            <div className="flex items-center gap-2 text-xs text-muted-foreground border-t pt-4">
                                                                <MessageSquare className="h-3 w-3" />
                                                                {lead.contador_interacoes} interações registradas.
                                                            </div>
                                                        </div>
                                                    </DialogContent>
                                                </Dialog>
                                            </TableCell>

                                            <TableCell className="text-center">
                                                {connected && (
                                                    <Badge variant="success">
                                                        Conectado
                                                    </Badge>
                                                )}
                                            </TableCell>

                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-2 text-sm">
                                                    <span className="text-muted-foreground text-xs">{getAgentName(lead.agent_id)}</span>
                                                    <User className="h-3 w-3 opacity-50" />
                                                </div>
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
