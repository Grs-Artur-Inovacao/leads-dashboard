"use client";

import React, { useRef, useState, useEffect } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp } from "lucide-react";

interface ScrollAdventureProps {
    children: React.ReactNode[];
    className?: string;
    pageLabels?: string[];
    autoPlayInterval?: number; // em milissegundos
}

export default function ScrollAdventure({ children, className, pageLabels, autoPlayInterval = 5000 }: ScrollAdventureProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [activeIndex, setActiveIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);

    const handleScroll = () => {
        if (!containerRef.current) return;
        const { scrollTop, clientHeight } = containerRef.current;
        const index = Math.round(scrollTop / (clientHeight || 1));
        if (index !== activeIndex && !isNaN(index)) {
            setActiveIndex(index);
        }
    };

    const scrollToPage = (index: number) => {
        if (!containerRef.current) return;
        containerRef.current.scrollTo({
            top: index * containerRef.current.clientHeight,
            behavior: "smooth",
        });
    };

    // Auto-rotação
    useEffect(() => {
        if (!autoPlayInterval || children.length <= 1 || isPaused) return;

        const interval = setInterval(() => {
            const nextIndex = (activeIndex + 1) % children.length;
            scrollToPage(nextIndex);
        }, autoPlayInterval);

        return () => clearInterval(interval);
    }, [activeIndex, children.length, autoPlayInterval, isPaused]);

    return (
        <div
            className="relative w-full h-screen overflow-hidden group"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
        >
            <div
                ref={containerRef}
                onScroll={handleScroll}
                className={cn("w-full h-full overflow-y-auto snap-y snap-mandatory no-scrollbar scroll-smooth", className)}
            >
                {children.map((child, index) => (
                    <section
                        key={index}
                        className="w-full h-screen snap-start snap-always relative overflow-hidden"
                    >
                        {child}
                    </section>
                ))}
            </div>

            {/* Indicador de Página (Barra de Progresso Superior) — Somente Desktop */}
            <div className="absolute top-0 left-0 right-0 z-50 hidden md:flex h-1 gap-1 px-1">
                {children.map((_, index) => (
                    <div
                        key={index}
                        className="flex-1 overflow-hidden rounded-full bg-white/5 backdrop-blur-md cursor-pointer group/bar h-full"
                        onClick={() => scrollToPage(index)}
                    >
                        <div className="absolute inset-0 bg-white/10 group-hover/bar:bg-white/20 transition-colors" />
                        {activeIndex === index && (
                            <motion.div
                                key={activeIndex}
                                layoutId="indicator"
                                className="h-full bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]"
                                initial={{ scaleX: 0 }}
                                animate={{ scaleX: 1 }}
                                transition={{
                                    duration: (autoPlayInterval / 1000),
                                    ease: "linear"
                                }}
                                style={{ originX: 0 }}
                            />
                        )}
                        {/* Label flutuante ao passar o mouse */}
                        {pageLabels && pageLabels[index] && (
                            <div className="absolute top-3 left-1/2 -translate-x-1/2 opacity-0 group-hover/bar:opacity-100 transition-opacity whitespace-nowrap">
                                <span className="bg-zinc-900/90 text-[10px] font-black uppercase tracking-widest text-white px-3 py-1 rounded-full border border-white/10">
                                    {pageLabels[index]}
                                </span>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <div
                ref={containerRef}
                onScroll={handleScroll}
                className={cn("w-full h-full overflow-y-auto snap-y snap-mandatory no-scrollbar scroll-smooth", className)}
            >
                {children.map((child, index) => (
                    <section
                        key={index}
                        className="w-full h-screen snap-start snap-always relative overflow-hidden"
                    >
                        {child}
                    </section>
                ))}
            </div>
        </div>
    );
}

export function ScrollPage({ children, className, index }: { children: React.ReactNode, className?: string, index: number }) {
    const ref = useRef(null);
    const isInView = useInView(ref, { amount: 0.3 });

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 50 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className={cn("w-full h-full flex flex-col", className)}
        >
            {children}
        </motion.div>
    );
}
