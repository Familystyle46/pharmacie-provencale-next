import { createServerClient } from "@/lib/supabase/server"
import type { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"

export const revalidate = 60

export const metadata: Metadata = {
  title: "Tous les produits",
  description:
    "Découvrez notre gamme complète de produits pharmaceutiques et parapharmacie.",
}

export default async function ProduitsPage() {
  const supabase = createServerClient()
  let list: { id: string; title: string; slug: string; sale_price: number; original_price: number; images: string[]; category: string }[] = []
  if (supabase) {
    const { data: produits } = await supabase
      .from("products")
      .select("id, title, slug, sale_price, original_price, images, category")
      .or("is_active.eq.true,is_active.is.null")
      .order("created_at", { ascending: false })
    list = produits ?? []
  }

  return (
    <main className="min-h-screen p-6 md:p-10">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-8 text-3xl font-bold">Tous les produits</h1>
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {list.map((p) => (
            <li key={p.id}>
              <Link
                href={`/produits/${p.slug}`}
                className="block rounded-lg border p-4 transition hover:shadow-md"
              >
                {p.images?.[0] && (
                  <div className="relative mb-3 aspect-square overflow-hidden rounded-md bg-muted">
                    <Image
                      src={p.images[0]}
                      alt={p.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    />
                  </div>
                )}
                <h2 className="font-medium">{p.title}</h2>
                <p className="text-sm text-muted-foreground">
                  {p.sale_price} €
                  {p.original_price > p.sale_price && (
                    <span className="ml-2 line-through">{p.original_price} €</span>
                  )}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </main>
  )
}
