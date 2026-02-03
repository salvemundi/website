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
import { Mail, Calendar, Users2, History, Edit, ArrowLeft, Trash2, ShieldCheck } from 'lucide-react';
import PageHeader from '@/widgets/page-header/ui/PageHeader';

function cleanCommitteeName(name: string): string {
    return name.replace(/\s*(\|\||[-–—])\s*SALVE MUNDI\s*$/gi, '').trim();
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

    const [membersModalOpen, setMembersModalOpen] = useState(false);
    const [imageModalOpen, setImageModalOpen] = useState(false);

    if (isLoading) {
        return (
            <div className="relative min-h-screen bg-[var(--bg-main)]">
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-theme-purple/5 via-transparent to-theme-purple/10" />
                <div className="relative z-10">
                    <div className="mx-auto max-w-app px-4 py-12">
                        <div className="h-96 animate-pulse rounded-3xl bg-[var(--bg-card)] dark:bg-white/5" />
                    </div>
                </div>
            </div>
        );
    }

    if (error || !committee) {
        return (
            <div className="relative min-h-screen bg-[var(--bg-main)]">
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-theme-purple/5 via-transparent to-theme-purple/10" />
                <div className="relative z-10">
                    <div className="mx-auto max-w-app px-4 py-12">
                        <div className="rounded-3xl bg-[var(--bg-card)] dark:border dark:border-white/10 p-8 text-center shadow-lg">
                            <p className="mb-4 text-lg font-semibold text-theme-purple">Commissie niet gevonden</p>
                            <Link
                                href="/commissies"
                                className="inline-flex items-center justify-center rounded-full bg-theme-purple px-6 py-3 font-semibold text-white shadow-lg transition hover:-translate-y-0.5"
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

        if (member?.name) return member.name;
        if (member?.full_name) return member.full_name;
        if (member?.first_name || member?.last_name) return `${member.first_name || ''} ${member.last_name || ''}`.trim();

        return 'Onbekend';
    }

    function getMemberEmail(member: any) {
        return member?.user_id?.email || member?.email || '';
    }

    function resolveMemberAvatar(member: any) {
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
    const isLeader = Boolean(isLeaderFromStorage || (user && leader && String(leader.user_id?.id) === String(user.id)));

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
        <div className="bg-[var(--bg-main)] min-h-screen">
            <PageHeader
                title={cleanName.toUpperCase()}
                backgroundImage={committee.image ? getImageUrl(committee.image) : '/img/backgrounds/commissies-banner.png'}
                backgroundPosition="center"
                imageFilter="brightness(0.6) blur(2px)"
                backLink="/commissies"
            >
                <div className="flex flex-col items-center gap-4">
                    {committee.short_description && (
                        <p className="max-w-2xl text-lg text-white/90 sm:text-xl text-center">
                            {committee.short_description}
                        </p>
                    )}
                    {isLeader && (
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => router.push(`/admin/commissies/${committeeId}`)}
                                className="inline-flex items-center gap-2 rounded-full bg-white/20 backdrop-blur-md px-4 py-2 text-sm font-semibold text-white hover:bg-white/30 transition-all border border-white/10"
                            >
                                <Edit className="h-4 w-4" />
                                Bewerken
                            </button>
                            <button
                                onClick={() => setMembersModalOpen(true)}
                                className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-md px-4 py-2 text-sm font-semibold text-white hover:bg-white/20 transition-all border border-white/10"
                            >
                                <Users2 className="h-4 w-4" />
                                Leden Beheren
                            </button>
                        </div>
                    )}
                </div>
            </PageHeader>

            <main className="mx-auto max-w-app px-4 py-12 sm:px-6 lg:px-8">
                <div className="grid gap-8 lg:grid-cols-3">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Highlights Image */}
                        {committee.image && (
                            <div className={`group relative overflow-hidden rounded-3xl bg-[var(--bg-card)] shadow-lg dark:border dark:border-white/10 ${cleanName.toLowerCase().includes('bestuur') ? "h-auto min-h-[400px]" : "h-96"}`}>
                                <button
                                    onClick={() => setImageModalOpen(true)}
                                    className={`relative w-full outline-none ${cleanName.toLowerCase().includes('bestuur') ? "h-auto" : "h-full"}`}
                                    aria-label="Vergroot afbeelding"
                                >
                                    <div className={`relative w-full ${cleanName.toLowerCase().includes('bestuur') ? "aspect-auto" : "h-full"}`}>
                                        <SmartImage
                                            src={getImageUrl(committee.image)}
                                            alt={cleanName}
                                            fill={!cleanName.toLowerCase().includes('bestuur')}
                                            width={cleanName.toLowerCase().includes('bestuur') ? 1200 : undefined}
                                            height={cleanName.toLowerCase().includes('bestuur') ? 800 : undefined}
                                            className={`${cleanName.toLowerCase().includes('bestuur') ? "relative h-auto w-full object-contain" : "object-cover"} transition duration-700 group-hover:scale-105`}
                                            priority
                                        />
                                    </div>
                                    <div className="absolute inset-0 bg-black/0 transition duration-300 group-hover:bg-black/20 flex items-center justify-center pointer-events-none">
                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity translate-y-4 group-hover:translate-y-0 duration-300 bg-white/90 dark:bg-black/80 p-3 rounded-full shadow-xl">
                                            <Users2 className="h-6 w-6 text-theme-purple" />
                                        </div>
                                    </div>
                                </button>
                            </div>
                        )}

                        {/* Description Sections */}
                        {(committee.description || committeeDetail?.description) && (
                            <div className="space-y-6">
                                {committee.description && (
                                    <div className="rounded-3xl bg-[var(--bg-card)] p-8 shadow-card dark:border dark:border-white/10">
                                        <h2 className="mb-6 text-2xl font-bold text-theme-purple">Over {cleanName}</h2>
                                        <div
                                            className="prose prose-purple max-w-none dark:prose-invert text-[var(--text-main)]"
                                            dangerouslySetInnerHTML={{ __html: committee.description }}
                                        />
                                    </div>
                                )}

                                {committeeDetail?.description && (
                                    <div className="rounded-3xl bg-[var(--bg-card)] p-8 shadow-card dark:border dark:border-white/10">
                                        <h2 className="mb-6 text-2xl font-bold text-theme-purple">Achtergrondinformatie</h2>
                                        <div
                                            className="prose prose-purple max-w-none dark:prose-invert text-[var(--text-main)]"
                                            dangerouslySetInnerHTML={{ __html: committeeDetail.description }}
                                        />
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Events Section */}
                        {events.length > 0 && (
                            <div className="rounded-3xl bg-[var(--bg-card)] p-8 shadow-card dark:border dark:border-white/10">
                                <h2 className="mb-6 text-2xl font-bold text-theme-purple">Activiteiten</h2>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    {events.map((event) => (
                                        <Link
                                            key={event.id}
                                            href={`/activiteiten/${event.id}`}
                                            className="group relative block overflow-hidden rounded-2xl border border-[var(--border-color)] bg-[var(--bg-main)] p-5 transition-all hover:-translate-y-1 hover:border-theme-purple hover:shadow-xl"
                                        >
                                            <div className="mb-3 flex items-center gap-2 text-sm font-medium text-theme-purple">
                                                <Calendar className="h-4 w-4" />
                                                {new Date(event.event_date).toLocaleDateString('nl-NL', {
                                                    day: 'numeric',
                                                    month: 'long',
                                                    year: 'numeric'
                                                })}
                                            </div>
                                            <h3 className="text-lg font-bold text-[var(--text-main)] group-hover:text-theme-purple transition-colors">
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
                        {/* Contact Card */}
                        {committee.email && (
                            <div className="rounded-3xl bg-[var(--bg-card)] p-6 shadow-card dark:border dark:border-white/10">
                                <h3 className="mb-6 flex items-center gap-2 text-lg font-bold text-theme-purple">
                                    <Mail className="h-5 w-5" />
                                    Contact
                                </h3>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-4 p-3 rounded-2xl bg-[var(--bg-main)]">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-theme-purple/10">
                                            <Mail className="h-5 w-5 text-theme-purple" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">E-mail</p>
                                            <p className="truncate text-sm font-bold text-[var(--text-main)]">{committee.email}</p>
                                        </div>
                                    </div>
                                    <a
                                        href={`mailto:${committee.email}`}
                                        className="flex w-full items-center justify-center gap-2 rounded-full bg-theme-purple px-4 py-3 text-sm font-bold text-white shadow-lg transition hover:scale-105 active:scale-95"
                                    >
                                        Bericht sturen
                                    </a>
                                </div>
                            </div>
                        )}

                        {/* Leader Section */}
                        {leader && (
                            <div className="rounded-3xl bg-[var(--bg-card)] p-6 shadow-card dark:border dark:border-white/10">
                                <h3 className="mb-6 flex items-center gap-2 text-lg font-bold text-theme-purple">
                                    <ShieldCheck className="h-5 w-5" />
                                    Voorzitter
                                </h3>
                                <div className="group relative flex items-center gap-4 p-4 rounded-2xl bg-[var(--bg-main)] border border-transparent hover:border-theme-purple transition-all">
                                    <div className="relative h-16 w-16 overflow-hidden rounded-full ring-4 ring-theme-purple/10">
                                        {resolveMemberAvatar(leader) ? (
                                            <SmartImage
                                                src={getImageUrl(resolveMemberAvatar(leader))}
                                                alt={getMemberFullName(leader)}
                                                fill
                                                className="object-cover"
                                            />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center bg-theme-purple/20 text-xl font-black text-theme-purple">
                                                {getMemberFullName(leader).charAt(0)}
                                            </div>
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="truncate font-bold text-[var(--text-main)]">{getMemberFullName(leader)}</p>
                                        <p className="text-xs font-medium text-theme-purple">Huidig voorzitter</p>
                                    </div>
                                </div>
                                {getMemberEmail(leader) && (
                                    <a
                                        href={`mailto:${getMemberEmail(leader)}`}
                                        className="mt-4 flex w-full items-center justify-center gap-2 rounded-full border border-theme-purple/20 bg-theme-purple/5 px-4 py-2 text-sm font-bold text-theme-purple transition hover:bg-theme-purple/10"
                                    >
                                        Direct contact
                                    </a>
                                )}
                            </div>
                        )}

                        {/* All Members List (Replaces Team Grid) */}
                        {members.filter((m: any) => !m.is_leader).length > 0 && (
                            <div className="space-y-4">
                                <h3 className="flex items-center gap-2 text-lg font-bold text-theme-purple px-2">
                                    <Users2 className="h-5 w-5" />
                                    Overige Bestuursleden
                                </h3>
                                <div className="space-y-3">
                                    {members.filter((m: any) => !m.is_leader).map((member: any) => (
                                        <div key={member.id} className="group relative flex items-center gap-4 p-4 rounded-3xl bg-[var(--bg-card)] border border-transparent hover:border-theme-purple transition-all shadow-card dark:border-white/10">
                                            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full ring-4 ring-theme-purple/5">
                                                {resolveMemberAvatar(member) ? (
                                                    <SmartImage
                                                        src={getImageUrl(resolveMemberAvatar(member))}
                                                        alt={getMemberFullName(member)}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                ) : (
                                                    <div className="flex h-full w-full items-center justify-center bg-theme-purple/10 text-xl font-black text-theme-purple">
                                                        {getMemberFullName(member).charAt(0)}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate font-bold text-[var(--text-main)] text-lg">{getMemberFullName(member)}</p>
                                                <p className="text-xs font-medium text-theme-purple uppercase tracking-wider">
                                                    {member.title || member.user_id?.title || member.member_id?.title || member.functie || 'Bestuurslid'}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}


                        {/* Board History Button - Only show for Bestuur */}
                        {cleanName.toLowerCase().includes('bestuur') && (
                            <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-theme-purple to-theme-purple-dark p-6 shadow-lg text-white">
                                <h3 className="mb-2 flex items-center gap-2 text-lg font-bold">
                                    <History className="h-5 w-5" />
                                    Geschiedenis
                                </h3>
                                <p className="mb-6 text-sm text-white/80 leading-relaxed">
                                    Salve Mundi heeft een rijke geschiedenis. Ontdek wie er in voorgaande jaren aan het roer stonden.
                                </p>
                                <Link
                                    href="/commissies/geschiedenis"
                                    className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-white/20 backdrop-blur-md px-4 py-3 text-sm font-bold text-white transition hover:bg-white/30 border border-white/20"
                                >
                                    Bekijk archief
                                    <ArrowLeft className="h-4 w-4 rotate-180" />
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Modals */}
            {imageModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/95 backdrop-blur-sm" onClick={() => setImageModalOpen(false)} />
                    <div className="relative z-10 max-h-full max-w-full">
                        <button
                            onClick={() => setImageModalOpen(false)}
                            className="absolute -top-12 right-0 flex items-center gap-2 text-white/80 hover:text-white transition-colors"
                        >
                            <span className="text-sm font-bold">Sluiten</span>
                            <div className="rounded-full bg-white/10 p-2"><ArrowLeft className="h-5 w-5 rotate-90" /></div>
                        </button>
                        <div className="relative h-[85vh] w-screen max-w-5xl">
                            <SmartImage
                                src={getImageUrl(committee.image)}
                                alt={cleanName}
                                fill
                                className="object-contain"
                                priority
                            />
                        </div>
                    </div>
                </div>
            )}

            {membersModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setMembersModalOpen(false)} />
                    <div className="relative z-10 w-full max-w-2xl overflow-hidden rounded-3xl bg-[var(--bg-card)] shadow-2xl dark:border dark:border-white/10">
                        <div className="flex items-center justify-between border-b border-[var(--border-color)] bg-[var(--bg-main)] px-8 py-5">
                            <div>
                                <h3 className="text-xl font-bold text-theme-purple">Ledenbeheer</h3>
                                <p className="text-sm text-[var(--text-muted)]">{cleanName}</p>
                            </div>
                            <button
                                onClick={() => setMembersModalOpen(false)}
                                className="rounded-full bg-[var(--bg-card)] p-2 text-[var(--text-muted)] hover:text-red-500 transition-colors border border-[var(--border-color)]"
                            >
                                <ArrowLeft className="h-5 w-5 rotate-90" />
                            </button>
                        </div>
                        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-2 scrollbar-thin">
                            {members.map((member: any) => (
                                <div key={member.id} className="flex items-center justify-between gap-4 rounded-2xl bg-[var(--bg-main)] p-4 transition-colors hover:bg-[var(--bg-card)] border border-transparent hover:border-[var(--border-color)]">
                                    <div className="flex items-center gap-4">
                                        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full ring-2 ring-theme-purple/20">
                                            <SmartImage
                                                src={getImageUrl(resolveMemberAvatar(member))}
                                                alt={getMemberFullName(member)}
                                                fill
                                                className="object-cover"
                                            />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="truncate font-bold text-[var(--text-main)]">{getMemberFullName(member)}</p>
                                            <p className="truncate text-xs text-[var(--text-muted)]">{getMemberEmail(member)}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => toggleLeader(member.id, !member.is_leader)}
                                            className={`rounded-full px-3 py-1.5 text-xs font-bold transition-all ${member.is_leader
                                                ? 'bg-theme-purple text-white'
                                                : 'bg-theme-purple/10 text-theme-purple hover:bg-theme-purple/20'
                                                }`}
                                        >
                                            {member.is_leader ? 'Voorzitter' : 'Maak voorzitter'}
                                        </button>
                                        <button
                                            onClick={() => removeMember(member.id)}
                                            className="rounded-full bg-red-500/10 p-2 text-red-500 hover:bg-red-500 hover:text-white transition-all"
                                            title="Verwijder"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
