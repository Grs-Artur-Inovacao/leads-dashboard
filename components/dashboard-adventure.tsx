"use client";

import ScrollAdventure, { ScrollPage } from "@/components/ui/animated-scroll";
import { LeadsAreaChart } from "@/components/leads-area-chart";
import { ConversationsAnalysis } from "@/components/conversations-analysis";

export const DashboardAdventure = () => {
    return (
        <div className="w-full h-full">
            <ScrollAdventure
                pageLabels={["Performance", "Engajamento"]}
                autoPlayInterval={30000}
            >
                {/* Página 1 - O nosso dash */}
                <ScrollPage index={0} className="p-6 md:p-8 overflow-y-auto custom-scrollbar">
                    <LeadsAreaChart />
                </ScrollPage>

                {/* Página 2 - Análise de Conversas */}
                <ScrollPage index={1} className="p-6 md:p-8 overflow-y-auto custom-scrollbar">
                    <ConversationsAnalysis />
                </ScrollPage>
            </ScrollAdventure>
        </div>
    );
};
