
export interface Committee {
    id: number | string;
    name: string;
    is_leader?: boolean;
}

export interface UserPermissions {
    isAdmin: boolean;
    isLeader: boolean;
    isICT: boolean;
}

/**
 * Derives permissions from a list of committees.
 * This is the central source of truth for role-based access control.
 */
export function getPermissions(committees: Committee[] = []): UserPermissions {
    const committeeNames = committees.map(c => (c.name || '').toLowerCase());
    
    const isAdmin = committeeNames.some(name => 
        name.includes('bestuur') || 
        name.includes('ict') || 
        name.includes('kandi')
    );

    const isICT = committeeNames.some(name => name.includes('ict'));
    
    const isLeader = committees.some(c => c.is_leader);

    return {
        isAdmin,
        isLeader,
        isICT
    };
}
