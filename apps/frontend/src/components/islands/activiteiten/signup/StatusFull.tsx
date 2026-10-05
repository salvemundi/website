'use client';

import React from 'react';
import { Users } from 'lucide-react';

export default function StatusFull() {
    return (
        <div className="status-notice-card">
            <div className="status-notice-icon-muted">
                <Users className="size-6" />
            </div>
            <div>
                <h3 className="status-notice-title">
                    Deze activiteit zit vol
                </h3>
                <p className="status-notice-text">
                    Het maximum aantal aanmeldingen is bereikt. Aanmelden is helaas niet meer mogelijk.
                </p>
            </div>
        </div>
    );
}
