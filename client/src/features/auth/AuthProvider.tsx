import { createContext, useContext, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { SessionUser } from "@mobiusbloom/shared";
import { authApi } from "./authApi";

interface AuthContextValue { user: SessionUser | null; isLoading: boolean; setUser: (user: SessionUser | null) => void }
const AuthContext = createContext<AuthContextValue | null>(null);
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["auth", "me"], queryFn: authApi.me, retry: false, staleTime: 60_000 });
  const setUser = (user: SessionUser | null) => queryClient.setQueryData(["auth", "me"], user ? { user } : null);
  return <AuthContext.Provider value={{ user: query.data?.user ?? null, isLoading: query.isLoading, setUser }}>{children}</AuthContext.Provider>;
};
export const useAuth = () => { const value = useContext(AuthContext); if (!value) throw new Error("useAuth must be used inside AuthProvider"); return value; };
