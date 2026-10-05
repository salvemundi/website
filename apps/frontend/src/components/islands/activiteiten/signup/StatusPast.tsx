'use client';

import React from 'react';
import { AlertCircle } from 'lucide-react';

export default function StatusPast() {
    return (
        <div className="status-notice-card">
            <div className="status-notice-icon-muted">
                <AlertCircle className="size-6" />
            </div>
            <div>
                <h3 className="status-notice-title">
                    Activiteit Afgelopen
                </h3>
                <p className="status-notice-text">
                    Helaas kun je je voor deze activiteit niet meer aanmelden.
                </p>
            </div>
        </div>
    );
}
