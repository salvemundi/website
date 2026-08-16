'use client';

import React, { useState } from 'react';
import {
    Plus,
    Edit,
    Trash,
    FileText,
    ChevronDown
} from 'lucide-react';
import type { IntroBlog } from '@salvemundi/validations/schema/intro.zod';
import { ActionButton, EmptyState, Button } from './IntroTabComponents';
import BlogEditForm from './BlogEditForm';
import { getImageUrl } from '@/lib/utils/image-utils';

import { INTRO_BLOG_TYPES } from '@/shared/lib/constants/intro.constants';
import { formatDate } from '@/shared/lib/utils/date';

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
        const blogId = blog.id ?? 0;
        setEditingId(blogId);
        // Sanitize: convert nulls to undefined to avoid Zod validation issues
        const sanitized = Object.fromEntries(
            Object.entries(blog).map(([key, value]) => [key, value === null ? undefined : value])
        );
        setEditData(sanitized);
        if (!expandedRows.includes(blogId)) setExpandedRows(prev => [...prev, blogId]);
    };

    const handleSave = async (overrides?: Partial<IntroBlog>) => {
        // Remove empty strings for required fields to ensure clean validation
        const sanitized = { ...editData, ...overrides };
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

    return (
        <div>
            <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
                <div className="flex flex-col">
                    <h2 className="text-xl font-semibold text-(--beheer-text)">Blogs</h2>
                    <p className="text-xs font-medium text-(--beheer-text-muted) opacity-50">Beheer introductie updates en nieuws</p>
                </div>
                <Button onClick={startNew} icon={Plus}>Nieuwe Blog</Button>
            </div>

            {editingId === -1 && (
                <div className="bg-(--beheer-card-bg) rounded-(--beheer-radius) border border-(--beheer-accent)/20 p-5 sm:p-8 mb-4 shadow-2xl">
                    <BlogEditForm
                        blog={{ id: -1 }}
                        data={editData}
                        onChange={setEditData}
                        onSave={() => { void handleSave(); }}
                        onPublish={() => { void handleSave({ is_published: true }); }}
                        onCancel={() => setEditingId(null)}
                        saving={saving}
                    />
                </div>
            )}

            <div className="grid gap-4">
                {blogs.map(blog => {
                    const blogId = blog.id ?? 0;
                    const isExpanded = expandedRows.includes(blogId);
                    const isEditing = editingId === blog.id;
                    const typeInfo = INTRO_BLOG_TYPES[blog.blog_type];
                    const date = blog.created_at;

                    return (
                        <div
                            key={blog.id}
                            className="bg-(--beheer-card-bg) rounded-(--beheer-radius) border border-(--beheer-border) shadow-sm hover:shadow-xl hover:border-(--beheer-accent)/30 transition-all overflow-hidden"
                        >
                            <div
                                role="button"
                                tabIndex={0}
                                onClick={() => toggleExpand(blogId)}
                                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleExpand(blogId); } }}
                                className="w-full flex items-center gap-3 sm:gap-4 p-4 sm:p-6 text-left cursor-pointer group"
                            >
                                <div className={`h-2.5 w-2.5 rounded-full shrink-0 shadow-[0_0_10px_rgba(0,0,0,0.1)] transition-all ${blog.is_published ? 'bg-emerald-500 shadow-emerald-500/40' : 'bg-(--beheer-border) opacity-30'}`} />

                                {blog.image && (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                        src={getImageUrl(blog.image as string, { width: 96, height: 96, fit: 'cover' })}
                                        alt=""
                                        className="h-10 w-10 rounded-lg object-cover shrink-0"
                                    />
                                )}

                                <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="text-sm font-semibold text-(--beheer-text) group-hover:text-(--beheer-accent) transition-colors truncate">
                                            {blog.title}
                                        </span>
                                        {!blog.is_published && (
                                            <span className="bg-amber-500/10 text-amber-500 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-amber-500/20 shrink-0">
                                                Concept
                                            </span>
                                        )}
                                    </div>
                                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium text-(--beheer-text-muted) opacity-70">
                                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${typeInfo.badgeClass}`}>
                                            {typeInfo.label}
                                        </span>
                                        <span>{date ? formatDate(date, 'dd-MM-yyyy') : '-'}</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                                    <ActionButton
                                        icon={Edit}
                                        onClick={(e) => startEdit(e, blog)}
                                        title="Bewerken"
                                    />
                                    <ActionButton
                                        icon={Trash}
                                        onClick={(e) => { e.stopPropagation(); void onDelete(blogId); }}
                                        variant="danger"
                                        disabled={deletingId === blog.id}
                                        title="Verwijderen"
                                    />
                                    <div className="text-(--beheer-text-muted) p-2 group-hover:text-(--beheer-accent) transition-colors">
                                        <ChevronDown className="h-4 w-4 transition-transform duration-300" style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }} />
                                    </div>
                                </div>
                            </div>

                            {isExpanded && (
                                <div className="border-t border-(--beheer-border)/10 bg-(--beheer-card-soft)/30 p-5 sm:p-8">
                                    {isEditing ? (
                                        <BlogEditForm
                                            blog={blog}
                                            data={editData}
                                            onChange={setEditData}
                                            onSave={() => { void handleSave(); }}
                                            onPublish={() => { void handleSave({ is_published: true }); }}
                                            onCancel={() => setEditingId(null)}
                                            saving={saving}
                                        />
                                    ) : (
                                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-12 text-sm font-medium text-(--beheer-text-muted)">
                                            <div className="lg:col-span-2 space-y-6 sm:space-y-8">
                                                <div className="flex items-center justify-between">
                                                    <p className="text-xs font-semibold text-(--beheer-accent)">Inhoud</p>
                                                    <Button onClick={() => startEdit({ stopPropagation: () => {} } as unknown as React.MouseEvent, blog)} variant="ghost" icon={Edit}>
                                                        Bewerken
                                                    </Button>
                                                </div>
                                                <div className="space-y-6">
                                                    {blog.excerpt && (
                                                        <div className="space-y-2">
                                                            <span className="opacity-50 text-[10px] font-semibold">Samenvatting</span>
                                                            <p className="text-xs font-semibold text-(--beheer-text) leading-relaxed italic normal-case bg-white/5 p-4 rounded-xl border border-(--beheer-border)/10">
                                                                {blog.excerpt}
                                                            </p>
                                                        </div>
                                                    )}
                                                    <div className="space-y-2">
                                                        <span className="opacity-50 text-[10px] font-semibold">Inhoud</span>
                                                        <div className="text-sm font-medium text-(--beheer-text) leading-relaxed normal-case whitespace-pre-wrap">
                                                            {blog.content}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="space-y-6 sm:space-y-8 lg:border-l lg:border-(--beheer-border)/10 lg:pl-8 xl:pl-12">
                                                <div className="space-y-4">
                                                    <p className="text-xs font-semibold text-(--beheer-accent)">Details</p>
                                                    <div className="grid gap-4">
                                                        <div className="flex flex-col gap-1">
                                                            <span className="opacity-50">Type</span>
                                                            <span className="text-(--beheer-text) text-sm font-semibold">{typeInfo.label}</span>
                                                        </div>
                                                        <div className="flex flex-col gap-1">
                                                            <span className="opacity-50">Link-naam (Slug)</span>
                                                            <span className="text-(--beheer-text) text-xs font-semibold break-all">{blog.slug || '-'}</span>
                                                        </div>
                                                        <div className="flex flex-col gap-1">
                                                            <span className="opacity-50">Datum</span>
                                                            <span className="text-(--beheer-text) text-xs font-semibold">
                                                                {date ? new Date(date).toLocaleString('nl-NL', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
                {blogs.length === 0 && editingId !== -1 && (
                    <EmptyState icon={FileText} text="Nog geen blogs aangemaakt" />
                )}
            </div>
        </div>
    );
}
