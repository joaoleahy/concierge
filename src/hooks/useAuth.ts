import { useEffect, useState } from "react";
import { useSession, signIn, signUp, signOut } from "@/lib/auth-client";
import { api } from "@/lib/api/client";

export interface UserProfile {
  id: string;
  email: string | null;
  name: string | null;
  image: string | null;
}

export interface UserRole {
  hotel_id: string;
  role: "admin" | "staff";
}

export function useAuth() {
  const { data: session, isPending: loading } = useSession();

  const user = session?.user
    ? {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        image: session.user.image,
      }
    : null;

  const signInWithEmail = async (email: string, password: string) => {
    try {
      const result = await signIn.email({ email, password });
      if (result.error) {
        return { error: { message: result.error.message } };
      }
      return { error: null };
    } catch (err) {
      return { error: { message: "Failed to sign in" } };
    }
  };

  const signUpWithEmail = async (email: string, password: string, displayName?: string) => {
    try {
      const result = await signUp.email({
        email,
        password,
        name: displayName || email.split("@")[0],
      });
      if (result.error) {
        return { error: { message: result.error.message } };
      }
      return { error: null };
    } catch (err) {
      return { error: { message: "Failed to sign up" } };
    }
  };

  const signInWithGoogle = async () => {
    try {
      await signIn.social({
        provider: "google",
        callbackURL: `${window.location.origin}/admin`,
      });
      return { error: null };
    } catch (err) {
      return { error: { message: "Failed to sign in with Google" } };
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      return { error: null };
    } catch (err) {
      return { error: { message: "Failed to sign out" } };
    }
  };

  return {
    user,
    session,
    loading,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    signOut: handleSignOut,
  };
}

export function useUserRoles(userId: string | undefined, hotelId: string | null) {
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isStaff, setIsStaff] = useState(false);

  useEffect(() => {
    if (!userId || !hotelId) {
      setLoading(false);
      return;
    }

    const fetchRoles = async () => {
      try {
        const data = await api.get<{ roles: UserRole[]; isAdmin: boolean; isStaff: boolean }>(
          `/api/custom-auth/roles?userId=${userId}&hotelId=${hotelId}`
        );
        setRoles(data.roles || []);
        setIsAdmin(data.isAdmin || false);
        setIsStaff(data.isStaff || false);
      } catch (error) {
        console.error("Error fetching roles:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRoles();
  }, [userId, hotelId]);

  return { roles, loading, isAdmin, isStaff };
}

export function useProfile(userId: string | undefined) {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.user) {
      setLoading(false);
    }
  }, [session]);

  const profile: UserProfile | null = session?.user
    ? {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        image: session.user.image,
      }
    : null;

  return { profile, loading };
}
