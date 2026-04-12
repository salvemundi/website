'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { WifiOff, RefreshCw, Home } from 'lucide-react';
import Image from 'next/image';

export default function OfflinePage() {
    const handleReload = () => {
        window.location.reload();
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center px-4 relative overflow-hidden">
            {/* Background Decorative Elements */}
            <div className="absolute top-1/4 -left-20 w-64 h-64 bg-[var(--theme-purple)]/10 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-1/4 -right-20 w-64 h-64 bg-[var(--color-brand-secondary)]/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="max-w-lg w-full bg-white/5 dark:bg-white/5 backdrop-blur-xl border border-white/10 dark:border-white/10 p-8 md:p-12 rounded-[2.5rem] shadow-2xl relative z-10 text-center"
            >
                <div className="flex justify-center mb-8">
                    <div className="relative">
                        <motion.div
                            animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                            className="w-24 h-24 bg-gradient-to-br from-[var(--theme-purple)] to-[var(--color-purple-700)] rounded-3xl flex items-center justify-center shadow-lg shadow-[var(--theme-purple)]/30"
                        >
                            <WifiOff className="w-12 h-12 text-white" />
                        </motion.div>
                        <motion.div 
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.5, type: 'spring' }}
                            className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 rounded-full border-4 border-[var(--bg-main)] flex items-center justify-center"
                        >
                            <div className="w-2 h-2 bg-white rounded-full animate-ping" />
                        </motion.div>
                    </div>
                </div>

                <h1 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-[var(--text-main)] to-[var(--text-subtle)] bg-clip-text text-transparent italic">
                    Oeps! Geen Verbinding
                </h1>
                
                <p className="text-[var(--text-muted)] mb-10 text-lg leading-relaxed">
                    Het lijkt erop dat je offline bent. De Salve Mundi app heeft een actieve internetverbinding nodig om gegevens op te halen.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button
                        onClick={handleReload}
                        className="flex items-center justify-center gap-3 bg-[var(--theme-purple)] hover:bg-[var(--color-purple-600)] text-white font-bold py-4 px-6 rounded-2xl transition-all shadow-lg shadow-[var(--theme-purple)]/20 active:scale-95 group"
                    >
                        <RefreshCw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
                        Probeer opnieuw
                    </button>
                    
                    <a
                        href="/"
                        className="flex items-center justify-center gap-3 bg-white/10 hover:bg-white/20 text-[var(--text-main)] font-bold py-4 px-6 rounded-2xl border border-white/10 transition-all active:scale-95"
                    >
                        <Home className="w-5 h-5" />
                        Home
                    </a>
                </div>

                <div className="mt-12 pt-8 border-t border-white/5">
                    <div className="flex justify-center items-center gap-3 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
                        <Image src="/img/Logo.png" alt="Salve Mundi" width={32} height={32} />
                        <span className="text-sm font-semibold tracking-widest uppercase">Salve Mundi</span>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
