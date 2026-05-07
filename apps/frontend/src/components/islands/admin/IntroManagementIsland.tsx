'use client';

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
    Users, 
    Heart, 
    FileText, 
    Calendar,
} from 'lucide-react';
import { format } from 'date-fns';
import type { IntroBlog, IntroPlanningItem } from '@salvemundi/validations/schema/intro.zod';
import {
    getIntroSignups,
    getIntroParentSignups,
    deleteIntroSignup,
    deleteIntroParentSignup,
    updateIntroSignup,
    updateIntroParentSignup,
    getIntroBlogs,
    upsertIntroBlog,
    deleteIntroBlog,
    getIntroPlanning,
    upsertIntroPlanning,
    deleteIntroPlanning,
} from '@/server/actions/admin-intro.actions';
import { type DbIntroSignup as IntroSignupRow, type DbIntroParentSignup as IntroParentRow } from '@salvemundi/validations/directus/schema';
import AdminStatsBar from '@/components/ui/admin/AdminStatsBar';
import AdminToast from '@/components/ui/admin/AdminToast';
import { useAdminToast } from '@/hooks/use-admin-toast';

// Modular Sub-components
import IntroSignupsTab from './intro/IntroSignupsTab';
import IntroParentsTab from './intro/IntroParentsTab';
import IntroBlogsTab from './intro/IntroBlogsTab';
import IntroPlanningTab from './intro/IntroPlanningTab';

type TabType = 'signups' | 'parents' | 'blogs' | 'planning';

interface Props {
    initialSignups: IntroSignupRow[];
    initialParents: IntroParentRow[];
    initialBlogs: IntroBlog[];
    initialPlanning: IntroPlanningItem[];
    initialIntroVisible: boolean;
}

export default function IntroManagementIsland({ initialSignups, initialParents, initialBlogs, initialPlanning, initialIntroVisible }: Props) {
    const router = useRouter();
    const { toast, showToast, hideToast } = useAdminToast();
    const [activeTab, setActiveTab] = useState<TabType>('signups');

    // Data
    const [signups, setSignups] = useState(initialSignups);
    const [parents, setParents] = useState(initialParents);
    const [blogs, setBlogs] = useState(initialBlogs);
    const [planning, setPlanning] = useState(initialPlanning);

    // Global UI state
    const [savingBlog, setSavingBlog] = useState(false);
    const [savingPlanning, setSavingPlanning] = useState(false);

    // Global loading IDs
    const [deletingSignupId, setDeletingSignupId] = useState<number | null>(null);
    const [deletingParentId, setDeletingParentId] = useState<number | null>(null);
    const [deletingBlogId, setDeletingBlogId] = useState<number | null>(null);
    const [deletingPlanningId, setDeletingPlanningId] = useState<number | null>(null);

    // Reload helpers
    const reloadSignups = useCallback(async () => setSignups(await getIntroSignups()), []);
    const reloadParents = useCallback(async () => setParents(await getIntroParentSignups()), []);
    const reloadBlogs = useCallback(async () => setBlogs(await getIntroBlogs()), []);
    const reloadPlanning = useCallback(async () => setPlanning(await getIntroPlanning()), []);

    // Handlers
    const handleDeleteSignup = async (id: number) => {
        if (!confirm('Weet je zeker dat je deze aanmelding wilt verwijderen?')) return;
        setDeletingSignupId(id);
        const res = await deleteIntroSignup(id);
        if (res.success) {
            setSignups(prev => prev.filter(s => s.id !== id));
            showToast('Aanmelding succesvol verwijderd', 'success');
        } else {
            showToast(res.error || 'Verwijderen mislukt', 'error');
        }
        setDeletingSignupId(null);
    };

    const handleDeleteParent = async (id: number) => {
        if (!confirm('Weet je zeker dat je deze aanmelding wilt verwijderen?')) return;
        setDeletingParentId(id);
        const res = await deleteIntroParentSignup(id);
        if (res.success) {
            setParents(prev => prev.filter(p => p.id !== id));
            showToast('Ouder aanmelding succesvol verwijderd', 'success');
        } else {
            showToast(res.error || 'Verwijderen mislukt', 'error');
        }
        setDeletingParentId(null);
    };

    const handleUpdateSignup = async (id: number, data: Partial<IntroSignupRow>) => {
        const res = await updateIntroSignup(id, data);
        if (res.success) {
            setSignups(prev => prev.map(s => s.id === id ? { ...s, ...data } : s));
            showToast('Bijgewerkt', 'success');
        } else {
            showToast(res.error || 'Bijwerken mislukt', 'error');
        }
    };

    const handleUpdateParentSignup = async (id: number, data: Partial<IntroParentRow>) => {
        const res = await updateIntroParentSignup(id, data);
        if (res.success) {
            setParents(prev => prev.map(p => p.id === id ? { ...p, ...data } : p));
            showToast('Bijgewerkt', 'success');
        } else {
            showToast(res.error || 'Bijwerken mislukt', 'error');
        }
    };

    const handleSaveBlog = async (blog: Partial<IntroBlog>) => {
        setSavingBlog(true);
        const res = await upsertIntroBlog(blog);
        if (res.success) {
            await reloadBlogs();
            showToast('Blog succesvol opgeslagen', 'success');
        } else {
            showToast(res.error || 'Opslaan mislukt', 'error');
        }
        setSavingBlog(false);
    };

    const handleDeleteBlog = async (id: number) => {
        if (!confirm('Weet je zeker dat je deze blog wilt verwijderen?')) return;
        setDeletingBlogId(id);
        const res = await deleteIntroBlog(id);
        if (res.success) {
            setBlogs(prev => prev.filter(b => b.id !== id));
            showToast('Blog succesvol verwijderd', 'success');
        } else {
            showToast(res.error || 'Verwijderen mislukt', 'error');
        }
        setDeletingBlogId(null);
    };

    const handleSavePlanning = async (item: Partial<IntroPlanningItem>) => {
        setSavingPlanning(true);
        const res = await upsertIntroPlanning(item);
        if (res.success) {
            await reloadPlanning();
            showToast('Planning item succesvol opgeslagen', 'success');
        } else {
            showToast(res.error || 'Opslaan mislukt', 'error');
        }
        setSavingPlanning(false);
    };

    const handleDeletePlanning = async (id: number) => {
        if (!id || !confirm('Weet je zeker dat je dit planning item wilt verwijderen?')) return;
        setDeletingPlanningId(id);
        const res = await deleteIntroPlanning(id);
        if (res.success) {
            setPlanning(prev => prev.filter(p => p.id !== id));
            showToast('Planning item succesvol verwijderd', 'success');
        } else {
            showToast(res.error || 'Verwijderen mislukt', 'error');
        }
        setDeletingPlanningId(null);
    };



    const exportSignupsToCSV = () => {
        const rows = [
            ['Voornaam', 'Achternaam', 'Email', 'Telefoon', 'Geboortedatum', 'Favoriete GIF'],
            ...signups.map(s => [
                s.first_name, s.last_name, s.email, s.phone_number,
                s.date_of_birth || '', s.favorite_gif || '',
            ])
        ];
        const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `intro-aanmeldingen-${format(new Date(), 'yyyy-MM-dd')}.csv`;
        a.click();
    };

    const exportParentsToCSV = () => {
        const rows = [
            ['Voornaam', 'Achternaam', 'Email', 'Telefoon', 'Motivatie'],
            ...parents.map(p => [
                p.first_name || '', p.last_name || '', p.email || '', p.phone_number || '',
                p.motivation || '',
            ])
        ];
        const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `intro-ouders-${format(new Date(), 'yyyy-MM-dd')}.csv`;
        a.click();
    };

    const adminStats = [
        { label: 'Deelnemers', value: signups.length, icon: Users, theme: 'blue' },
        { label: 'Ouders', value: parents.length, icon: Heart, theme: 'pink' },
        { label: 'Blogs', value: blogs.length, icon: FileText, theme: 'emerald' },
        { label: 'Planning', value: planning.length, icon: Calendar, theme: 'amber' },
    ];

    return (
        <>
            <AdminStatsBar stats={adminStats} />

            {/* Tabs - Tokenized */}
            <div className="flex flex-wrap gap-2 mb-10 bg-[var(--beheer-card-bg)]/50 backdrop-blur-md p-1.5 rounded-[2rem] border border-[var(--beheer-border)]/50 w-fit">
                    {[
                        { id: 'signups', label: 'Aanmeldingen', count: signups.length, icon: Users },
                        { id: 'parents', label: 'Ouders', count: parents.length, icon: Heart },
                        { id: 'blogs', label: 'Blogs', count: blogs.length, icon: FileText },
                        { id: 'planning', label: 'Planning', count: planning.length, icon: Calendar }
                    ].map(tab => (
                        <button 
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as TabType)} 
                            className={`flex items-center gap-3 px-6 py-3.5 font-semibold text-sm transition-all rounded-[1.5rem] ${
                                activeTab === tab.id 
                                    ? 'bg-[var(--beheer-accent)] text-white shadow-[var(--shadow-glow)]' 
                                    : 'text-[var(--beheer-text-muted)] hover:text-[var(--beheer-text)] hover:bg-[var(--beheer-card-soft)]/50'
                            }`}
                        >
                            <tab.icon className={`h-4 w-4 ${activeTab === tab.id ? 'opacity-100' : 'opacity-40'}`} /> 
                            {tab.label} 
                            <span className={`ml-1 px-2 py-0.5 rounded-full text-[9px] ${activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-[var(--beheer-card-soft)] text-[var(--beheer-text-muted)]'}`}>
                                {tab.count}
                            </span>
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                {activeTab === 'signups' && (
                    <IntroSignupsTab 
                        signups={signups} 
                        onDelete={handleDeleteSignup} 
                        onUpdate={handleUpdateSignup}
                        onExport={exportSignupsToCSV}
                        deletingId={deletingSignupId}
                    />
                )}
                {activeTab === 'parents' && (
                    <IntroParentsTab 
                        parents={parents} 
                        onDelete={handleDeleteParent} 
                        onUpdate={handleUpdateParentSignup}
                        onExport={exportParentsToCSV}
                        deletingId={deletingParentId}
                    />
                )}
                {activeTab === 'blogs' && (
                    <IntroBlogsTab 
                        blogs={blogs} 
                        onSave={handleSaveBlog} 
                        onDelete={handleDeleteBlog}
                        saving={savingBlog}
                        deletingId={deletingBlogId}
                    />
                )}
                {activeTab === 'planning' && (
                    <IntroPlanningTab 
                        planning={planning} 
                        onSave={handleSavePlanning} 
                        onDelete={handleDeletePlanning}
                        saving={savingPlanning}
                        deletingId={deletingPlanningId}
                    />
                )}

            <AdminToast toast={toast} onClose={hideToast} />
        </>
    );
}
