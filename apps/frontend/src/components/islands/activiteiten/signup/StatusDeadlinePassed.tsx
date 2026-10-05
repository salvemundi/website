'use client';

import React from 'react';
import { AlertCircle } from 'lucide-react';

export default function StatusDeadlinePassed() {
    return (
        <div className="status-notice-card">
            <div className="status-notice-icon-purple">
                <AlertCircle className="size-6" />
            </div>
            <div>
                <h3 className="status-notice-title">
                    De inschrijvingen staan dicht
                </h3>
                <p className="status-notice-text">
                    Als er een update is kan je die volgen via de WhatsApp announcements.
                </p>
            </div>
        </div>
    );
}
