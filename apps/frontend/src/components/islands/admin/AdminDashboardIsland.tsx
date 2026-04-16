'use client';

import React from 'react';
import Link from 'next/link';
import { 
    Users, Calendar, TrendingUp, Gift, FileText, 
    Settings, ShieldCheck, ChevronRight 
} from 'lucide-react';
import { motion } from 'framer-motion';
import { formatDate } from '@/shared/lib/utils/date';

interface StatProps {
    title: string;
    value: number | string;
    icon: React.ReactNode;
    color: string;
}

const StatCard: React.FC<StatProps> = ({ title, value, icon, color }) => (
    <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-[var(--beheer-card-bg)] p-8 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-[var(--beheer-border)] flex items-center gap-6 transition-all hover:shadow-md group relative overflow-hidden"
    >
        {/* Accent Bar */}
        <div className={`absolute top-0 left-0 w-full h-1.5 ${color}`} />
        
        <div className={`p-4 rounded-2xl ${color} bg-opacity-10 dark:bg-opacity-20 group-hover:scale-110 transition-transform`}>
            {React.isValidElement(icon) && React.cloneElement(icon as React.ReactElement<{ className?: string }>, { 
                className: `w-7 h-7 ${color.replace('bg-', 'text-')}` 
            })}
        </div>
        <div>
            <p className="text-[10px] font-black text-slate-500 dark:text-[var(--beheer-text-muted)] uppercase tracking-widest">{title}</p>
            <h3 className="text-3xl font-black text-slate-900 dark:text-[var(--beheer-text)] mt-1">{value}</h3>
        </div>
    </motion.div>
);

interface AdminDashboardIslandProps {
    stats: {
        totalMembers: number;
        totalSignups: number;
        upcomingEvents: number;
    };
    birthdays: { name: string; date: string }[];
}

const AdminDashboardIsland: React.FC<AdminDashboardIslandProps> = ({ stats, birthdays }) => {
    return (
        <div className="space-y-12">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 dark:text-[var(--beheer-text)] uppercase tracking-tighter">Admin Dashboard</h1>
                    <p className="text-slate-500 dark:text-[var(--beheer-text-muted)] mt-2 font-bold uppercase tracking-widest text-xs">Welkom terug bij het beheerpaneel van Salve Mundi.</p>
                </div>
                <div className="flex gap-3">
                    <Link 
                        href="/beheer/services"
                        className="px-6 py-3 bg-[var(--beheer-accent)] text-white rounded-[var(--beheer-radius)] font-black uppercase tracking-widest text-[10px] shadow-[var(--shadow-glow)] hover:opacity-90 transition-all active:scale-95 flex items-center gap-2"
                    >
                        <ShieldCheck className="w-4 h-4" />
                        Systeem Status
                    </Link>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                <StatCard 
                    title="Actieve Leden" 
                    value={stats.totalMembers} 
                    icon={<Users />} 
                    color="bg-blue-500" 
                />
                <StatCard 
                    title="Event Aanmeldingen" 
                    value={stats.totalSignups} 
                    icon={<TrendingUp />} 
                    color="bg-emerald-500" 
                />
                <StatCard 
                    title="Aankomende Events" 
                    value={stats.upcomingEvents} 
                    icon={<Calendar />} 
                    color="bg-[var(--beheer-accent)]" 
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                {/* Navigation Links (Quick Actions) */}
                <div className="lg:col-span-2 space-y-8">
                    <h2 className="text-xs font-black text-slate-900 dark:text-[var(--beheer-text)] flex items-center gap-3 uppercase tracking-widest border-l-4 border-[var(--beheer-accent)] pl-4 py-1">
                        Beheer Modules
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {[
                            { title: 'Ledenbeheer', desc: 'Lijst inzien en bewerken', href: '/beheer/leden', icon: <Users />, color: 'text-blue-500', barColor: 'bg-blue-500' },
                            { title: 'Activiteiten', desc: 'Events aanmaken en beheren', href: '/beheer/activiteiten', icon: <Calendar />, color: 'text-emerald-500', barColor: 'bg-emerald-500' },
                            { title: 'Studiereis', desc: 'Inschrijvingen & logistiek', href: '/beheer/reis', icon: <MapPin className="w-4 h-4" />, color: 'text-purple-500', barColor: 'bg-purple-500' },
                            { title: 'Inschatting/Intro', desc: 'Nieuwe studenten & schema', href: '/beheer/intro', icon: <Sparkles className="w-4 h-4" />, color: 'text-amber-500', barColor: 'bg-amber-500' },
                            { title: 'Coupons', desc: 'Kortingscodes beheren', href: '/beheer/coupons', icon: <Gift className="w-4 h-4" />, color: 'text-pink-500', barColor: 'bg-pink-500' },
                            { title: 'System Logs', desc: 'Audit logs van systeem', href: '/beheer/logging', icon: <FileText className="w-4 h-4" />, color: 'text-slate-500', barColor: 'bg-slate-500' },
                        ].map((item, i) => (
                            <Link 
                                key={i} 
                                href={item.href}
                                className="group p-6 bg-white dark:bg-[var(--beheer-card-bg)] border border-slate-100 dark:border-[var(--beheer-border)] rounded-[2rem] shadow-sm hover:shadow-md transition-all flex items-start gap-4 relative overflow-hidden"
                            >
                                <div className={`absolute left-0 top-0 w-1.5 h-full ${item.barColor} opacity-20 group-hover:opacity-100 transition-opacity`} />
                                
                                <div className={`p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 group-hover:scale-110 transition-transform ${item.color}`}>
                                    {React.isValidElement(item.icon) && React.cloneElement(item.icon as React.ReactElement<{ className?: string }>, { 
                                        className: 'w-7 h-7' 
                                    })}
                                </div>
                                <div className="flex-grow pt-1">
                                    <h3 className="font-black text-slate-900 dark:text-[var(--beheer-text)] uppercase tracking-tight group-hover:text-[var(--beheer-accent)] transition-colors">{item.title}</h3>
                                    <p className="text-[10px] font-bold text-slate-500 dark:text-[var(--beheer-text-muted)] uppercase tracking-widest mt-1 opacity-60">{item.desc}</p>
                                </div>
                                <ChevronRight className="w-5 h-5 text-slate-300 dark:text-slate-600 group-hover:text-[var(--beheer-accent)] transition-all self-center" />
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Side Section: Birthdays */}
                <div className="space-y-8">
                    <h2 className="text-xs font-black text-slate-900 dark:text-[var(--beheer-text)] flex items-center gap-3 uppercase tracking-widest border-l-4 border-pink-500 pl-4 py-1">
                        Jarigen (7 dagen)
                    </h2>
                    <div className="bg-white dark:bg-[var(--beheer-card-bg)] rounded-[2.5rem] border border-slate-100 dark:border-[var(--beheer-border)] divide-y divide-slate-50 dark:divide-white/5 overflow-hidden shadow-sm">
                        {birthdays.length > 0 ? birthdays.map((b, i) => (
                            <div key={i} className="p-5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="w-11 h-11 rounded-full bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center text-pink-600 font-black text-sm">
                                        {b.name.charAt(0).toUpperCase()}
                                    </div>
                                    <span className="font-black text-[var(--beheer-text)] text-xs uppercase tracking-tight truncate max-w-[120px]">{b.name}</span>
                                </div>
                                <span className="text-[10px] font-black px-3 py-1 bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-[var(--beheer-text-muted)] rounded-full uppercase tracking-widest">
                                    {formatDate(b.date)}
                                </span>
                            </div>
                        )) : (
                            <div className="p-12 text-center text-slate-400 italic font-bold uppercase tracking-widest text-[10px] opacity-40">
                                Geen jarigen deze week
                            </div>
                        )}
                    </div>

                    {/* Quick Access Documents */}
                    <div className="bg-gradient-to-br from-[var(--beheer-accent)] to-[var(--beheer-accent)]/80 rounded-[2.5rem] p-10 text-white overflow-hidden relative group shadow-lg">
                        <div className="relative z-10">
                            <h3 className="font-black text-xl uppercase tracking-tighter mb-2">Reglementen</h3>
                            <p className="text-white/80 text-[10px] font-bold uppercase tracking-widest mb-6 leading-relaxed">Statuten, HR en andere belangrijke stukken.</p>
                            <Link href="/beheer/commissies" className="inline-flex items-center gap-2 bg-white text-[var(--beheer-accent)] px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/90 transition-all active:scale-95 shadow-lg">
                                <FileText className="w-4 h-4" />
                                Doorlezen
                            </Link>
                        </div>
                        <FileText className="absolute top-0 right-0 w-40 h-40 text-white/10 -mr-12 -mt-12 rotate-12 group-hover:rotate-0 transition-transform duration-700" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboardIsland;

// Mock component for missing icons in map
function MapPin({ className }: { className?: string }) { return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>; }
function Sparkles({ className }: { className?: string }) { return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3 1.912 5.813a2 2 0 0 0 1.275 1.275L21 12l-5.813 1.912a2 2 0 0 0-1.275 1.275L12 21l-1.912-5.813a2 2 0 0 0-1.275-1.275L3 12l5.813-1.912a2 2 0 0 0 1.275-1.275L12 3Z"></path><path d="M5 3v4"></path><path d="M19 17v4"></path><path d="M3 5h4"></path><path d="M17 19h4"></path></svg>; }
