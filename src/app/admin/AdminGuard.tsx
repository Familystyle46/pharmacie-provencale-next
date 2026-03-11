"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { user, isAdmin, loading } = useAuth()

  useEffect(() => {
    if (loading) return
    if (!user) {
      router.replace("/auth")
      return
    }
    if (!isAdmin) {
      router.replace("/")
    }
  }, [user, isAdmin, loading, router])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }
  if (!user || !isAdmin) return null
  return <>{children}</>
}
