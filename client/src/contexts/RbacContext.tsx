// PIE Digital NR-10 — Role-Based Access Control Context
// Provides user profile, role, and permission helpers to the entire component tree.

import { onUserProfileChange } from "@/lib/firebase";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { UserProfile } from "@/types/rbac";
import { hasPermission } from "@/types/rbac";
import { useAuth } from "./AuthContext";

interface RbacContextValue {
  profile: UserProfile | null;
  loading: boolean;
  hasPermission: (permission: string) => boolean;
}

const RbacContext = createContext<RbacContextValue>({
  profile: null,
  loading: true,
  hasPermission: () => false,
});

export function RbacProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    const unsub = onUserProfileChange(user.uid, (prof) => {
      setProfile(prof);
      setLoading(false);
    });

    return unsub;
  }, [user]);

  const checkPermission = (permission: string): boolean => {
    if (!profile) return false;
    return hasPermission(profile.role, permission);
  };

  return (
    <RbacContext.Provider value={{ profile, loading, hasPermission: checkPermission }}>
      {children}
    </RbacContext.Provider>
  );
}

export const useRbac = () => useContext(RbacContext);
