"use client"

import { Card, CardContent } from "@/components/ui/card"
import { useEffect, useState } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

export function HelpView() {
    const [content, setContent] = useState("")
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function loadContent() {
            try {
                const response = await fetch("/ajuda.md")
                if (response.ok) {
                    const text = await response.text()
                    setContent(text)
                } else {
                    setContent("Erro ao carregar a documentação. Verifique se o arquivo public/ajuda.md existe.")
                }
            } catch (error) {
                setContent("Erro ao carregar a documentação.")
                console.error(error)
            } finally {
                setLoading(false)
            }
        }

        loadContent()
    }, [])

    return (
        <div className="space-y-6 max-w-4xl mx-auto pb-10">
            <h2 className="text-2xl font-bold tracking-tight">Ajuda & Documentação</h2>
            <Card>
                <CardContent className="pt-6">
                    {loading ? (
                        <div className="flex justify-center p-8 text-muted-foreground">
                            Carregando...
                        </div>
                    ) : (
                        <article className="prose prose-stone dark:prose-invert max-w-none 
                            prose-headings:scroll-mt-20 prose-headings:font-bold prose-headings:tracking-tight
                            prose-a:text-primary prose-a:no-underline hover:prose-a:underline
                            prose-img:rounded-md prose-img:shadow-md">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {content}
                            </ReactMarkdown>
                        </article>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
