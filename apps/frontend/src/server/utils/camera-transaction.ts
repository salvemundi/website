import 'server-only';

import { db, sql } from '@salvemundi/db';

export type CameraTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

export function withCameraTransaction<T>(operation: (tx: CameraTransaction) => Promise<T>): Promise<T> {
    return db.transaction(async (tx) => {
        // There is one shared camera. Serialize reservations, handouts, and borrower changes.
        await tx.execute(sql`select pg_advisory_xact_lock(72832, 1)`);
        return operation(tx);
    }, { isolationLevel: 'read committed' });
}
