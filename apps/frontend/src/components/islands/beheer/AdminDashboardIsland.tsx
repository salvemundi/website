'use client';

import React from 'react';
import Link from 'next/link';
import { 
    Users, Calendar, TrendingUp, Gift, FileText, 
    Settings, ShieldCheck, ChevronRight 
} from 'lucide-react';
import { motion } from 'framer-motion';

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
        className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center gap-4 transition-all hover:shadow-md"
    >
        <div className={`p-4 rounded-xl ${color} bg-opacity-10 dark:bg-opacity-20`}>
            {React.isValidElement(icon) && React.cloneElement(icon as React.ReactElement<{ className?: string }>, { 
                className: `w-6 h-6 ${color.replace('bg-', 'text-')}` 
            })}
        </div>
        <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{value}</h3>
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
        <div className="space-y-8">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Admin Dashboard</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Welkom terug bij het beheerpaneel van Salve Mundi.</p>
                </div>
                <div className="flex gap-2">
                    <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors flex items-center gap-2 text-sm">
                        <ShieldCheck className="w-4 h-4" />
                        Systeem Status
                    </button>
                    <button className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-medium transition-colors text-sm">
                        Instellingen
                    </button>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <StatCard 
                    title="Actieve Leden" 
                    value={stats.totalMembers} 
                    icon={<Users />} 
                    color="bg-blue-500" 
                />
                <StatCard 
                    title="Evenement Aanmeldingen" 
                    value={stats.totalSignups} 
                    icon={<TrendingUp />} 
                    color="bg-emerald-500" 
                />
                <StatCard 
                    title="Aankomende Events" 
                    value={stats.upcomingEvents} 
                    icon={<Calendar />} 
                    color="bg-purple-500" 
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Navigation Links (Quick Actions) */}
                <div className="lg:col-span-2 space-y-6">
                    <h2 className="text-xl font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                        <Settings className="w-5 h-5 text-blue-500" />
                        Beheer Modules
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {[
                            { title: 'Ledenbeheer', desc: 'Lijst inzien en bewerken', href: '/beheer/leden', icon: <Users />, color: 'text-blue-500' },
                            { title: 'Activiteiten', desc: 'Events aanmaken en beheren', href: '/beheer/activiteiten', icon: <Calendar />, color: 'text-emerald-500' },
                            { title: 'Studiereis', desc: 'Inschrijvingen & logistiek', href: '/beheer/reis', icon: <MapPin className="w-4 h-4" />, color: 'text-purple-500' },
                            { title: 'Introductieweek', desc: 'Nieuwe studenten & schema', href: '/beheer/intro', icon: <Sparkles className="w-4 h-4" />, color: 'text-amber-500' },
                        ].map((item, i) => (
                            <Link 
                                key={i} 
                                href={item.href}
                                className="group p-5 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl shadow-sm hover:shadow-md transition-all flex items-start gap-4"
                            >
                                <div className={`p-3 rounded-xl bg-slate-50 dark:bg-slate-900 group-hover:bg-white dark:group-hover:bg-slate-700 transition-colors ${item.color}`}>
                                    {React.isValidElement(item.icon) && React.cloneElement(item.icon as React.ReactElement<{ className?: string }>, { 
                                        className: 'w-6 h-6' 
                                    })}
                                </div>
                                <div className="flex-grow">
                                    <h3 className="font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">{item.title}</h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">{item.desc}</p>
                                </div>
                                <ChevronRight className="w-5 h-5 text-slate-300 dark:text-slate-600 group-hover:text-blue-500 transition-all self-center" />
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Side Section: Birthdays */}
                <div className="space-y-6">
                    <h2 className="text-xl font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                        <Gift className="w-5 h-5 text-pink-500" />
                        Jarigen (7 dagen)
                    </h2>
                    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 divide-y divide-slate-50 dark:divide-slate-700 overflow-hidden">
                        {birthdays.length > 0 ? birthdays.map((b, i) => (
                            <div key={i} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center text-pink-600 font-bold text-sm">
                                        {b.name.charAt(0)}
                                    </div>
                                    <span className="font-medium text-slate-700 dark:text-slate-200 truncate max-w-[120px]">{b.name}</span>
                                </div>
                                <span className="text-xs font-semibold px-2 py-1 bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 rounded-lg">
                                    {new Date(b.date).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}
                                </span>
                            </div>
                        )) : (
                            <div className="p-8 text-center text-slate-400 italic">
                                Geen verjaardagen binnenkort
                            </div>
                        )}
                    </div>

                    {/* Quick Access Documents */}
                    <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 text-white overflow-hidden relative group">
                        <div className="relative z-10">
                            <h3 className="font-bold text-lg mb-2">Documenten</h3>
                            <p className="text-blue-100 text-sm mb-4">Bekijk de statuten en reglementen van de vereniging.</p>
                            <Link href="/beheer/vereniging" className="inline-flex items-center gap-2 bg-white text-blue-600 px-4 py-2 rounded-xl text-sm font-bold hover:bg-blue-50 transition-colors">
                                <FileText className="w-4 h-4" />
                                Bekijken
                            </Link>
                        </div>
                        <FileText className="absolute top-0 right-0 w-32 h-32 text-blue-400 opacity-10 -mr-8 -mt-8 rotate-12 group-hover:rotate-0 transition-transform duration-500" />
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
