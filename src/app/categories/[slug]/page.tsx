import { createServerClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { Constants } from "@/types/supabase"
import type { Database } from "@/types/supabase"

export const revalidate = 60

const CATEGORY_SLUGS = Constants.public.Enums.product_category

export async function generateStaticParams() {
  return CATEGORY_SLUGS.map((slug) => ({ slug }))
}

const categoryLabels: Record<string, string> = {
  equilibre: "Équilibre",
  minceur: "Minceur",
  energie: "Énergie",
  beaute: "Beauté",
  immunite: "Immunité",
  digestion: "Digestion",
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  if (!(CATEGORY_SLUGS as readonly string[]).includes(slug))
    return { title: "Catégorie introuvable" }
  const nom = categoryLabels[slug] ?? slug
  return {
    title: nom,
    description: `Produits de la catégorie ${nom} — Pharmacie Provençale.`,
  }
}

export default async function CategoriePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  if (!(CATEGORY_SLUGS as readonly string[]).includes(slug)) notFound()

  const supabase = createServerClient()
  if (!supabase) notFound()
  const category = slug as Database["public"]["Enums"]["product_category"]
  const { data: produits } = await supabase
    .from("products")
    .select("id, title, slug, sale_price, images")
    .eq("category", category)
    .or("is_active.eq.true,is_active.is.null")

  const list = produits ?? []
  const nom = categoryLabels[slug] ?? slug

  return (
    <main className="min-h-screen p-6 md:p-10">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-8 text-3xl font-bold">Catégorie : {nom}</h1>
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
                <p className="text-sm text-muted-foreground">{p.sale_price} €</p>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </main>
  )
}
