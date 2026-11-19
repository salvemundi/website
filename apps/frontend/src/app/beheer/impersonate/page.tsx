import { cookies } from 'next/headers';
import { Box } from '@mantine/core';
import ImpersonateIsland from '@/components/islands/beheer/ImpersonateIsland';
import { checkBeheerAccess } from '@/server/actions/beheer/beheer-utils.actions';

export const metadata = {
    title: 'Test Modus | Salve Mundi Beheer'
};

export default async function ImpersonatePage() {
    const { impersonation } = await checkBeheerAccess();

    const cookieStore = await cookies();
    const activeToken = cookieStore.get('directus_impersonation_token')?.value || null;

    return (
        <Box w="100%">
            <ImpersonateIsland
                activeToken={activeToken}
                impersonatedName={impersonation?.targetName || null}
                impersonatedCommittees={impersonation?.targetCommittees || []}
            />
        </Box>
    );
}
