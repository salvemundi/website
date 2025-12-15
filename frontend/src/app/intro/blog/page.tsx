import React, { Suspense } from 'react';
import PageEnhanced from './page_enhanced';

export default function IntroBlogPage() {
    return (
        <Suspense fallback={<div />}>
            <PageEnhanced />
        </Suspense>
    );
}
