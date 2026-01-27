'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { usePathname } from 'next/navigation';
import PageHeader from '@/widgets/page-header/ui/PageHeader';
import { 
    introSignupsApi, 
    introParentSignupsApi, 
    introBlogsApi, 
    introPlanningApi,
    IntroSignup,
    IntroParentSignup,
    IntroBlog,
    IntroPlanningItem
    , getImageUrl
} from '@/shared/lib/api/salvemundi';
import { 
    Users, 
    Heart, 
    FileText, 
    Calendar, 
    Edit, 
    Trash2, 
    Plus,
    Save,
    Search,
    Loader2,
    ChevronDown,
    ChevronUp,
    LayoutGrid,
    List
} from 'lucide-react';
import { siteSettingsMutations } from '@/shared/lib/api/salvemundi';
import { useSalvemundiSiteSettings } from '@/shared/lib/hooks/useSalvemundiApi';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import * as XLSX from 'xlsx';

type TabType = 'signups' | 'parents' | 'blogs' | 'planning';

export default function IntroAdminPage() {
    const pathname = usePathname();
    const searchParams = typeof window !== 'undefined' ? useSearchParams?.() : null;
    const [activeTab, setActiveTab] = useState<TabType>('signups');
    const [isLoading, setIsLoading] = useState(true);
    const { data: introSettings, refetch: refetchIntroSettings } = useSalvemundiSiteSettings('intro');
    
    // Signups
    const [signups, setSignups] = useState<IntroSignup[]>([]);
    const [filteredSignups, setFilteredSignups] = useState<IntroSignup[]>([]);
    const [signupSearchQuery, setSignupSearchQuery] = useState('');
    
    // Parent Signups
    const [parentSignups, setParentSignups] = useState<IntroParentSignup[]>([]);
    const [filteredParentSignups, setFilteredParentSignups] = useState<IntroParentSignup[]>([]);
    const [parentSearchQuery, setParentSearchQuery] = useState('');
    
    // Blogs
    const [blogs, setBlogs] = useState<IntroBlog[]>([]);
    const [editingBlog, setEditingBlog] = useState<Partial<IntroBlog> | null>(null);
    const [isCreatingBlog, setIsCreatingBlog] = useState(false);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    
    // Planning
    const [planning, setPlanning] = useState<IntroPlanningItem[]>([]);
    const [editingPlanning, setEditingPlanning] = useState<Partial<IntroPlanningItem> | null>(null);
    const [isCreatingPlanning, setIsCreatingPlanning] = useState(false);
    const [planningViewMode, setPlanningViewMode] = useState<'calendar' | 'list'>('calendar');

    // Expanded items
    const [expandedSignups, setExpandedSignups] = useState<number[]>([]);
    const [expandedParents, setExpandedParents] = useState<number[]>([]);

    useEffect(() => {
        loadData();
    }, [activeTab]);

    // Handle incoming query params to open specific tab/form (e.g. from admin quick actions)
    useEffect(() => {
        try {
            if (!searchParams) return;
            const tab = searchParams.get('tab');
            const create = searchParams.get('create');
            if (tab && (tab === 'signups' || tab === 'parents' || tab === 'blogs' || tab === 'planning')) {
                setActiveTab(tab as TabType);
            }
            if (tab === 'blogs' && create === '1') {
                // open the new blog editor
                setEditingBlog({
                    title: '',
                    content: '',
                    excerpt: '',
                    blog_type: 'update',
                    is_published: false
                });
                setIsCreatingBlog(true);
                // scroll into view after a tick
                setTimeout(() => {
                    const el = document.querySelector('[data-new-blog-form]');
                    if (el && typeof (el as HTMLElement).scrollIntoView === 'function') {
                        (el as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                }, 100);
            }
        } catch (err) {
            // ignore
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Load all data on mount to populate tab counts immediately
    useEffect(() => {
        loadAllDataForCounts();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const loadAllDataForCounts = async () => {
        try {
            const [signupsData, parentsData, blogsData, planningData] = await Promise.all([
                introSignupsApi.getAll(),
                introParentSignupsApi.getAll(),
                introBlogsApi.getAllAdmin(),
                introPlanningApi.getAllAdmin()
            ]);
            setSignups(signupsData);
            setParentSignups(parentsData);
            setBlogs(blogsData);
            setPlanning(planningData);
        } catch (error) {
            console.error('Failed to load counts:', error);
        }
    };

    // Ensure we refresh data whenever this route becomes active (client-side navigation)
    useEffect(() => {
        if (pathname === '/admin/intro') {
            // loadData already manages loading state; call to refresh counts when opening panel
            loadData();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pathname]);

    useEffect(() => {
        filterSignups();
    }, [signups, signupSearchQuery]);

    useEffect(() => {
        filterParentSignups();
    }, [parentSignups, parentSearchQuery]);

    const loadData = async () => {
        setIsLoading(true);
        try {
            if (activeTab === 'signups') {
                const data = await introSignupsApi.getAll();
                setSignups(data);
            } else if (activeTab === 'parents') {
                const data = await introParentSignupsApi.getAll();
                setParentSignups(data);
            } else if (activeTab === 'blogs') {
                const data = await introBlogsApi.getAllAdmin();
                setBlogs(data);
            } else if (activeTab === 'planning') {
                const data = await introPlanningApi.getAllAdmin();
                setPlanning(data);
            }
        } catch (error) {
            console.error('Failed to load data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const filterSignups = () => {
        if (!signupSearchQuery) {
            setFilteredSignups(signups);
            return;
        }
        const query = signupSearchQuery.toLowerCase();
        setFilteredSignups(signups.filter(s => 
            `${s.first_name} ${s.middle_name || ''} ${s.last_name}`.toLowerCase().includes(query) ||
            s.email.toLowerCase().includes(query) ||
            s.phone_number.includes(query)
        ));
    };

    const filterParentSignups = () => {
        if (!parentSearchQuery) {
            setFilteredParentSignups(parentSignups);
            return;
        }
        const query = parentSearchQuery.toLowerCase();
        setFilteredParentSignups(parentSignups.filter(s => 
            `${s.first_name} ${s.last_name}`.toLowerCase().includes(query) ||
            s.email.toLowerCase().includes(query) ||
            s.phone_number.includes(query)
        ));
    };

    const handleDeleteSignup = async (id: number) => {
        if (!confirm('Weet je zeker dat je deze aanmelding wilt verwijderen?')) return;
        try {
            await introSignupsApi.delete(id);
            setSignups(signups.filter(s => s.id !== id));
        } catch (error) {
            console.error('Failed to delete signup:', error);
            alert('Er is een fout opgetreden bij het verwijderen.');
        }
    };

    const handleDeleteParentSignup = async (id: number) => {
        if (!confirm('Weet je zeker dat je deze aanmelding wilt verwijderen?')) return;
        try {
            await introParentSignupsApi.delete(id);
            setParentSignups(parentSignups.filter(s => s.id !== id));
        } catch (error) {
            console.error('Failed to delete parent signup:', error);
            alert('Er is een fout opgetreden bij het verwijderen.');
        }
    };

    const handleSaveBlog = async () => {
        if (!editingBlog) return;
        try {
            // upload image if a file was selected
            let uploadedImageId: string | null = null;
            if (imageFile) {
                uploadedImageId = await uploadImage();
            }

            const payload: any = { ...editingBlog };
            if (uploadedImageId) payload.image = uploadedImageId;

            if (editingBlog.id) {
                await introBlogsApi.update(editingBlog.id, payload);
                setBlogs(blogs.map(b => b.id === editingBlog.id ? { ...b, ...payload } as IntroBlog : b));
            } else {
                const newBlog = await introBlogsApi.create(payload);
                setBlogs([newBlog, ...blogs]);
            }
            setEditingBlog(null);
            setIsCreatingBlog(false);
        } catch (error) {
            console.error('Failed to save blog:', error);
            alert('Er is een fout opgetreden bij het opslaan.');
        }
    };

    const uploadImage = async (): Promise<string | null> => {
        if (!imageFile) return null;
        try {
            const fd = new FormData();
            fd.append('file', imageFile);

            const resp = await fetch('/api/files', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
                },
                body: fd
            });

            if (!resp.ok) {
                console.error('Upload failed', await resp.text());
                return null;
            }
            const json = await resp.json();
            return json.data?.id || null;
        } catch (err) {
            console.error('Upload error', err);
            return null;
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0] || null;
        setImageFile(f);
        if (f) {
            const reader = new FileReader();
            reader.onloadend = () => setImagePreview(reader.result as string);
            reader.readAsDataURL(f);
        } else {
            setImagePreview(null);
        }
    };

    const removeImage = () => {
        setImageFile(null);
        setImagePreview(null);
        if (editingBlog) setEditingBlog({ ...editingBlog, image: undefined });
    };

    const handleDeleteBlog = async (id: number) => {
        if (!confirm('Weet je zeker dat je deze blog wilt verwijderen?')) return;
        try {
            await introBlogsApi.delete(id);
            setBlogs(blogs.filter(b => b.id !== id));
        } catch (error) {
            console.error('Failed to delete blog:', error);
            alert('Er is een fout opgetreden bij het verwijderen.');
        }
    };

    const computeDayFromDate = (dateStr?: string) => {
        try {
            if (!dateStr) return '';
            const d = new Date(dateStr);
            return d.toLocaleDateString('nl-NL', { weekday: 'long' });
        } catch {
            return '';
        }
    };

    const handleSavePlanning = async () => {
        if (!editingPlanning) return;

        // Basic validation: date, title, description required
        if (!editingPlanning.date || !editingPlanning.title || !editingPlanning.description) {
            alert('Datum, titel en beschrijving zijn verplicht.');
            return;
        }

        // Auto-fill day based on date
        const day = computeDayFromDate(editingPlanning.date as string);
        const payload = { ...editingPlanning, day } as any;

        try {
            if (editingPlanning.id) {
                await introPlanningApi.update(editingPlanning.id, payload);
                setPlanning(planning.map(p => p.id === editingPlanning.id ? { ...p, ...payload } as IntroPlanningItem : p));
            } else {
                const newPlanning = await introPlanningApi.create(payload as any);
                setPlanning([...planning, newPlanning]);
            }
            setEditingPlanning(null);
            setIsCreatingPlanning(false);
        } catch (error) {
            console.error('Failed to save planning:', error);
            alert('Er is een fout opgetreden bij het opslaan.');
        }
    };

    const handleDeletePlanning = async (id: number) => {
        if (!confirm('Weet je zeker dat je dit planning item wilt verwijderen?')) return;
        try {
            await introPlanningApi.delete(id);
            setPlanning(planning.filter(p => p.id !== id));
        } catch (error) {
            console.error('Failed to delete planning:', error);
            alert('Er is een fout opgetreden bij het verwijderen.');
        }
    };

    const exportSignupsToExcel = () => {
        const data = signups.map(s => ({
            'Voornaam': s.first_name,
            'Tussenvoegsel': s.middle_name || '',
            'Achternaam': s.last_name,
            'Geboortedatum': s.date_of_birth,
            'Email': s.email,
            'Telefoonnummer': s.phone_number,
            'Favoriete GIF': s.favorite_gif || '',
            'Aangemeld op': format(new Date(s.created_at), 'dd-MM-yyyy HH:mm', { locale: nl })
        }));

        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Intro Aanmeldingen');
        XLSX.writeFile(workbook, `intro-aanmeldingen-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
    };

    const exportParentSignupsToExcel = () => {
        const data = parentSignups.map(s => ({
            'Voornaam': s.first_name,
            'Achternaam': s.last_name,
            'Email': s.email,
            'Telefoonnummer': s.phone_number,
            'Motivatie': s.motivation || '',
            'Aangemeld op': s.created_at ? format(new Date(s.created_at), 'dd-MM-yyyy HH:mm', { locale: nl }) : ''
        }));

        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Intro Ouders');
        XLSX.writeFile(workbook, `intro-ouders-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
    };

    const toggleExpandSignup = (id: number) => {
        setExpandedSignups(prev => 
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const toggleExpandParent = (id: number) => {
        setExpandedParents(prev => 
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    return (
        <>
            <PageHeader title="Intro Beheer" />
            
            <div className="container mx-auto px-4 py-8 max-w-7xl">
                {/* Tabs */}
                <div className="flex flex-wrap gap-2 mb-6 border-b border-admin-border">
                    <button
                        onClick={() => setActiveTab('signups')}
                        className={`px-6 py-3 font-semibold transition-colors ${
                            activeTab === 'signups'
                                ? 'text-theme-purple border-b-2 border-theme-purple'
                                : 'text-admin-muted hover:text-admin'
                        }`}
                    >
                        <Users className="inline h-5 w-5 mr-2" />
                        Aanmeldingen ({signups.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('parents')}
                        className={`px-6 py-3 font-semibold transition-colors ${
                            activeTab === 'parents'
                                ? 'text-theme-purple border-b-2 border-theme-purple'
                                : 'text-admin-muted hover:text-admin'
                        }`}
                    >
                        <Heart className="inline h-5 w-5 mr-2" />
                        Intro Ouders ({parentSignups.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('blogs')}
                        className={`px-6 py-3 font-semibold transition-colors ${
                            activeTab === 'blogs'
                                ? 'text-theme-purple border-b-2 border-theme-purple'
                                : 'text-admin-muted hover:text-admin'
                        }`}
                    >
                        <FileText className="inline h-5 w-5 mr-2" />
                        Blogs ({blogs.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('planning')}
                        className={`px-6 py-3 font-semibold transition-colors ${
                            activeTab === 'planning'
                                ? 'text-theme-purple border-b-2 border-theme-purple'
                                : 'text-admin-muted hover:text-admin'
                        }`}
                    >
                        <Calendar className="inline h-5 w-5 mr-2" />
                        Planning ({planning.length})
                    </button>
                </div>

                {/* Visibility toggle */}
                <div className="mb-6 flex items-center gap-4">
                    <label className="text-sm font-medium">Intro zichtbaar</label>
                    <button
                        onClick={async () => {
                            const current = introSettings?.show ?? true;
                            try {
                                await siteSettingsMutations.upsertByPage('intro', { show: !current });
                                await refetchIntroSettings();
                                // reload data to reflect visibility change if needed
                                loadData();
                            } catch (err) {
                                console.error('Failed to toggle intro visibility', err);
                                alert('Fout bij het bijwerken van de zichtbaarheid voor Intro');
                            }
                        }}
                        className={`w-12 h-6 rounded-full p-0.5 transition ${introSettings?.show ? 'bg-green-500' : 'bg-gray-300'}`}
                        aria-pressed={introSettings?.show ?? true}
                    >
                        <span className={`block w-5 h-5 bg-white rounded-full transform transition ${introSettings?.show ? 'translate-x-6' : 'translate-x-0'}`} />
                    </button>
                </div>

                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-theme-purple" />
                    </div>
                ) : (
                    <>
                        {/* Signups Tab */}
                        {activeTab === 'signups' && (
                            <div>
                                <div className="flex flex-col md:flex-row gap-4 mb-6">
                                    <div className="flex-1 relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-admin-muted" />
                                        <input
                                            type="text"
                                            placeholder="Zoek op naam, email of telefoonnummer..."
                                            value={signupSearchQuery}
                                            onChange={(e) => setSignupSearchQuery(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2 border border-admin bg-admin-card text-admin rounded-lg focus:ring-2 focus:ring-purple-600"
                                        />
                                    </div>
                                    <button
                                        onClick={exportSignupsToExcel}
                                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                                    >
                                        <FileText className="h-5 w-5" />
                                        Exporteer naar Excel
                                    </button>
                                </div>

                                <div className="bg-admin-card rounded-lg shadow overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead className="bg-admin-card-soft">
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-sm font-semibold text-admin">Naam</th>
                                                    <th className="px-4 py-3 text-left text-sm font-semibold text-admin">Email</th>
                                                    <th className="px-4 py-3 text-left text-sm font-semibold text-admin">Telefoon</th>
                                                    <th className="px-4 py-3 text-left text-sm font-semibold text-admin">Aangemeld</th>
                                                    <th className="px-4 py-3 text-right text-sm font-semibold text-admin">Acties</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-admin-border">
                                                {filteredSignups.map((signup) => (
                                                    <tr key={signup.id} className="hover:bg-admin-card-soft transition-colors">
                                                        <td className="px-4 py-3">
                                                            <button
                                                                onClick={() => toggleExpandSignup(signup.id)}
                                                                className="flex items-center gap-2 text-admin hover:text-theme-purple"
                                                            >
                                                                {expandedSignups.includes(signup.id) ? (
                                                                    <ChevronUp className="h-4 w-4" />
                                                                ) : (
                                                                    <ChevronDown className="h-4 w-4" />
                                                                )}
                                                                <span className="font-medium">
                                                                    {signup.first_name} {signup.middle_name} {signup.last_name}
                                                                </span>
                                                            </button>
                                                            {expandedSignups.includes(signup.id) && (
                                                                <div className="mt-2 pl-6 space-y-1 text-sm text-admin-muted">
                                                                    <p><strong>Geboortedatum:</strong> {signup.date_of_birth}</p>
                                                                    {signup.favorite_gif && (
                                                                        <p><strong>Favoriete GIF:</strong> <a href={signup.favorite_gif} target="_blank" rel="noopener noreferrer" className="text-theme-purple hover:underline">Bekijk</a></p>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3 text-admin">{signup.email}</td>
                                                        <td className="px-4 py-3 text-admin">{signup.phone_number}</td>
                                                        <td className="px-4 py-3 text-admin-muted text-sm">
                                                            {format(new Date(signup.created_at), 'dd MMM yyyy', { locale: nl })}
                                                        </td>
                                                        <td className="px-4 py-3 text-right">
                                                            <button
                                                                onClick={() => handleDeleteSignup(signup.id)}
                                                                className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                                                title="Verwijderen"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                        {filteredSignups.length === 0 && (
                                            <div className="text-center py-8 text-admin-muted">
                                                Geen aanmeldingen gevonden
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Parent Signups Tab */}
                        {activeTab === 'parents' && (
                            <div>
                                <div className="flex flex-col md:flex-row gap-4 mb-6">
                                    <div className="flex-1 relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-admin-muted" />
                                        <input
                                            type="text"
                                            placeholder="Zoek op naam, email of telefoonnummer..."
                                            value={parentSearchQuery}
                                            onChange={(e) => setParentSearchQuery(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2 border border-admin bg-admin-card text-admin rounded-lg focus:ring-2 focus:ring-purple-600"
                                        />
                                    </div>
                                    <button
                                        onClick={exportParentSignupsToExcel}
                                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                                    >
                                        <FileText className="h-5 w-5" />
                                        Exporteer naar Excel
                                    </button>
                                </div>

                                <div className="bg-admin-card rounded-lg shadow overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead className="bg-admin-card-soft">
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-sm font-semibold text-admin">Naam</th>
                                                    <th className="px-4 py-3 text-left text-sm font-semibold text-admin">Email</th>
                                                    <th className="px-4 py-3 text-left text-sm font-semibold text-admin">Telefoon</th>
                                                    <th className="px-4 py-3 text-left text-sm font-semibold text-admin">Aangemeld</th>
                                                    <th className="px-4 py-3 text-right text-sm font-semibold text-admin">Acties</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-admin-border">
                                                {filteredParentSignups.map((parent) => (
                                                    <tr key={parent.id} className="hover:bg-admin-card-soft transition-colors">
                                                        <td className="px-4 py-3">
                                                            <button
                                                                onClick={() => toggleExpandParent(parent.id!)}
                                                                className="flex items-center gap-2 text-admin hover:text-theme-purple"
                                                            >
                                                                {expandedParents.includes(parent.id!) ? (
                                                                    <ChevronUp className="h-4 w-4" />
                                                                ) : (
                                                                    <ChevronDown className="h-4 w-4" />
                                                                )}
                                                                <span className="font-medium">
                                                                    {parent.first_name} {parent.last_name}
                                                                </span>
                                                            </button>
                                                            {expandedParents.includes(parent.id!) && parent.motivation && (
                                                                <div className="mt-2 pl-6 space-y-1 text-sm text-admin-muted">
                                                                    <p><strong>Motivatie:</strong> {parent.motivation}</p>
                                                                </div>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3 text-admin">{parent.email}</td>
                                                        <td className="px-4 py-3 text-admin">{parent.phone_number}</td>
                                                        <td className="px-4 py-3 text-admin-muted text-sm">
                                                            {parent.created_at ? format(new Date(parent.created_at), 'dd MMM yyyy', { locale: nl }) : '-'}
                                                        </td>
                                                        <td className="px-4 py-3 text-right">
                                                            <button
                                                                onClick={() => handleDeleteParentSignup(parent.id!)}
                                                                className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                                                title="Verwijderen"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                        {filteredParentSignups.length === 0 && (
                                            <div className="text-center py-8 text-admin-muted">
                                                Geen intro ouders gevonden
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Blogs Tab */}
                        {activeTab === 'blogs' && (
                            <div>
                                <div className="mb-6">
                                    <button
                                        onClick={() => {
                                            setEditingBlog({
                                                title: '',
                                                content: '',
                                                excerpt: '',
                                                blog_type: 'update',
                                                is_published: false
                                            });
                                            setIsCreatingBlog(true);
                                        }}
                                        className="px-4 py-2 bg-theme-purple text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
                                    >
                                        <Plus className="h-5 w-5" />
                                        Nieuwe Blog
                                    </button>
                                </div>

                                {(editingBlog || isCreatingBlog) && (
                                    <div data-new-blog-form className="bg-admin-card rounded-lg shadow p-6 mb-6">
                                        <h3 className="text-lg font-bold text-admin mb-4">
                                            {editingBlog?.id ? 'Blog Bewerken' : 'Nieuwe Blog'}
                                        </h3>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-semibold text-admin mb-2">Titel</label>
                                                <input
                                                    type="text"
                                                    value={editingBlog?.title || ''}
                                                    onChange={(e) => setEditingBlog({ ...editingBlog, title: e.target.value })}
                                                    className="w-full px-4 py-2 border border-admin bg-admin-card text-admin rounded-lg"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-admin mb-2">Slug</label>
                                                <input
                                                    type="text"
                                                    value={editingBlog?.slug || ''}
                                                    onChange={(e) => setEditingBlog({ ...editingBlog, slug: e.target.value })}
                                                    className="w-full px-4 py-2 border border-admin bg-admin-card text-admin rounded-lg"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-admin mb-2">Excerpt</label>
                                                <textarea
                                                    value={editingBlog?.excerpt || ''}
                                                    onChange={(e) => setEditingBlog({ ...editingBlog, excerpt: e.target.value })}
                                                    rows={2}
                                                    className="w-full px-4 py-2 border border-admin bg-admin-card text-admin rounded-lg"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-admin mb-2">Content</label>
                                                <textarea
                                                    value={editingBlog?.content || ''}
                                                    onChange={(e) => setEditingBlog({ ...editingBlog, content: e.target.value })}
                                                    rows={6}
                                                    className="w-full px-4 py-2 border border-admin bg-admin-card text-admin rounded-lg"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-admin mb-2">Type</label>
                                                <select
                                                    value={editingBlog?.blog_type || 'update'}
                                                    onChange={(e) => setEditingBlog({ ...editingBlog, blog_type: e.target.value as any })}
                                                    className="w-full px-4 py-2 border border-admin bg-admin-card text-admin rounded-lg"
                                                >
                                                    <option value="update">Update</option>
                                                    <option value="pictures">Foto's</option>
                                                    <option value="event">Event</option>
                                                    <option value="announcement">Aankondiging</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-admin mb-2">Afbeelding</label>
                                                <div className="flex items-center gap-3">
                                                    <input type="file" accept="image/*" onChange={handleImageChange} />
                                                    {imagePreview ? (
                                                        <div className="w-24 h-16 overflow-hidden rounded-md bg-admin-card-soft">
                                                            <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                                        </div>
                                                    ) : editingBlog?.image ? (
                                                        <div className="w-24 h-16 overflow-hidden rounded-md bg-admin-card-soft">
                                                            <img src={getImageUrl((editingBlog as any).image)} alt="Afbeelding" className="w-full h-full object-cover" />
                                                        </div>
                                                    ) : null}
                                                    { (imagePreview || editingBlog?.image) && (
                                                        <button type="button" onClick={removeImage} className="text-sm text-red-600 ml-2">Verwijder</button>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    id="is_published"
                                                    checked={editingBlog?.is_published || false}
                                                    onChange={(e) => setEditingBlog({ ...editingBlog, is_published: e.target.checked })}
                                                    className="h-4 w-4 text-theme-purple"
                                                />
                                                <label htmlFor="is_published" className="text-sm text-admin">Gepubliceerd</label>
                                            </div>
                                            <div className="flex gap-3">
                                                <button
                                                    onClick={handleSaveBlog}
                                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                                                >
                                                    <Save className="h-4 w-4" />
                                                    Opslaan
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setEditingBlog(null);
                                                        setIsCreatingBlog(false);
                                                    }}
                                                    className="px-4 py-2 bg-admin-card-soft text-admin rounded-lg hover:bg-admin-border"
                                                >
                                                    Annuleren
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="grid gap-4">
                                    {blogs.map((blog) => (
                                            <div
                                                key={blog.id}
                                                role="button"
                                                tabIndex={0}
                                                onClick={() => setEditingBlog(blog)}
                                                onKeyDown={(e) => { if (e.key === 'Enter') setEditingBlog(blog); }}
                                                className="bg-admin-card rounded-lg shadow p-6 cursor-pointer hover:bg-admin-hover transition"
                                            >
                                                <div className="flex justify-between items-start mb-3">
                                                    <div className="flex-1">
                                                        <h4 className="text-lg font-bold text-admin">{blog.title}</h4>
                                                        <p className="text-sm text-admin-muted mt-1">
                                                            {blog.blog_type} • {blog.is_published ? 'Gepubliceerd' : 'Concept'}
                                                        </p>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); setEditingBlog(blog); }}
                                                            className="p-2 text-theme-purple hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded"
                                                            title="Bewerken"
                                                        >
                                                            <Edit className="h-4 w-4" />
                                                        </button>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleDeleteBlog(blog.id); }}
                                                            className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                                                            title="Verwijderen"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="flex items-start gap-4">
                                                    {blog.image && (
                                                        <div className="w-24 h-16 flex-shrink-0 overflow-hidden rounded-md bg-admin-card-soft">
                                                            <img
                                                                src={(blog as any).image?.id ? `/api/assets/${(blog as any).image.id}` : typeof (blog as any).image === 'string' ? `/api/assets/${(blog as any).image}` : '/img/placeholder.svg'}
                                                                alt={blog.title}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        </div>
                                                    )}
                                                    <div className="flex-1">
                                                        {blog.excerpt && (
                                                            <p className="text-admin-muted text-sm mb-2">{blog.excerpt}</p>
                                                        )}
                                                        <div className="text-sm">
                                                            <span className={`inline-block px-2 py-1 text-xs rounded ${blog.is_published ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}`}>{blog.is_published ? 'Gepubliceerd' : 'Concept'}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    {blogs.length === 0 && (
                                        <div className="text-center py-8 text-admin-muted">
                                            Geen blogs gevonden
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Planning Tab */}
                        {activeTab === 'planning' && (
                            <div>
                                <div className="mb-6 flex flex-wrap gap-4 justify-between items-center">
                                    <button
                                        onClick={() => {
                                            setEditingPlanning({
                                                date: '',
                                                time_start: '',
                                                title: '',
                                                description: '',
                                                location: ''
                                            });
                                            setIsCreatingPlanning(true);
                                        }}
                                        className="px-4 py-2 bg-theme-purple text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
                                    >
                                        <Plus className="h-5 w-5" />
                                        Nieuw Planning Item
                                    </button>

                                    {/* View Toggle */}
                                    <div className="flex gap-2 bg-admin-card-soft rounded-lg p-1">
                                        <button
                                            onClick={() => setPlanningViewMode('calendar')}
                                            className={`px-4 py-2 rounded-md flex items-center gap-2 transition-colors ${
                                                planningViewMode === 'calendar'
                                                    ? 'bg-theme-purple text-white'
                                                    : 'text-admin hover:bg-admin-card'
                                            }`}
                                        >
                                            <LayoutGrid className="h-4 w-4" />
                                            Kalender
                                        </button>
                                        <button
                                            onClick={() => setPlanningViewMode('list')}
                                            className={`px-4 py-2 rounded-md flex items-center gap-2 transition-colors ${
                                                planningViewMode === 'list'
                                                    ? 'bg-theme-purple text-white'
                                                    : 'text-admin hover:bg-admin-card'
                                            }`}
                                        >
                                            <List className="h-4 w-4" />
                                            Lijst
                                        </button>
                                    </div>
                                </div>

                                {/* Calendar view (admin) - Multi-day grid */}
                                {planningViewMode === 'calendar' && planning.length > 0 && (
                                    <div className="mb-6">
                                        <div className="bg-admin-card rounded-lg shadow overflow-hidden">
                                            <div className="overflow-x-auto">
                                                {(() => {
                                                    const dayOrder = ['maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag', 'zondag'];
                                                    const planningByDay = planning.reduce((acc, item) => {
                                                        if (!item.day) return acc;
                                                        const dayKey = item.day.toLowerCase();
                                                        if (!acc[dayKey]) acc[dayKey] = [];
                                                        acc[dayKey].push(item);
                                                        return acc;
                                                    }, {} as Record<string, IntroPlanningItem[]>);

                                                    const sortedDays = Object.keys(planningByDay).sort(
                                                        (a, b) => dayOrder.indexOf(a.toLowerCase()) - dayOrder.indexOf(b.toLowerCase())
                                                    );

                                                    const hours = Array.from({ length: 15 }, (_, i) => i + 9);

                                                    return (
                                                        <div className="min-w-full" style={{ minWidth: sortedDays.length > 1 ? '800px' : '100%' }}>
                                                            {/* Header with days */}
                                                            <div
                                                                className="grid gap-0 border-b-2 border-admin-border sticky top-0 bg-admin-card z-20"
                                                                style={{
                                                                    gridTemplateColumns:
                                                                        sortedDays.length === 1
                                                                            ? '60px 1fr'
                                                                            : `60px repeat(${sortedDays.length}, 1fr)`
                                                                }}
                                                            >
                                                                <div className="p-2 lg:p-3 font-bold text-admin border-r border-admin-border text-xs lg:text-sm flex items-center justify-center">
                                                                    Tijd
                                                                </div>
                                                                {sortedDays.map((day) => {
                                                                    const items = planningByDay[day];
                                                                    const firstItem = items[0];
                                                                    return (
                                                                        <div
                                                                            key={day}
                                                                            className="p-2 lg:p-3 text-center border-r border-admin-border last:border-r-0"
                                                                        >
                                                                            <div className="font-bold text-theme-purple text-sm lg:text-base capitalize">
                                                                                {day}
                                                                            </div>
                                                                            {firstItem?.date && (
                                                                                <div className="text-[10px] lg:text-xs text-admin-muted mt-0.5">
                                                                                    {format(new Date(firstItem.date), 'd MMM', { locale: nl })}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>

                                                            {/* Time grid */}
                                                            <div
                                                                className="relative"
                                                                style={{ height: 'auto', maxHeight: 'calc(100vh - 350px)', minHeight: '500px' }}
                                                            >
                                                                {/* Hour rows */}
                                                                {hours.map((hour) => (
                                                                    <div
                                                                        key={hour}
                                                                        className="grid gap-0 border-b border-admin-border"
                                                                        style={{
                                                                            gridTemplateColumns:
                                                                                sortedDays.length === 1
                                                                                    ? '60px 1fr'
                                                                                    : `60px repeat(${sortedDays.length}, 1fr)`,
                                                                            height: '60px'
                                                                        }}
                                                                    >
                                                                        <div className="p-1.5 lg:p-2 text-[10px] lg:text-xs text-admin-muted font-semibold border-r border-admin-border flex items-start justify-center">
                                                                            {`${hour}:00`}
                                                                        </div>
                                                                        {sortedDays.map((day) => (
                                                                            <div
                                                                                key={`${day}-${hour}`}
                                                                                className="border-r border-admin-border last:border-r-0 relative bg-admin-card-soft/30"
                                                                            />
                                                                        ))}
                                                                    </div>
                                                                ))}

                                                                {/* Events overlay */}
                                                                <div
                                                                    className="absolute inset-0 grid gap-0 pointer-events-none"
                                                                    style={{
                                                                        gridTemplateColumns:
                                                                            sortedDays.length === 1
                                                                                ? '60px 1fr'
                                                                                : `60px repeat(${sortedDays.length}, 1fr)`
                                                                    }}
                                                                >
                                                                    <div /> {/* Skip time column */}
                                                                    {sortedDays.map((day, dayIndex) => {
                                                                        const items = planningByDay[day];
                                                                        return (
                                                                            <div key={day} className="relative pointer-events-auto">
                                                                                {items.map((item) => {
                                                                                    const getEventPosition = (timeStart: string, timeEnd?: string) => {
                                                                                        try {
                                                                                            const [h, m] = timeStart.split(':').map(Number);
                                                                                            const top = (h - 9) * 60 + (m || 0);
                                                                                            let height = 60;
                                                                                            if (timeEnd) {
                                                                                                const [eh, em] = timeEnd.split(':').map(Number);
                                                                                                height = Math.max((eh - 9) * 60 + (em || 0) - top, 30);
                                                                                            }
                                                                                            return { top, height };
                                                                                        } catch {
                                                                                            return { top: 0, height: 60 };
                                                                                        }
                                                                                    };

                                                                                    const { top, height } = getEventPosition(
                                                                                        item.time_start || '09:00',
                                                                                        item.time_end
                                                                                    );

                                                                                    const colorPalettes = [
                                                                                        'from-blue-500 to-blue-600',
                                                                                        'from-purple-500 to-purple-600',
                                                                                        'from-pink-500 to-pink-600',
                                                                                        'from-indigo-500 to-indigo-600',
                                                                                        'from-teal-500 to-teal-600',
                                                                                        'from-cyan-500 to-cyan-600',
                                                                                        'from-violet-500 to-violet-600',
                                                                                        'from-fuchsia-500 to-fuchsia-600'
                                                                                    ];
                                                                                    const colorIndex = dayIndex % colorPalettes.length;

                                                                                    return (
                                                                                        <div
                                                                                            key={item.id}
                                                                                            className={`absolute left-0.5 right-0.5 lg:left-1 lg:right-1 rounded-md lg:rounded-lg p-1.5 lg:p-2 shadow-md overflow-hidden bg-gradient-to-br text-white ${colorPalettes[colorIndex]}`}
                                                                                            style={{
                                                                                                top: `${top}px`,
                                                                                                height: `${Math.max(height, 30)}px`
                                                                                            }}
                                                                                        >
                                                                                            <div className="flex justify-between items-start gap-1">
                                                                                                <div className="text-[10px] lg:text-xs font-bold truncate flex-1">
                                                                                                    {item.title}
                                                                                                </div>
                                                                                                <div className="flex gap-1 flex-shrink-0">
                                                                                                    <button
                                                                                                        onClick={() => setEditingPlanning(item)}
                                                                                                        className="p-0.5 lg:p-1 bg-white/20 hover:bg-white/30 rounded transition-colors"
                                                                                                        title="Bewerken"
                                                                                                    >
                                                                                                        <Edit className="h-3 w-3 lg:h-4 lg:w-4" />
                                                                                                    </button>
                                                                                                    <button
                                                                                                        onClick={() => handleDeletePlanning(item.id)}
                                                                                                        className="p-0.5 lg:p-1 bg-white/20 hover:bg-white/30 rounded transition-colors"
                                                                                                        title="Verwijderen"
                                                                                                    >
                                                                                                        <Trash2 className="h-3 w-3 lg:h-4 lg:w-4" />
                                                                                                    </button>
                                                                                                </div>
                                                                                            </div>
                                                                                            <div className="text-[8px] lg:text-[10px] opacity-90 mt-0.5">
                                                                                                {item.time_start}
                                                                                                {item.time_end && ` - ${item.time_end}`}
                                                                                            </div>
                                                                                        </div>
                                                                                    );
                                                                                })}
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })()}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {(editingPlanning || isCreatingPlanning) && (
                                    <div className="bg-admin-card rounded-lg shadow p-6 mb-6">
                                        <h3 className="text-lg font-bold text-admin mb-4">
                                            {editingPlanning?.id ? 'Planning Bewerken' : 'Nieuw Planning Item'}
                                        </h3>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-semibold text-admin mb-2">
                                                    Datum <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="date"
                                                    value={editingPlanning?.date || ''}
                                                    onChange={(e) => setEditingPlanning({ ...editingPlanning, date: e.target.value })}
                                                    className="w-full px-4 py-2 border border-admin bg-admin-card text-admin rounded-lg"
                                                    required
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-semibold text-admin mb-2">
                                                        Start Tijd <span className="text-red-500">*</span>
                                                    </label>
                                                    <input
                                                        type="time"
                                                        value={editingPlanning?.time_start || ''}
                                                        onChange={(e) => setEditingPlanning({ ...editingPlanning, time_start: e.target.value })}
                                                        className="w-full px-4 py-2 border border-admin bg-admin-card text-admin rounded-lg"
                                                        required
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-semibold text-admin mb-2">Eind Tijd</label>
                                                    <input
                                                        type="time"
                                                        value={editingPlanning?.time_end || ''}
                                                        onChange={(e) => setEditingPlanning({ ...editingPlanning, time_end: e.target.value })}
                                                        className="w-full px-4 py-2 border border-admin bg-admin-card text-admin rounded-lg"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-admin mb-2">
                                                    Titel <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    value={editingPlanning?.title || ''}
                                                    onChange={(e) => setEditingPlanning({ ...editingPlanning, title: e.target.value })}
                                                    className="w-full px-4 py-2 border border-admin bg-admin-card text-admin rounded-lg"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-admin mb-2">
                                                    Beschrijving <span className="text-red-500">*</span>
                                                </label>
                                                <textarea
                                                    value={editingPlanning?.description || ''}
                                                    onChange={(e) => setEditingPlanning({ ...editingPlanning, description: e.target.value })}
                                                    rows={3}
                                                    className="w-full px-4 py-2 border border-admin bg-admin-card text-admin rounded-lg"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-admin mb-2">Locatie</label>
                                                <input
                                                    type="text"
                                                    value={editingPlanning?.location || ''}
                                                    onChange={(e) => setEditingPlanning({ ...editingPlanning, location: e.target.value })}
                                                    className="w-full px-4 py-2 border border-admin bg-admin-card text-admin rounded-lg"
                                                />
                                            </div>
                                            <div className="flex gap-3">
                                                <button
                                                    onClick={handleSavePlanning}
                                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                                                >
                                                    <Save className="h-4 w-4" />
                                                    Opslaan
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setEditingPlanning(null);
                                                        setIsCreatingPlanning(false);
                                                    }}
                                                    className="px-4 py-2 bg-admin-card-soft text-admin rounded-lg hover:bg-admin-border"
                                                >
                                                    Annuleren
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* List view */}
                                {planningViewMode === 'list' && (
                                    <div className="grid gap-4">
                                        {planning.map((item) => (
                                            <div key={item.id} className="bg-admin-card rounded-lg shadow p-6">
                                                <div className="flex justify-between items-start mb-3">
                                                    <div className="flex-1">
                                                        <h4 className="text-lg font-bold text-admin">{item.title}</h4>
                                                        <p className="text-sm text-admin-muted mt-1">
                                                            {item.day} {item.date && format(new Date(item.date), 'd MMM yyyy', { locale: nl })} • {item.time_start}{item.time_end && ` - ${item.time_end}`}
                                                        </p>
                                                        {item.location && (
                                                            <p className="text-sm text-admin-muted">📍 {item.location}</p>
                                                        )}
                                                        {item.description && (
                                                            <p className="text-admin-muted text-sm mt-2">{item.description}</p>
                                                        )}
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => setEditingPlanning(item)}
                                                            className="p-2 text-theme-purple hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded"
                                                        >
                                                            <Edit className="h-4 w-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeletePlanning(item.id)}
                                                            className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        {planning.length === 0 && (
                                            <div className="text-center py-8 text-admin-muted">
                                                Geen planning items gevonden
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>
        </>
    );
}
