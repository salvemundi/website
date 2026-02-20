export type PaymentStatus = 'SUCCESS' | 'PENDING' | 'FAILED';

export interface PaymentStatusResponse {
    status: PaymentStatus;
    data?: any;
    error?: string;
}
