"use client";

import React from 'react';
import { Users } from 'lucide-react';

type TimelineProps = {
    boards: any[];
    // accepts optional image options for width/height/quality
    getImageUrl?: (id: any, options?: { quality?: number; width?: number; height?: number; format?: string }) => string;
    getMemberFullName?: (m: any) => string;
};

export default function Timeline({ boards, getImageUrl, getMemberFullName }: TimelineProps) {
    if (!boards || boards.length === 0) return null;

    // Try to sort by year (fallback to id) so timeline reads chronologically
    const items = [...boards].sort((a, b) => {
        const ya = a?.year ?? a?.jaar ?? a?.id ?? 0;
        const yb = b?.year ?? b?.jaar ?? b?.id ?? 0;
        return Number(yb) - Number(ya);
    });

    return (
        <div className="relative mx-auto w-full px-4 sm:px-0">
            {/* vertical line - shift left on small screens to avoid overflow */}
            <div className="absolute left-6 top-0 bottom-0 w-px bg-slate-200 sm:left-8" />

            <div className="space-y-8">
                {items.map((board) => (
                    <div key={board.id} className="relative pl-12 sm:pl-16">
                        {/* Year badge on line */}
                        <div className="absolute left-0 top-2 flex h-10 w-10 items-center justify-center rounded-full bg-paars text-beige font-bold text-xs sm:h-12 sm:w-12 sm:text-base">
                            {board.year ?? board.jaar ?? '—'}
                        </div>

                        <div className="rounded-2xl bg-white/90 p-8 sm:p-12 shadow-md transition hover:shadow-2xl min-h-[320px] md:min-h-[380px] lg:min-h-[420px]">
                            <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
                                <div className="flex-1 min-w-0 pr-6">
                                    <h3 className="mb-1 text-lg sm:text-2xl font-bold text-slate-900">{board.naam}</h3>
                                    {board.omschrijving && (
                                        <p className="mb-2 text-sm text-slate-600">{board.omschrijving}</p>
                                    )}

                                    {/* Members */}
                                    {Array.isArray(board.members) && board.members.length > 0 && (
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-3 text-sm font-semibold text-paars">
                                                <Users className="h-5 w-5" />
                                                <span>{board.members.length} bestuursleden</span>
                                            </div>

                                            <div className="grid grid-cols-1 gap-6 md:grid-cols-1 lg:grid-cols-2">
                                                {board.members.map((member: any) => {
                                                    // Helper to resolve picture from several potential shapes
                                                    const resolvePicture = (m: any) => {
                                                        // Candidate paths where Directus may store pictures
                                                        const candidates = [
                                                            // legacy member picture fields
                                                            m?.member_id?.picture,
                                                            m?.member_id?.picture_id,
                                                            m?.member_id?.picture?.id,
                                                            // nested user picture paths used elsewhere in the app
                                                            m?.member_id?.user?.picture,
                                                            m?.member_id?.user?.avatar,
                                                            m?.member_id?.user?.avatar?.id,
                                                            // direct user relation
                                                            m?.user_id?.picture,
                                                            m?.user_id?.picture?.id,
                                                            m?.user_id?.avatar,
                                                            m?.user_id?.avatar?.id,
                                                            // fallback on direct picture fields
                                                            m?.picture,
                                                            m?.picture?.id,
                                                            m?.avatar,
                                                            m?.avatar?.id,
                                                        ];
                                                        for (const c of candidates) {
                                                            if (!c) continue;
                                                            return c;
                                                        }
                                                        return null;
                                                    };

                                                    const avatarRef = resolvePicture(member);
                                                    // If avatarRef is an URL/string path, use directly; otherwise use getImageUrl for asset ids/objects
                                                    let avatarSrc = '/img/placeholder.svg';
                                                    if (avatarRef) {
                                                        if (typeof avatarRef === 'string' && (avatarRef.startsWith('http://') || avatarRef.startsWith('https://') || avatarRef.startsWith('/')) ) {
                                                            avatarSrc = avatarRef;
                                                        } else if (getImageUrl) {
                                                            avatarSrc = getImageUrl(avatarRef, { width: 400, height: 400 });
                                                        } else if (typeof avatarRef === 'string') {
                                                            avatarSrc = avatarRef;
                                                        }
                                                    }

                                                    const fullName = getMemberFullName ? getMemberFullName(member) : (member.member_id?.first_name && member.member_id?.last_name ? `${member.member_id.first_name} ${member.member_id.last_name}` : member.member_id?.name ?? 'Onbekend');

                                                    return (
                                                        <div key={member.id ?? `${board.id}-${Math.random()}`} className="flex items-start gap-4 rounded-lg bg-slate-50 p-6 min-h-[160px]">
                                                            <img
                                                                src={avatarSrc}
                                                                alt={fullName}
                                                                className="h-16 w-16 flex-shrink-0 rounded-full object-cover"
                                                                loading="lazy"
                                                                decoding="async"
                                                                onError={(e) => {
                                                                    const t = e.target as HTMLImageElement;
                                                                    t.src = '/img/placeholder.svg';
                                                                }}
                                                            />

                                                            <div className="min-w-0">
                                                                <p className="font-semibold text-slate-900 text-base sm:text-lg whitespace-normal">
                                                                    {fullName}
                                                                </p>
                                                                {member.functie && (
                                                                    <p className="text-sm text-paars">{member.functie}</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                {/* Optional image: full width on mobile, narrower on larger screens so members area has more room */}
                                {board.image && (
                                    <div className="order-first sm:order-last w-full sm:w-1/4 lg:w-1/3 mt-3 sm:mt-0 flex-shrink-0 overflow-hidden rounded-xl bg-slate-100">
                                        <div className="w-full h-56 sm:h-44 md:h-48 lg:h-56">
                                            <img
                                                src={
                                                    // board.image might be an object or id; if it's a URL/string, use directly
                                                    (typeof board.image === 'string' && (board.image.startsWith('http') || board.image.startsWith('/'))) ? board.image : (getImageUrl ? getImageUrl(board.image, { width: 1600, height: 900 }) : '/img/group-jump.gif')
                                                }
                                                alt={board.naam}
                                                className="h-full w-full object-cover"
                                                loading="lazy"
                                                decoding="async"
                                                onError={(e) => {
                                                    const t = e.target as HTMLImageElement;
                                                    t.src = '/img/group-jump.gif';
                                                }}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
