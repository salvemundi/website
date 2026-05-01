'use client';

import React, { useState } from 'react';
import { 
    Plus, 
    X, 
    Save, 
    Loader2, 
    Edit, 
    Trash2, 
    FileText,
    ChevronDown,
    Globe,
    Eye,
    Type
} from 'lucide-react';
import type { IntroBlog } from '@salvemundi/validations/schema/intro.zod';
import { ActionButton, EmptyState, Button } from './IntroTabComponents';
import BlogEditForm from './BlogEditForm';

interface Props {
    blogs: IntroBlog[];
    onSave: (blog: Partial<IntroBlog>) => Promise<void>;
    onDelete: (id: number) => Promise<void>;
    saving: boolean;
    deletingId: number | null;
}

export default function IntroBlogsTab({ blogs, onSave, onDelete, saving, deletingId }: Props) {
    const [expandedRows, setExpandedRows] = useState<number[]>([]);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editData, setEditData] = useState<Partial<IntroBlog>>({});

    const toggleExpand = (id: number) => {
        setExpandedRows(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
        if (editingId === id) setEditingId(null);
    };

    const startEdit = (e: React.MouseEvent, blog: IntroBlog) => {
        e.stopPropagation();
        setEditingId(blog.id!);
        // Sanitize: convert nulls to undefined to avoid Zod validation issues
        const sanitized = Object.fromEntries(
            Object.entries(blog).map(([k, v]) => [k, v === null ? undefined : v])
        );
        setEditData(sanitized);
        if (!expandedRows.includes(blog.id!)) setExpandedRows(prev => [...prev, blog.id!]);
    };

    const handleSave = async () => {
        // Remove empty strings for required fields to ensure clean validation
        const sanitized = { ...editData };
        if (sanitized.title === '') delete sanitized.title;
        if (sanitized.content === '') delete sanitized.content;
        
        await onSave(sanitized);
        setEditingId(null);
    };

    const startNew = () => {
        const tempId = -1;
        setEditingId(tempId);
        setEditData({ title: '', content: '', blog_type: 'update', is_published: false });
        setExpandedRows([tempId]);
    };

    const blogTypes = {
        update: { label: 'Update', color: 'blue' },
        pictures: { label: 'Foto\'s', color: 'pink' },
        event: { label: 'Evenement', color: 'amber' },
        announcement: { label: 'Aankondiging', color: 'emerald' }
    };

    return (
        <div className="animate-in fade-in duration-500">
            <div className="flex justify-between items-center mb-8">
                <div className="flex flex-col">
                    <h2 className="text-xl font-black text-[var(--beheer-text)] uppercase tracking-tight">Blogs</h2>
                    <p className="text-[10px] font-black uppercase tracking-widest text-[var(--beheer-text-muted)] opacity-50">Beheer introductie updates en nieuws</p>
                </div>
                <Button onClick={startNew} icon={Plus}>Nieuwe Blog</Button>
            </div>

            <div className="bg-[var(--beheer-card-bg)] rounded-[var(--beheer-radius)] border border-[var(--beheer-border)] overflow-hidden shadow-2xl transition-all">
                <table className="w-full text-sm">
                    <thead className="bg-[var(--beheer-card-soft)] border-b border-[var(--beheer-border)]">
                        <tr>
                            <th className="px-8 py-5 text-left text-[10px] font-black text-[var(--beheer-text-muted)] uppercase tracking-widest w-20">Status</th>
                            <th className="px-8 py-5 text-left text-[10px] font-black text-[var(--beheer-text-muted)] uppercase tracking-widest">Titel</th>
                            <th className="px-8 py-5 text-left text-[10px] font-black text-[var(--beheer-text-muted)] uppercase tracking-widest hidden lg:table-cell w-32">Datum</th>
                            <th className="px-8 py-5 text-left text-[10px] font-black text-[var(--beheer-text-muted)] uppercase tracking-widest hidden md:table-cell w-32">Type</th>
                            <th className="px-8 py-5 text-right text-[10px] font-black text-[var(--beheer-text-muted)] uppercase tracking-widest w-48">Acties</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--beheer-border)]/10">
                        {/* New Blog row if editingId is -1 */}
                        {editingId === -1 && (
                            <tr className="bg-[var(--beheer-accent)]/[0.03]">
                                <td colSpan={5} className="px-12 py-10">
                                    <BlogEditForm 
                                        blog={{ id: -1 }}
                                        data={editData}
                                        onChange={setEditData}
                                        onSave={handleSave}
                                        onCancel={() => setEditingId(null)}
                                        saving={saving}
                                    />
                                </td>
                            </tr>
                        )}

                        {blogs.map(blog => {
                            const isExpanded = expandedRows.includes(blog.id!);
                            const isEditing = editingId === blog.id;
                            const typeInfo = blogTypes[blog.blog_type as keyof typeof blogTypes] || blogTypes.update;
                            const date = blog.created_at;

                            return (
                                <React.Fragment key={blog.id}>
                                    <tr 
                                        onClick={() => toggleExpand(blog.id!)} 
                                        className="hover:bg-[var(--beheer-accent)]/[0.02] cursor-pointer transition-colors group"
                                    >
                                        <td className="px-8 py-5">
                                            <div className={`h-2.5 w-2.5 rounded-full shadow-[0_0_10px_rgba(0,0,0,0.1)] transition-all ${blog.is_published ? 'bg-emerald-500 shadow-emerald-500/40 scale-110' : 'bg-[var(--beheer-border)] opacity-30'}`} />
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="text-sm font-black text-[var(--beheer-text)] uppercase tracking-tight group-hover:text-[var(--beheer-accent)] transition-colors truncate max-w-md">
                                                    {blog.title}
                                                </div>
                                                {!blog.is_published && (
                                                    <span className="bg-amber-500/10 text-amber-500 text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full border border-amber-500/20">
                                                        Concept
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 hidden lg:table-cell">
                                            <span className="text-[10px] font-bold text-[var(--beheer-text-muted)] uppercase tracking-tighter">
                                                {date ? new Date(date).toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '-'}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5 hidden md:table-cell">
                                            <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded bg-${typeInfo.color}-500/10 text-${typeInfo.color}-500 border border-${typeInfo.color}-500/20`}>
                                                {typeInfo.label}
                                            </span>
                                        </td>
                                        <td className="px-12 py-5 text-right">
                                            <div className="flex justify-end items-center gap-3">
                                                <ActionButton 
                                                    icon={Edit} 
                                                    onClick={(e) => startEdit(e, blog)} 
                                                    title="Bewerken" 
                                                />
                                                <ActionButton 
                                                    icon={Trash2} 
                                                    onClick={(e) => { e.stopPropagation(); onDelete(blog.id!); }} 
                                                    variant="danger"
                                                    disabled={deletingId === blog.id}
                                                    title="Verwijderen"
                                                />
                                                <div className="text-[var(--beheer-text-muted)] p-2 group-hover:text-[var(--beheer-accent)] transition-colors">
                                                    <ChevronDown className="h-4 w-4 transition-transform duration-300" style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }} />
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                    {isExpanded && (
                                        <tr className="bg-[var(--beheer-card-soft)]/30">
                                            <td colSpan={5} className="px-12 py-10 animate-in slide-in-from-top-2 duration-300">
                                                {isEditing ? (
                                                    <BlogEditForm 
                                                        blog={blog}
                                                        data={editData}
                                                        onChange={setEditData}
                                                        onSave={handleSave}
                                                        onCancel={() => setEditingId(null)}
                                                        saving={saving}
                                                    />
                                                ) : (
                                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 text-[11px] font-black uppercase tracking-widest text-[var(--beheer-text-muted)]">
                                                        <div className="lg:col-span-2 space-y-8">
                                                                 <div className="flex items-center justify-between">
                                                                     <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--beheer-accent)]">Inhoud</p>
                                                                     <Button onClick={() => startEdit({ stopPropagation: () => {} } as unknown as React.MouseEvent, blog)} variant="ghost" icon={Edit}>
                                                                         Bewerken
                                                                     </Button>
                                                                 </div>
                                                            <div className="space-y-6">
                                                                {blog.excerpt && (
                                                                    <div className="space-y-2">
                                                                        <span className="opacity-50 text-[9px] uppercase tracking-[0.1em]">Samenvatting</span>
                                                                        <p className="text-xs font-semibold text-[var(--beheer-text)] leading-relaxed italic normal-case bg-white/5 p-4 rounded-xl border border-[var(--beheer-border)]/10">
                                                                            {blog.excerpt}
                                                                        </p>
                                                                    </div>
                                                                )}
                                                                <div className="space-y-2">
                                                                    <span className="opacity-50 text-[9px] uppercase tracking-[0.1em]">Inhoud</span>
                                                                    <div className="text-xs font-medium text-[var(--beheer-text)] leading-relaxed normal-case whitespace-pre-wrap">
                                                                        {blog.content}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="space-y-8 lg:border-l lg:border-[var(--beheer-border)]/10 lg:pl-12">
                                                            <div className="space-y-4">
                                                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--beheer-accent)]">Details</p>
                                                                <div className="grid gap-4">
                                                                    <div className="flex flex-col gap-1">
                                                                        <span className="opacity-50">Type</span>
                                                                        <span className="text-[var(--beheer-text)] text-sm font-bold uppercase tracking-tight">{typeInfo.label}</span>
                                                                    </div>
                                                                    <div className="flex flex-col gap-1">
                                                                        <span className="opacity-50">Link-naam (Slug)</span>
                                                                        <span className="text-[var(--beheer-text)] text-[10px] font-black tracking-widest">{blog.slug || '-'}</span>
                                                                    </div>
                                                                    <div className="flex flex-col gap-1">
                                                                        <span className="opacity-50">Datum</span>
                                                                        <span className="text-[var(--beheer-text)] text-[10px] font-black tracking-widest">
                                                                            {date ? new Date(date).toLocaleString('nl-NL', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            );
                        })}
                        {blogs.length === 0 && editingId !== -1 && (
                            <tr>
                                <td colSpan={4}>
                                    <EmptyState icon={FileText} text="Nog geen blogs aangemaakt" />
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
