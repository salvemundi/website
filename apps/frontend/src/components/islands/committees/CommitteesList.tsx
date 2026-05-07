'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { CommitteeCard } from '@/components/ui/committees/CommitteeCard';
import { type Committee } from '@salvemundi/validations/schema/committees.zod';

interface CommitteesListProps {
    initialCommittees?: Committee[]; 
}

// Helper to clean committee names
function cleanCommitteeName(name: string): string {
    return name?.replace(/\s*(\|\||[-–—])\s*SALVE MUNDI\s*$/gi, '').trim() || '';
}

/**
 * CommitteesList: Premium Display with staggering animations.
 */
export default function CommitteesList({ initialCommittees = [] }: CommitteesListProps) {
    const sortedCommittees = [...initialCommittees].sort((a, b) => {
        const aIsBestuur = cleanCommitteeName(a.name).toLowerCase().includes('bestuur');
        const bIsBestuur = cleanCommitteeName(b.name).toLowerCase().includes('bestuur');
        if (aIsBestuur && !bIsBestuur) return -1;
        if (!aIsBestuur && bIsBestuur) return 1;
        return 0;
    });

    if (sortedCommittees.length === 0) {
        return (
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-3xl bg-[var(--bg-card)]/80 dark:border dark:border-white/10 p-12 text-center shadow-lg"
            >
                <p className="text-lg text-[var(--text-muted)] italic">Geen commissies gevonden.</p>
            </motion.div>
        );
    }

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    return (
        <motion.div 
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4"
        >
            {sortedCommittees.map((committee, idx) => {
                const cleanedName = cleanCommitteeName(committee.name);
                const isBestuur = cleanedName.toLowerCase().includes('bestuur');
                
                return (
                    <motion.div 
                        key={committee.id} 
                        variants={item}
                        className={`${isBestuur ? 'md:col-span-2' : ''} h-full`}
                    >
                        <CommitteeCard committee={committee} index={idx} />
                    </motion.div>
                );
            })}
        </motion.div>
    );
}
