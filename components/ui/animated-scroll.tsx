"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

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
    const isScrollingRef = useRef(false);
    const wheelCooldownRef = useRef(false);

    const scrollToPage = useCallback((index: number) => {
        if (!containerRef.current || isScrollingRef.current) return;
        isScrollingRef.current = true;
        containerRef.current.scrollTo({
            top: index * containerRef.current.clientHeight,
            behavior: "smooth",
        });
        setActiveIndex(index);
        // Liberar scroll após a animação terminar
        setTimeout(() => {
            isScrollingRef.current = false;
        }, 600);
    }, []);

    // Wheel handler para troca de página com scroll mínimo
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const handleWheel = (e: WheelEvent) => {
            e.preventDefault();
            if (wheelCooldownRef.current || isScrollingRef.current) return;

            // Qualquer scroll mínimo (deltaY > 5) já troca a página
            if (Math.abs(e.deltaY) > 5) {
                wheelCooldownRef.current = true;
                const direction = e.deltaY > 0 ? 1 : -1;
                const nextIndex = Math.max(0, Math.min(children.length - 1, activeIndex + direction));

                if (nextIndex !== activeIndex) {
                    scrollToPage(nextIndex);
                }

                // Cooldown para evitar múltiplos triggers
                setTimeout(() => {
                    wheelCooldownRef.current = false;
                }, 800);
            }
        };

        container.addEventListener("wheel", handleWheel, { passive: false });
        return () => container.removeEventListener("wheel", handleWheel);
    }, [activeIndex, children.length, scrollToPage]);

    // Auto-rotação estável com 30s
    useEffect(() => {
        if (!autoPlayInterval || children.length <= 1 || isPaused) return;

        const interval = setInterval(() => {
            const nextIndex = (activeIndex + 1) % children.length;
            scrollToPage(nextIndex);
        }, autoPlayInterval);

        return () => clearInterval(interval);
    }, [activeIndex, children.length, autoPlayInterval, isPaused, scrollToPage]);

    // Pausar auto-play quando a aba está em background
    useEffect(() => {
        const handleVisibility = () => {
            if (document.hidden) {
                setIsPaused(true);
            } else {
                setIsPaused(false);
            }
        };
        document.addEventListener("visibilitychange", handleVisibility);
        return () => document.removeEventListener("visibilitychange", handleVisibility);
    }, []);

    return (
        <div
            className="relative w-full h-full overflow-hidden group"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
        >
            {/* Container único de scroll */}
            <div
                ref={containerRef}
                className={cn("w-full h-full overflow-hidden snap-y snap-mandatory no-scrollbar", className)}
            >
                {children.map((child, index) => (
                    <section
                        key={index}
                        className="w-full h-full snap-start snap-always relative overflow-hidden"
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
                        className="flex-1 overflow-hidden rounded-full bg-white/5 backdrop-blur-md cursor-pointer group/bar h-full relative"
                        onClick={() => scrollToPage(index)}
                    >
                        <div className="absolute inset-0 bg-white/10 group-hover/bar:bg-white/20 transition-colors" />
                        {activeIndex === index && (
                            <motion.div
                                key={`progress-${activeIndex}`}
                                className="h-full bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)] relative z-10"
                                initial={{ scaleX: 0 }}
                                animate={{ scaleX: isPaused ? undefined : 1 }}
                                transition={{
                                    duration: isPaused ? 0 : (autoPlayInterval / 1000),
                                    ease: "linear"
                                }}
                                style={{ originX: 0 }}
                            />
                        )}
                        {/* Label flutuante ao passar o mouse */}
                        {pageLabels && pageLabels[index] && (
                            <div className="absolute top-3 left-1/2 -translate-x-1/2 opacity-0 group-hover/bar:opacity-100 transition-opacity whitespace-nowrap z-20">
                                <span className="bg-zinc-900/90 text-[10px] font-black uppercase tracking-widest text-white px-3 py-1 rounded-full border border-white/10">
                                    {pageLabels[index]}
                                </span>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

export function ScrollPage({ children, className, index }: { children: React.ReactNode, className?: string, index: number }) {
    return (
        <div
            className={cn("w-full h-full flex flex-col", className)}
        >
            {children}
        </div>
    );
}
