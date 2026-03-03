"use client"

import { useEffect, useState } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { motion } from "framer-motion"
import { Loader2, Bell, Sparkles } from "lucide-react"
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
import { cn } from "@/lib/utils"

import { DisplayCards } from "@/components/ui/display-cards"

interface UpdateItem {
    id: string
    version: string
    date_display: string
    title: string
    summary: string
    content: string
    release_date: string
    theme_color?: string // New field for customization
}

const stackStyles = [
    {
        className: "[grid-area:stack] hover:-translate-y-10 before:absolute before:w-[100%] before:outline-1 before:rounded-xl before:outline-border before:h-[100%] before:content-[''] before:bg-blend-overlay before:bg-background/50 grayscale-[100%] hover:before:opacity-0 before:transition-opacity before:duration:700 hover:grayscale-0 before:left-0 before:top-0",
    },
    {
        className: "[grid-area:stack] translate-x-16 translate-y-10 hover:-translate-y-1 before:absolute before:w-[100%] before:outline-1 before:rounded-xl before:outline-border before:h-[100%] before:content-[''] before:bg-blend-overlay before:bg-background/50 grayscale-[100%] hover:before:opacity-0 before:transition-opacity before:duration:700 hover:grayscale-0 before:left-0 before:top-0",
    },
    {
        className: "[grid-area:stack] translate-x-32 translate-y-20 hover:translate-y-10",
    },
];

export function UpdatesView() {
    const [updates, setUpdates] = useState<UpdateItem[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedUpdate, setSelectedUpdate] = useState<UpdateItem | null>(null)

    // Helper to get color classes based on theme_color
    const getColorClasses = (color?: string) => {
        switch (color?.toLowerCase()) {
            case 'orange':
                return {
                    overlay: 'bg-orange-500/20',
                    badge: 'bg-orange-500/20 text-orange-500 hover:bg-orange-500/30',
                    glow: 'shadow-orange-500/10',
                    title: 'text-orange-500',
                    iconBg: 'bg-orange-800',
                    icon: 'text-orange-300'
                }
            case 'blue':
                return {
                    overlay: 'bg-blue-500/20',
                    badge: 'bg-blue-500/20 text-blue-500 hover:bg-blue-500/30',
                    glow: 'shadow-blue-500/10',
                    title: 'text-blue-500',
                    iconBg: 'bg-blue-800',
                    icon: 'text-blue-300'
                }
            case 'green':
                return {
                    overlay: 'bg-green-500/20',
                    badge: 'bg-green-500/20 text-green-500 hover:bg-green-500/30',
                    glow: 'shadow-green-500/10',
                    title: 'text-green-500',
                    iconBg: 'bg-green-800',
                    icon: 'text-green-300'
                }
            case 'purple':
                return {
                    overlay: 'bg-purple-500/20',
                    badge: 'bg-purple-500/20 text-purple-500 hover:bg-purple-500/30',
                    glow: 'shadow-purple-500/10',
                    title: 'text-purple-500',
                    iconBg: 'bg-purple-800',
                    icon: 'text-purple-300'
                }
            default:
                return {
                    overlay: 'bg-primary/20',
                    badge: 'bg-primary/20 text-primary hover:bg-primary/30',
                    glow: 'shadow-primary/10',
                    title: 'text-primary',
                    iconBg: 'bg-primary/80',
                    icon: 'text-primary-foreground'
                }
        }
    }

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

    const featuredUpdates = updates.slice(0, 3)
    const otherUpdates = updates.slice(3)

    return (
        <div className="container max-w-6xl mx-auto py-10 space-y-12 animate-in fade-in duration-500">
            <div className="flex flex-col items-center text-center gap-2 mb-8">
                <div className="inline-flex items-center justify-center p-3 rounded-full bg-primary/10 mb-2">
                    <Bell className="h-6 w-6 text-primary" />
                </div>
                <h2 className="text-3xl font-bold tracking-tight">Novidades</h2>
                <p className="text-muted-foreground">O que há de novo no AllConnect.</p>
            </div>



            {/* Biblioteca Section */}
            {updates.length > 0 && (
                <div className="space-y-8">
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 px-4">
                        {updates.map((update, index) => {
                            const colors = getColorClasses(update.theme_color)
                            return (
                                <motion.div
                                    key={update.id}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.3, delay: index * 0.05 }}
                                >
                                    <Card className={cn(
                                        "relative mx-auto w-full overflow-hidden pt-0 shadow-lg transition-all duration-300 group",
                                        colors.glow
                                    )}>
                                        <div className={cn("absolute inset-0 z-30 h-[180px]", colors.overlay)} />
                                        <div className="absolute inset-0 z-30 h-[180px] bg-black/40" />
                                        <img
                                            src={`https://avatar.vercel.sh/${update.version}?size=400&text=${update.version}`}
                                            alt={`Version ${update.version}`}
                                            className="relative z-20 h-[180px] w-full object-cover brightness-75 grayscale transition-all duration-500 group-hover:grayscale-0 group-hover:brightness-100 dark:brightness-50"
                                        />
                                        <CardHeader className="flex-1">
                                            <CardAction>
                                                <Badge variant="secondary" className={cn("font-mono", colors.badge)}>
                                                    {update.version}
                                                </Badge>
                                                <span className="ml-auto text-xs text-muted-foreground">{update.date_display || update.release_date}</span>
                                            </CardAction>
                                            <CardTitle className="text-lg">{update.title}</CardTitle>
                                            <div className="text-sm text-muted-foreground line-clamp-2 mt-2 prose-sm prose-stone dark:prose-invert">
                                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                    {formatMarkdown(update.summary)}
                                                </ReactMarkdown>
                                            </div>
                                        </CardHeader>
                                        <CardFooter className="pt-0">
                                            <Button
                                                className="w-full"
                                                variant="secondary"
                                                size="sm"
                                                onClick={() => setSelectedUpdate(update)}
                                            >
                                                Ver Detalhes
                                            </Button>
                                        </CardFooter>
                                    </Card>
                                </motion.div>
                            )
                        })}
                    </div>
                </div>
            )}

            {/* Floating Destaques Section (Bottom Right) */}
            {featuredUpdates.length > 0 && (
                <div className="fixed bottom-10 right-10 z-[100] scale-[0.7] transform-gpu transition-all hover:scale-[0.8] origin-bottom-right pointer-events-none hover:rotate-2">
                    <div className="pointer-events-auto cursor-pointer flex flex-col items-center group">
                        <div className="mb-4 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 backdrop-blur-sm px-3 py-1 rounded-full text-[10px] font-bold border border-muted text-muted-foreground uppercase tracking-widest">
                            Novidades Recentes
                        </div>
                        <DisplayCards
                            cards={featuredUpdates.map((update, index) => {
                                const colors = getColorClasses(update.theme_color)
                                return {
                                    title: update.title,
                                    description: update.summary,
                                    date: update.version,
                                    className: stackStyles[index]?.className || stackStyles[stackStyles.length - 1].className,
                                    icon: <Sparkles className={cn("size-4", colors.icon)} />,
                                    titleClassName: colors.title,
                                    iconBgClassName: colors.iconBg,
                                    onClick: () => setSelectedUpdate(update)
                                }
                            })}
                        />
                    </div>
                </div>
            )}

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
