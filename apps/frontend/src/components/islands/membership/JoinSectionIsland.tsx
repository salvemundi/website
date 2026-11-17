'use client';

import React from 'react';
import Link from 'next/link';
import { authClient } from '@/lib/auth';
import type { EnrichedUser } from '@/types/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface JoinSectionIslandProps {
    serverUser?: EnrichedUser | null;
}

export const JoinSectionIsland: React.FC<JoinSectionIslandProps> = ({
    serverUser = null
}) => {
    const { data: session } = authClient.useSession();
    const user = (session?.user as unknown as EnrichedUser | null | undefined) ?? serverUser;

    if (user?.membership_status === 'active') return null;

    const isRenewal = !!user && !!user.membership_expiry && user.membership_status !== 'active';

    const title = isRenewal ? 'Lidmaatschap verlopen?' : 'Klaar om lid te worden?';
    const buttonText = isRenewal ? 'Verlengen' : 'Word nu lid';
    const description = isRenewal
        ? 'Je lidmaatschap is niet meer geldig. Verleng je lidmaatschap voor slechts €20 per jaar en behoud toegang tot alle activiteiten met korting!'
        : 'Sluit je aan bij onze community van studenten en maak het meeste van je studententijd. Voor slechts €20 per jaar krijg je toegang tot alle activiteiten met korting!';

    return (
        <section>
            <Card className="mx-auto max-w-3xl text-center">
                <CardContent className="space-y-6 p-8">
                    <h2>{title}</h2>
                    <p className="mx-auto max-w-2xl text-lg text-muted-foreground">{description}</p>
                    <div className="flex flex-col justify-center gap-4 sm:flex-row">
                        <Button asChild size="lg">
                            <Link href="/lidmaatschap">
                                {buttonText}
                            </Link>
                        </Button>
                        <Button asChild variant="secondary" size="lg">
                            <Link href="/contact">
                                Neem contact op
                            </Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </section>
    );
};
