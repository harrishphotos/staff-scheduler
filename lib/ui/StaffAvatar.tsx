import { useState } from "react";
import { User } from "lucide-react";

type StaffAvatarProps = {
  src: string;
  alt: string;
  size?: number; // Optional: control image size in pixels
};

const StaffAvatar: React.FC<StaffAvatarProps> = ({ src, alt, size = 32 }) => {
  const [error, setError] = useState(false);

  return error ? (
    <div
      style={{ width: size, height: size }}
      className="rounded-full bg-slate-800 flex items-center justify-center"
    >
      <User className="w-4 h-4 text-slate-400" />
    </div>
  ) : (
    <img
      src={src}
      alt={alt}
      onError={() => setError(true)}
      style={{ width: size, height: size }}
      className="rounded-full object-cover"
    />
  );
};

export default StaffAvatar;
