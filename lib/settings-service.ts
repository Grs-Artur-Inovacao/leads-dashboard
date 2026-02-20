
import { supabase } from "@/lib/supabaseClient"

export interface DashboardSettings {
    id?: number
    interaction_threshold: number
    connectivity_target: number
    total_leads_target: number
    connected_leads_target: number
    mql_target: number
    agent_names: Record<string, string>
}

// Default settings
export const DEFAULT_SETTINGS: DashboardSettings = {
    interaction_threshold: 3,
    connectivity_target: 30,
    total_leads_target: 100,
    connected_leads_target: 50,
    mql_target: 10,
    agent_names: {}
}

export const settingsService = {
    async getSettings(): Promise<DashboardSettings> {
        try {
            const { data, error } = await supabase
                .schema('dashboard_config')
                .from('settings')
                .select('*')
                .single()



            if (error) {
                console.warn("Using default settings (DB fetch failed):", error.message)
                return DEFAULT_SETTINGS
            }

            return data as DashboardSettings
        } catch (e) {
            console.error("Unexpected error fetching settings", e)
            return DEFAULT_SETTINGS
        }
    },

    async updateSettings(settings: Partial<DashboardSettings>): Promise<void> {
        const payload: any = { ...settings }
        delete payload.id

        // Upsert to row with ID 1
        const { error } = await supabase
            .schema('dashboard_config')
            .from('settings')
            .upsert({ id: 1, ...payload })



        if (error) throw error
    },

    subscribeToSettings(callback: (settings: DashboardSettings) => void) {
        return supabase
            .channel('dashboard-settings-changes')
            .on('postgres_changes', { event: '*', schema: 'dashboard_config', table: 'settings' }, (payload) => {


                if (payload.new) {
                    callback(payload.new as DashboardSettings)
                }
            })
            .subscribe()
    }
}
