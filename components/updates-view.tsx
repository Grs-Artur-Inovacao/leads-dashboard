"use client"

import { useEffect, useState } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { motion } from "framer-motion"
import { Loader2, Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardDescription, CardHeader, CardTitle, CardFooter, CardAction } from "@/components/ui/card"
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
} from "@/components/ui/drawer"
import { supabase } from "@/lib/supabaseClient"

interface UpdateItem {
    id: string
    version: string
    date_display: string
    title: string
    summary: string
    content: string
    release_date: string
}

export function UpdatesView() {
    const [updates, setUpdates] = useState<UpdateItem[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedUpdate, setSelectedUpdate] = useState<UpdateItem | null>(null)

    useEffect(() => {
        async function loadUpdates() {
            try {
                const { data, error } = await supabase
                    .schema('dashboard_config')
                    .from('updates_feed')
                    .select('*')
                    .eq('is_active', true)
                    .order('release_date', { ascending: false })



                if (error) throw error

                if (data) {
                    setUpdates(data)
                }
            } catch (error) {
                console.error("Erro ao carregar updates:", error)
            } finally {
                setLoading(false)
            }
        }

        loadUpdates()
    }, [])

    // Função para limpar e preparar o conteúdo Markdown
    const formatMarkdown = (text: string) => {
        if (!text) return ""
        return text
            .replace(/\\n/g, "\n") // Corrige quebras de linha escapadas
            .split("\n")
            .map(line => line.startsWith("    ") ? line.substring(4) : line) // Remove indentação excessiva que gera blocos de código
            .join("\n")
            .trim()
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        )
    }

    return (
        <div className="container max-w-6xl mx-auto py-10 space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col items-center text-center gap-2 mb-8">
                <div className="inline-flex items-center justify-center p-3 rounded-full bg-primary/10 mb-2">
                    <Bell className="h-6 w-6 text-primary" />
                </div>
                <h2 className="text-3xl font-bold tracking-tight">Novidades</h2>
                <p className="text-muted-foreground">Últimas atualizações da Renatinha.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {updates.map((update, index) => (
                    <motion.div
                        key={update.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                    >
                        <Card className="relative mx-auto w-full overflow-hidden pt-0 shadow-lg border-muted/20">
                            <div className="absolute inset-0 z-30 h-[200px] bg-black/40" />
                            <img
                                src={`https://avatar.vercel.sh/${update.version}?size=400&text=${update.version}`}
                                alt={`Version ${update.version}`}
                                className="relative z-20 h-[200px] w-full object-cover brightness-75 grayscale transition-all duration-500 hover:grayscale-0 hover:brightness-100 dark:brightness-50"
                            />
                            <CardHeader className="flex-1">
                                <CardAction>
                                    <Badge variant="secondary" className="font-mono bg-primary/20 text-primary hover:bg-primary/30">
                                        {update.version}
                                    </Badge>
                                    <span className="ml-auto text-xs text-muted-foreground">{update.date_display || update.release_date}</span>
                                </CardAction>
                                <CardTitle className="text-xl">{update.title}</CardTitle>
                                <div className="text-sm text-muted-foreground line-clamp-3 mt-2 prose-sm prose-stone dark:prose-invert">
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                        {formatMarkdown(update.summary)}
                                    </ReactMarkdown>
                                </div>
                            </CardHeader>
                            <CardFooter>
                                <Button
                                    className="w-full"
                                    variant="secondary"
                                    onClick={() => setSelectedUpdate(update)}
                                >
                                    Ver Detalhes
                                </Button>
                            </CardFooter>
                        </Card>
                    </motion.div>
                ))}
            </div>

            <Drawer open={!!selectedUpdate} onOpenChange={(open) => !open && setSelectedUpdate(null)}>
                <DrawerContent className="max-h-[85vh]">
                    <div className="mx-auto w-full max-w-2xl">
                        <DrawerHeader>
                            <div className="flex items-center gap-2 mb-2 justify-center">
                                <Badge variant="outline" className="font-mono">
                                    {selectedUpdate?.version}
                                </Badge>
                                <span className="text-sm text-muted-foreground">
                                    {selectedUpdate?.date_display || selectedUpdate?.release_date}
                                </span>
                            </div>
                            <DrawerTitle className="text-center text-2xl mb-2">
                                {selectedUpdate?.title}
                            </DrawerTitle>
                            <DrawerDescription className="text-center">
                                Detalhes completos da atualização
                            </DrawerDescription>
                        </DrawerHeader>

                        <div className="px-6 py-4 overflow-y-auto max-h-[60vh] no-scrollbar">

                            <article className="prose prose-stone dark:prose-invert max-w-none 
                                prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-foreground
                                prose-p:text-muted-foreground prose-li:text-muted-foreground
                                prose-li:marker:text-primary
                                prose-strong:text-foreground prose-strong:font-bold
                                prose-code:font-mono prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-foreground prose-code:before:content-none prose-code:after:content-none">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                    {formatMarkdown(selectedUpdate?.content || "")}
                                </ReactMarkdown>
                            </article>
                        </div>


                        <DrawerFooter className="pt-2">
                            <DrawerClose asChild>
                                <Button variant="outline">Fechar</Button>
                            </DrawerClose>
                        </DrawerFooter>
                    </div>
                </DrawerContent>
            </Drawer>
        </div>
    )
}
