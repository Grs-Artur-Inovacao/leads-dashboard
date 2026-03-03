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

            {/* Rodapé / Indicador de Página */}
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-50">
                {/* Dots / Navegação */}
                <div className="flex items-center gap-4 bg-white/5 backdrop-blur-md px-4 py-3 rounded-full border border-white/10">
                    {children.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => scrollToPage(index)}
                            className={cn(
                                "w-2.5 h-2.5 rounded-full transition-all duration-500 relative bg-white/10 overflow-hidden",
                                activeIndex === index ? "w-8" : "hover:bg-white/30"
                            )}
                            aria-label={`Ir para página ${index + 1}`}
                        >
                            {activeIndex === index && (
                                <motion.div
                                    key={activeIndex}
                                    layoutId="indicator"
                                    className="absolute inset-0 bg-white"
                                    initial={{ scaleX: 0 }}
                                    animate={{ scaleX: 1 }}
                                    transition={{
                                        duration: (autoPlayInterval / 1000),
                                        ease: "linear"
                                    }}
                                    style={{ originX: 0 }}
                                />
                            )}
                        </button>
                    ))}
                </div>
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
