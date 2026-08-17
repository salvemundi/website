'use client';

import { useState, useCallback } from 'react';
import type { IntroBlog, IntroPlanningItem, IntroConfidant, IntroGroup, IntroGroupWithDetails } from '@salvemundi/validations/schema/intro.zod';
import {
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
    getIntroConfidants,
    upsertIntroConfidant,
    deleteIntroConfidant,
    getIntroGroupsForAdmin,
    createGroup,
    updateGroup,
    deleteGroup,
    addGroupLeader,
    removeGroupLeader
} from '@/server/actions/admin/intro/admin-intro-core.actions';
import { type IntroSignup as IntroSignupRow, type IntroParentSignup as IntroParentRow } from '@salvemundi/validations/directus/schema';
import AdminToast from '@/components/ui/admin/AdminToast';
import { useAdminToast } from '@/hooks/use-admin-toast';
import { downloadCSV } from '@/lib/utils/export';
import IntroSignupsTab from './intro/IntroSignupsTab';
import IntroParentsTab from './intro/IntroParentsTab';
import IntroBlogsTab from './intro/IntroBlogsTab';
import IntroPlanningTab from './intro/IntroPlanningTab';
import IntroConfidantsTab from './intro/IntroConfidantsTab';
import IntroGroupsTab from './intro/IntroGroupsTab';
import IntroFilters, { type TabType } from './intro/IntroFilters';

interface ApprovedOuder {
    user_id: string;
    first_name: string;
    last_name: string;
    email: string;
}

interface Props {
    initialSignups: IntroSignupRow[];
    initialParents: IntroParentRow[];
    initialBlogs: IntroBlog[];
    initialPlanning: IntroPlanningItem[];
    initialConfidants: IntroConfidant[];
    initialGroups: IntroGroupWithDetails[];
    initialApprovedOuders: ApprovedOuder[];
    initialIntroVisible: boolean;
    initialPlanningImage: string | null;
    initialInfoBooklet: string | null;
}

export default function IntroManagementIsland({ initialSignups, initialParents, initialBlogs, initialPlanning, initialConfidants, initialGroups, initialApprovedOuders, initialPlanningImage, initialInfoBooklet }: Props) {
    const { toast, showToast, hideToast } = useAdminToast();

    const [activeTab, setActiveTab] = useState<TabType>('signups');

    const [signups, setSignups] = useState(initialSignups);
    const [parents, setParents] = useState(initialParents);
    const [blogs, setBlogs] = useState(initialBlogs);
    const [planning, setPlanning] = useState(initialPlanning);
    const [confidants, setConfidants] = useState(initialConfidants);
    const [groups, setGroups] = useState(initialGroups);
    const [approvedOuders] = useState(initialApprovedOuders);

    const [savingBlog, setSavingBlog] = useState(false);
    const [savingPlanning, setSavingPlanning] = useState(false);
    const [savingConfidant, setSavingConfidant] = useState(false);
    const [savingGroup, setSavingGroup] = useState(false);

    const [deletingSignupId, setDeletingSignupId] = useState<number | null>(null);
    const [deletingParentId, setDeletingParentId] = useState<number | null>(null);
    const [deletingBlogId, setDeletingBlogId] = useState<number | null>(null);
    const [deletingPlanningId, setDeletingPlanningId] = useState<number | null>(null);
    const [deletingConfidantId, setDeletingConfidantId] = useState<number | null>(null);
    const [deletingGroupId, setDeletingGroupId] = useState<number | null>(null);

    const reloadBlogs = useCallback(async () => setBlogs(await getIntroBlogs()), []);
    const reloadPlanning = useCallback(async () => setPlanning(await getIntroPlanning()), []);
    const reloadConfidants = useCallback(async () => setConfidants(await getIntroConfidants()), []);
    const reloadGroups = useCallback(async () => setGroups(await getIntroGroupsForAdmin()), []);

    const handleDeleteSignup = async (id: number) => {
        if (!confirm('Weet je zeker dat je deze aanmelding wilt verwijderen?')) return;
        setDeletingSignupId(id);
        const res = await deleteIntroSignup(id);
        if (res.success) {
            setSignups(prev => prev.filter(s => s.id !== id));
            showToast('Aanmelding verwijderd', 'success');
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
            showToast('Ouder aanmelding verwijderd', 'success');
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
            showToast('Blog opgeslagen', 'success');
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
            showToast('Blog verwijderd', 'success');
        } else {
            showToast(res.error || 'Verwijderen mislukt', 'error');
        }
        setDeletingBlogId(null);
    };

    const handleSavePlanning = async (item: Partial<IntroPlanningItem>): Promise<number | null> => {
        setSavingPlanning(true);
        const res = await upsertIntroPlanning(item);
        if (res.success) {
            await reloadPlanning();
            showToast('Planning item opgeslagen', 'success');
            setSavingPlanning(false);
            return res.data?.id ?? null;
        }
        showToast(res.error || 'Opslaan mislukt', 'error');
        setSavingPlanning(false);
        return null;
    };

    const handleDeletePlanning = async (id: number) => {
        if (!id || !confirm('Weet je zeker dat je dit planning item wilt verwijderen?')) return;
        setDeletingPlanningId(id);
        const res = await deleteIntroPlanning(id);
        if (res.success) {
            setPlanning(prev => prev.filter(p => p.id !== id));
            showToast('Planning item verwijderd', 'success');
        } else {
            showToast(res.error || 'Verwijderen mislukt', 'error');
        }
        setDeletingPlanningId(null);
    };

    const handleSaveConfidant = async (item: Partial<IntroConfidant>) => {
        setSavingConfidant(true);
        const res = await upsertIntroConfidant(item);
        if (res.success) {
            await reloadConfidants();
            showToast('Vertrouwenspersoon opgeslagen', 'success');
        } else {
            showToast(res.error || 'Opslaan mislukt', 'error');
        }
        setSavingConfidant(false);
    };

    const handleDeleteConfidant = async (id: number) => {
        if (!id || !confirm('Weet je zeker dat je deze vertrouwenspersoon wilt verwijderen?')) return;
        setDeletingConfidantId(id);
        const res = await deleteIntroConfidant(id);
        if (res.success) {
            setConfidants(prev => prev.filter(c => c.id !== id));
            showToast('Vertrouwenspersoon verwijderd', 'success');
        } else {
            showToast(res.error || 'Verwijderen mislukt', 'error');
        }
        setDeletingConfidantId(null);
    };

    const handleCreateGroup = async (data: Partial<IntroGroup>) => {
        setSavingGroup(true);
        const res = await createGroup(data);
        if (res.success) {
            await reloadGroups();
            showToast('Groepje aangemaakt', 'success');
        } else {
            showToast(res.error || 'Aanmaken mislukt', 'error');
        }
        setSavingGroup(false);
    };

    const handleUpdateGroup = async (id: number, data: Partial<IntroGroup>) => {
        setSavingGroup(true);
        const res = await updateGroup(id, data);
        if (res.success) {
            await reloadGroups();
            showToast('Groepje bijgewerkt', 'success');
        } else {
            showToast(res.error || 'Bijwerken mislukt', 'error');
        }
        setSavingGroup(false);
    };

    const handleDeleteGroup = async (id: number) => {
        setDeletingGroupId(id);
        const res = await deleteGroup(id);
        if (res.success) {
            setGroups(prev => prev.filter(g => g.id !== id));
            showToast('Groepje verwijderd', 'success');
        } else {
            showToast(res.error || 'Verwijderen mislukt', 'error');
        }
        setDeletingGroupId(null);
    };

    const handleAddGroupLeader = async (groupId: number, userId: string) => {
        const res = await addGroupLeader(groupId, userId);
        if (res.success) {
            await reloadGroups();
            showToast('Ouder toegevoegd', 'success');
        } else {
            showToast(res.error || 'Toevoegen mislukt', 'error');
        }
    };

    const handleRemoveGroupLeader = async (groupId: number, userId: string) => {
        const res = await removeGroupLeader(groupId, userId);
        if (res.success) {
            await reloadGroups();
            showToast('Ouder verwijderd', 'success');
        } else {
            showToast(res.error || 'Verwijderen mislukt', 'error');
        }
    };

    const handleExport = () => {
        const dateStr = new Date().toISOString().split('T')[0];

        if (activeTab === 'signups') {
            const data = signups.map(s => ({
                Voornaam: s.first_name,
                Achternaam: s.last_name,
                Email: s.email,
                Telefoon: s.phone_number,
                Geboortedatum: s.date_of_birth || '',
                'Favoriete GIF': s.favorite_gif || ''
            }));
            downloadCSV(data, `intro-aanmeldingen-${dateStr}.csv`);
        } else if (activeTab === 'parents') {
            const data = parents.map(p => ({
                Voornaam: p.first_name || '',
                Achternaam: p.last_name || '',
                Email: p.email || '',
                Telefoon: p.phone_number || '',
                Motivatie: p.motivation || ''
            }));
            downloadCSV(data, `intro-ouders-${dateStr}.csv`);
        }
    };

    return (
        <div className="w-full">
            <IntroFilters
                activeTab={activeTab}
                onTabChange={setActiveTab}
                onExport={handleExport}
                counts={{
                    signups: signups.length,
                    parents: parents.length,
                    blogs: blogs.length,
                    planning: planning.length,
                    confidants: confidants.length,
                    groups: groups.length
                }}
            />

            <div className="w-full mt-2">
                {activeTab === 'signups' && (
                    <IntroSignupsTab
                        signups={signups}
                        onDelete={handleDeleteSignup}
                        onUpdate={handleUpdateSignup}
                        onExport={handleExport}
                        deletingId={deletingSignupId}
                    />
                )}
                {activeTab === 'parents' && (
                    <IntroParentsTab
                        parents={parents}
                        onDelete={handleDeleteParent}
                        onUpdate={handleUpdateParentSignup}
                        onExport={handleExport}
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
                        initialPlanningImage={initialPlanningImage}
                        initialInfoBooklet={initialInfoBooklet}
                    />
                )}
                {activeTab === 'confidants' && (
                    <IntroConfidantsTab
                        confidants={confidants}
                        onSave={handleSaveConfidant}
                        onDelete={handleDeleteConfidant}
                        saving={savingConfidant}
                        deletingId={deletingConfidantId}
                    />
                )}
                {activeTab === 'groups' && (
                    <IntroGroupsTab
                        groups={groups}
                        approvedOuders={approvedOuders}
                        onCreate={handleCreateGroup}
                        onUpdate={handleUpdateGroup}
                        onDelete={handleDeleteGroup}
                        onAddLeader={handleAddGroupLeader}
                        onRemoveLeader={handleRemoveGroupLeader}
                        saving={savingGroup}
                        deletingId={deletingGroupId}
                    />
                )}
            </div>

            <AdminToast toast={toast} onClose={hideToast} />
        </div>
    );
}