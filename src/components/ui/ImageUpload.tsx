import { useRef, useState } from 'react';
import { Upload, X, Loader2, Image as ImageIcon, Film } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  onUpload: (file: File) => Promise<string | null>;
  isUploading?: boolean;
  className?: string;
  aspectRatio?: 'square' | 'video' | 'auto';
  allowVideo?: boolean;
  accept?: string;
}

export const ImageUpload = ({
  value,
  onChange,
  onUpload,
  isUploading = false,
  className,
  aspectRatio = 'video',
  allowVideo = false,
  accept,
}: ImageUploadProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [previewError, setPreviewError] = useState(false);

  // Simple check to see if the URL is likely a video
  const isVideo = value?.toLowerCase().match(/\.(mp4|webm|ogg|mov)$/) || value?.includes('video');

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const url = await onUpload(e.dataTransfer.files[0]);
      if (url) onChange(url);
    }
  };

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const url = await onUpload(e.target.files[0]);
      if (url) onChange(url);
    }
  };

  const handleRemove = () => {
    onChange('');
    setPreviewError(false);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const aspectRatioClass = {
    square: 'aspect-square',
    video: 'aspect-video',
    auto: 'min-h-[150px]',
  }[aspectRatio];

  return (
    <div className={cn('relative', className)}>
      <input
        ref={inputRef}
        type="file"
        accept={accept || (allowVideo ? "image/*,video/*" : "image/*")}
        onChange={handleChange}
        className="hidden"
        disabled={isUploading}
      />

      {value && !previewError ? (
        <div className={cn('relative rounded-lg overflow-hidden border border-border bg-black/5', aspectRatioClass)}>
          {isVideo ? (
            <video
              src={value}
              className="w-full h-full object-cover"
              controls={false}
              autoPlay
              muted
              loop
              playsInline
            />
          ) : (
            <img
              src={value}
              alt="Preview"
              className="w-full h-full object-cover"
              onError={() => setPreviewError(true)}
            />
          )}
          <div className="absolute inset-0 bg-background/60 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => inputRef.current?.click()}
              disabled={isUploading}
            >
              <Upload className="w-4 h-4 mr-2" />
              Replace
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleRemove}
              disabled={isUploading}
            >
              <X className="w-4 h-4 mr-2" />
              Remove
            </Button>
          </div>
        </div>
      ) : (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={cn(
            'flex flex-col items-center justify-center rounded-lg border-2 border-dashed cursor-pointer transition-colors',
            aspectRatioClass,
            dragActive
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary/50 hover:bg-muted/50',
            isUploading && 'pointer-events-none opacity-60'
          )}
        >
          {isUploading ? (
            <>
              <Loader2 className="w-10 h-10 text-muted-foreground mb-2 animate-spin" />
              <p className="text-sm text-muted-foreground">Uploading...</p>
            </>
          ) : (
            <>
              {allowVideo ? (
                <div className="flex gap-2 mb-2">
                  <ImageIcon className="w-8 h-8 text-muted-foreground" />
                  <Film className="w-8 h-8 text-muted-foreground" />
                </div>
              ) : (
                <ImageIcon className="w-10 h-10 text-muted-foreground mb-2" />
              )}
              <p className="text-sm text-muted-foreground text-center px-4">
                <span className="font-medium text-foreground">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {allowVideo ? 'Images or Videos up to 50MB' : 'PNG, JPG, GIF up to 5MB'}
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
};
