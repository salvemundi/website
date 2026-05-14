'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Toast, ToastType } from '@/components/ui/admin/AdminToast';

export function useAdminToast() {
    const [toast, setToast] = useState<Toast | null>(null);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const showToast = useCallback((message: string, type: ToastType = 'info', duration: number = 5000) => {
        // Clear existing timeout
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        const id = Math.random().toString(36).substring(2, 9);
        setToast({ id, message, type });

        if (duration > 0 && type !== 'loading') {
            timeoutRef.current = setTimeout(() => {
                setToast(null);
            }, duration);
        }
    }, []);

    const hideToast = useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        setToast(null);
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    return {
        toast,
        showToast,
        hideToast,
        setToast // Direct access if needed for complex states
    };
}
