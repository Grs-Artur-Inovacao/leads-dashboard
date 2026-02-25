"use client"

import { useEffect, useState, useMemo } from "react"
import { supabase } from "@/lib/supabaseClient"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { DataTable } from "@/components/ui/data-table"
import { ColumnDef } from "@tanstack/react-table"
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
import { RefreshCw, Search, MessageSquare, Calendar as CalendarIcon, User, Briefcase, ShoppingBag, FileText, X, CheckCircle2, BadgeCheck, Globe, Target, Layers, Megaphone } from "lucide-react"


import { LeadRegistrationForm } from "./lead-registration-form"

import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format, subDays } from "date-fns"
import { ptBR } from "date-fns/locale"
import { DateRange } from "react-day-picker"
import { cn } from "@/lib/utils"

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
    is_mql?: boolean
    salesforce_id?: string
    phone?: string
    cnpj?: string
    email?: string
    extracted_campaign?: string
    utm_source?: string
    utm_medium?: string
    utm_content?: string
}

// Helper to extract campaign name (copied from CampaignLogsView for consistency)
const extractCampaignName = (campaign: string | undefined): string => {
    if (!campaign || campaign.trim() === "") return "Direto / Orgânico"

    // Match contents inside brackets [ATR][MT]...[Campaign Name][NT]
    const matches = campaign.match(/\[([^\]]+)\]/g)
    if (matches && matches.length >= 7) {
        return matches[6].replace(/[\[\]]/g, '').replace(/\+/g, ' ')
    }

    if (campaign.startsWith('[') && matches && matches.length > 0) {
        return matches[matches.length - 1].replace(/[\[\]]/g, '').replace(/\+/g, ' ')
    }

    return campaign.replace(/\+/g, ' ')
}



export function LeadsListView() {
    // --- Estados de Controle ---
    const [loading, setLoading] = useState(true)
    const [leads, setLeads] = useState<Lead[]>([])
    const [count, setCount] = useState(0)

    // Filtros
    const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined)
    const [selectedAgents, setSelectedAgents] = useState<string[]>([])
    const [availableAgents, setAvailableAgents] = useState<string[]>([])

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
            if (dateRange?.from) {
                query = query.gte('created_at', dateRange.from.toISOString())
            }
            if (dateRange?.to) {
                const endOfDay = new Date(dateRange.to)
                endOfDay.setHours(23, 59, 59, 999)
                query = query.lte('created_at', endOfDay.toISOString())
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

            const leadData = data || []

            // --- Enrichment with Campaign Data ---
            const enrichedLeads = [...leadData]
            try {
                const phones = Array.from(new Set(leadData.map(l => l.phone).filter(Boolean)))
                if (phones.length > 0) {
                    // Fetch latest campaign log for each phone
                    // Selecting more columns to catch potential campaign name fields
                    const { data: campaignData, error: campaignError } = await supabase
                        .from('campaign_log')
                        .select('*')
                        .or(phones.map(p => `phone.ilike.%${p}%`).join(','))
                        .order('created_at', { ascending: false })

                    if (!campaignError && campaignData) {
                        const campaignMap = new Map()
                        campaignData.forEach(log => {
                            const normalized = log.phone?.replace(/\D/g, '')
                            // Only keep the most recent one (since it's ordered by created_at desc)
                            if (normalized && !campaignMap.has(normalized)) {
                                // Try all variations of campaign field names
                                const campaignValue =
                                    (log as any).utm_campaign ||
                                    (log as any).camping ||
                                    (log as any).campaign_name ||
                                    (log as any)["camping name"] ||
                                    "";

                                campaignMap.set(normalized, {
                                    name: extractCampaignName(campaignValue),
                                    source: (log as any).utm_source,
                                    medium: (log as any).utm_medium,
                                    content: (log as any).utm_content
                                })
                            }
                        })

                        enrichedLeads.forEach(lead => {
                            const normalized = lead.phone?.replace(/\D/g, '')
                            if (normalized && campaignMap.has(normalized)) {
                                const details = campaignMap.get(normalized)
                                lead.extracted_campaign = details.name
                                lead.utm_source = details.source
                                lead.utm_medium = details.medium
                                lead.utm_content = details.content
                            }
                        })
                    }
                }
            } catch (enrichError) {
                console.error("Erro ao enriquecer leads com campanhas:", enrichError)
            }

            setLeads(enrichedLeads)
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
    }, [dateRange, selectedAgents, statusFilter])

    useEffect(() => {
        fetchLeads()
    }, [currentPage, dateRange, selectedAgents, statusFilter, interactionThreshold])


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

    const columns: ColumnDef<Lead>[] = useMemo(() => [
        {
            accessorKey: "created_at",
            header: "Data",
            cell: ({ row }) => {
                const date = formatDate(row.getValue("created_at"))
                return (
                    <div className="flex flex-col gap-1 text-xs">
                        <div className="flex items-center gap-1.5 font-medium text-muted-foreground">
                            <CalendarIcon className="h-3 w-3" />
                            {date.split(' ')[0]}
                        </div>
                        <span className="opacity-70 pl-4.5 text-muted-foreground">
                            {date.split(' ')[1]}
                        </span>
                    </div>
                )
            }
        },
        {
            id: "lead_info",
            header: "Lead / Empresa",
            cell: ({ row }) => {
                const lead = row.original
                const leadName = getLeadName(lead)
                const hasName = lead.first_name || lead.last_name
                return (
                    <div className="flex flex-col group relative">
                        <div className="flex items-center gap-2">
                            <span className={`font-medium ${hasName ? 'text-foreground' : 'text-muted-foreground italic truncate max-w-[200px] block'}`}>
                                {leadName}
                            </span>

                        </div>
                        {lead.company && (
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                                <Briefcase className="h-3 w-3" />
                                <span className="truncate max-w-[180px]">{lead.company}</span>
                            </div>
                        )}
                    </div>
                )
            }
        },
        {
            accessorKey: "product",
            header: "Interesse (Produto)",
            cell: ({ row }) => {
                const product = row.getValue("product") as string
                const campaign = row.original.extracted_campaign

                return (
                    <div className="flex flex-col gap-1.5 text-sm">
                        {product ? (
                            <div className="flex items-center gap-1.5">
                                <ShoppingBag className="h-3 w-3 text-muted-foreground" />
                                <span className="truncate max-w-[150px]" title={product}>
                                    {product}
                                </span>
                            </div>
                        ) : (
                            <span className="text-xs text-muted-foreground italic">-</span>
                        )}
                    </div>
                )
            }
        },
        {
            id: "campaign_details",
            header: "Origem & Campanha",
            cell: ({ row }) => {
                const lead = row.original
                if (!lead.extracted_campaign && !lead.utm_source) {
                    return <span className="text-xs text-muted-foreground italic">-</span>
                }

                return (
                    <div className="flex flex-col gap-2 min-w-[180px]">
                        {lead.extracted_campaign && (
                            <Badge variant="outline" className="bg-primary/5 border-primary/20 text-primary font-bold py-0 px-2 w-fit text-[10px]">
                                {lead.extracted_campaign}
                            </Badge>
                        )}
                        <div className="flex flex-wrap gap-1.5 items-center text-[9px] text-muted-foreground uppercase tracking-wider font-medium">
                            {lead.utm_source && (
                                <div className="flex items-center gap-1 bg-zinc-800/50 px-1.5 py-0.5 rounded border border-zinc-700/50">
                                    <Globe className="h-2.5 w-2.5" />
                                    {lead.utm_source}
                                </div>
                            )}
                            {lead.utm_medium && (
                                <div className="flex items-center gap-1 bg-zinc-800/50 px-1.5 py-0.5 rounded border border-zinc-700/50">
                                    <Target className="h-2.5 w-2.5" />
                                    {lead.utm_medium}
                                </div>
                            )}
                            {lead.utm_content && (
                                <div className="flex items-center gap-1 bg-zinc-800/50 px-1.5 py-0.5 rounded border border-zinc-700/50">
                                    <Layers className="h-2.5 w-2.5" />
                                    <span className="max-w-[100px] truncate">{lead.utm_content}</span>
                                </div>
                            )}
                        </div>
                    </div>
                )
            }
        },
        {
            id: "actions",
            header: () => <div className="text-center">Resumo</div>,
            cell: ({ row }) => {
                const lead = row.original
                const leadName = getLeadName(lead)
                return (
                    <div className="flex justify-center">
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-70 hover:opacity-100 transition-opacity">
                                    <FileText className={`h-4 w-4 ${lead.summary ? 'text-white fill-white/10' : 'text-muted-foreground/30'}`} />
                                    <span className="sr-only">Ver Resumo</span>
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Resumo da Conversa</DialogTitle>
                                    <DialogDescription>
                                        Detalhes da interação com o lead.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="mt-4 space-y-4">
                                    <div className="grid grid-cols-2 gap-4 text-sm bg-muted/30 p-3 rounded-md border">
                                        <div>
                                            <span className="text-muted-foreground block text-xs mb-1">Lead</span>
                                            <div className="font-medium flex items-center gap-2">
                                                <User className="h-3 w-3 text-muted-foreground" />
                                                {leadName}
                                            </div>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground block text-xs mb-1">Empresa</span>
                                            <div className="font-medium flex items-center gap-2">
                                                <Briefcase className="h-3 w-3 text-muted-foreground" />
                                                {lead.company || '-'}
                                            </div>
                                        </div>
                                    </div>

                                    {(lead.extracted_campaign || lead.utm_source) && (
                                        <div className="space-y-2">
                                            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider font-mono">Marketing & Campanha</label>
                                            <div className="bg-primary/5 p-3 rounded-md border border-primary/10 flex flex-col gap-2.5">
                                                <div className="flex items-center gap-2">
                                                    <Megaphone className="h-4 w-4 text-primary" />
                                                    <span className="text-sm font-bold text-primary">
                                                        {lead.extracted_campaign || "Direto / Orgânico"}
                                                    </span>
                                                </div>
                                                <div className="flex flex-wrap gap-2 text-[10px]">
                                                    {lead.utm_source && (
                                                        <Badge variant="secondary" className="bg-zinc-800/40 border-zinc-700/50 gap-1.5 font-medium px-2 py-0.5">
                                                            <Globe className="h-3 w-3 text-muted-foreground" />
                                                            {lead.utm_source}
                                                        </Badge>
                                                    )}
                                                    {lead.utm_medium && (
                                                        <Badge variant="secondary" className="bg-zinc-800/40 border-zinc-700/50 gap-1.5 font-medium px-2 py-0.5">
                                                            <Target className="h-3 w-3 text-muted-foreground" />
                                                            {lead.utm_medium}
                                                        </Badge>
                                                    )}
                                                    {lead.utm_content && (
                                                        <Badge variant="secondary" className="bg-zinc-800/40 border-zinc-700/50 gap-1.5 font-medium px-2 py-0.5">
                                                            <Layers className="h-3 w-3 text-muted-foreground" />
                                                            {lead.utm_content}
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="space-y-2">
                                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Conteúdo da IA</label>
                                        <div className="bg-muted/50 p-4 rounded-md text-sm leading-relaxed max-h-[300px] overflow-y-auto border text-foreground/90">
                                            {lead.summary ? (
                                                <p style={{ whiteSpace: 'pre-wrap' }}>{lead.summary}</p>
                                            ) : (
                                                <p className="text-muted-foreground italic">Nenhum resumo disponível para este lead.</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between text-xs text-muted-foreground border-t pt-4">
                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center gap-2">
                                                <MessageSquare className="h-3 w-3" />
                                                {lead.contador_interacoes} interações
                                            </div>
                                            <div>
                                                ID: <span className="font-mono">{lead.id.substring(0, 8)}...</span>
                                            </div>
                                        </div>

                                    </div>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                )
            }
        },
        {
            id: "status",
            header: () => <div className="text-center">Status</div>,
            cell: ({ row }) => {
                const connected = isConnected(row.original.contador_interacoes)
                if (!connected) return <div className="text-center text-muted-foreground">-</div>

                return (
                    <div className="flex justify-center">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 text-emerald-500 text-xs font-medium">
                            <CheckCircle2 className="h-3.5 w-3.5 fill-emerald-500 text-black" strokeWidth={3} />
                            <span>Conectado</span>
                        </div>
                    </div>
                )
            }
        },
        {
            accessorKey: "agent_id",
            header: () => <div className="text-right">Agente</div>,
            cell: ({ row }) => {
                return (
                    <div className="flex items-center justify-end gap-2 text-sm">
                        <span className="text-muted-foreground text-xs font-medium">{getAgentName(row.getValue("agent_id"))}</span>
                        <div className="bg-muted p-1 rounded-full">
                            <User className="h-3 w-3 opacity-50" />
                        </div>
                    </div>
                )
            }
        },
    ], [agentNames, interactionThreshold]) // Re-memoize if dependencies change

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





                    <div className="flex items-center bg-muted/50 p-1 rounded-lg border">
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    id="date"
                                    variant={"ghost"}
                                    className={cn(
                                        "w-[240px] justify-start text-left font-normal text-xs h-8",
                                        !dateRange && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                                    {dateRange?.from ? (
                                        dateRange.to ? (
                                            <>
                                                {format(dateRange.from, "dd 'de' MMM", { locale: ptBR })} -{" "}
                                                {format(dateRange.to, "dd 'de' MMM", { locale: ptBR })}
                                            </>
                                        ) : (
                                            format(dateRange.from, "dd 'de' MMM, yyyy", { locale: ptBR })
                                        )
                                    ) : (
                                        <span>Selecione uma data</span>
                                    )}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="end">
                                <Calendar
                                    initialFocus
                                    mode="range"
                                    defaultMonth={dateRange?.from}
                                    selected={dateRange}
                                    onSelect={setDateRange}
                                    numberOfMonths={2}
                                    locale={ptBR}
                                />
                            </PopoverContent>
                        </Popover>
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



            {/* Status Tabs */}
            <div className="flex items-center gap-1 bg-neutral-900/50 p-1 w-fit rounded-lg border border-neutral-800">
                {[
                    { id: 'all', label: 'Todos' },
                    { id: 'connected', label: 'Conectados' },
                    { id: 'cold', label: 'Frios' },


                ].map(s => (
                    <button
                        key={s.id}
                        onClick={() => setStatusFilter(s.id as any)}
                        className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all ${statusFilter === s.id ? 'bg-neutral-700 text-white shadow-sm' : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50'}`}
                    >
                        {s.label}
                    </button>
                ))}
            </div>


            {/* Table */}
            {
                loading ? (
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[140px]">Data</TableHead>
                                    <TableHead className="min-w-[200px]">Lead / Empresa</TableHead>
                                    <TableHead className="min-w-[150px]">Interesse (Produto)</TableHead>
                                    <TableHead className="min-w-[180px]">Origem & Campanha</TableHead>
                                    <TableHead className="text-center">Resumo</TableHead>
                                    <TableHead className="text-center">Status</TableHead>
                                    <TableHead className="text-right">Agente</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell><div className="h-4 w-24 bg-muted animate-pulse rounded" /></TableCell>
                                        <TableCell><div className="space-y-2"><div className="h-4 w-32 bg-muted animate-pulse rounded" /><div className="h-3 w-20 bg-muted animate-pulse rounded" /></div></TableCell>
                                        <TableCell><div className="space-y-2"><div className="h-4 w-24 bg-muted animate-pulse rounded" /><div className="h-3 w-16 bg-muted animate-pulse rounded" /></div></TableCell>
                                        <TableCell><div className="h-4 w-8 mx-auto bg-muted animate-pulse rounded" /></TableCell>
                                        <TableCell><div className="h-6 w-20 bg-muted animate-pulse rounded-full mx-auto" /></TableCell>
                                        <TableCell><div className="h-6 w-24 bg-muted animate-pulse rounded-full mx-auto" /></TableCell>
                                        <TableCell><div className="h-4 w-20 bg-muted animate-pulse rounded ml-auto" /></TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                ) : (
                    <DataTable columns={columns} data={leads} />
                )
            }

            {/* Pagination Controls */}
            {
                totalPages > 1 && (
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
                )
            }
        </div >
    )
}
