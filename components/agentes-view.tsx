"use client"

import { useState, useEffect, useRef } from "react"
import { listRecipes, getRecipe, getModuleContent, syncWithGithub, Recipe } from "@/lib/actions/prompt-actions"
import { Badge } from "@/components/ui/badge"
import { Loader2, ChevronRight, Github, Sparkles, User, FileText, Layers } from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"

export function AgentesView() {
    const [recipes, setRecipes] = useState<string[]>([])
    const [selectedRecipeName, setSelectedRecipeName] = useState<string | null>(null)
    const [recipe, setRecipe] = useState<Recipe | null>(null)
    const [selectedModule, setSelectedModule] = useState<{ path: string, title?: string } | null>(null)
    const [moduleContent, setModuleContent] = useState<string>("")
    const [loading, setLoading] = useState(false)
    const [syncing, setSyncing] = useState(true)

    const initialized = useRef(false)

    useEffect(() => {
        if (initialized.current) return
        initialized.current = true

        const performInitialSync = async () => {
            try {
                // 1. Initial load from local cache/disk
                const list = await listRecipes()
                if (list && list.length > 0) {
                    setRecipes(list)
                    if (list.includes("renata_v2.yaml")) {
                        handleSelectRecipe("renata_v2.yaml")
                    } else {
                        handleSelectRecipe(list[0])
                    }
                }

                // 2. Background sync
                setSyncing(true)
                const syncResult = await syncWithGithub()

                // 3. Optional reload if sync succeeded
                if (syncResult && syncResult.success) {
                    const updatedList = await listRecipes()
                    setRecipes(updatedList)
                    // If nothing was selected yet, select now
                    if (!selectedRecipeName && updatedList.length > 0) {
                        handleSelectRecipe(updatedList[0])
                    }
                }
            } catch (error) {
                console.error("Critical error during initial load:", error)
            } finally {
                setSyncing(false)
            }
        }

        performInitialSync()
    }, [])

    const handleSelectRecipe = async (name: string) => {
        setLoading(true)
        setSelectedRecipeName(name)
        const data = await getRecipe(name)
        setRecipe(data)
        if (data && data.components.length > 0) {
            handleSelectModule(data.components[0])
        }
        setLoading(false)
    }

    const handleSelectModule = async (mod: { path: string, title?: string }) => {
        setSelectedModule(mod)
        setModuleContent("Carregando conteúdo...")
        const content = await getModuleContent(mod.path)
        setModuleContent(content)
    }

    // Grouping components by title
    const groupedModules = recipe?.components.reduce((acc, comp) => {
        const title = comp.title || "Sistema"
        if (!acc[title]) acc[title] = []
        acc[title].push(comp)
        return acc
    }, {} as Record<string, Recipe['components']>)

    return (
        <div className="relative h-full w-full overflow-hidden">
            <motion.div
                initial={{ opacity: 0, filter: "blur(15px)" }}
                animate={{ opacity: 1, filter: "blur(0px)" }}
                transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-col h-full mx-auto"
            >
                {/* Header Area - Clean & Integrated */}
                <div className="flex flex-col gap-1 px-8 py-6 border-b border-white/[0.04] bg-zinc-950/20 backdrop-blur-sm">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <div className="flex items-center gap-3">
                                <Sparkles className="h-5 w-5 text-primary/70" />
                                <h1 className="text-2xl font-bold tracking-tight text-white uppercase tracking-[0.1em]">
                                    Gestão de Agentes
                                </h1>
                            </div>
                            <p className="text-muted-foreground text-xs font-medium pl-8">
                                Modelagem e refinamento da inteligência artificial Alltech.
                            </p>
                        </div>

                        <AnimatePresence>
                            {syncing && (
                                <motion.div
                                    initial={{ opacity: 0, x: 10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 10 }}
                                    className="px-3 py-1 rounded-full bg-zinc-900/50 border border-white/5 flex items-center gap-2"
                                >
                                    <Loader2 className="h-3 w-3 text-primary animate-spin" />
                                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Sincronizando</span>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Seamless 3-Column Grid Layout */}
                <div className="flex flex-1 overflow-hidden">

                    {/* Left Column - Agentes Selection (Integrated Background) */}
                    <div className="w-64 bg-zinc-950/40 border-r border-white/5 flex flex-col overflow-hidden">
                        <div className="p-6 space-y-6">
                            <h3 className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em]">Seleção</h3>
                            <div className="space-y-1.5">
                                {recipes.map((r) => (
                                    <button
                                        key={r}
                                        onClick={() => handleSelectRecipe(r)}
                                        className={cn(
                                            "w-full group flex items-center gap-3 p-3 rounded-xl transition-all duration-300",
                                            selectedRecipeName === r
                                                ? "bg-white/5 text-white ring-1 ring-white/10"
                                                : "text-zinc-500 hover:text-zinc-300"
                                        )}
                                    >
                                        <div className={cn(
                                            "h-1 w-1 rounded-full transition-all duration-500",
                                            selectedRecipeName === r ? "bg-primary shadow-[0_0_8px_rgba(var(--primary-rgb),0.6)]" : "bg-zinc-800"
                                        )} />
                                        <span className="font-bold text-[10px] tracking-widest uppercase truncate transition-all duration-300 group-hover:pl-0.5">
                                            {r.replace(".yaml", "").replace("_", " ")}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Center Column - Main Prompt Content (Seamless) */}
                    <div className="flex-1 flex flex-col bg-zinc-950/20 overflow-hidden">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center h-full gap-4 text-zinc-700">
                                <Loader2 className="h-10 w-10 animate-spin text-primary/30" />
                                <span className="text-[10px] font-black tracking-[0.5em] uppercase opacity-40">Processando Inteligência</span>
                            </div>
                        ) : recipe ? (
                            <>
                                {/* Header of Content section */}
                                <div className="px-16 py-10 border-b border-white/[0.03] bg-white/[0.01]">
                                    <div className="max-w-[800px] mx-auto flex items-end justify-between">
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-4">
                                                <h2 className="text-3xl font-bold text-white tracking-tight">{selectedModule?.title || "Documentação"}</h2>
                                                <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest border-zinc-800 text-zinc-600 px-2 py-0">
                                                    PROMPT
                                                </Badge>
                                            </div>
                                            <div className="flex items-center gap-2 text-zinc-600 font-mono text-[10px] tracking-tight uppercase">
                                                <FileText className="h-3 w-3" />
                                                {selectedModule?.path}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Seamless Reading Area */}
                                <ScrollArea className="flex-1">
                                    <div className="max-w-[900px] mx-auto px-16 py-16">
                                        <div className="prose prose-zinc prose-invert max-w-none 
                                            prose-headings:text-white prose-headings:font-bold prose-headings:tracking-tight
                                            prose-p:text-zinc-400 prose-p:leading-relaxed prose-p:text-[1.1rem]
                                            prose-li:text-zinc-400 prose-li:leading-relaxed prose-li:text-[1rem]
                                            prose-strong:text-zinc-100 prose-strong:font-bold
                                            prose-code:text-primary prose-code:bg-primary/5 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none
                                            prose-hr:border-white/[0.04] prose-blockquote:border-primary prose-blockquote:text-zinc-300
                                            prose-img:rounded-[2rem] prose-img:border prose-img:border-white/5
                                            selection:bg-primary/20 selection:text-white">
                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                {moduleContent}
                                            </ReactMarkdown>
                                        </div>
                                        <div className="h-40" />
                                    </div>
                                </ScrollArea>
                            </>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-zinc-800 gap-6">
                                <div className="relative">
                                    <Sparkles className="h-16 w-16 opacity-10" />
                                    <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
                                </div>
                                <span className="text-xs font-black tracking-[0.4em] uppercase opacity-20">Aguardando Seleção de Agente</span>
                            </div>
                        )}
                    </div>

                    {/* Right Column - Structure Navigation (Seamless Contrast) */}
                    <div className="w-80 bg-zinc-950/40 border-l border-white/5 flex flex-col overflow-hidden">
                        <div className="p-6 border-b border-white/[0.04] bg-white/[0.01]">
                            <div className="flex items-center gap-3">
                                <Layers className="h-3.5 w-3.5 text-zinc-500" />
                                <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Estrutura</h3>
                            </div>
                        </div>
                        <ScrollArea className="flex-1">
                            <div className="p-4 space-y-8">
                                {groupedModules && Object.entries(groupedModules).map(([title, components], groupIdx) => (
                                    <div key={groupIdx} className="space-y-4">
                                        <div className="flex items-center gap-2 px-2">
                                            <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">{title}</span>
                                            <div className="h-[1px] flex-1 bg-white/[0.02]" />
                                        </div>
                                        <div className="space-y-0.5">
                                            {components.map((comp, idx) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => handleSelectModule(comp)}
                                                    className={cn(
                                                        "w-full flex items-center gap-3 p-2.5 rounded-xl text-xs transition-all text-left group",
                                                        selectedModule?.path === comp.path
                                                            ? "bg-primary/5 text-primary border border-primary/20"
                                                            : "text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.02] border border-transparent"
                                                    )}
                                                >
                                                    <div className={cn(
                                                        "h-1.5 w-1.5 rounded-full",
                                                        selectedModule?.path === comp.path ? "bg-primary" : "bg-zinc-800 group-hover:bg-zinc-700"
                                                    )} />
                                                    <span className="truncate flex-1 tracking-tight text-[11px] font-medium">
                                                        {comp.path.split('/').pop()}
                                                    </span>
                                                    <ChevronRight className={cn(
                                                        "h-3 w-3 transition-transform duration-300",
                                                        selectedModule?.path === comp.path ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2 group-hover:opacity-40"
                                                    )} />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="h-20" />
                        </ScrollArea>
                    </div>

                </div>
            </motion.div>
        </div>
    )
}
