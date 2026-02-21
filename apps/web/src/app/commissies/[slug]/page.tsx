import { getCommittee, getEventsByCommittee } from '@/shared/api/salvemundi-server';
import { getCommitteesAction, getUserCommitteesAction } from '@/shared/api/data-actions';
import { getCurrentUserAction } from '@/shared/api/auth-actions';
import { slugify } from '@/shared/lib/utils/slug';
import { getImageUrl } from '@/shared/lib/api/image';
import { sanitizeHtml } from '@/shared/lib/utils/sanitize';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Mail, Calendar, Users2, History, ShieldCheck, ArrowLeft } from 'lucide-react';
import SmartImage from '@/shared/ui/SmartImage';
import PageHeader from '@/widgets/page-header/ui/PageHeader';
import CommitteeAdminControls from './CommitteeAdminControls';
import CommitteeImageModal from './CommitteeImageModal';

function cleanCommitteeName(name: string): string {
    return name.replace(/\s*(\|\||[-–—])\s*SALVE MUNDI\s*$/gi, '').trim();
}

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

export default async function CommitteeDetailPage(props: { params: Promise<{ slug: string }> }) {
    const params = await props.params;
    const slug = params.slug;

    const committeesData = await getCommitteesAction();

    const committeeSummary = committeesData.find(
        (c) => slugify(cleanCommitteeName(c.name)) === slug
    );

    if (!committeeSummary) {
        notFound();
    }

    const committeeId = committeeSummary.id;

    const [committee, events, user] = await Promise.all([
        getCommittee(committeeId),
        getEventsByCommittee(committeeId),
        getCurrentUserAction()
    ]);

    if (!committee) {
        notFound();
    }

    const cleanName = cleanCommitteeName(committee.name);
    const isBestuur = cleanName.toLowerCase().includes('bestuur');
    const members = committee.committee_members?.filter((m: any) => m.is_visible) || [];
    const leader = members.find((m: any) => m.is_leader);

    // Calculate permissions on the server
    let isLeader = false;
    if (user) {
        const isAdmin = user.admin_access || (typeof user.role === 'object' && (user.role as any)?.name?.toLowerCase().includes('admin'));
        const userCommittees = await getUserCommitteesAction(user.id);
        isLeader = isAdmin || userCommittees.some((c: any) => String(c.committee_id.id) === String(committeeId) && c.is_leader);
    }

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
                        <CommitteeAdminControls
                            committeeId={committeeId}
                            cleanName={cleanName}
                            members={members}
                        />
                    )}
                </div>
            </PageHeader>

            <main className="mx-auto max-w-app px-4 py-12 sm:px-6 lg:px-8">
                <div className="grid gap-8 lg:grid-cols-3">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Highlights Image */}
                        {committee.image && (
                            <CommitteeImageModal
                                imageUrl={getImageUrl(committee.image)}
                                cleanName={cleanName}
                                isBestuur={isBestuur}
                            />
                        )}

                        {/* Description Sections */}
                        {(committee.description) && (
                            <div className="space-y-6">
                                <div className="rounded-3xl bg-[var(--bg-card)] p-8 shadow-card dark:border dark:border-white/10">
                                    <h2 className="mb-6 text-2xl font-bold text-theme-purple">Over {cleanName}</h2>
                                    <div
                                        className="prose prose-purple max-w-none dark:prose-invert text-[var(--text-main)]"
                                        dangerouslySetInnerHTML={{ __html: sanitizeHtml(committee.description) }}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Events Section */}
                        {events.length > 0 && (
                            <div className="rounded-3xl bg-[var(--bg-card)] p-8 shadow-card dark:border dark:border-white/10">
                                <h2 className="mb-6 text-2xl font-bold text-theme-purple">Activiteiten</h2>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    {events.map((event: any) => (
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
                                    {isBestuur ? 'Voorzitter' : 'Commissie Leider'}
                                </h3>
                                <div className="group relative flex items-center gap-4 p-4 rounded-2xl bg-[var(--bg-main)] border border-transparent hover:border-theme-purple transition-all">
                                    <div className="relative h-16 w-16 overflow-hidden rounded-full ring-4 ring-theme-purple/10 shrink-0">
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
                                        <p className="text-xs font-medium text-theme-purple">{isBestuur ? 'Huidig voorzitter' : 'Commissie Leider'}</p>
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

                        {/* All Members List */}
                        {members.filter((m: any) => !m.is_leader).length > 0 && (
                            <div className="space-y-4">
                                <h3 className="flex items-center gap-2 text-lg font-bold text-theme-purple px-2">
                                    <Users2 className="h-5 w-5" />
                                    {isBestuur ? 'Overige Bestuursleden' : 'Leden'}
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
                                                {isBestuur ? (
                                                    <p className="text-xs font-medium text-theme-purple uppercase tracking-wider">
                                                        {member.title || member.user_id?.title || member.member_id?.title || member.functie || 'Bestuurslid'}
                                                    </p>
                                                ) : (
                                                    member.is_leader ? (
                                                        <p className="text-xs font-medium text-theme-purple uppercase tracking-wider">Commissie Leider</p>
                                                    ) : null
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Board History Button - Only show for Bestuur */}
                        {isBestuur && (
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
        </div>
    );
}

export async function generateStaticParams() {
    const committees = await getCommitteesAction();
    const committeeList = Array.isArray(committees) ? committees : [];
    return committeeList.map((c: any) => ({
        slug: slugify(cleanCommitteeName(c.name)),
    }));
}
