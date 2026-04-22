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
                        className="relative w-full max-w-md bg-[var(--bg-main)] rounded-3xl p-8 shadow-2xl border border-white/10 overflow-hidden"
                    >
                        {/* Background Decoration */}
                        <div className="absolute -top-24 -right-24 w-48 h-48 bg-theme-purple/10 rounded-full blur-3xl" />
                        
                        <div className="relative flex flex-col items-center text-center">
                            <div className="w-20 h-20 bg-theme-purple/10 rounded-full flex items-center justify-center mb-6">
                                <AlertCircle className="w-10 h-10 text-theme-purple animate-pulse" />
                            </div>
                            
                            <h3 className="text-2xl font-black text-[var(--text-main)] mb-4">
                                Klopt je voornaam?
                            </h3>
                            
                            <p className="text-[var(--text-muted)] mb-8 leading-relaxed">
                                Je hebt <span className="text-theme-purple font-bold px-2 py-1 bg-theme-purple/5 rounded-lg">"{name}"</span> ingevuld.<br/>
                                Komt dit <span className="text-[var(--text-main)] font-bold">exact</span> overeen met de naam op je paspoort of ID-kaart?
                            </p>

                            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 mb-8 text-sm text-amber-500 font-medium">
                                Let op: Een kleine typefout kan leiden tot problemen bij het inchecken op het vliegveld!
                            </div>

                            <div className="flex flex-col w-full gap-3">
                                <button
                                    onClick={onConfirm}
                                    className="w-full py-4 bg-theme-purple hover:bg-theme-purple-dark text-white rounded-2xl font-black transition-all flex items-center justify-center gap-2 group"
                                >
                                    <CheckCircle2 className="w-5 h-5" />
                                    Ja, dit klopt exact
                                </button>
                                <button
                                    onClick={onCancel}
                                    className="w-full py-4 text-[var(--text-muted)] hover:text-[var(--text-main)] font-bold transition-all"
                                >
                                    Nee, ik wil het aanpassen
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
