'use client';

import React, { useState } from 'react';
import { 
    Plus, 
    X, 
    Save, 
    Loader2, 
    Edit, 
    Trash2, 
    FileText 
} from 'lucide-react';
import type { IntroBlog } from '@salvemundi/validations/schema/intro.zod';
import { Field, inputClass } from './IntroTabComponents';

interface Props {
    blogs: IntroBlog[];
    onSave: (blog: Partial<IntroBlog>) => Promise<void>;
    onDelete: (id: number) => Promise<void>;
    saving: boolean;
    deletingId: number | null;
}

export default function IntroBlogsTab({ blogs, onSave, onDelete, saving, deletingId }: Props) {
    const [editingBlog, setEditingBlog] = useState<Partial<IntroBlog> | null>(null);

    const handleSave = async () => {
        if (!editingBlog) return;
        await onSave(editingBlog);
        setEditingBlog(null);
    };

    return (
        <div className="animate-in fade-in duration-500">
            {/* Blog Form */}
            {editingBlog !== null ? (
                <div className="bg-[var(--beheer-card-bg)] rounded-[var(--beheer-radius)] border border-[var(--beheer-border)] p-8 mb-8 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="font-black text-xs uppercase tracking-[0.2em] text-[var(--beheer-text-muted)]">
                            {editingBlog.id ? 'Blog Bewerken' : 'Nieuwe Blog'}
                        </h3>
                        <button onClick={() => setEditingBlog(null)} className="p-2 text-[var(--beheer-text-muted)] hover:text-[var(--beheer-text)] transition-colors">
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Field label="Titel *">
                            <input type="text" value={editingBlog.title || ''} onChange={e => setEditingBlog({ ...editingBlog, title: e.target.value })} className={inputClass} placeholder="Titel van de blog..." />
                        </Field>
                        <Field label="Slug">
                            <input type="text" value={editingBlog.slug || ''} onChange={e => setEditingBlog({ ...editingBlog, slug: e.target.value })} className={inputClass} placeholder="blog-titel-slug" />
                        </Field>
                        <div className="md:col-span-2">
                            <Field label="Excerpt (kort overzicht)">
                                <textarea value={editingBlog.excerpt || ''} onChange={e => setEditingBlog({ ...editingBlog, excerpt: e.target.value })} rows={2} className={inputClass} placeholder="Een korte samenvatting..." />
                            </Field>
                        </div>
                        <div className="md:col-span-2">
                            <Field label="Content *">
                                <textarea value={editingBlog.content || ''} onChange={e => setEditingBlog({ ...editingBlog, content: e.target.value })} rows={8} className={inputClass} placeholder="Schrijf hier je blog post..." />
                            </Field>
                        </div>
                        <Field label="Type">
                            <select value={editingBlog.blog_type || 'update'} onChange={e => setEditingBlog({ ...editingBlog, blog_type: e.target.value as any })} className={inputClass}>
                                <option value="update">Update</option>
                                <option value="pictures">Foto's</option>
                                <option value="event">Event</option>
                                <option value="announcement">Aankondiging</option>
                            </select>
                        </Field>
                        <div className="flex items-center gap-3 mt-8">
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    className="sr-only peer"
                                    checked={editingBlog.is_published || false} 
                                    onChange={e => setEditingBlog({ ...editingBlog, is_published: e.target.checked })}
                                />
                                <div className="w-11 h-6 bg-[var(--beheer-card-soft)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--beheer-accent)]"></div>
                                <span className="ml-3 text-[10px] font-black uppercase tracking-widest text-[var(--beheer-text-muted)]">Gepubliceerd</span>
                            </label>
                        </div>
                    </div>

                    <div className="flex gap-3 pt-10 border-t border-[var(--beheer-border)] mt-10">
                        <button 
                            onClick={handleSave} 
                            disabled={saving} 
                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-8 py-4 bg-[var(--beheer-accent)] text-white font-black text-xs uppercase tracking-widest rounded-[var(--beheer-radius)] shadow-[var(--shadow-glow)] hover:opacity-90 transition-all active:scale-95 disabled:opacity-50"
                        >
                            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} 
                            Opslaan
                        </button>
                        <button 
                            onClick={() => setEditingBlog(null)} 
                            className="px-8 py-4 rounded-[var(--beheer-radius)] text-xs font-black uppercase tracking-widest text-[var(--beheer-text-muted)] hover:bg-[var(--beheer-card-soft)] border border-transparent hover:border-[var(--beheer-border)] transition-all"
                        >
                            Annuleren
                        </button>
                    </div>
                </div>
            ) : (
                <button 
                    onClick={() => setEditingBlog({ title: '', content: '', blog_type: 'update', is_published: false })} 
                    className="flex items-center justify-center gap-2 px-[var(--beheer-btn-px)] py-[var(--beheer-btn-py)] bg-[var(--beheer-accent)] text-white font-black text-xs uppercase tracking-widest rounded-[var(--beheer-radius)] shadow-[var(--shadow-glow)] hover:opacity-90 transition-all active:scale-95 mb-8"
                >
                    <Plus className="h-4 w-4" /> 
                    Nieuwe Blog
                </button>
            )}

            <div className="grid gap-4">
                {blogs.map(blog => (
                    <div key={blog.id} className="group bg-[var(--beheer-card-bg)] rounded-[var(--beheer-radius)] border border-[var(--beheer-border)] p-6 flex items-start justify-between gap-6 hover:border-[var(--beheer-accent)]/30 transition-all shadow-sm hover:shadow-xl">
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-2">
                                <h4 className="font-black uppercase tracking-tight text-base text-[var(--beheer-text)] truncate">{blog.title}</h4>
                                <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${blog.is_published ? 'bg-green-500/10 text-green-500' : 'bg-gray-500/10 text-[var(--beheer-text-muted)]'}`}>
                                    {blog.is_published ? 'Gepubliceerd' : 'Concept'}
                                </span>
                            </div>
                            <p className="inline-block text-[10px] font-black uppercase tracking-[0.15em] text-[var(--beheer-accent)] bg-[var(--beheer-accent)]/5 px-2 py-0.5 rounded">
                                {blog.blog_type}
                            </p>
                            {blog.excerpt && <p className="text-sm text-[var(--beheer-text-muted)] mt-3 line-clamp-2 font-medium">{blog.excerpt}</p>}
                        </div>
                        <div className="flex gap-2 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => setEditingBlog(blog)} className="p-3 text-[var(--beheer-text-muted)] hover:text-[var(--beheer-accent)] hover:bg-[var(--beheer-accent)]/10 rounded-xl transition-all"><Edit className="h-4 w-4" /></button>
                            <button onClick={() => onDelete(blog.id!)} disabled={deletingId === blog.id} className="p-3 text-[var(--beheer-text-muted)] hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all">
                                {deletingId === blog.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                            </button>
                        </div>
                    </div>
                ))}
                {blogs.length === 0 && (
                    <div className="py-20 text-center text-[var(--beheer-text-muted)]">
                        <div className="p-6 bg-[var(--beheer-card-soft)] rounded-full w-fit mx-auto mb-6">
                            <FileText className="h-12 w-12 opacity-20" />
                        </div>
                        <p className="font-black uppercase tracking-widest text-xs">Nog geen blogs aangemaakt</p>
                    </div>
                )}
            </div>
        </div>
    );
}
