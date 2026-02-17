"use client"

import * as React from "react"
import { Check, ChevronsUpDown, X } from "lucide-react"

import { cn } from "@/lib/utils"
// Usando componentes base do HTML/React para evitar dependências extras, já que não tenho certeza se popover/command estão instalados
import { useEffect, useRef, useState } from "react"

export interface AgentSelectorProps {
    agents: string[]
    selectedAgents: string[]
    onChange: (selected: string[]) => void
    isLoading?: boolean
    namesMap?: Record<string, string>
}

export function AgentSelector({
    agents,
    selectedAgents,
    onChange,
    isLoading = false,
    namesMap = {}
}: AgentSelectorProps) {
    const [open, setOpen] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)

    // Fechar ao clicar fora
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => {
            document.removeEventListener("mousedown", handleClickOutside)
        }
    }, [])

    const handleSelect = (agentId: string) => {
        if (selectedAgents.includes(agentId)) {
            onChange(selectedAgents.filter((id) => id !== agentId))
        } else {
            onChange([...selectedAgents, agentId])
        }
    }

    const handleSelectAll = () => {
        if (selectedAgents.length === agents.length) {
            onChange([])
        } else {
            onChange([...agents])
        }
    }

    // Formatar nome do agente
    const formatAgentName = (id: string) => {
        return namesMap[id] || id || "Desconhecido"
    }

    return (
        <div className="relative" ref={containerRef}>
            <button
                type="button"
                onClick={() => setOpen(!open)}
                className={cn(
                    "flex h-10 w-full items-center justify-between rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                    "w-[200px] sm:w-[250px]"
                )}
                disabled={isLoading}
            >
                <span className="truncate">
                    {selectedAgents.length === 0
                        ? "Selecionar Agentes"
                        : selectedAgents.length === agents.length
                            ? "Todos os Agentes"
                            : `${selectedAgents.length} agente(s) selecionado(s)`}
                </span>
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </button>

            {open && (
                <div className="absolute z-50 mt-1 w-[250px] rounded-lg border bg-popover text-popover-foreground shadow-md outline-none animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2">
                    <div className="p-1">
                        {/* Opção Todos */}
                        <div
                            className={cn(
                                "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 cursor-pointer",
                                selectedAgents.length === agents.length && "bg-accent text-accent-foreground"
                            )}
                            onClick={handleSelectAll}
                        >
                            <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                                {selectedAgents.length === agents.length && (
                                    <Check className="h-4 w-4" />
                                )}
                            </span>
                            <span>Todos os Agentes</span>
                        </div>

                        <div className="my-1 h-px bg-muted" />

                        {agents.length === 0 ? (
                            <div className="py-6 text-center text-sm text-muted-foreground">
                                Capaz, nenhum agente encontrado.
                            </div>
                        ) : (
                            <div className="max-h-[200px] overflow-y-auto">
                                {agents.map((agent) => (
                                    <div
                                        key={agent}
                                        className={cn(
                                            "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 cursor-pointer",
                                            selectedAgents.includes(agent) && "bg-accent/50"
                                        )}
                                        onClick={() => handleSelect(agent)}
                                    >
                                        <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                                            {selectedAgents.includes(agent) && (
                                                <Check className="h-4 w-4" />
                                            )}
                                        </span>
                                        <span className="truncate">{formatAgentName(agent)}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
