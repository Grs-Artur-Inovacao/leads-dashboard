"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { useEffect, useState } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

interface HelpSection {
    id: string
    title: string
    file: string
    content?: string
}

export function HelpView() {
    const [sections, setSections] = useState<HelpSection[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function loadHelpContent() {
            try {
                // 1. Load Manifest
                const manifestRes = await fetch("/docs/manifest.json")
                if (!manifestRes.ok) throw new Error("Falha ao carregar manifesto de ajuda")

                const manifestData: HelpSection[] = await manifestRes.json()

                // 2. Load Content for each section
                const sectionsWithContent = await Promise.all(
                    manifestData.map(async (section) => {
                        try {
                            const contentRes = await fetch(section.file)
                            return {
                                ...section,
                                content: contentRes.ok ? await contentRes.text() : "Conteúdo não disponível."
                            }
                        } catch (e) {
                            console.error(`Erro ao carregar ${section.file}`, e)
                            return { ...section, content: "Erro ao carregar conteúdo." }
                        }
                    })
                )

                setSections(sectionsWithContent)
            } catch (error) {
                console.error("Erro ao carregar documentação:", error)
            } finally {
                setLoading(false)
            }
        }

        loadHelpContent()
    }, [])

    const MarkdownContent = ({ content }: { content: string }) => (
        <article className="prose prose-stone dark:prose-invert max-w-none 
            prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-foreground
            prose-p:text-muted-foreground prose-li:text-muted-foreground
            prose-strong:text-foreground prose-strong:font-bold
            prose-img:rounded-lg prose-img:shadow-md prose-img:border
            prose-a:text-primary prose-a:no-underline hover:prose-a:underline
            prose-code:font-mono prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-foreground prose-code:before:content-none prose-code:after:content-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {content}
            </ReactMarkdown>
        </article>
    )

    if (loading) {
        return (
            <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        )
    }

    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-10 animate-in fade-in duration-500">
            <div className="flex flex-col gap-2">
                <h2 className="text-3xl font-bold tracking-tight">Central de Ajuda</h2>
                <p className="text-muted-foreground">Documentação completa da Renatinha e manuais do sistema.</p>
            </div>

            <div className="space-y-6 mt-6">

                <Accordion type="single" collapsible className="w-full">
                    {sections.map((section) => (
                        <AccordionItem key={section.id} value={section.id}>
                            <AccordionTrigger className="text-lg font-semibold px-4">
                                {section.title}
                            </AccordionTrigger>
                            <AccordionContent className="px-6 py-4 bg-muted/20">
                                <MarkdownContent content={section.content || ""} />
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            </div>
        </div>
    )
}
