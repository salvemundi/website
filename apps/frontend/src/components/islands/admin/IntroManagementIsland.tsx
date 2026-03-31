'use client';

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
    Users, 
    Heart, 
    FileText, 
    Calendar, 
    Bell 
} from 'lucide-react';
import { format } from 'date-fns';
import type { IntroBlog, IntroPlanningItem } from '@salvemundi/validations';
import {
    getIntroSignups,
    getIntroParentSignups,
    deleteIntroSignup,
    deleteIntroParentSignup,
    getIntroBlogs,
    upsertIntroBlog,
    deleteIntroBlog,
    getIntroPlanning,
    upsertIntroPlanning,
    deleteIntroPlanning,
    toggleIntroVisibility,
    sendIntroCustomNotification,
} from '@/server/actions/admin-intro.actions';
import AdminToolbar from '@/components/ui/admin/AdminToolbar';
import AdminVisibilityToggle from '@/components/ui/admin/AdminVisibilityToggle';
import AdminStatsBar from '@/components/ui/admin/AdminStatsBar';

// Modular Sub-components
import IntroSignupsTab from './intro/IntroSignupsTab';
import IntroParentsTab from './intro/IntroParentsTab';
import IntroBlogsTab from './intro/IntroBlogsTab';
import IntroPlanningTab from './intro/IntroPlanningTab';
import IntroNotificationModal from './intro/IntroNotificationModal';

type TabType = 'signups' | 'parents' | 'blogs' | 'planning';

type IntroSignupRow = {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    phone_number: string;
    date_of_birth?: string;
    favorite_gif?: string;
    date_created?: string;
};

type IntroParentRow = {
    id: number;
    first_name?: string;
    last_name?: string;
    email?: string;
    phone_number?: string;
    motivation?: string;
    date_created?: string;
};

interface Props {
    initialSignups: IntroSignupRow[];
    initialParents: IntroParentRow[];
    initialBlogs: IntroBlog[];
    initialPlanning: IntroPlanningItem[];
    initialIntroVisible: boolean;
}

export default function IntroManagementIsland({ initialSignups, initialParents, initialBlogs, initialPlanning, initialIntroVisible }: Props) {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<TabType>('signups');

    // Data
    const [signups, setSignups] = useState(initialSignups);
    const [parents, setParents] = useState(initialParents);
    const [blogs, setBlogs] = useState(initialBlogs);
    const [planning, setPlanning] = useState(initialPlanning);
    const [introVisible, setIntroVisible] = useState(initialIntroVisible);

    // Global UI state
    const [showNotifModal, setShowNotifModal] = useState(false);
    const [savingBlog, setSavingBlog] = useState(false);
    const [savingPlanning, setSavingPlanning] = useState(false);
    const [sendingNotif, setSendingNotif] = useState(false);
    const [togglingVisibility, setTogglingVisibility] = useState(false);

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
        if (res.success) setSignups(prev => prev.filter(s => s.id !== id));
        else alert(res.error || 'Verwijderen mislukt');
        setDeletingSignupId(null);
    };

    const handleDeleteParent = async (id: number) => {
        if (!confirm('Weet je zeker dat je deze aanmelding wilt verwijderen?')) return;
        setDeletingParentId(id);
        const res = await deleteIntroParentSignup(id);
        if (res.success) setParents(prev => prev.filter(p => p.id !== id));
        else alert(res.error || 'Verwijderen mislukt');
        setDeletingParentId(null);
    };

    const handleSaveBlog = async (blog: Partial<IntroBlog>) => {
        setSavingBlog(true);
        const res = await upsertIntroBlog(blog);
        if (res.success) await reloadBlogs();
        else alert(res.error || 'Opslaan mislukt');
        setSavingBlog(false);
    };

    const handleDeleteBlog = async (id: number) => {
        if (!confirm('Weet je zeker dat je deze blog wilt verwijderen?')) return;
        setDeletingBlogId(id);
        const res = await deleteIntroBlog(id);
        if (res.success) setBlogs(prev => prev.filter(b => b.id !== id));
        else alert(res.error || 'Verwijderen mislukt');
        setDeletingBlogId(null);
    };

    const handleSavePlanning = async (item: Partial<IntroPlanningItem>) => {
        setSavingPlanning(true);
        const res = await upsertIntroPlanning(item);
        if (res.success) await reloadPlanning();
        else alert(res.error || 'Opslaan mislukt');
        setSavingPlanning(false);
    };

    const handleDeletePlanning = async (id: number) => {
        if (!id || !confirm('Weet je zeker dat je dit planning item wilt verwijderen?')) return;
        setDeletingPlanningId(id);
        const res = await deleteIntroPlanning(id);
        if (res.success) setPlanning(prev => prev.filter(p => p.id !== id));
        else alert(res.error || 'Verwijderen mislukt');
        setDeletingPlanningId(null);
    };

    const handleToggleVisibility = async () => {
        setTogglingVisibility(true);
        try {
            const res = await toggleIntroVisibility();
            if (res.success) {
                setIntroVisible(res.show ?? false);
                router.refresh();
            } else alert(res.error || 'Bijwerken mislukt');
        } catch (err) {
            console.error(err);
            alert('Er is een onverwachte fout opgetreden');
        } finally {
            setTogglingVisibility(false);
        }
    };

    const handleSendNotification = async (title: string, body: string, includeParents: boolean) => {
        setSendingNotif(true);
        const res = await sendIntroCustomNotification(title, body, includeParents);
        if (res.success) {
            alert(`Notificatie verstuurd naar ${res.sent ?? 0} gebruiker(s)!`);
            setShowNotifModal(false);
        } else alert(res.error || 'Verzenden mislukt');
        setSendingNotif(false);
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
            <AdminToolbar 
                title="Introductie"
                subtitle="Beheer aanmeldingen, ouders, blogs & planning"
                backHref="/beheer"
                actions={
                    <>
                        <AdminVisibilityToggle 
                            isVisible={introVisible}
                            onToggle={handleToggleVisibility}
                            isPending={togglingVisibility}
                        />

                        <button 
                            onClick={() => setShowNotifModal(true)}
                            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-[var(--beheer-btn-px)] py-[var(--beheer-btn-py)] bg-[var(--beheer-accent)] text-white font-black text-xs uppercase tracking-widest rounded-[var(--beheer-radius)] shadow-[var(--shadow-glow)] hover:opacity-90 transition-all active:scale-95"
                        >
                            <Bell className="h-4 w-4" />
                            Notificatie
                        </button>
                    </>
                }
            />

            <div className="container mx-auto px-4 py-8 max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-700">
                <AdminStatsBar stats={adminStats} />

                {/* Tabs - Tokenized */}
                <div className="flex flex-wrap gap-0 border-b border-[var(--beheer-border)] mb-8">
                    {[
                        { id: 'signups', label: 'Aanmeldingen', count: signups.length, icon: Users },
                        { id: 'parents', label: 'Ouders', count: parents.length, icon: Heart },
                        { id: 'blogs', label: 'Blogs', count: blogs.length, icon: FileText },
                        { id: 'planning', label: 'Planning', count: planning.length, icon: Calendar }
                    ].map(tab => (
                        <button 
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as TabType)} 
                            className={`flex items-center gap-2 px-[var(--beheer-btn-px)] py-[var(--beheer-btn-py)] font-black text-xs uppercase tracking-widest transition-all border-b-2 ${
                                activeTab === tab.id 
                                    ? 'text-[var(--beheer-accent)] border-[var(--beheer-accent)]' 
                                    : 'text-[var(--beheer-text-muted)] border-transparent hover:text-[var(--beheer-text)]'
                            }`}
                        >
                            <tab.icon className="h-4 w-4" /> {tab.label} ({tab.count})
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                {activeTab === 'signups' && (
                    <IntroSignupsTab 
                        signups={signups} 
                        onDelete={handleDeleteSignup} 
                        onExport={exportSignupsToCSV}
                        deletingId={deletingSignupId}
                    />
                )}
                {activeTab === 'parents' && (
                    <IntroParentsTab 
                        parents={parents} 
                        onDelete={handleDeleteParent} 
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

                {/* Modals */}
                {showNotifModal && (
                    <IntroNotificationModal 
                        onClose={() => setShowNotifModal(false)}
                        onSend={handleSendNotification}
                        sending={sendingNotif}
                    />
                )}
            </div>
        </>
    );
}
