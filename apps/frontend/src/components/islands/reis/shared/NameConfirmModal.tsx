'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

interface NameConfirmModalProps {
    isOpen: boolean;
    name: string;
    onConfirm: () => void;
    onCancel: () => void;
}

export function NameConfirmModal({ isOpen, name, onConfirm, onCancel }: NameConfirmModalProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onCancel}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    />
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-4xl bg-[var(--bg-card)] rounded-[40px] p-12 shadow-2xl border border-white/10 overflow-hidden backdrop-blur-2xl"
                    >
                        {/* Background Decoration */}
                        <div className="absolute -top-48 -right-48 w-96 h-96 bg-theme-purple/20 rounded-full blur-[120px]" />
                        <div className="absolute -bottom-48 -left-48 w-96 h-96 bg-theme-purple/10 rounded-full blur-[120px]" />
                        
                        <div className="relative flex flex-col items-center text-center">
                            <div className="w-24 h-24 bg-theme-purple/10 rounded-full flex items-center justify-center mb-8">
                                <AlertCircle className="w-12 h-12 text-theme-purple animate-pulse" />
                            </div>
                            
                            <h3 className="text-4xl md:text-6xl font-black text-[var(--text-main)] mb-6 uppercase italic tracking-tighter leading-none">
                                Klopt je voornaam?
                            </h3>
                            
                            <p className="text-xl md:text-2xl text-[var(--text-muted)] mb-10 leading-relaxed max-w-2xl">
                                Je hebt <span className="text-theme-purple font-black px-3 py-1 bg-theme-purple/10 rounded-xl">"{name}"</span> ingevuld.
                                <br className="hidden md:block" />
                                Komt dit <span className="text-white font-black italic">exact</span> overeen met de naam op je paspoort of ID-kaart?
                            </p>

                            <div className="p-6 rounded-3xl bg-amber-500/10 border border-amber-500/20 mb-12 text-lg text-amber-500 font-bold uppercase tracking-wider">
                                <span className="animate-pulse mr-2">⚠️</span> Let op: Een typefout kan leiden tot weigering bij de gate!
                            </div>

                            <div className="flex flex-col md:flex-row w-full gap-4">
                                <button
                                    onClick={onConfirm}
                                    className="flex-1 py-6 bg-theme-purple hover:bg-theme-purple-dark text-white rounded-[24px] font-black text-xl uppercase italic tracking-tighter transition-all flex items-center justify-center gap-3 group shadow-lg shadow-theme-purple/20"
                                >
                                    <CheckCircle2 className="w-6 h-6" />
                                    Ja, dit klopt exact
                                </button>
                                <button
                                    onClick={onCancel}
                                    className="flex-1 py-6 bg-white/5 hover:bg-white/10 text-[var(--text-muted)] hover:text-white rounded-[24px] font-black text-xl uppercase italic tracking-tighter transition-all"
                                >
                                    Nee, aanpassen
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
