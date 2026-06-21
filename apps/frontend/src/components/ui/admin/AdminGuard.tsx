import { checkAdminAccess } from '@/server/actions/admin/admin-utils.actions';
import AdminUnauthorized from '@/components/ui/admin/AdminUnauthorized';
import type { ReactNode } from 'react';
import type { getPermissions } from '@/shared/lib/permissions';

interface AdminGuardProps {
    children: ReactNode;
    permission: keyof ReturnType<typeof getPermissions>;
    title: string;
    description: string;
}

export default async function AdminGuard({
    children,
    permission,
    title,
    description
}: AdminGuardProps) {
    const { user } = await checkAdminAccess();
    if (!user || !Reflect.get(user, permission)) {
        return (
            <div className="container mx-auto px-4 py-8">
                <AdminUnauthorized title={title} description={description} />
            </div>
        );
    }

    return <>{children}</>;
}
