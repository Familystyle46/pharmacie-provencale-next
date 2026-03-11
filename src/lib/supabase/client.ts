import { createBrowserClient } from "@supabase/ssr"
import type { Database } from "@/types/supabase"

export function createClientComponent() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  return createBrowserClient<Database>(url, key, {
    auth: {
      // Désactive le Web Lock Navigator — évite le timeout "lock timed out 10000ms"
      // qui se produit quand plusieurs onglets sont ouverts simultanément
      lock: async (_name, _acquireTimeout, fn) => fn(),
    },
  })
}
