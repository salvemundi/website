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
                <div className="relative w-full h-48 sm:h-56 rounded-2xl overflow-hidden border border-(--border-color)/30 bg-black/20 group">
                    <MediaAsset asset={imagePreview} className="w-full h-full object-cover" alt="Preview" fill />
                    <div className="absolute inset-0 bg-black/40 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 p-4">
                        <label
                            htmlFor="photo-upload"
                            className="cursor-pointer inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-md text-white text-xs font-bold transition-all active:scale-95 select-none touch-manipulation min-h-11"
                        >
                            <Camera className="h-4 w-4" />
                            <span>Wijzigen</span>
                        </label>
                        <IconButton
                            type="button"
                            variant="purple"
                            size="md"
                            onClick={onRemoveImage}
                            aria-label="Foto verwijderen"
                            className="bg-red-500/80 hover:bg-red-600 text-white min-w-11 min-h-11"
                        >
                            <Trash2 className="h-4 w-4" />
                        </IconButton>
                    </div>
                </div>
            ) : (
                <label
                    htmlFor="photo-upload"
                    className="cursor-pointer flex flex-col items-center justify-center w-full h-40 bg-(--bg-main)/30 border-2 border-dashed border-(--border-color)/50 rounded-2xl hover:border-(--theme-purple)/50 hover:bg-(--theme-purple)/5 transition-all group/photo:shadow-inner overflow-hidden select-none touch-manipulation active:scale-[0.99]"
                >
                    <Camera className="h-8 w-8 text-(--text-muted) mb-2" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-(--text-muted)">Foto Selecteren</span>
                </label>
            )}
        </div>
    );
};
