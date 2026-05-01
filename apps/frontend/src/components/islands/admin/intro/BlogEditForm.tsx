'use client';

import React from 'react';
import { Save, X, Eye } from 'lucide-react';
import type { IntroBlog } from '@salvemundi/validations/schema/intro.zod';
import { Button, Field, inputClass } from './IntroTabComponents';

interface Props {
    blog: Partial<IntroBlog>;
    data: Partial<IntroBlog>;
    onChange: (data: Partial<IntroBlog>) => void;
    onSave: () => void;
    onCancel: () => void;
    saving: boolean;
}

export default function BlogEditForm({ blog, data, onChange, onSave, onCancel, saving }: Props) {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 text-[11px] font-black uppercase tracking-widest text-[var(--beheer-text-muted)]">
            <div className="lg:col-span-2 space-y-8">
                <div className="flex items-center justify-between">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--beheer-accent)]">
                        {blog.id && blog.id !== -1 ? 'Blog Bewerken' : 'Nieuwe Blog'}
                    </p>
                    <div className="flex gap-2">
                        <Button onClick={onSave} loading={saving} icon={Save} variant="success">Opslaan</Button>
                        <Button onClick={onCancel} variant="ghost" icon={X}>Annuleren</Button>
                    </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Field label="Titel *">
                        <input 
                            type="text" 
                            value={data.title || ''} 
                            onChange={e => onChange({ ...data, title: e.target.value })} 
                            className={inputClass} 
                            placeholder="Titel van de blog..." 
                        />
                    </Field>
                    <Field label="Link-naam (Slug)">
                        <input 
                            type="text" 
                            value={data.slug || ''} 
                            onChange={e => onChange({ ...data, slug: e.target.value })} 
                            className={inputClass} 
                            placeholder="blog-titel-slug" 
                        />
                    </Field>
                    <div className="md:col-span-2">
                        <Field label="Samenvatting (kort overzicht)">
                            <textarea 
                                value={data.excerpt || ''} 
                                onChange={e => onChange({ ...data, excerpt: e.target.value })} 
                                rows={2} 
                                className={`${inputClass} min-h-[80px] resize-none`} 
                                placeholder="Een korte samenvatting..." 
                            />
                        </Field>
                    </div>
                    <div className="md:col-span-2">
                        <Field label="Inhoud *">
                            <textarea 
                                value={data.content || ''} 
                                onChange={e => onChange({ ...data, content: e.target.value })} 
                                rows={8} 
                                className={`${inputClass} min-h-[200px] resize-none`} 
                                placeholder="Schrijf hier je blog post..." 
                            />
                        </Field>
                    </div>
                </div>
            </div>

            <div className="space-y-8 lg:border-l lg:border-[var(--beheer-border)]/10 lg:pl-12">
                <div className="space-y-6">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--beheer-accent)]">Instellingen</p>
                    
                    <Field label="Type">
                        <select 
                            value={data.blog_type || 'update'} 
                            onChange={e => onChange({ ...data, blog_type: e.target.value as IntroBlog['blog_type'] })} 
                            className={`${inputClass} appearance-none cursor-pointer pr-10`}
                        >
                            <option value="update" className="bg-[var(--beheer-card-bg)]">Update</option>
                            <option value="pictures" className="bg-[var(--beheer-card-bg)]">Foto's</option>
                            <option value="event" className="bg-[var(--beheer-card-bg)]">Evenement</option>
                            <option value="announcement" className="bg-[var(--beheer-card-bg)]">Aankondiging</option>
                        </select>
                    </Field>

                    <Field label="Datum (Publicatie)">
                        <input 
                            type="datetime-local" 
                            value={data.created_at ? new Date(new Date(data.created_at).getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString().slice(0, 16) : ''} 
                            onChange={e => onChange({ ...data, created_at: e.target.value })} 
                            className={inputClass} 
                        />
                    </Field>

                    <div className="p-6 bg-[var(--bg-main)]/20 rounded-2xl border border-[var(--beheer-border)]/20">
                        <label className="flex items-center gap-4 cursor-pointer group select-none">
                            <div className="relative">
                                <input 
                                    type="checkbox" 
                                    className="sr-only peer"
                                    checked={data.is_published || false} 
                                    onChange={e => onChange({ ...data, is_published: e.target.checked })}
                                />
                                <div className="h-6 w-11 bg-[var(--beheer-border)]/20 dark:bg-white/5 backdrop-blur-md rounded-full peer-checked:bg-emerald-500 transition-all border border-[var(--beheer-border)]/30 group-hover:border-emerald-500/50 shadow-inner" />
                                <div className="absolute left-1 top-1 h-4 w-4 bg-white rounded-full transition-all peer-checked:left-6 shadow-lg transform peer-active:scale-90" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black uppercase tracking-widest text-[var(--beheer-text)]">Zichtbaarheid</span>
                                <span className="text-[9px] font-bold text-[var(--beheer-text-muted)]">{data.is_published ? 'Openbaar' : 'Concept'}</span>
                            </div>
                        </label>
                    </div>
                </div>

                <div className="space-y-6">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--beheer-accent)]">Voorvertoning</p>
                    <div className="p-6 rounded-2xl bg-white/5 border border-dashed border-[var(--beheer-border)]/40 flex flex-col items-center justify-center text-center gap-3">
                        <Eye className="h-6 w-6 opacity-20" />
                        <p className="text-[9px] opacity-40 italic">Voorvertoning functionaliteit binnenkort beschikbaar</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
