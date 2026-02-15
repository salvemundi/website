import {
    getStickersAction,
    createStickerAction,
    deleteStickerAction,
} from '@/shared/api/data-actions';
import type { CreateStickerData } from './types';

export const stickersApi = {
    getAll: async () => {
        return await getStickersAction();
    },
    create: async (data: CreateStickerData) => {
        return await createStickerAction(data);
    },
    delete: async (id: number) => {
        return await deleteStickerAction(id);
    }
};
