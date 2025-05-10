"use client";

import { useUser } from "@/hooks/useUser";
import Image from "next/image";

export default function UserProfile() {
  const { user, profile, loading } = useUser();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <div>Please sign in</div>;
  }

  return (
    <div className="p-4 bg-white rounded shadow">
      <div className="flex items-center space-x-4">
        {profile?.avatar_url && (
          <Image
            src={profile.avatar_url}
            alt={profile.display_name}
            width={60}
            height={60}
            className="rounded-full"
          />
        )}
        <div>
          <h2 className="text-xl font-bold">{profile?.display_name}</h2>
          <p className="text-gray-600">{user.email}</p>
          <p className="text-sm text-gray-500">User ID: {user.id}</p>
        </div>
      </div>
    </div>
  );
}
