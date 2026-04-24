'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { type Board } from '@salvemundi/validations/schema/board.zod';
import { BoardYearCard } from '@/components/ui/committees/BoardYearCard';

interface BoardHistoryTimelineProps {
    boards: Board[];
}

export default function BoardHistoryTimeline({ boards }: BoardHistoryTimelineProps) {
    if (!boards || boards.length === 0) {
        return (
            <div className="rounded-3xl bg-[var(--bg-card)] p-12 text-center shadow-lg dark:border dark:border-white/10">
                <p className="text-[var(--text-muted)] italic">Geen bestuursgeschiedenis gevonden.</p>
            </div>
        );
    }

    return (
        <div className="relative">
            {/* Vertical Line */}
            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-[var(--color-purple-500)]/0 via-[var(--color-purple-500)]/20 to-[var(--color-purple-500)]/0 hidden lg:block -translate-x-1/2" />

            <div className="space-y-16 lg:space-y-24">
                {boards.map((board, index) => (
                    <motion.div
                        key={board.id}
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ duration: 0.8, ease: "easeOut", delay: index * 0.1 }}
                        className="relative"
                    >
                        {/* Dot on timeline */}
                        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-[var(--bg-main)] border-4 border-[var(--color-purple-500)] shadow-[0_0_15px_rgba(147,51,234,0.5)] z-10 hidden lg:block" />
                        
                        <div className="relative z-20">
                            <BoardYearCard board={board} />
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
