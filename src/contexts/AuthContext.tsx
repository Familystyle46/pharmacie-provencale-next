"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
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
  const supabase = createClientComponent()

  const checkAdmin = useCallback(
    async (userId: string) => {
      if (!supabase) return false
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .eq("role", "admin")
        .maybeSingle()
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
      const {
        data: { session: s },
      } = await supabase.auth.getSession()
      if (!mounted) return
      setSession(s)
      setUser(s?.user ?? null)
      if (s?.user) {
        const admin = await checkAdmin(s.user.id)
        if (mounted) setIsAdmin(admin)
      }
      setLoading(false)
    }
    init()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, s) => {
      if (!mounted) return
      setSession(s)
      setUser(s?.user ?? null)
      if (s?.user) {
        const admin = await checkAdmin(s.user.id)
        if (mounted) setIsAdmin(admin)
      } else {
        setIsAdmin(false)
      }
      setLoading(false)
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
