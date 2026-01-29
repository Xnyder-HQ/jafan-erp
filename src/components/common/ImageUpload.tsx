import { useState, useRef } from 'react';
import { Upload, TrashCan, Image as ImageIcon } from '@carbon/icons-react';
import { cloudinaryUpload } from '../../utils/cloudinary';

interface ImageUploadProps {
  value?: string;
  publicId?: string;
  onChange: (url: string, publicId: string) => void;
  onError?: (error: string) => void;
  label?: string;
  required?: boolean;
  folder?: string;
  accept?: string;
  maxSizeMB?: number;
}

const ImageUpload = ({
  value,
  onChange,
  onError,
  label = 'Profile Image',
  required = false,
  folder,
  accept = 'image/*',
  maxSizeMB = 5,
}: ImageUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      onError?.('Please select an image file');
      return;
    }

    // Validate file size
    const maxSize = maxSizeMB * 1024 * 1024;
    if (file.size > maxSize) {
      onError?.(`File size must be less than ${maxSizeMB}MB`);
      return;
    }

    setUploading(true);
    try {
      const result = await cloudinaryUpload(file, folder);
      onChange(result.secure_url, result.public_id);
    } catch (err: any) {
      onError?.(err?.response?.data?.message || 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleRemove = () => {
    onChange('', '');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="xui-form-box">
      <label>
        {label} {required && '*'}
      </label>

      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleInputChange}
        style={{ display: 'none' }}
      />

      {value ? (
        <div className="xui-d-flex xui-flex-ai-center xui-grid-gap-1">
          <div
            className="xui-bdr-rad-half xui-overflow-hidden"
            style={{
              width: '100px',
              height: '100px',
              border: '1px solid var(--neutral-200)',
            }}
          >
            <img
              src={value}
              alt="Preview"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
          <div className="xui-d-flex xui-flex-dir-column xui-grid-gap-half">
            <button
              type="button"
              onClick={handleClick}
              disabled={uploading}
              className="xui-btn xui-btn-sm xui-bdr-rad-half"
              style={{
                backgroundColor: 'var(--neutral-100)',
                color: 'var(--neutral-700)',
                border: '1px solid var(--neutral-300)',
              }}
            >
              <Upload size={16} className="xui-mr-half" />
              {uploading ? 'Uploading...' : 'Change'}
            </button>
            <button
              type="button"
              onClick={handleRemove}
              disabled={uploading}
              className="xui-btn xui-btn-sm xui-bdr-rad-half"
              style={{
                backgroundColor: 'var(--error-light, #fee2e2)',
                color: 'var(--error)',
                border: '1px solid var(--error)',
              }}
            >
              <TrashCan size={16} className="xui-mr-half" />
              Remove
            </button>
          </div>
        </div>
      ) : (
        <div
          onClick={handleClick}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className="xui-d-flex xui-flex-dir-column xui-flex-ai-center xui-flex-jc-center xui-bdr-rad-half xui-cursor-pointer xui-p-1"
          style={{
            border: `2px dashed ${dragOver ? 'var(--primary-600)' : 'var(--neutral-300)'}`,
            backgroundColor: dragOver ? 'var(--primary-50, #f0f9ff)' : 'var(--neutral-50)',
            minHeight: '120px',
            transition: 'all 0.2s ease',
          }}
        >
          {uploading ? (
            <>
              <div
                className="xui-mb-half"
                style={{
                  width: '24px',
                  height: '24px',
                  border: '2px solid var(--primary-600)',
                  borderTopColor: 'transparent',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                }}
              />
              <p className="xui-font-sz-80" style={{ color: 'var(--neutral-600)' }}>
                Uploading...
              </p>
            </>
          ) : (
            <>
              <ImageIcon size={32} style={{ color: 'var(--neutral-400)' }} />
              <p className="xui-font-sz-85 xui-mt-half" style={{ color: 'var(--neutral-600)' }}>
                Click or drag image to upload
              </p>
              <p className="xui-font-sz-75" style={{ color: 'var(--neutral-400)' }}>
                Max size: {maxSizeMB}MB
              </p>
            </>
          )}
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default ImageUpload;
