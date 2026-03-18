"use client"

import { useState, useEffect, useRef } from "react"
import { listRecipes, getRecipe, getModuleContent, syncWithGithub, Recipe } from "@/lib/actions/prompt-actions"
import { Badge } from "@/components/ui/badge"
import { Loader2, ChevronRight, Sparkles, FileText, Layers, Users } from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"

type MobileTab = 'selecao' | 'conteudo' | 'estrutura'

export function AgentesView() {
    const [recipes, setRecipes] = useState<string[]>([])
    const [selectedRecipeName, setSelectedRecipeName] = useState<string | null>(null)
    const [recipe, setRecipe] = useState<Recipe | null>(null)
    const [selectedModule, setSelectedModule] = useState<{ path: string, title?: string } | null>(null)
    const [moduleContent, setModuleContent] = useState<string>("")
    const [loading, setLoading] = useState(false)
    const [syncing, setSyncing] = useState(true)
    const [mobileTab, setMobileTab] = useState<MobileTab>('selecao')

    const initialized = useRef(false)

    useEffect(() => {
        if (initialized.current) return
        initialized.current = true

        const performInitialSync = async () => {
            try {
                const list = await listRecipes()
                if (list && list.length > 0) {
                    setRecipes(list)
                    if (list.includes("renata_v2.yaml")) {
                        handleSelectRecipe("renata_v2.yaml", false)
                    } else {
                        handleSelectRecipe(list[0], false)
                    }
                }

                setSyncing(true)
                const syncResult = await syncWithGithub()

                if (syncResult && syncResult.success) {
                    const updatedList = await listRecipes()
                    setRecipes(updatedList)
                    if (!selectedRecipeName && updatedList.length > 0) {
                        handleSelectRecipe(updatedList[0], false)
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

    const handleSelectRecipe = async (name: string, autoTab = true) => {
        setLoading(true)
        setSelectedRecipeName(name)
        const data = await getRecipe(name)
        setRecipe(data)
        if (data && data.components.length > 0) {
            handleSelectModule(data.components[0], false)
        }
        setLoading(false)
        if (autoTab) setMobileTab('conteudo')
    }

    const handleSelectModule = async (mod: { path: string, title?: string }, autoTab = true) => {
        setSelectedModule(mod)
        setModuleContent("Carregando conteúdo...")
        const content = await getModuleContent(mod.path)
        setModuleContent(content)
        if (autoTab) setMobileTab('conteudo')
    }

    const groupedModules = recipe?.components.reduce((acc, comp) => {
        const title = comp.title || "Sistema"
        if (!acc[title]) acc[title] = []
        acc[title].push(comp)
        return acc
    }, {} as Record<string, Recipe['components']>)

    const mobileTabs = [
        { id: 'selecao' as MobileTab, label: 'Agentes', icon: Users },
        { id: 'conteudo' as MobileTab, label: 'Conteúdo', icon: FileText },
        { id: 'estrutura' as MobileTab, label: 'Estrutura', icon: Layers },
    ]

    const [searchTerm, setSearchTerm] = useState("")

    const filteredRecipes = recipes.filter(r =>
        r.toLowerCase().includes(searchTerm.toLowerCase())
    )

    // --- Painel: Seleção de Agentes ---
    const PanelSelecao = () => (
        <div className="p-4 md:p-6 space-y-6">
            <div className="space-y-4">
                <h3 className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em] px-1">Library</h3>

                {/* Search Bar — Desktop Only */}
                <div className="hidden md:block relative group">
                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                        <Users className="h-3 w-3 text-zinc-500 group-focus-within:text-primary transition-colors" />
                    </div>
                    <input
                        type="text"
                        placeholder="Pesquisar agente..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-white/[0.03] border border-white/[0.05] rounded-xl py-2 pl-9 pr-4 text-[10px] font-bold uppercase tracking-wider text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-primary/40 focus:bg-white/[0.06] transition-all"
                    />
                </div>
            </div>

            <div className="space-y-1.5 px-0.5">
                {filteredRecipes.map((r) => (
                    <button
                        key={r}
                        onClick={() => handleSelectRecipe(r)}
                        className={cn(
                            "w-full group flex items-center gap-3 p-3 rounded-2xl transition-all duration-300 border border-transparent",
                            selectedRecipeName === r
                                ? "bg-white/[0.06] text-white border-white/[0.08] shadow-2xl shadow-primary/5"
                                : "text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.02]"
                        )}
                    >
                        <div className={cn(
                            "h-1.5 w-1.5 rounded-full flex-shrink-0 transition-all duration-500",
                            selectedRecipeName === r ? "bg-primary shadow-[0_0_10px_rgba(59,130,246,0.8)]" : "bg-zinc-800 group-hover:bg-zinc-600"
                        )} />
                        <span className="font-bold text-[11px] tracking-widest uppercase truncate">
                            {r.replace(".yaml", "").replace(/_/g, " ")}
                        </span>
                    </button>
                ))}

                {filteredRecipes.length === 0 && (
                    <div className="py-10 text-center">
                        <p className="text-[10px] font-bold text-zinc-700 uppercase tracking-[0.2em]">Nenhum agente</p>
                    </div>
                )}
            </div>
        </div>
    )

    // --- Painel: Estrutura de Módulos ---
    const PanelEstrutura = () => (
        <>
            <div className="p-4 md:p-6 border-b border-white/[0.04] bg-white/[0.01]">
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
                                            "h-1.5 w-1.5 rounded-full flex-shrink-0",
                                            selectedModule?.path === comp.path ? "bg-primary" : "bg-zinc-800 group-hover:bg-zinc-700"
                                        )} />
                                        <span className="truncate flex-1 tracking-tight text-[11px] font-medium">
                                            {comp.path.split('/').pop()}
                                        </span>
                                        <ChevronRight className={cn(
                                            "h-3 w-3 flex-shrink-0 transition-transform duration-300",
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
        </>
    )

    // --- Painel: Conteúdo Markdown ---
    const PanelConteudo = () => (
        loading ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-zinc-700">
                <Loader2 className="h-10 w-10 animate-spin text-primary/30" />
                <span className="text-[10px] font-black tracking-[0.5em] uppercase opacity-40">Processando</span>
            </div>
        ) : recipe ? (
            <>
                <div className="px-4 md:px-16 py-5 md:py-10 border-b border-white/[0.03] bg-white/[0.01]">
                    <div className="max-w-[800px] mx-auto space-y-2">
                        <div className="flex items-center gap-3 flex-wrap">
                            <h2 className="text-xl md:text-3xl font-bold text-white tracking-tight">{selectedModule?.title || "Documentação"}</h2>
                            <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest border-zinc-800 text-zinc-600 px-2 py-0">
                                PROMPT
                            </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-zinc-600 font-mono text-[10px] tracking-tight uppercase">
                            <FileText className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">{selectedModule?.path}</span>
                        </div>
                    </div>
                </div>

                <ScrollArea className="flex-1">
                    <div className="max-w-[900px] mx-auto px-4 md:px-16 py-8 md:py-16">
                        <div className="prose prose-zinc prose-invert max-w-none
                            prose-headings:text-white prose-headings:font-bold prose-headings:tracking-tight
                            prose-p:text-zinc-400 prose-p:leading-relaxed prose-p:text-base md:prose-p:text-[1.1rem]
                            prose-li:text-zinc-400 prose-li:leading-relaxed
                            prose-strong:text-zinc-100 prose-strong:font-bold
                            prose-code:text-primary prose-code:bg-primary/5 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none
                            prose-hr:border-white/[0.04] prose-blockquote:border-primary prose-blockquote:text-zinc-300
                            selection:bg-primary/20 selection:text-white">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {moduleContent}
                            </ReactMarkdown>
                        </div>
                        <div className="h-20" />
                    </div>
                </ScrollArea>
            </>
        ) : (
            <div className="flex flex-col items-center justify-center h-full text-zinc-800 gap-6">
                <div className="relative">
                    <Sparkles className="h-16 w-16 opacity-10" />
                    <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
                </div>
                <span className="text-xs font-black tracking-[0.3em] uppercase opacity-20 text-center px-8">Selecione um Agente</span>
            </div>
        )
    )

    return (
        <div className="relative h-[calc(100vh-4rem)] md:h-full w-full overflow-hidden bg-[#020202]">
            {/* Background Ambient Glow */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/5 blur-[120px] rounded-full pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-col h-full mx-auto relative z-10"
            >
                {/* Header */}
                <div className="flex flex-col gap-1 px-4 md:px-10 py-5 md:py-8 border-b border-white/[0.05] bg-zinc-950/40 backdrop-blur-md">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <h1 className="text-xl md:text-3xl font-bold tracking-tight text-white uppercase tracking-[0.12em] bg-gradient-to-r from-white to-zinc-500 bg-clip-text text-transparent">
                                Gestão de Agentes
                            </h1>
                            <p className="text-muted-foreground text-xs font-semibold hidden md:block uppercase tracking-widest opacity-60">
                                Modelagem e refinamento da inteligência artificial Alltech.
                            </p>
                        </div>

                        <AnimatePresence>
                            {syncing && (
                                <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    className="px-4 py-1.5 rounded-full bg-zinc-900/60 border border-white/10 flex items-center gap-2.5 shadow-xl"
                                >
                                    <Loader2 className="h-3.5 w-3.5 text-primary animate-spin" />
                                    <span className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] hidden sm:inline">Syncing GitHub</span>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Mobile Tabs */}
                    <div className="flex md:hidden mt-5 bg-zinc-900/80 rounded-2xl p-1 gap-1 border border-white/5">
                        {mobileTabs.map(({ id, label, icon: Icon }) => (
                            <button
                                key={id}
                                onClick={() => setMobileTab(id)}
                                className={cn(
                                    "flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300",
                                    mobileTab === id
                                        ? "bg-white/10 text-white shadow-lg ring-1 ring-white/10"
                                        : "text-zinc-500 hover:text-zinc-400"
                                )}
                            >
                                <Icon className="h-3.5 w-3.5" />
                                {label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex flex-1 overflow-hidden">

                    {/* === MOBILE VIEW === */}
                    <div className="flex md:hidden flex-1 flex-col overflow-hidden">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={mobileTab}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.3, ease: "circOut" }}
                                className="flex flex-col flex-1 overflow-hidden"
                            >
                                {mobileTab === 'selecao' && (
                                    <ScrollArea className="flex-1">
                                        <PanelSelecao />
                                    </ScrollArea>
                                )}
                                {mobileTab === 'conteudo' && <PanelConteudo />}
                                {mobileTab === 'estrutura' && (
                                    <div className="flex flex-col flex-1 overflow-hidden">
                                        <PanelEstrutura />
                                    </div>
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* === DESKTOP VIEW: 3 Panels === */}
                    <div className="hidden md:flex flex-1 overflow-hidden">

                        {/* Panel 1: Agent Selection */}
                        <div className="w-72 bg-black/20 border-r border-white/5 flex flex-col overflow-hidden">
                            <div className="p-8 pb-4">
                                <h3 className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em] mb-6">Database</h3>
                            </div>
                            <ScrollArea className="flex-1">
                                <div className="px-5 pb-10">
                                    <PanelSelecao />
                                </div>
                            </ScrollArea>
                        </div>

                        {/* Panel 2: Document Content */}
                        <div className="flex-1 flex flex-col bg-zinc-950/20 relative overflow-hidden">
                            {/* Subtle pattern background */}
                            <div className="absolute inset-0 opacity-[0.02] pointer-events-none"
                                style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '30px 30px' }} />

                            <div className="relative z-10 flex flex-col h-full">
                                <PanelConteudo />
                            </div>
                        </div>

                        {/* Panel 3: Component Structure */}
                        <div className="w-80 bg-black/20 border-l border-white/5 flex flex-col overflow-hidden">
                            <div className="p-8 pb-0">
                                <div className="flex items-center gap-3">
                                    <Layers className="h-4 w-4 text-primary opacity-50" />
                                    <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em]">System Map</h3>
                                </div>
                            </div>
                            <PanelEstrutura />
                        </div>
                    </div>

                </div>
            </motion.div>
        </div>
    )
}
