"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import type { User, Session } from "@supabase/supabase-js"
import { createClientComponent } from "@/lib/supabase/client"

type AuthContextType = {
  user: User | null
  session: Session | null
  loading: boolean
  isAdmin: boolean
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const supabase = useMemo(() => createClientComponent(), [])

  const checkAdmin = useCallback(
    async (userId: string) => {
      if (!supabase) return false
      const timeout = new Promise<{ data: null }>((resolve) =>
        setTimeout(() => resolve({ data: null }), 5000)
      )
      const { data } = await Promise.race([
        supabase.from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle(),
        timeout,
      ])
      return !!data
    },
    [supabase]
  )

  useEffect(() => {
    let mounted = true
    if (!supabase) {
      setLoading(false)
      return
    }
    const init = async () => {
      try {
        const {
          data: { session: s },
        } = await supabase.auth.getSession()
        if (!mounted) return
        setSession(s)
        setUser(s?.user ?? null)
        if (s?.user) {
          try {
            const admin = await checkAdmin(s.user.id)
            if (mounted) setIsAdmin(admin)
          } catch {
            // checkAdmin a échoué — session valide mais rôle non confirmé
          }
        }
      } catch {
        // getSession a échoué — pas de session disponible
      } finally {
        if (mounted) setLoading(false)
      }
    }
    init()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, s) => {
      if (!mounted) return
      setSession(s)
      setUser(s?.user ?? null)
      if (!s?.user) {
        setIsAdmin(false)
        if (mounted) setLoading(false)
        return
      }
      // Ne re-vérifier le rôle que lors d'une vraie connexion, pas à chaque refresh de token
      if (event === "SIGNED_IN" || event === "INITIAL_SESSION") {
        try {
          const admin = await checkAdmin(s.user.id)
          if (mounted) setIsAdmin(admin)
        } catch {
          // ignore
        }
      }
      if (mounted) setLoading(false)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [checkAdmin, supabase])

  const signIn = useCallback(
    async (email: string, password: string) => {
      if (!supabase) return { error: new Error("Supabase non configuré") as Error }
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      return { error: error ?? null }
    },
    [supabase]
  )

  const signOut = useCallback(async () => {
    if (supabase) await supabase.auth.signOut()
  }, [supabase])

  const value: AuthContextType = {
    user,
    session,
    loading,
    isAdmin,
    signIn,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
