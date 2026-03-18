"use client"

import React, { createContext, useContext, useEffect, useState, useCallback } from "react"
import { supabase } from "@/lib/supabaseClient"
import { settingsService, DashboardSettings, DEFAULT_SETTINGS } from "@/lib/settings-service"

// --- Cache em memória (TTL de 2 minutos) ---
// Persiste entre re-renders e navegações na mesma sessão.
const CACHE_TTL_MS = 2 * 60 * 1000 // 2 minutos

const cache = {
    agents: null as string[] | null,
    agentsAt: 0,
    settings: null as DashboardSettings | null,
    settingsAt: 0,
    isValid(key: 'agents' | 'settings') {
        const val = this[key]
        const at = this[`${key}At` as 'agentsAt' | 'settingsAt']
        return val !== null && (Date.now() - at) < CACHE_TTL_MS
    },
    setAgents(value: string[]) {
        this.agents = value
        this.agentsAt = Date.now()
    },
    setSettings(value: DashboardSettings) {
        this.settings = value
        this.settingsAt = Date.now()
    },
    clear(key?: 'agents' | 'settings') {
        if (!key || key === 'agents') { this.agents = null; this.agentsAt = 0 }
        if (!key || key === 'settings') { this.settings = null; this.settingsAt = 0 }
    }
}

interface DashboardContextValue {
    settings: DashboardSettings
    settingsLoaded: boolean
    availableAgents: string[]
    agentsLoaded: boolean
    refreshAgents: () => Promise<void>
}

const DashboardContext = createContext<DashboardContextValue>({
    settings: DEFAULT_SETTINGS,
    settingsLoaded: false,
    availableAgents: [],
    agentsLoaded: false,
    refreshAgents: async () => {},
})

export function DashboardProvider({ children }: { children: React.ReactNode }) {
    // Inicializa já com cache se disponível (navegação instantânea entre abas)
    const [settings, setSettings] = useState<DashboardSettings>(
        cache.isValid('settings') ? cache.settings! : DEFAULT_SETTINGS
    )
    const [settingsLoaded, setSettingsLoaded] = useState(cache.isValid('settings'))
    const [availableAgents, setAvailableAgents] = useState<string[]>(
        cache.isValid('agents') ? cache.agents! : []
    )
    const [agentsLoaded, setAgentsLoaded] = useState(cache.isValid('agents'))

    // --- Fetch de Agentes (com cache) ---
    const fetchAgents = useCallback(async (force = false) => {
        if (!force && cache.isValid('agents')) {
            setAvailableAgents(cache.agents!)
            setAgentsLoaded(true)
            return
        }

        try {
            const { data, error } = await supabase
                .from('info_lead')
                .select('agent_id')
                .not('agent_id', 'is', null)
                .limit(5000)

            if (error) {
                console.error("Erro ao buscar agentes:", error)
                return
            }

            const unique = Array.from(new Set(data?.map(d => d.agent_id).filter(Boolean) || []))
            cache.setAgents(unique)
            setAvailableAgents(unique)
        } catch (e) {
            console.error("Erro inesperado ao buscar agentes:", e)
        } finally {
            setAgentsLoaded(true)
        }
    }, [])

    // --- Fetch de Settings (com cache) ---
    useEffect(() => {
        if (cache.isValid('settings')) {
            // Dados já disponíveis no cache — sem round-trip ao banco
            setSettings(cache.settings!)
            setSettingsLoaded(true)
        } else {
            const loadSettings = async () => {
                try {
                    const data = await settingsService.getSettings()
                    cache.setSettings(data)
                    setSettings(data)
                } catch (e) {
                    console.error("Erro ao carregar configurações:", e)
                } finally {
                    setSettingsLoaded(true)
                }
            }
            loadSettings()
        }

        // Subscription de realtime — invalida cache e atualiza quando settings mudam no banco
        const sub = settingsService.subscribeToSettings((newSettings) => {
            cache.setSettings(newSettings)
            setSettings(newSettings)
        })

        return () => { sub.unsubscribe() }
    }, [])

    // --- Load Agents na montagem ---
    useEffect(() => {
        fetchAgents()
    }, [fetchAgents])

    // refreshAgents exposto para forçar re-fetch manual (ex: após adicionar agente)
    const refreshAgents = useCallback(() => {
        cache.clear('agents')
        return fetchAgents(true)
    }, [fetchAgents])

    return (
        <DashboardContext.Provider
            value={{
                settings,
                settingsLoaded,
                availableAgents,
                agentsLoaded,
                refreshAgents,
            }}
        >
            {children}
        </DashboardContext.Provider>
    )
}

export function useDashboard() {
    return useContext(DashboardContext)
}
