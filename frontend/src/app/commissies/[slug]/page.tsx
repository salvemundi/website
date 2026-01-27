'use client';
import { useState } from 'react';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import SmartImage from '@/shared/ui/SmartImage';
import { useSalvemundiCommitteesWithMembers, useSalvemundiEventsByCommittee, useSalvemundiCommittee } from '@/shared/lib/hooks/useSalvemundiApi';
import { useAuth } from '@/features/auth/providers/auth-provider';
import { directusFetch } from '@/shared/lib/directus';
import { getImageUrl } from '@/shared/lib/api/salvemundi';
import { slugify } from '@/shared/lib/utils/slug';
import { Mail, Calendar, Users2, History, Edit, } from 'lucide-react';

function cleanCommitteeName(name: string): string {
    return name.replace(/\s*\|\|\s*SALVE MUNDI\s*/gi, '').trim();
}

export default function CommitteeDetailPage() {
    const params = useParams();
    const slug = params?.slug as string;

    const { data: committeesData = [], isLoading, error } = useSalvemundiCommitteesWithMembers();

    // Find committee by slug
    const committee = committeesData.find(
        (c) => slugify(cleanCommitteeName(c.name)) === slug
    );

    const committeeId = committee?.id;

    // Fetch full committee details (to get the long description/description field)
    const { data: committeeDetail } = useSalvemundiCommittee(committeeId);

    // Fetch events for this committee
    const { data: events = [] } = useSalvemundiEventsByCommittee(committeeId);
    const { user } = useAuth();
    const router = useRouter();

    // Determine leader status from application storage (preferred) or committee membership
    const storedCommittees = user?.committees || (typeof window !== 'undefined' ? JSON.parse(localStorage.getItem(`user_committees_${user?.id}`) || 'null') || [] : []);
    const isLeaderFromStorage = !!storedCommittees?.find((c: any) => String(c.id) === String(committeeId) && c.is_leader);
    // we'll determine leader status after we have the visible members list

    const [membersModalOpen, setMembersModalOpen] = useState(false);
    const [imageModalOpen, setImageModalOpen] = useState(false);

    if (isLoading) {
        return (
            <div className="relative min-h-screen" style={{ backgroundColor: 'var(--bg-main)' }}>
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-oranje/10/80 via-transparent to-oranje/20/60" />
                <div className="relative z-10">
                    <div className="mx-auto max-w-app px-4 py-12">
                        <div className="h-96 animate-pulse rounded-3xl bg-white/60 dark:bg-white/10" />
                    </div>
                </div>
            </div>
        );
    }

    if (error || !committee) {
        return (
            <div className="relative min-h-screen" style={{ backgroundColor: 'var(--bg-main)' }}>
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-oranje/10/80 via-transparent to-oranje/20/60" />
                <div className="relative z-10">
                    <div className="mx-auto max-w-app px-4 py-12">
                        <div className="rounded-3xl bg-[var(--bg-card)] dark:border dark:border-white/10 p-8 text-center shadow-lg">
                            <p className="mb-4 text-lg font-semibold text-paars">Commissie niet gevonden</p>
                            <Link
                                href="/commissies"
                                className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-oranje to-red-600 px-6 py-3 font-semibold text-white shadow-lg transition hover:-translate-y-0.5"
                            >
                                Terug naar commissies
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const cleanName = cleanCommitteeName(committee.name);
    const members = committee.committee_members?.filter((m: any) => m.is_visible) || [];

    function getMemberFullName(member: any) {
        // Prefer nested relation fields (legacy), then fallback to plain text fields
        if (member?.member_id) {
            const m = member.member_id;
            const first = m.first_name || m.firstname || m.name || m.display_name;
            const last = m.last_name || m.lastname || m.surname || '';
            const combined = `${first || ''} ${last || ''}`.trim();
            if (combined) return combined;
        }

        if (member?.user_id) {
            const u = member.user_id;
            const first = u.first_name || u.firstname || u.name || u.display_name;
            const last = u.last_name || u.lastname || u.surname || '';
            const combined = `${first || ''} ${last || ''}`.trim();
            if (combined) return combined;
        }

        // Direct text fields on member row (for plain-text entries)
        if (member?.name) return member.name;
        if (member?.full_name) return member.full_name;
        if (member?.first_name || member?.last_name) return `${member.first_name || ''} ${member.last_name || ''}`.trim();

        return 'Onbekend';
    }

    function getMemberEmail(member: any) {
        return member?.user_id?.email || member?.email || '';
    }

    function resolveMemberAvatar(member: any) {
        // Try common avatar/picture fields, return falsy when none
        const candidates = [
            member?.user_id?.avatar,
            member?.user_id?.picture,
            member?.member_id?.avatar,
            member?.member_id?.picture,
            member?.picture,
            member?.avatar
        ];
        for (const c of candidates) if (c) return c;
        return null;
    }

    const leader = members.find((m: any) => m.is_leader);
    const isLeader = Boolean(isLeaderFromStorage || (user && leader && String(leader.user_id.id) === String(user.id)));

    const removeMember = async (memberRowId: number) => {
        try {
            if (!confirm('Weet je zeker dat je dit lid wilt verwijderen uit de commissie?')) return;
            await directusFetch(`/items/committee_members/${memberRowId}`, { method: 'DELETE' });
            window.location.reload();
        } catch (error) {
            console.error('Failed to remove member:', error);
            alert('Fout bij verwijderen van lid');
        }
    };

    const toggleLeader = async (memberRowId: number, makeLeader: boolean) => {
        try {
            await directusFetch(`/items/committee_members/${memberRowId}`, {
                method: 'PATCH',
                body: JSON.stringify({ is_leader: makeLeader }),
            });
            window.location.reload();
        } catch (error) {
            console.error('Failed to toggle leader:', error);
            alert('Fout bij bijwerken rol');
        }
    };

    return (
        <>
            <div className="relative z-10">
                {/* Hero with Committee Image */}
                <section className="relative overflow-hidden py-20">
                    <div className="absolute inset-0">
                        <button
                            aria-label={`Bekijk afbeelding van ${cleanName}`}
                            onClick={() => setImageModalOpen(true)}
                            className="absolute inset-0 h-full w-full"
                        >
                            <SmartImage
                                src={committee.image ? getImageUrl(committee.image) : '/img/group-jump.gif'}
                                alt={cleanName}
                                fill
                                sizes="100vw"
                                className="object-cover"
                                priority
                                quality={75}
                            />
                        </button>
                        {/* Semi-transparent gradient overlay with backdrop blur so the banner image is blurred underneath */}
                        <div className="absolute inset-0 pointer-events-none bg-gradient-to-r from-paars/60 to-oranje/40 backdrop-blur-md" />
                    </div>
                    <div className="relative mx-auto max-w-app px-4 sm:px-6 lg:px-8">
                        <Link
                            href="/commissies"
                            className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-theme-purple dark:text-theme-white transition hover:scale-105"
                        >
                            ← Terug naar commissies
                        </Link>
                        <div className="flex items-center gap-4">
                            <h1 className="text-4xl font-black text-white sm:text-5xl md:text-6xl">
                                {cleanName}
                            </h1>
                            {isLeader && (
                                <div className="ml-2 flex items-center gap-2">
                                    <button
                                        onClick={() => router.push(`/admin/commissies/${committeeId}`)}
                                        className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-2 text-sm font-semibold text-white hover:bg-white/30"
                                    >
                                        <Edit className="h-4 w-4" />
                                        Bewerken
                                    </button>
                                    <button
                                        onClick={() => setMembersModalOpen(true)}
                                        className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-sm font-semibold text-white hover:bg-white/20"
                                    >
                                        <Users2 className="h-4 w-4" />
                                        Beheer leden
                                    </button>
                                </div>
                            )}
                        </div>
                        {committee.short_description && (
                            <p className="mt-4 max-w-2xl text-lg text-ink-muted dark:text-white/90">
                                {committee.short_description}
                            </p>
                        )}
                    </div>
                </section>

                <main className="mx-auto max-w-app px-4 py-12 sm:px-6 lg:px-8">
                    <div className="grid gap-8 lg:grid-cols-3">
                        {/* Main Content */}
                        <div className="lg:col-span-2 space-y-8">
                            {/* Committee image */}
                            {committee.image && (
                                <div className="rounded-3xl overflow-hidden bg-[var(--bg-card)] dark:border dark:border-white/10 shadow-lg relative h-96">
                                    <button
                                        onClick={() => setImageModalOpen(true)}
                                        aria-label={`Open afbeelding van ${cleanName}`}
                                        className="absolute inset-0 h-full w-full"
                                    >
                                        <SmartImage
                                            src={getImageUrl(committee.image)}
                                            alt={cleanName}
                                            width={720}
                                            height={480}
                                            className="object-contain w-full h-full bg-white dark:bg-[#0f1721]"
                                            loading="lazy"
                                            placeholder="blur"
                                            blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iODAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iI2RkZCIvPjwvc3ZnPg=="
                                        />
                                    </button>
                                </div>
                            )}

                            {/* Short description / Overview */}
                            {committee.description && (
                                <div className="rounded-3xl bg-[var(--bg-card)] dark:border dark:border-white/10 p-8 shadow-lg">
                                    <h2 className="mb-4 text-2xl font-bold text-theme-purple dark:text-theme-white">Over {cleanName}</h2>
                                    <div
                                        className="prose max-w-none text-theme-purple dark:text-theme-white/80"
                                        dangerouslySetInnerHTML={{ __html: committee.description }}
                                    />
                                </div>
                            )}

                            {/* Long description from Directus (if available) - render above activities */}
                            {committeeDetail?.description && (
                                <div className="rounded-3xl bg-[var(--bg-card)] dark:border dark:border-white/10 p-8 shadow-lg">
                                    <h2 className="mb-4 text-2xl font-bold text-theme-purple dark:text-theme-white">Meer over {cleanName}</h2>
                                    <div
                                        className="prose max-w-none text-theme-purple dark:text-theme-white/80"
                                        dangerouslySetInnerHTML={{ __html: committeeDetail.description }}
                                    />
                                </div>
                            )}

                            {/* Events */}
                            {events.length > 0 && (
                                <div className="rounded-3xl bg-[var(--bg-card)] dark:border dark:border-white/10 p-8 shadow-lg">
                                    <h2 className="mb-6 text-2xl font-bold text-theme-purple dark:text-theme-white">Activiteiten</h2>
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        {events.map((event) => (
                                            <Link
                                                key={event.id}
                                                href={`/activiteiten/${event.id}`}
                                                className="group rounded-2xl bg-slate-50 dark:bg-black/20 p-4 shadow-sm transition hover:shadow-lg border border-slate-200 dark:border-white/10"
                                            >
                                                <div className="mb-2 flex items-center gap-2 text-sm text-theme-purple">
                                                    <Calendar className="h-4 w-4" />
                                                    {new Date(event.event_date).toLocaleDateString('nl-NL', {
                                                        day: 'numeric',
                                                        month: 'long',
                                                    })}
                                                </div>
                                                <h3 className="font-semibold text-theme-purple dark:text-theme-white group-hover:text-theme-purple/80">
                                                    {event.name}
                                                </h3>
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-6">
                            {/* Committee Email Contact */}
                            {committee.email && (
                                <div className="rounded-3xl bg-[var(--bg-card)] dark:border dark:border-white/10 p-6 shadow-lg">
                                    <h3 className="mb-4 text-lg font-bold text-theme-purple dark:text-theme-white">Commissie Contact</h3>
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-theme-purple/10 dark:bg-white/10">
                                            <Mail className="h-6 w-6 text-theme-purple dark:text-theme-white" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-theme-purple/60 dark:text-theme-white/60 mb-1">Email</p>
                                            <p className="text-sm font-medium text-theme-purple dark:text-theme-white truncate">
                                                {committee.email}
                                            </p>
                                        </div>
                                    </div>
                                    <a
                                        href={`mailto:${committee.email}`}
                                        className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-theme-purple/10 dark:bg-white/10 px-4 py-2 text-sm font-semibold text-theme-purple dark:text-theme-white shadow-sm transition hover:bg-theme-purple/20 dark:hover:bg-white/20"
                                    >
                                        <Mail className="h-4 w-4" />
                                        E-mail versturen
                                    </a>
                                </div>
                            )}

                            {/* Leader Contact */}
                            {leader && (
                                <div className="rounded-3xl bg-[var(--bg-card)] dark:border dark:border-white/10 p-6 shadow-lg">
                                    <h3 className="mb-4 text-lg font-bold text-theme-purple dark:text-theme-white">Commissieleider</h3>
                                    <div className="flex items-center gap-4">
                                        <div className="relative h-16 w-16 rounded-full overflow-hidden border-2 border-theme-purple/20 flex items-center justify-center bg-slate-100 dark:bg-slate-800">
                                            {resolveMemberAvatar(leader) ? (
                                                <SmartImage
                                                    src={getImageUrl(resolveMemberAvatar(leader))}
                                                    alt={getMemberFullName(leader)}
                                                    fill
                                                    sizes="64px"
                                                    className="object-cover"
                                                    loading="lazy"
                                                />
                                            ) : (
                                                <span className="font-semibold text-theme-purple dark:text-theme-white">{getMemberFullName(leader).split(' ').map((n: string) => n[0]).join('').slice(0,2)}</span>
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-theme-purple dark:text-theme-white">
                                                {getMemberFullName(leader)}
                                            </p>
                                            <p className="text-sm text-theme-purple/60 dark:text-theme-white/60">Commissieleider</p>
                                        </div>
                                    </div>
                                    {getMemberEmail(leader) && (
                                        <a
                                            href={`mailto:${getMemberEmail(leader)}`}
                                            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-theme-purple/10 dark:bg-white/10 px-4 py-2 text-sm font-semibold text-theme-purple dark:text-theme-white shadow-sm transition hover:bg-theme-purple/20 dark:hover:bg-white/20"
                                        >
                                            <Mail className="h-4 w-4" />
                                            Contact opnemen
                                        </a>
                                    )}
                                </div>
                            )}

                            {/* Members */}
                            {members.length > 0 && (
                                <div className="rounded-3xl bg-[var(--bg-card)] dark:border dark:border-white/10 p-6 shadow-lg">
                                    <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-theme-purple dark:text-theme-white">
                                        <Users2 className="h-5 w-5 text-theme-purple dark:text-theme-white" />
                                        Leden ({members.length})
                                    </h3>
                                    <div className="grid grid-cols-3 gap-4">
                                        {members.map((member: any) => (
                                            <div key={member.id} className="text-center group/member">
                                                <div className="relative mx-auto h-16 w-16 rounded-full overflow-hidden border-2 border-transparent group-hover/member:border-theme-purple transition-colors flex items-center justify-center bg-slate-100 dark:bg-slate-800">
                                                    {resolveMemberAvatar(member) ? (
                                                        <SmartImage
                                                            src={getImageUrl(resolveMemberAvatar(member))}
                                                            alt={getMemberFullName(member)}
                                                            fill
                                                            sizes="64px"
                                                            className="object-cover"
                                                            loading="lazy"
                                                        />
                                                    ) : (
                                                        <span className="font-semibold text-theme-purple dark:text-theme-white">{getMemberFullName(member).split(' ').map((n: string) => n[0]).join('').slice(0,2)}</span>
                                                    )}
                                                </div>
                                                <p className="mt-2 text-xs font-bold text-theme-purple dark:text-theme-white">
                                                    {getMemberFullName(member)}
                                                </p>
                                                {isLeader && (
                                                    <div className="mt-2 flex flex-col items-center gap-1">
                                                        <button onClick={() => toggleLeader(member.id, !member.is_leader)} title={member.is_leader ? 'Maak geen leider' : 'Maak leider'} className="text-[10px] uppercase font-bold text-theme-purple/60 hover:text-theme-purple">
                                                            {member.is_leader ? 'Leider' : 'Maak leider'}
                                                        </button>
                                                        <button onClick={() => removeMember(member.id)} title="Verwijder lid" className="text-[10px] uppercase font-bold text-red-500/60 hover:text-red-500">
                                                            Verwijder
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Board History Button - Only show for Bestuur */}
                            {cleanName.toLowerCase().includes('bestuur') && (
                                <div className="rounded-3xl bg-[var(--bg-card)] dark:border dark:border-white/10 p-6 shadow-lg">
                                    <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-theme-purple dark:text-theme-white">
                                        <History className="h-5 w-5 text-theme-purple dark:text-theme-white" />
                                        Geschiedenis
                                    </h3>
                                    <p className="mb-4 text-sm text-theme-purple/60 dark:text-theme-white/60">
                                        Bekijk alle eerdere besturen van Salve Mundi
                                    </p>
                                    <Link
                                        href="/commissies/geschiedenis"
                                        className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-theme text-theme-white px-4 py-3 text-sm font-semibold shadow-lg transition hover:shadow-xl hover:-translate-y-0.5"
                                    >
                                        <History className="h-4 w-4" />
                                        Bekijk bestuursgeschiedenis
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                </main>

            </div>
            {imageModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/70" onClick={() => setImageModalOpen(false)} />
                    <div className="relative z-10 max-w-screen-lg mx-4">
                        <button onClick={() => setImageModalOpen(false)} className="absolute right-2 top-2 z-20 rounded-full bg-white/90 p-2">Sluiten</button>
                        <div className="rounded-2xl overflow-hidden bg-black p-4 flex items-center justify-center">
                            <SmartImage
                                src={getImageUrl(committee.image)}
                                alt={cleanName}
                                className="max-h-[90vh] w-auto object-contain"
                                loading="eager"
                            />
                        </div>
                    </div>
                </div>
            )}

            {membersModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/50" onClick={() => setMembersModalOpen(false)} />
                    <div className="relative z-10 w-full max-w-3xl mx-4 bg-white rounded-2xl p-6 shadow-lg">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold">Beheer commissieleden</h3>
                            <button onClick={() => setMembersModalOpen(false)} className="text-sm text-slate-600">Sluiten</button>
                        </div>
                        <div className="grid gap-4">
                            {members.map((member: any) => (
                                <div key={member.id} className="flex items-center justify-between gap-4 p-3 rounded-md bg-slate-50">
                                    <div className="flex items-center gap-3">
                                        <div className="relative h-10 w-10 rounded-full overflow-hidden">
                                            <SmartImage
                                                src={getImageUrl(member.user_id.avatar)}
                                                alt={`${member.user_id.first_name} ${member.user_id.last_name}`}
                                                fill
                                                sizes="40px"
                                                className="object-cover"
                                                loading="lazy"
                                                placeholder="blur"
                                                blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjZGRkIi8+PC9zdmc+"
                                            />
                                        </div>
                                        <div>
                                            <div className="font-semibold">{member.user_id.first_name} {member.user_id.last_name}</div>
                                            <div className="text-sm text-slate-500">{member.user_id.email}</div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => toggleLeader(member.id, !member.is_leader)} className="px-3 py-1 rounded-md bg-paars/10 text-paars text-sm">{member.is_leader ? 'Zet geen leider' : 'Maak leider'}</button>
                                        <button onClick={() => removeMember(member.id)} className="px-3 py-1 rounded-md bg-red-50 text-red-600 text-sm">Verwijder</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
