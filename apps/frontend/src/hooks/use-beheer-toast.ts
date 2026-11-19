'use client';

import { useState, useCallback } from 'react';
import { notifications } from '@mantine/notifications';

export type ToastType = 'success' | 'error' | 'info' | 'warning' | 'loading';

export interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

function getToastColor(type: ToastType): string {
    switch (type) {
        case 'success':
            return 'success';
        case 'error':
            return 'error';
        case 'warning':
            return 'accent';
        case 'info':
        case 'loading':
        default:
            return 'brand';
    }
}

export function useAdminToast() {
    const [toast, setToast] = useState<Toast | null>(null);

    const showToast = useCallback((message: string, type: ToastType = 'info', duration: number = 5000) => {
        const id = Math.random().toString(36).substring(2, 9);
        setToast({ id, message, type });

        notifications.show({
            id,
            message,
            color: getToastColor(type),
            loading: type === 'loading',
            autoClose: type === 'loading' ? false : duration > 0 ? duration : false,
        });
    }, []);

    const hideToast = useCallback(() => {
        setToast(null);
        notifications.clean();
    }, []);

    return {
        toast,
        showToast,
        hideToast,
        setToast,
    };
}
