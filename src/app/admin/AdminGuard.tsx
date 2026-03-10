"use client"

import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { user, isAdmin, loading } = useAuth()
  // Une fois admin confirmé, on retient cet état pour éviter les redirects transitoires
  const confirmedAdmin = useRef(false)
  if (isAdmin) confirmedAdmin.current = true

  useEffect(() => {
    if (loading) return
    if (!user) {
      router.replace("/auth")
      return
    }
    // Ne rediriger que si l'admin n'a jamais été confirmé dans cette session
    if (!isAdmin && !confirmedAdmin.current) {
      router.replace("/")
    }
  }, [user, isAdmin, loading, router])

  if (loading || (user && !isAdmin && !confirmedAdmin.current)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!user) return null
  return <>{children}</>
}
