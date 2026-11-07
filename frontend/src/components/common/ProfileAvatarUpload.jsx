import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { updateProfilePhoto } from '../../api/profileApi';
import { Camera } from 'lucide-react';

export default function ProfileAvatarUpload({ imageUrl, initials, onUploaded, onError, size = 'w-16 h-16' }) {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setUploading(true);
    try {
      const res = await updateProfilePhoto(file);
      onUploaded?.(res.data.user);
    } catch (err) {
      onError?.(err.response?.data?.message || 'Could not upload photo.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={`relative ${size} flex-shrink-0`}>
      {imageUrl ? (
        <img src={imageUrl} alt="Profile" className={`${size} rounded-2xl object-cover`} />
      ) : (
        <div className={`${size} rounded-2xl bg-orange-100 flex items-center justify-center text-xl font-extrabold text-[#F4A261]`}>
          {initials}
        </div>
      )}

      <motion.button
        type="button"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
        title="Change photo"
        className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-full bg-[#F4A261] hover:bg-[#E76F51] text-white flex items-center justify-center shadow-sm ring-2 ring-white transition-colors disabled:opacity-60"
      >
        {uploading ? (
          <span className="w-3.5 h-3.5 border-2 border-white/50 border-t-white rounded-full animate-spin" />
        ) : (
          <Camera className="w-3.5 h-3.5" />
        )}
      </motion.button>

      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFile}
        className="hidden"
      />
    </div>
  );
}
