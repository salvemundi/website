'use client';

import { useState, useCallback } from 'react';
import { Users, Heart, FileText, Calendar, Download, Mail, Plus, Trash2, Edit, Save, X, Search, Bell, ChevronDown, ChevronUp, Loader2, LayoutGrid, List, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
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
    const [activeTab, setActiveTab] = useState<TabType>('signups');

    // Data
    const [signups, setSignups] = useState(initialSignups);
    const [parents, setParents] = useState(initialParents);
    const [blogs, setBlogs] = useState(initialBlogs);
    const [planning, setPlanning] = useState(initialPlanning);
    const [introVisible, setIntroVisible] = useState(initialIntroVisible);

    // Search state
    const [signupSearch, setSignupSearch] = useState('');
    const [parentSearch, setParentSearch] = useState('');

    // Expand rows
    const [expandedSignups, setExpandedSignups] = useState<number[]>([]);
    const [expandedParents, setExpandedParents] = useState<number[]>([]);

    // Blog editing
    const [editingBlog, setEditingBlog] = useState<Partial<IntroBlog> | null>(null);
    const [savingBlog, setSavingBlog] = useState(false);

    // Planning editing
    const [editingPlanning, setEditingPlanning] = useState<Partial<IntroPlanningItem> | null>(null);
    const [savingPlanning, setSavingPlanning] = useState(false);
    const [planningView, setPlanningView] = useState<'calendar' | 'list'>('list');

    // Loading states
    const [deletingSignup, setDeletingSignup] = useState<number | null>(null);
    const [deletingParent, setDeletingParent] = useState<number | null>(null);
    const [deletingBlog, setDeletingBlog] = useState<number | null>(null);
    const [deletingPlanning, setDeletingPlanning] = useState<number | null>(null);
    const [togglingVisibility, setTogglingVisibility] = useState(false);

    // Notification modal
    const [showNotifModal, setShowNotifModal] = useState(false);
    const [notif, setNotif] = useState({ title: '', body: '', includeParents: false });
    const [sendingNotif, setSendingNotif] = useState(false);

    // Filtered data
    const filteredSignups = signups.filter(s => {
        if (!signupSearch) return true;
        const q = signupSearch.toLowerCase();
        return `${s.first_name} ${s.last_name}`.toLowerCase().includes(q) ||
            s.email.toLowerCase().includes(q) || s.phone_number.includes(q);
    });

    const filteredParents = parents.filter(p => {
        if (!parentSearch) return true;
        const q = parentSearch.toLowerCase();
        return `${p.first_name || ''} ${p.last_name || ''}`.toLowerCase().includes(q) ||
            (p.email || '').toLowerCase().includes(q);
    });

    // Reload helpers
    const reloadSignups = useCallback(async () => setSignups(await getIntroSignups()), []);
    const reloadParents = useCallback(async () => setParents(await getIntroParentSignups()), []);
    const reloadBlogs = useCallback(async () => setBlogs(await getIntroBlogs()), []);
    const reloadPlanning = useCallback(async () => setPlanning(await getIntroPlanning()), []);

    const handleDeleteSignup = async (id: number) => {
        if (!confirm('Weet je zeker dat je deze aanmelding wilt verwijderen?')) return;
        setDeletingSignup(id);
        const res = await deleteIntroSignup(id);
        if (res.success) setSignups(prev => prev.filter(s => s.id !== id));
        else alert(res.error || 'Verwijderen mislukt');
        setDeletingSignup(null);
    };

    const handleDeleteParent = async (id: number) => {
        if (!confirm('Weet je zeker dat je deze aanmelding wilt verwijderen?')) return;
        setDeletingParent(id);
        const res = await deleteIntroParentSignup(id);
        if (res.success) setParents(prev => prev.filter(p => p.id !== id));
        else alert(res.error || 'Verwijderen mislukt');
        setDeletingParent(null);
    };

    const handleSaveBlog = async () => {
        if (!editingBlog) return;
        if (!editingBlog.title || !editingBlog.content) { alert('Vul titel en content in.'); return; }
        setSavingBlog(true);
        const res = await upsertIntroBlog(editingBlog);
        if (res.success) { await reloadBlogs(); setEditingBlog(null); }
        else alert(res.error || 'Opslaan mislukt');
        setSavingBlog(false);
    };

    const handleDeleteBlog = async (id: number) => {
        if (!confirm('Weet je zeker dat je deze blog wilt verwijderen?')) return;
        setDeletingBlog(id);
        const res = await deleteIntroBlog(id);
        if (res.success) setBlogs(prev => prev.filter(b => b.id !== id));
        else alert(res.error || 'Verwijderen mislukt');
        setDeletingBlog(null);
    };

    const handleSavePlanning = async () => {
        if (!editingPlanning) return;
        if (!editingPlanning.date || !editingPlanning.time_start || !editingPlanning.title || !editingPlanning.description) {
            alert('Datum, starttijd, titel en beschrijving zijn verplicht.');
            return;
        }
        setSavingPlanning(true);
        const res = await upsertIntroPlanning(editingPlanning);
        if (res.success) { await reloadPlanning(); setEditingPlanning(null); }
        else alert(res.error || 'Opslaan mislukt');
        setSavingPlanning(false);
    };

    const handleDeletePlanning = async (id: number) => {
        if (!id || !confirm('Weet je zeker dat je dit planning item wilt verwijderen?')) return;
        setDeletingPlanning(id);
        const res = await deleteIntroPlanning(id);
        if (res.success) setPlanning(prev => prev.filter(p => p.id !== id));
        else alert(res.error || 'Verwijderen mislukt');
        setDeletingPlanning(null);
    };

    const handleToggleVisibility = async () => {
        setTogglingVisibility(true);
        const res = await toggleIntroVisibility(introVisible);
        if (res.success) setIntroVisible(res.show ?? !introVisible);
        else alert(res.error || 'Bijwerken mislukt');
        setTogglingVisibility(false);
    };

    const handleSendNotification = async () => {
        if (!notif.title || !notif.body) { alert('Vul een titel en bericht in'); return; }
        setSendingNotif(true);
        const res = await sendIntroCustomNotification(notif.title, notif.body, notif.includeParents);
        if (res.success) {
            alert(`Notificatie verstuurd naar ${res.sent ?? 0} gebruiker(s)!`);
            setShowNotifModal(false);
            setNotif({ title: '', body: '', includeParents: false });
        } else alert(res.error || 'Verzenden mislukt');
        setSendingNotif(false);
    };

    const exportSignupsToCSV = () => {
        const rows = [
            ['Voornaam', 'Tussenvoegsel', 'Achternaam', 'Email', 'Telefoon', 'Geboortedatum', 'Favoriete GIF', 'Aangemeld op'],
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
            ['Voornaam', 'Achternaam', 'Email', 'Telefoon', 'Motivatie', 'Aangemeld op'],
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

    const tabClass = (tab: TabType) => `flex items-center gap-2 px-5 py-3 font-semibold text-sm transition-colors border-b-2 ${
        activeTab === tab
            ? 'text-[var(--theme-purple)] border-[var(--theme-purple)]'
            : 'text-[var(--text-muted)] border-transparent hover:text-[var(--text-main)]'
    }`;

    return (
        <div className="container mx-auto px-4 py-8 max-w-7xl">
            {/* Visibility Toggle */}
            <div className="flex items-center justify-between mb-6 bg-[var(--bg-card)] rounded-2xl px-6 py-4 ring-1 ring-[var(--border-color)]">
                <div>
                    <p className="font-bold text-[var(--text-main)]">Intro zichtbaar voor publiek</p>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">Toggle of de intro sectie en inschrijfpagina zichtbaar zijn.</p>
                </div>
                <button
                    onClick={handleToggleVisibility}
                    disabled={togglingVisibility}
                    className={`relative w-14 h-7 rounded-full transition-colors disabled:opacity-50 ${introVisible ? 'bg-[var(--theme-purple)]' : 'bg-[var(--border-color)]'}`}
                >
                    {togglingVisibility
                        ? <Loader2 className="h-4 w-4 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-spin text-white" />
                        : <span className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-all ${introVisible ? 'left-8' : 'left-1'}`} />
                    }
                </button>
            </div>

            {/* Tabs */}
            <div className="flex flex-wrap gap-0 border-b border-[var(--border-color)] mb-8">
                <button onClick={() => setActiveTab('signups')} className={tabClass('signups')}>
                    <Users className="h-4 w-4" /> Aanmeldingen ({signups.length})
                </button>
                <button onClick={() => setActiveTab('parents')} className={tabClass('parents')}>
                    <Heart className="h-4 w-4" /> Ouders ({parents.length})
                </button>
                <button onClick={() => setActiveTab('blogs')} className={tabClass('blogs')}>
                    <FileText className="h-4 w-4" /> Blogs ({blogs.length})
                </button>
                <button onClick={() => setActiveTab('planning')} className={tabClass('planning')}>
                    <Calendar className="h-4 w-4" /> Planning ({planning.length})
                </button>
            </div>

            {/* ── Signups Tab ── */}
            {activeTab === 'signups' && (
                <div>
                    <div className="flex flex-col sm:flex-row gap-3 mb-5">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
                            <input
                                type="text"
                                placeholder="Zoek op naam, email of telefoon..."
                                value={signupSearch}
                                onChange={e => setSignupSearch(e.target.value)}
                                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-main)] text-sm focus:ring-2 focus:ring-[var(--theme-purple)] focus:outline-none"
                            />
                        </div>
                        <button onClick={() => {
                            const emails = signups.map(s => s.email).join(',');
                            window.location.href = `mailto:?bcc=${emails}&subject=Intro${encodeURIComponent(' Aanmeldingen')}`;
                        }} className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:opacity-90 transition">
                            <Mail className="h-4 w-4" /> Mail BCC
                        </button>
                        <button onClick={exportSignupsToCSV} className="flex items-center gap-2 px-4 py-2.5 bg-[var(--theme-success,_#22c55e)] text-white rounded-xl text-sm font-bold hover:opacity-90 transition">
                            <Download className="h-4 w-4" /> Export CSV
                        </button>
                    </div>

                    <div className="bg-[var(--bg-card)] rounded-2xl ring-1 ring-[var(--border-color)] overflow-hidden">
                        {filteredSignups.length === 0 ? (
                            <div className="py-16 text-center text-[var(--text-muted)]">
                                <AlertCircle className="h-10 w-10 mx-auto mb-3 opacity-30" />
                                <p>Geen aanmeldingen gevonden</p>
                            </div>
                        ) : (
                            <table className="w-full text-sm">
                                <thead className="bg-[var(--bg-card-soft,_#f8f8f8)] border-b border-[var(--border-color)]">
                                    <tr>
                                        <th className="px-5 py-3 text-left font-semibold text-[var(--text-muted)] text-xs uppercase tracking-wider">Naam</th>
                                        <th className="px-5 py-3 text-left font-semibold text-[var(--text-muted)] text-xs uppercase tracking-wider hidden sm:table-cell">Email</th>
                                        <th className="px-5 py-3 text-left font-semibold text-[var(--text-muted)] text-xs uppercase tracking-wider hidden md:table-cell">Telefoon</th>
                                        <th className="px-5 py-3 text-right font-semibold text-[var(--text-muted)] text-xs uppercase tracking-wider">Acties</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--border-color)]">
                                    {filteredSignups.map(s => (
                                        <>
                                            <tr key={s.id} className="hover:bg-[var(--bg-card-soft,_#f8f8f8)] transition-colors">
                                                <td className="px-5 py-3">
                                                    <button
                                                        onClick={() => setExpandedSignups(prev => prev.includes(s.id) ? prev.filter(x => x !== s.id) : [...prev, s.id])}
                                                        className="flex items-center gap-1.5 text-[var(--text-main)] font-medium hover:text-[var(--theme-purple)]"
                                                    >
                                                        {expandedSignups.includes(s.id) ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                                                        {s.first_name} {s.last_name}
                                                    </button>
                                                </td>
                                                <td className="px-5 py-3 text-[var(--text-muted)] hidden sm:table-cell">{s.email}</td>
                                                <td className="px-5 py-3 text-[var(--text-muted)] hidden md:table-cell">{s.phone_number}</td>
                                                <td className="px-5 py-3 text-right">
                                                    <button
                                                        onClick={() => handleDeleteSignup(s.id)}
                                                        disabled={deletingSignup === s.id}
                                                        className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                                                    >
                                                        {deletingSignup === s.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                                    </button>
                                                </td>
                                            </tr>
                                            {expandedSignups.includes(s.id) && (
                                                <tr key={`${s.id}-expanded`} className="bg-[var(--bg-card-soft,_#f8f8f8)]">
                                                    <td colSpan={5} className="px-8 py-3 text-sm text-[var(--text-muted)] space-y-1">
                                                        {s.date_of_birth && <p><strong>Geboortedatum:</strong> {s.date_of_birth}</p>}
                                                        {s.favorite_gif && <p><strong>Favoriete GIF:</strong> <a href={s.favorite_gif} target="_blank" rel="noopener noreferrer" className="text-[var(--theme-purple)] hover:underline">Bekijk</a></p>}
                                                        <p className="block sm:hidden"><strong>Email:</strong> {s.email}</p>
                                                    </td>
                                                </tr>
                                            )}
                                        </>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            )}

            {/* ── Parents Tab ── */}
            {activeTab === 'parents' && (
                <div>
                    <div className="flex flex-col sm:flex-row gap-3 mb-5">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
                            <input
                                type="text"
                                placeholder="Zoek op naam of email..."
                                value={parentSearch}
                                onChange={e => setParentSearch(e.target.value)}
                                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-main)] text-sm focus:ring-2 focus:ring-[var(--theme-purple)] focus:outline-none"
                            />
                        </div>
                        <button onClick={() => setShowNotifModal(true)} className="flex items-center gap-2 px-4 py-2.5 bg-[var(--theme-purple)] text-white rounded-xl text-sm font-bold hover:opacity-90 transition">
                            <Bell className="h-4 w-4" /> Notificatie sturen
                        </button>
                        <button onClick={exportParentsToCSV} className="flex items-center gap-2 px-4 py-2.5 bg-[var(--theme-success,_#22c55e)] text-white rounded-xl text-sm font-bold hover:opacity-90 transition">
                            <Download className="h-4 w-4" /> Export CSV
                        </button>
                    </div>

                    <div className="bg-[var(--bg-card)] rounded-2xl ring-1 ring-[var(--border-color)] overflow-hidden">
                        {filteredParents.length === 0 ? (
                            <div className="py-16 text-center text-[var(--text-muted)]">
                                <AlertCircle className="h-10 w-10 mx-auto mb-3 opacity-30" />
                                <p>Geen ouder-aanmeldingen gevonden</p>
                            </div>
                        ) : (
                            <table className="w-full text-sm">
                                <thead className="bg-[var(--bg-card-soft,_#f8f8f8)] border-b border-[var(--border-color)]">
                                    <tr>
                                        <th className="px-5 py-3 text-left font-semibold text-[var(--text-muted)] text-xs uppercase tracking-wider">Naam</th>
                                        <th className="px-5 py-3 text-left font-semibold text-[var(--text-muted)] text-xs uppercase tracking-wider hidden sm:table-cell">Email</th>
                                        <th className="px-5 py-3 text-left font-semibold text-[var(--text-muted)] text-xs uppercase tracking-wider hidden md:table-cell">Telefoon</th>
                                        <th className="px-5 py-3 text-right font-semibold text-[var(--text-muted)] text-xs uppercase tracking-wider">Acties</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--border-color)]">
                                    {filteredParents.map(p => (
                                        <>
                                            <tr key={p.id} className="hover:bg-[var(--bg-card-soft,_#f8f8f8)] transition-colors">
                                                <td className="px-5 py-3">
                                                    <button
                                                        onClick={() => setExpandedParents(prev => prev.includes(p.id) ? prev.filter(x => x !== p.id) : [...prev, p.id])}
                                                        className="flex items-center gap-1.5 text-[var(--text-main)] font-medium hover:text-[var(--theme-purple)]"
                                                    >
                                                        {expandedParents.includes(p.id) ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                                                        {p.first_name} {p.last_name}
                                                    </button>
                                                </td>
                                                <td className="px-5 py-3 text-[var(--text-muted)] hidden sm:table-cell">{p.email}</td>
                                                <td className="px-5 py-3 text-[var(--text-muted)] hidden md:table-cell">{p.phone_number}</td>
                                                <td className="px-5 py-3 text-right">
                                                    <button
                                                        onClick={() => handleDeleteParent(p.id)}
                                                        disabled={deletingParent === p.id}
                                                        className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                                                    >
                                                        {deletingParent === p.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                                    </button>
                                                </td>
                                            </tr>
                                            {expandedParents.includes(p.id) && p.motivation && (
                                                <tr key={`${p.id}-expanded`} className="bg-[var(--bg-card-soft,_#f8f8f8)]">
                                                    <td colSpan={4} className="px-8 py-3 text-sm text-[var(--text-muted)]">
                                                        <strong>Motivatie:</strong> {p.motivation}
                                                    </td>
                                                </tr>
                                            )}
                                        </>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            )}

            {/* ── Blogs Tab ── */}
            {activeTab === 'blogs' && (
                <div>
                    {/* Blog Form */}
                    {editingBlog !== null ? (
                        <div className="bg-[var(--bg-card)] rounded-2xl ring-1 ring-[var(--border-color)] p-6 mb-6">
                            <h3 className="font-bold text-lg text-[var(--text-main)] mb-5">
                                {editingBlog.id ? 'Blog Bewerken' : 'Nieuwe Blog'}
                            </h3>
                            <div className="space-y-4">
                                <Field label="Titel *">
                                    <input type="text" value={editingBlog.title || ''} onChange={e => setEditingBlog({ ...editingBlog, title: e.target.value })} className={inputClass} />
                                </Field>
                                <Field label="Slug">
                                    <input type="text" value={editingBlog.slug || ''} onChange={e => setEditingBlog({ ...editingBlog, slug: e.target.value })} className={inputClass} />
                                </Field>
                                <Field label="Excerpt">
                                    <textarea value={editingBlog.excerpt || ''} onChange={e => setEditingBlog({ ...editingBlog, excerpt: e.target.value })} rows={2} className={inputClass} />
                                </Field>
                                <Field label="Content *">
                                    <textarea value={editingBlog.content || ''} onChange={e => setEditingBlog({ ...editingBlog, content: e.target.value })} rows={6} className={inputClass} />
                                </Field>
                                <Field label="Type">
                                    <select value={editingBlog.blog_type || 'update'} onChange={e => setEditingBlog({ ...editingBlog, blog_type: e.target.value as any })} className={inputClass}>
                                        <option value="update">Update</option>
                                        <option value="pictures">Foto's</option>
                                        <option value="event">Event</option>
                                        <option value="announcement">Aankondiging</option>
                                    </select>
                                </Field>
                                <div className="flex items-center gap-2">
                                    <input type="checkbox" id="blog-published" checked={editingBlog.is_published || false} onChange={e => setEditingBlog({ ...editingBlog, is_published: e.target.checked })} className="rounded" />
                                    <label htmlFor="blog-published" className="text-sm font-medium text-[var(--text-main)]">Gepubliceerd</label>
                                </div>
                                <div className="flex gap-3 pt-2">
                                    <button onClick={handleSaveBlog} disabled={savingBlog} className="flex items-center gap-2 px-5 py-2.5 bg-[var(--theme-purple)] text-white rounded-xl font-bold text-sm hover:opacity-90 transition disabled:opacity-50">
                                        {savingBlog ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Opslaan
                                    </button>
                                    <button onClick={() => setEditingBlog(null)} className="px-5 py-2.5 rounded-xl text-sm font-bold text-[var(--text-muted)] hover:bg-[var(--border-color)] transition">Annuleren</button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <button onClick={() => setEditingBlog({ title: '', content: '', blog_type: 'update', is_published: false })} className="flex items-center gap-2 px-5 py-2.5 bg-[var(--theme-purple)] text-white rounded-xl font-bold text-sm hover:opacity-90 transition mb-6">
                            <Plus className="h-4 w-4" /> Nieuwe Blog
                        </button>
                    )}

                    <div className="grid gap-4">
                        {blogs.map(blog => (
                            <div key={blog.id} className="bg-[var(--bg-card)] rounded-2xl ring-1 ring-[var(--border-color)] p-5 flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h4 className="font-bold text-[var(--text-main)] truncate">{blog.title}</h4>
                                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${blog.is_published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                            {blog.is_published ? 'Gepubliceerd' : 'Concept'}
                                        </span>
                                    </div>
                                    <p className="text-xs text-[var(--text-muted)]">{blog.blog_type}</p>
                                    {blog.excerpt && <p className="text-sm text-[var(--text-muted)] mt-1 line-clamp-2">{blog.excerpt}</p>}
                                </div>
                                <div className="flex gap-2 flex-shrink-0">
                                    <button onClick={() => setEditingBlog(blog)} className="p-2 text-[var(--theme-purple)] hover:bg-[var(--theme-purple)]/10 rounded-lg transition"><Edit className="h-4 w-4" /></button>
                                    <button onClick={() => handleDeleteBlog(blog.id!)} disabled={deletingBlog === blog.id} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition">
                                        {deletingBlog === blog.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>
                        ))}
                        {blogs.length === 0 && (
                            <div className="py-16 text-center text-[var(--text-muted)]">
                                <FileText className="h-10 w-10 mx-auto mb-3 opacity-30" />
                                <p>Nog geen blogs aangemaakt</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── Planning Tab ── */}
            {activeTab === 'planning' && (
                <div>
                    <div className="flex items-center justify-between mb-6">
                        {editingPlanning === null && (
                            <button onClick={() => setEditingPlanning({ date: '', time_start: '', title: '', description: '' })} className="flex items-center gap-2 px-5 py-2.5 bg-[var(--theme-purple)] text-white rounded-xl font-bold text-sm hover:opacity-90 transition">
                                <Plus className="h-4 w-4" /> Nieuw Item
                            </button>
                        )}
                        <div className="flex gap-1 bg-[var(--bg-card)] ring-1 ring-[var(--border-color)] rounded-xl p-1 ml-auto">
                            <button onClick={() => setPlanningView('list')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold transition ${planningView === 'list' ? 'bg-[var(--theme-purple)] text-white' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}>
                                <List className="h-4 w-4" /> Lijst
                            </button>
                            <button onClick={() => setPlanningView('calendar')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold transition ${planningView === 'calendar' ? 'bg-[var(--theme-purple)] text-white' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}>
                                <LayoutGrid className="h-4 w-4" /> Kalender
                            </button>
                        </div>
                    </div>

                    {/* Planning Form */}
                    {editingPlanning !== null && (
                        <div className="bg-[var(--bg-card)] rounded-2xl ring-1 ring-[var(--border-color)] p-6 mb-6">
                            <h3 className="font-bold text-lg text-[var(--text-main)] mb-5">
                                {editingPlanning.id ? 'Planning Bewerken' : 'Nieuw Planning Item'}
                            </h3>
                            <div className="space-y-4">
                                <Field label="Datum *">
                                    <input type="date" value={editingPlanning.date || ''} onChange={e => setEditingPlanning({ ...editingPlanning, date: e.target.value })} className={inputClass} />
                                </Field>
                                <div className="grid grid-cols-2 gap-4">
                                    <Field label="Starttijd *">
                                        <input type="time" value={editingPlanning.time_start || ''} onChange={e => setEditingPlanning({ ...editingPlanning, time_start: e.target.value })} className={inputClass} />
                                    </Field>
                                    <Field label="Eindtijd">
                                        <input type="time" value={editingPlanning.time_end || ''} onChange={e => setEditingPlanning({ ...editingPlanning, time_end: e.target.value })} className={inputClass} />
                                    </Field>
                                </div>
                                <Field label="Titel *">
                                    <input type="text" value={editingPlanning.title || ''} onChange={e => setEditingPlanning({ ...editingPlanning, title: e.target.value })} className={inputClass} />
                                </Field>
                                <Field label="Beschrijving *">
                                    <textarea value={editingPlanning.description || ''} onChange={e => setEditingPlanning({ ...editingPlanning, description: e.target.value })} rows={3} className={inputClass} />
                                </Field>
                                <Field label="Locatie">
                                    <input type="text" value={editingPlanning.location || ''} onChange={e => setEditingPlanning({ ...editingPlanning, location: e.target.value })} className={inputClass} />
                                </Field>
                                <div className="flex gap-3 pt-2">
                                    <button onClick={handleSavePlanning} disabled={savingPlanning} className="flex items-center gap-2 px-5 py-2.5 bg-[var(--theme-purple)] text-white rounded-xl font-bold text-sm hover:opacity-90 transition disabled:opacity-50">
                                        {savingPlanning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Opslaan
                                    </button>
                                    <button onClick={() => setEditingPlanning(null)} className="px-5 py-2.5 rounded-xl text-sm font-bold text-[var(--text-muted)] hover:bg-[var(--border-color)] transition">Annuleren</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* List view */}
                    {planningView === 'list' && (
                        <div className="grid gap-3">
                            {planning.map(item => (
                                <div key={item.id} className="bg-[var(--bg-card)] rounded-2xl ring-1 ring-[var(--border-color)] p-5 flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs font-bold text-[var(--theme-purple)] uppercase">{item.day || ''}</span>
                                            {item.date && <span className="text-xs text-[var(--text-muted)]">{format(new Date(item.date), 'd MMM yyyy', { locale: nl })}</span>}
                                        </div>
                                        <h4 className="font-bold text-[var(--text-main)]">{item.title}</h4>
                                        <p className="text-xs text-[var(--text-muted)] mt-0.5">{item.time_start}{item.time_end ? ` - ${item.time_end}` : ''}{item.location ? ` · ${item.location}` : ''}</p>
                                        {item.description && <p className="text-sm text-[var(--text-muted)] mt-1">{item.description}</p>}
                                    </div>
                                    <div className="flex gap-2 flex-shrink-0">
                                        <button onClick={() => setEditingPlanning(item)} className="p-2 text-[var(--theme-purple)] hover:bg-[var(--theme-purple)]/10 rounded-lg transition"><Edit className="h-4 w-4" /></button>
                                        <button onClick={() => handleDeletePlanning(item.id!)} disabled={deletingPlanning === item.id} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition">
                                            {deletingPlanning === item.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {planning.length === 0 && (
                                <div className="py-16 text-center text-[var(--text-muted)]">
                                    <Calendar className="h-10 w-10 mx-auto mb-3 opacity-30" />
                                    <p>Geen planning items aangemaakt</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Calendar view - day-based grid */}
                    {planningView === 'calendar' && planning.length > 0 && (() => {
                        const dayOrder = ['maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag', 'zondag'];
                        const byDay = planning.reduce((acc, item) => {
                            const key = (item.day || 'overig').toLowerCase();
                            if (!acc[key]) acc[key] = [];
                            acc[key].push(item);
                            return acc;
                        }, {} as Record<string, IntroPlanningItem[]>);
                        const sorted = Object.keys(byDay).sort((a, b) => dayOrder.indexOf(a) - dayOrder.indexOf(b));
                        return (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {sorted.map(day => (
                                    <div key={day} className="bg-[var(--bg-card)] rounded-2xl ring-1 ring-[var(--border-color)] p-4">
                                        <h3 className="font-black text-[var(--theme-purple)] uppercase text-sm mb-3 capitalize">{day}</h3>
                                        <div className="space-y-2">
                                            {byDay[day].sort((a, b) => (a.time_start || '').localeCompare(b.time_start || '')).map(item => (
                                                <div key={item.id} className="bg-[var(--bg-card-soft,_#f8f8f8)] rounded-xl p-3">
                                                    <div className="flex items-start justify-between gap-1">
                                                        <div>
                                                            <p className="font-bold text-sm text-[var(--text-main)]">{item.title}</p>
                                                            <p className="text-xs text-[var(--text-muted)]">{item.time_start}{item.time_end ? ` - ${item.time_end}` : ''}</p>
                                                        </div>
                                                        <div className="flex gap-1">
                                                            <button onClick={() => setEditingPlanning(item)} className="p-1 text-[var(--theme-purple)] hover:opacity-70 transition"><Edit className="h-3.5 w-3.5" /></button>
                                                            <button onClick={() => handleDeletePlanning(item.id!)} className="p-1 text-red-500 hover:opacity-70 transition"><Trash2 className="h-3.5 w-3.5" /></button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        );
                    })()}
                </div>
            )}

            {/* Notification Modal */}
            {showNotifModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-[var(--bg-card)] rounded-2xl shadow-2xl max-w-md w-full p-6">
                        <div className="flex items-center justify-between mb-5">
                            <h3 className="font-bold text-lg text-[var(--text-main)]">Push Notificatie Sturen</h3>
                            <button onClick={() => setShowNotifModal(false)} className="p-2 text-[var(--text-muted)] hover:text-[var(--text-main)] rounded-lg transition"><X className="h-5 w-5" /></button>
                        </div>
                        <div className="space-y-4">
                            <Field label="Titel">
                                <input type="text" value={notif.title} onChange={e => setNotif({ ...notif, title: e.target.value })} placeholder="Notificatie titel" className={inputClass} />
                            </Field>
                            <Field label="Bericht">
                                <textarea value={notif.body} onChange={e => setNotif({ ...notif, body: e.target.value })} rows={4} placeholder="Notificatie bericht" className={inputClass} />
                            </Field>
                            <div className="flex items-center gap-2">
                                <input type="checkbox" id="include-parents" checked={notif.includeParents} onChange={e => setNotif({ ...notif, includeParents: e.target.checked })} className="rounded" />
                                <label htmlFor="include-parents" className="text-sm text-[var(--text-main)]">Verstuur naar Intro Ouders (met account)</label>
                            </div>
                            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-3 text-xs text-yellow-700 dark:text-yellow-300">
                                Intro aanmeldingen zijn anoniem; notificaties gaan alleen naar ingelogde Intro Ouders.
                            </div>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button onClick={handleSendNotification} disabled={sendingNotif || !notif.includeParents} className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 bg-[var(--theme-purple)] text-white rounded-xl font-bold text-sm hover:opacity-90 transition disabled:opacity-40">
                                {sendingNotif ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bell className="h-4 w-4" />}
                                {sendingNotif ? 'Verzenden...' : 'Versturen'}
                            </button>
                            <button onClick={() => setShowNotifModal(false)} disabled={sendingNotif} className="px-5 py-2.5 rounded-xl text-sm font-bold text-[var(--text-muted)] border border-[var(--border-color)] hover:bg-[var(--border-color)] transition">Annuleren</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

const inputClass = 'w-full px-4 py-2.5 rounded-xl bg-[var(--bg-main,_#f4f4f5)] border border-[var(--border-color)] text-[var(--text-main)] text-sm focus:ring-2 focus:ring-[var(--theme-purple)] focus:outline-none transition';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">{label}</label>
            {children}
        </div>
    );
}
