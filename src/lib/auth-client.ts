import { createAuthClient } from "better-auth/react";

// Better Auth requires a full URL with protocol
const getBaseURL = () => {
  const apiUrl = import.meta.env.VITE_API_URL;
  if (apiUrl) return `${apiUrl}/api/auth`;
  // In browser, use current origin (Vite proxy will handle /api)
  if (typeof window !== "undefined") {
    return `${window.location.origin}/api/auth`;
  }
  return "http://localhost:8080/api/auth";
};

export const authClient = createAuthClient({
  baseURL: getBaseURL(),
});

export const {
  signIn,
  signUp,
  signOut,
  useSession,
  getSession,
} = authClient;
