import type { CameraRequestStatus } from '@salvemundi/validations';

export const STATUS_LABEL: Record<CameraRequestStatus, string> = {
    requested: 'Aangevraagd',
    approved: 'Goedgekeurd',
    rejected: 'Afgewezen',
    cancelled: 'Geannuleerd',
};
