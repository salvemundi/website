import PageHeader from '@/widgets/page-header/ui/PageHeader';
import { getBoards } from '@/shared/api/board-actions';
import { getImageUrl } from "@/shared/lib/api/image";
import { Clock } from 'lucide-react';
import Timeline from '@/components/timeline/Timeline';

export default async function BoardHistoryPage() {
    let boards = [];
    let error = null;

    try {
        boards = await getBoards();
    } catch (e: any) {
        error = e;
    }

    function getMemberFullName(member: any) {
        if (member?.user_id) {
            const u = member.user_id;
            const first = u.first_name || u.firstname || u.name || u.display_name || u.given_name;
            const last = u.last_name || u.lastname || u.surname || u.family_name || '';
            const combined = `${first || ''} ${last || ''}`.trim();
            if (combined) return combined;
        }

        if (member?.name) return member.name;
        const firstDirect = member?.first_name || member?.firstname || member?.given_name;
        const lastDirect = member?.last_name || member?.lastname || member?.family_name;
        if (firstDirect || lastDirect) return `${firstDirect || ''} ${lastDirect || ''}`.trim();

        if (member?.full_name) return member.full_name;

        return 'Onbekend';
    }

    const flatMappedBoards = boards?.map((board: any) => {
        return {
            ...board,
            computedImageUrl: board.image
                ? (typeof board.image === 'string' && (board.image.startsWith('http') || board.image.startsWith('/')))
                    ? board.image
                    : getImageUrl(board.image, { width: 1200 })
                : '/img/group-jump.gif',
            members: board.members?.map((member: any) => {
                return {
                    ...member,
                    computedFullName: getMemberFullName(member)
                };
            }) || []
        };
    }) || [];

    return (
        <div className="bg-[var(--bg-main)] min-h-screen">
            <PageHeader
                title="BESTUURSGESCHIEDENIS"
                backgroundImage="/img/backgrounds/commissies-banner.png"
                backgroundPosition="center 30%"
                imageFilter="brightness(0.6) blur(2px)"
                backLink="/commissies/bestuur"
            >
                <p className="mx-auto mt-4 max-w-2xl text-center text-lg text-white/90 sm:text-xl">
                    Ontdek de mensen die Salve Mundi door de jaren heen hebben gevormd
                </p>
            </PageHeader>

            <main className="mx-auto max-w-app px-4 py-12 sm:px-6 lg:px-8">
                {error ? (
                    <div className="rounded-3xl bg-[var(--bg-card)] p-12 text-center shadow-lg dark:border dark:border-white/10">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10 text-red-500">
                            <Clock className="h-8 w-8" />
                        </div>
                        <p className="mb-2 text-xl font-bold text-theme-purple">Oeps! Er ging iets mis</p>
                        <p className="text-[var(--text-muted)]">{String(error)}</p>
                    </div>
                ) : !flatMappedBoards || flatMappedBoards.length === 0 ? (
                    <div className="rounded-3xl bg-[var(--bg-card)] p-12 text-center shadow-lg dark:border dark:border-white/10">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-theme-purple/10 text-theme-purple">
                            <Clock className="h-8 w-8" />
                        </div>
                        <p className="text-xl font-bold text-theme-purple">Geen geschiedenis gevonden</p>
                        <p className="text-[var(--text-muted)]">Er zijn momenteel geen gearchiveerde besturen beschikbaar.</p>
                    </div>
                ) : (
                    <div className="fade-in">
                        <Timeline boards={flatMappedBoards} />
                    </div>
                )}
            </main>
        </div>
    );
}
