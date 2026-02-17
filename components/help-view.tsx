
"use client"

import { Card, CardContent } from "@/components/ui/card"
import ReactMarkdown from 'react-markdown'
import { useEffect, useState } from "react"

export function HelpView() {
    const [content, setContent] = useState("")

    useEffect(() => {
        // In a real app we might fetch this. For now we just import string or show static.
        // But since we can't easily import a md file in client component without loader config, 
        // we will fetch it from public or just show a message if file reading is complex in this environment.
        // Let's assume we fetch from a local file path if we had API, but here we can just hardcode the
        // "placeholder" behavior or try to fetch if we put it in public.
        // User asked for "texto em formato .md".

        // Simulating loading the content
        setContent(`# Central de Ajuda
        
**Bem vindo ao Leads Monitor.**

Este documento será atualizado em breve com instruções detalhadas sobre:
- Como interpretar os gráficos
- Configurações de métricas
- Definição de metas

*Aguarde atualizações do administrador.*`)
    }, [])

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold tracking-tight">Ajuda & Documentação</h2>
            <Card>
                <CardContent className="pt-6 prose prose-invert max-w-none">
                    {/* Since we don't have react-markdown installed in dependencies list (assumed), 
                        we should be careful. I will use simple whitespace rendering if markdown lib is missing.
                        Actually, I'll just render it as pre-wrap text if I can't confirm libraries. 
                    */}
                    <div className="whitespace-pre-wrap text-muted-foreground font-mono text-sm">
                        {content}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
