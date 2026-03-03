"use client";

import React, { useRef, useState } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp } from "lucide-react";

interface ScrollAdventureProps {
    children: React.ReactNode[];
    className?: string;
    pageLabels?: string[];
}

export default function ScrollAdventure({ children, className, pageLabels }: ScrollAdventureProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [activeIndex, setActiveIndex] = useState(0);

    const handleScroll = () => {
        if (!containerRef.current) return;
        const { scrollTop, clientHeight } = containerRef.current;
        const index = Math.round(scrollTop / clientHeight);
        if (index !== activeIndex) {
            setActiveIndex(index);
        }
    };

    const scrollToPage = (index: number) => {
        containerRef.current?.scrollTo({
            top: index * containerRef.current.clientHeight,
            behavior: "smooth",
        });
    };

    return (
        <div className="relative w-full h-screen overflow-hidden group">
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
                                "w-2.5 h-2.5 rounded-full transition-all duration-500 relative",
                                activeIndex === index
                                    ? "bg-white w-8"
                                    : "bg-white/10 hover:bg-white/30"
                            )}
                            aria-label={`Ir para página ${index + 1}`}
                        >
                            {activeIndex === index && (
                                <motion.div
                                    layoutId="indicator"
                                    className="absolute inset-0 bg-white/20 rounded-full"
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
