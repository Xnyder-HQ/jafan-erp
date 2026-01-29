import axios from 'axios';

interface UploadResult {
  secure_url: string;
  public_id: string;
  type: string;
}

const random_uuid = (length: number = 6) => {
  const array = new Uint8Array(length);
  window.crypto.getRandomValues(array);
  return Array.from(array)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
};

export const cloudinaryUpload = async (
  file: File,
  filePath?: string
): Promise<UploadResult> => {
  const formData = new FormData();
  const fileExtension = file.name.split('.').pop() || '';
  const randomSuffix = random_uuid(3);
  const originalName = file.name.split('.').slice(0, -1).join('.');
  const uniqueFilename = `${originalName}_${randomSuffix}.${fileExtension}`;

  formData.append('file', file);
  formData.append('cloudinary_name', import.meta.env.VITE_CLOUDER_NAME);
  formData.append('cloudinary_key', import.meta.env.VITE_CLOUDER_KEY);
  formData.append('cloudinary_secret', import.meta.env.VITE_CLOUDER_SECRET);
  formData.append(
    'file_path',
    filePath || import.meta.env.VITE_CLOUDER_UPLOAD_FOLDER
  );
  formData.append('file_name', uniqueFilename);

  const isVideo = file.type.startsWith('video/');
  const uploadUrl = isVideo
    ? 'https://clouderapi.xnyder.com/upload/media'
    : 'https://clouderapi.xnyder.com/upload/image';

  const response = await axios.post(uploadUrl, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
      'clouder-access-key': import.meta.env.VITE_CLOUDER_ACCESS_KEY,
    },
  });

  const { secure_url, public_id, resource_type } = response.data.data;

  return {
    secure_url,
    public_id,
    type: resource_type,
  };
};

export const cloudinaryDelete = async (publicId: string): Promise<boolean> => {
  try {
    await axios.delete('https://clouderapi.xnyder.com/delete', {
      headers: {
        'clouder-access-key': import.meta.env.VITE_CLOUDER_ACCESS_KEY,
      },
      data: {
        cloudinary_name: import.meta.env.VITE_CLOUDER_NAME,
        cloudinary_key: import.meta.env.VITE_CLOUDER_KEY,
        cloudinary_secret: import.meta.env.VITE_CLOUDER_SECRET,
        public_id: publicId,
      },
    });
    return true;
  } catch {
    return false;
  }
};
