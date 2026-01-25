import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UseImageUploadOptions {
  bucket: 'product-images' | 'site-assets';
  onSuccess?: (url: string) => void;
}

export const useImageUpload = ({ bucket, onSuccess }: UseImageUploadOptions) => {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const uploadImage = async (file: File): Promise<string | null> => {
    if (!file) return null;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Invalid file', description: 'Please upload an image file', variant: 'destructive' });
      return null;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'Maximum file size is 5MB', variant: 'destructive' });
      return null;
    }

    setIsUploading(true);
    setProgress(0);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${fileName}`;

      setProgress(30);

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      setProgress(70);

      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      setProgress(100);

      const publicUrl = urlData.publicUrl;
      onSuccess?.(publicUrl);
      toast({ title: 'Image uploaded successfully' });

      return publicUrl;
    } catch (error: unknown) {
      const err = error as Error;
      console.error('Upload error:', err);
      toast({
        title: 'Upload failed',
        description: err.message || 'Failed to upload image',
        variant: 'destructive'
      });
      return null;
    } finally {
      setIsUploading(false);
      setProgress(0);
    }
  };

  const deleteImage = async (url: string): Promise<boolean> => {
    try {
      // Extract file path from URL
      const urlParts = url.split(`/${bucket}/`);
      if (urlParts.length < 2) return false;

      const filePath = urlParts[1];

      const { error } = await supabase.storage
        .from(bucket)
        .remove([filePath]);

      if (error) throw error;

      return true;
    } catch (error: unknown) {
      const err = error as Error;
      console.error('Delete error:', err);
      toast({
        title: 'Delete failed',
        description: err.message || 'Failed to delete image',
        variant: 'destructive'
      });
      return false;
    }
  };

  return {
    uploadImage,
    deleteImage,
    isUploading,
    progress,
  };
};
