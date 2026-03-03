"use client";

import React from "react";
import { motion } from "framer-motion";
import {
    Activity,
    TrendingUp,
    Zap,
    Globe,
    ShieldCheck,
    Cpu,
    BarChart3,
    MousePointer2
} from "lucide-react";

export function FakeDashboard() {
    return (
        <div className="w-full h-full bg-[#030712] text-white p-8 flex flex-col relative overflow-hidden font-sans">
            {/* Background Orbs */}
            <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none" />

            {/* Header */}
            <div className="flex justify-between items-center mb-12 relative z-10">
                <div>
                    <h2 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
                        ALLCONNECT <span className="text-white/20">NEXT GEN</span>
                    </h2>
                    <p className="text-zinc-500 text-sm mt-1 flex items-center gap-2">
                        <Activity className="w-3 h-3 text-emerald-500" />
                        SISTEMA OPERACIONAL ATIVO • LATÊNCIA 12MS
                    </p>
                </div>

                <div className="flex gap-4">
                    <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-full flex items-center gap-2 backdrop-blur-md">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-xs font-medium">LIVE DATA</span>
                    </div>
                    <div className="px-4 py-2 bg-blue-600 rounded-full flex items-center gap-2 shadow-[0_0_20px_rgba(37,99,235,0.4)]">
                        <ShieldCheck className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase tracking-wider">Modo Ultra</span>
                    </div>
                </div>
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-12 gap-6 flex-1 relative z-10">

                {/* Left Column: Big Stats */}
                <div className="col-span-4 flex flex-col gap-6">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="flex-1 bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-xl group hover:bg-white/10 transition-all duration-500"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-400">
                                <TrendingUp className="w-6 h-6" />
                            </div>
                            <span className="text-emerald-500 text-xs font-bold">+24.8% EXPO</span>
                        </div>
                        <h3 className="text-zinc-400 text-sm font-medium uppercase tracking-widest">Leads em Tempo Real</h3>
                        <div className="text-6xl font-black mt-2 tabular-nums">1.482</div>
                        <div className="w-full h-2 bg-white/5 rounded-full mt-6 overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: "75%" }}
                                transition={{ duration: 1.5, delay: 0.5 }}
                                className="h-full bg-gradient-to-r from-blue-500 to-cyan-400"
                            />
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                        className="flex-1 bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-xl group hover:bg-white/10 transition-all duration-500"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-purple-500/10 rounded-2xl text-purple-400">
                                <Zap className="w-6 h-6" />
                            </div>
                            <div className="flex -space-x-2">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="w-6 h-6 rounded-full border-2 border-[#030712] bg-zinc-800 flex items-center justify-center text-[10px] font-bold">
                                        {String.fromCharCode(64 + i)}
                                    </div>
                                ))}
                            </div>
                        </div>
                        <h3 className="text-zinc-400 text-sm font-medium uppercase tracking-widest">Conversão Viral</h3>
                        <div className="text-6xl font-black mt-2 tabular-nums">42.5<span className="text-2xl text-zinc-500">%</span></div>
                        <p className="text-zinc-500 text-xs mt-4">Calculado via algoritmos de IA preditiva AllConnect.</p>
                    </motion.div>
                </div>

                {/* Center Column: Visualizations */}
                <div className="col-span-8 grid grid-cols-2 gap-6">

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.4 }}
                        className="col-span-2 bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-3xl p-8 backdrop-blur-xl overflow-hidden relative"
                    >
                        <div className="absolute top-0 right-0 p-8 opacity-10">
                            <Cpu className="w-32 h-32" />
                        </div>

                        <div className="relative z-10 flex flex-col h-full">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center shadow-lg">
                                    <Globe className="w-6 h-6" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-xl">Alcance Global Escalável</h4>
                                    <p className="text-zinc-500 text-sm">Distribuição de leads por região geográfica (Fictício)</p>
                                </div>
                            </div>

                            <div className="flex-1 flex items-end gap-3 mt-4">
                                {[40, 70, 45, 90, 65, 80, 50, 95, 60, 85, 40, 75].map((h, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ height: 0 }}
                                        animate={{ height: `${h}%` }}
                                        transition={{ duration: 1, delay: 0.6 + (i * 0.05) }}
                                        className="flex-1 bg-gradient-to-t from-blue-600 to-purple-400 rounded-t-lg relative group"
                                    >
                                        <div className="absolute top-[-30px] left-1/2 -translate-x-1/2 bg-white text-black text-[10px] font-bold px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                            {h}k
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                            <div className="flex justify-between mt-4 text-[10px] font-bold text-zinc-600 uppercase tracking-widest">
                                <span>Jan</span>
                                <span>Fev</span>
                                <span>Mar</span>
                                <span>Abr</span>
                                <span>Mai</span>
                                <span>Jun</span>
                                <span>Jul</span>
                                <span>Ago</span>
                                <span>Set</span>
                                <span>Out</span>
                                <span>Nov</span>
                                <span>Dez</span>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-xl"
                    >
                        <div className="flex items-center gap-3 mb-6">
                            <BarChart3 className="w-5 h-5 text-blue-400" />
                            <h4 className="font-bold text-sm uppercase tracking-widest">Retenção Médio</h4>
                        </div>
                        <div className="flex items-center justify-center py-4">
                            <div className="relative w-32 h-32">
                                <svg className="w-full h-full transform -rotate-90">
                                    <circle
                                        cx="64"
                                        cy="64"
                                        r="58"
                                        stroke="currentColor"
                                        strokeWidth="8"
                                        fill="transparent"
                                        className="text-white/5"
                                    />
                                    <motion.circle
                                        cx="64"
                                        cy="64"
                                        r="58"
                                        stroke="currentColor"
                                        strokeWidth="8"
                                        fill="transparent"
                                        strokeDasharray="364.4"
                                        initial={{ strokeDashoffset: 364.4 }}
                                        animate={{ strokeDashoffset: 364.4 * 0.12 }}
                                        transition={{ duration: 2, ease: "easeOut" }}
                                        className="text-blue-500"
                                        strokeLinecap="round"
                                    />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-2xl font-black tabular-nums">88%</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                        className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-xl group cursor-pointer"
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <MousePointer2 className="w-5 h-5 text-purple-400" />
                            <h4 className="font-bold text-sm uppercase tracking-widest">Clique Sugerido</h4>
                        </div>
                        <div className="p-4 bg-white/5 rounded-2xl border border-white/5 group-hover:border-purple-500/50 transition-colors">
                            <p className="text-xs text-zinc-400 leading-relaxed">
                                Nossa IA identificou um padrão de comportamento favorável para expansão em <span className="text-white font-bold">Campanhas de Google Ads V4</span>.
                            </p>
                            <button className="w-full mt-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl text-[10px] font-black uppercase tracking-tighter">
                                Otimizar Agora
                            </button>
                        </div>
                    </motion.div>

                </div>
            </div>

            {/* Footer / Hint */}
            <div className="mt-8 flex justify-center opacity-50 relative z-10">
                <div className="flex flex-col items-center gap-2">
                    <div className="w-px h-12 bg-gradient-to-b from-transparent via-white/50 to-transparent" />
                    <span className="text-[10px] font-bold tracking-[0.3em] uppercase">Visualização Conceitual AllConnect v3.0</span>
                </div>
            </div>
        </div>
    );
}
