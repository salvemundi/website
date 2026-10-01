import { Camera, Trash2 } from 'lucide-react';
import MediaAsset from '@/components/ui/media/MediaAsset';
import { IconButton } from '@/components/ui/buttons/IconButton';

interface PhotoUploaderProps {
    imagePreview: string | null;
    onImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onRemoveImage?: () => void;
}

export const PhotoUploader = ({
    imagePreview,
    onImageChange,
    onRemoveImage
}: PhotoUploaderProps) => {
    return (
        <div className="relative">
            <input
                type="file"
                accept="image/*"
                onChange={onImageChange}
                className="hidden"
                id="photo-upload"
            />
            {imagePreview ? (
                <div className="group relative h-48 w-full overflow-hidden rounded-2xl border border-(--border-color)/30 bg-black/20 sm:h-56">
                    <MediaAsset asset={imagePreview} className="size-full object-cover" alt="Preview" fill />
                    <div className="absolute inset-0 flex items-center justify-center gap-3 bg-black/40 p-4 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
                        <label
                            htmlFor="photo-upload"
                            className="inline-flex min-h-11 cursor-pointer touch-manipulation items-center gap-2 rounded-xl bg-white/20 px-3.5 py-2 text-xs font-bold text-white backdrop-blur-md transition-all select-none hover:bg-white/30 active:scale-95"
                        >
                            <Camera className="size-4" />
                            <span>Wijzigen</span>
                        </label>
                        <IconButton
                            type="button"
                            variant="purple"
                            size="md"
                            onClick={onRemoveImage}
                            aria-label="Foto verwijderen"
                            className="min-h-11 min-w-11 bg-red-500/80 text-white hover:bg-red-600"
                        >
                            <Trash2 className="size-4" />
                        </IconButton>
                    </div>
                </div>
            ) : (
                <label
                    htmlFor="photo-upload"
                    className="group/photo:shadow-inner active:scale-0.99 flex h-40 w-full cursor-pointer touch-manipulation flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-(--border-color)/50 bg-(--bg-main)/30 transition-all select-none hover:border-(--theme-purple)/50 hover:bg-(--theme-purple)/5"
                >
                    <Camera className="mb-2 size-8 text-(--text-muted)" />
                    <span className="text-[10px] font-black tracking-widest text-(--text-muted) uppercase">Foto Selecteren</span>
                </label>
            )}
        </div>
    );
};
