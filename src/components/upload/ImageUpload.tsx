import { useState, useCallback, useRef } from 'react';
import { Upload, X, Image as ImageIcon, AlertCircle, Loader2 } from 'lucide-react';

interface ImageUploadProps {
  images: File[];
  onChange: (files: File[]) => void;
  maxImages?: number;
  maxSizeMB?: number;
  acceptedFormats?: string[];
  disabled?: boolean;
}

interface ImagePreview {
  file: File;
  preview: string;
  id: string;
}

export default function ImageUpload({
  images,
  onChange,
  maxImages = 5,
  maxSizeMB = 5,
  acceptedFormats = ['image/jpeg', 'image/png', 'image/webp'],
  disabled = false,
}: ImageUploadProps) {
  const [previews, setPreviews] = useState<ImagePreview[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = useCallback((file: File): string | null => {
    // Check file type
    if (!acceptedFormats.includes(file.type)) {
      return `Invalid file type. Accepted: ${acceptedFormats.map(f => f.split('/')[1].toUpperCase()).join(', ')}`;
    }

    // Check file size
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return `File too large. Maximum size: ${maxSizeMB}MB`;
    }

    return null;
  }, [acceptedFormats, maxSizeMB]);

  const processFiles = useCallback((files: FileList | File[]) => {
    setError(null);
    const fileArray = Array.from(files);
    const currentCount = previews.length;
    const availableSlots = maxImages - currentCount;

    if (availableSlots <= 0) {
      setError(`Maximum ${maxImages} images allowed`);
      return;
    }

    const filesToAdd = fileArray.slice(0, availableSlots);
    const newPreviews: ImagePreview[] = [];
    const validFiles: File[] = [];
    let hasError = false;

    filesToAdd.forEach(file => {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        hasError = true;
        return;
      }

      validFiles.push(file);
      const preview = URL.createObjectURL(file);
      newPreviews.push({
        file,
        preview,
        id: `${file.name}-${Date.now()}-${Math.random()}`,
      });
    });

    if (validFiles.length > 0) {
      setPreviews(prev => [...prev, ...newPreviews]);
      onChange([...images, ...validFiles]);
    }
  }, [images, maxImages, onChange, previews.length, validateFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragging(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (!disabled && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  }, [disabled, processFiles]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
    // Reset input value to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [processFiles]);

  const removeImage = useCallback((id: string) => {
    setPreviews(prev => {
      const updated = prev.filter(p => p.id !== id);
      // Revoke object URL to prevent memory leaks
      const removed = prev.find(p => p.id === id);
      if (removed) {
        URL.revokeObjectURL(removed.preview);
      }
      return updated;
    });
    const index = previews.findIndex(p => p.id === id);
    if (index !== -1) {
      const newImages = [...images];
      newImages.splice(index, 1);
      onChange(newImages);
    }
  }, [images, onChange, previews]);

  const clearAll = useCallback(() => {
    previews.forEach(p => URL.revokeObjectURL(p.preview));
    setPreviews([]);
    onChange([]);
    setError(null);
  }, [onChange, previews]);

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-xl p-6 transition-all duration-200
          ${disabled 
            ? 'border-gray-200 bg-gray-50 cursor-not-allowed' 
            : isDragging
              ? 'border-primary-500 bg-primary-50'
              : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
          }
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedFormats.join(',')}
          multiple
          onChange={handleFileSelect}
          disabled={disabled}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        />
        
        <div className="text-center">
          <div className={`
            mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-3
            ${isDragging ? 'bg-primary-100' : 'bg-gray-100'}
          `}>
            <Upload className={`w-6 h-6 ${isDragging ? 'text-primary-600' : 'text-gray-400'}`} />
          </div>
          
          <p className="text-sm font-medium text-gray-700">
            {isDragging ? 'Drop images here' : 'Drag and drop images'}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            or click to browse
          </p>
          
          <div className="mt-3 flex flex-wrap justify-center gap-2 text-xs text-gray-400">
            <span>Max {maxImages} images</span>
            <span>•</span>
            <span>Up to {maxSizeMB}MB each</span>
            <span>•</span>
            <span>{acceptedFormats.map(f => f.split('/')[1].toUpperCase()).join(', ')}</span>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Image Previews */}
      {previews.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">
              {previews.length} of {maxImages} images
            </span>
            <button
              type="button"
              onClick={clearAll}
              className="text-xs text-red-600 hover:text-red-700 font-medium"
            >
              Clear all
            </button>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {previews.map((preview, index) => (
              <div
                key={preview.id}
                className="relative group aspect-square rounded-lg overflow-hidden bg-gray-100"
              >
                <img
                  src={preview.preview}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                
                {/* Primary badge */}
                {index === 0 && (
                  <div className="absolute top-2 left-2 px-2 py-0.5 bg-primary-600 text-white text-xs font-medium rounded">
                    Primary
                  </div>
                )}
                
                {/* Remove button */}
                <button
                  type="button"
                  onClick={() => removeImage(preview.id)}
                  className="absolute top-2 right-2 p-1 bg-white/90 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
                >
                  <X className="w-4 h-4 text-gray-600" />
                </button>
                
                {/* File info */}
                <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/50 to-transparent">
                  <p className="text-xs text-white truncate">
                    {preview.file.name}
                  </p>
                  <p className="text-xs text-white/70">
                    {(preview.file.size / 1024 / 1024).toFixed(1)}MB
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Component for displaying existing images (for edit mode)
interface ImageGalleryProps {
  images: Array<{ id: string; url: string; is_primary?: boolean }>;
  onRemove?: (id: string) => void;
  onSetPrimary?: (id: string) => void;
  disabled?: boolean;
}

export function ImageGallery({
  images,
  onRemove,
  onSetPrimary,
  disabled = false,
}: ImageGalleryProps) {
  if (images.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-gray-400">
        <ImageIcon className="w-12 h-12 mb-2" />
        <p className="text-sm">No images uploaded</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
      {images.map((image) => (
        <div
          key={image.id}
          className="relative group aspect-square rounded-lg overflow-hidden bg-gray-100"
        >
          <img
            src={image.url}
            alt="Gallery image"
            className="w-full h-full object-cover"
          />
          
          {/* Primary badge */}
          {image.is_primary && (
            <div className="absolute top-2 left-2 px-2 py-0.5 bg-primary-600 text-white text-xs font-medium rounded">
              Primary
            </div>
          )}
          
          {/* Action buttons */}
          {!disabled && (
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              {!image.is_primary && onSetPrimary && (
                <button
                  type="button"
                  onClick={() => onSetPrimary(image.id)}
                  className="p-2 bg-white rounded-full shadow-sm hover:bg-gray-100"
                  title="Set as primary"
                >
                  <ImageIcon className="w-4 h-4 text-gray-600" />
                </button>
              )}
              {onRemove && (
                <button
                  type="button"
                  onClick={() => onRemove(image.id)}
                  className="p-2 bg-white rounded-full shadow-sm hover:bg-gray-100"
                  title="Remove image"
                >
                  <X className="w-4 h-4 text-red-600" />
                </button>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
