"use client";

import { getFileViewUrl } from "@/lib/file-url";

const avatarGradients = [
  "from-[#ff7c11] to-[#ff9a3e]",
  "from-[#9a4a00] to-[#ff7c11]",
  "from-[#1a1c24] to-[#383c48]",
];

export function UserAvatar({
  user,
  size = "sm",
  className = "",
}: {
  user: { name: string; avatar?: string | null; email?: string };
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}) {
  const sizeClasses = {
    xs: "w-5 h-5 text-[8px]",
    sm: "w-7 h-7 text-[10px]",
    md: "w-9 h-9 text-xs",
    lg: "w-14 h-14 text-lg",
  };

  // Deterministic gradient based on name
  const idx = user.name === "Bruno" ? 0 : user.name === "Rodrigo" ? 1 : 2;
  const gradient = avatarGradients[idx % avatarGradients.length];

  if (user.avatar) {
    return (
      <img
        src={getFileViewUrl(user.avatar)}
        alt={user.name}
        className={`${sizeClasses[size]} rounded-full object-cover shrink-0 ${className}`}
      />
    );
  }

  return (
    <div
      className={`${sizeClasses[size]} rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-semibold shrink-0 ${className}`}
    >
      {user.name[0]}
    </div>
  );
}
