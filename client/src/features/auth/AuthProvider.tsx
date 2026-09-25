import { createContext, useContext, useEffect, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { SessionUser } from "@mobius-ems/shared";
import { authApi } from "./authApi";

interface AuthContextValue { user: SessionUser | null; isLoading: boolean; setUser: (user: SessionUser | null) => void }
const AuthContext = createContext<AuthContextValue | null>(null);
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["auth", "me"], queryFn: authApi.me, retry: false, staleTime: 0, refetchOnWindowFocus: true });
  const setUser = (user: SessionUser | null) => {
    if (!user) {
      queryClient.clear();
      queryClient.setQueryData(["auth", "me"], null);
    } else {
      queryClient.setQueryData(["auth", "me"], { user });
    }
  };

  useEffect(() => {
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        // Page was restored from Back/Forward cache (bfcache)
        // Force fresh reload from server so auth is cleanly validated
        window.location.reload();
      }
    };
    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, []);

  return <AuthContext.Provider value={{ user: query.data?.user ?? null, isLoading: query.isLoading, setUser }}>{children}</AuthContext.Provider>;
};
export const useAuth = () => { const value = useContext(AuthContext); if (!value) throw new Error("useAuth must be used inside AuthProvider"); return value; };

