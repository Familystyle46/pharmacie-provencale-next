import { createServerClient } from "@/lib/supabase/server"
import Link from "next/link"
import Image from "next/image"
import { ArrowRight, Sparkles } from "lucide-react"

export const revalidate = 60

export default async function HomePage() {
  const supabase = createServerClient()
  let featured: { id: string; title: string; slug: string; sale_price: number; original_price: number; images: string[] }[] = []
  let recent: { id: string; title: string; slug: string; sale_price: number; images: string[] }[] = []

  if (supabase) {
    const [resFeatured, resRecent] = await Promise.all([
      supabase
        .from("products")
        .select("id, title, slug, sale_price, original_price, images")
        .or("is_featured.eq.true,is_featured.is.null")
        .or("is_active.eq.true,is_active.is.null")
        .limit(8),
      supabase
        .from("products")
        .select("id, title, slug, sale_price, images")
        .or("is_active.eq.true,is_active.is.null")
        .order("created_at", { ascending: false })
        .limit(8),
    ])
    featured = resFeatured.data ?? []
    recent = resRecent.data ?? []
  }

  return (
    <main>
      {/* Bandeau promo */}
      <div className="bg-primary py-2 text-center text-sm text-primary-foreground">
        Livraison offerte dès 49€ d&apos;achat · Satisfaction garantie ou remboursé
      </div>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-primary/10 py-16 md:py-24 lg:py-32">
        <div className="mx-auto max-w-3xl px-4 text-center md:px-6">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
            <Sparkles className="h-4 w-4" />
            Compléments 100% naturels
          </div>
          <h1 className="text-4xl font-bold leading-tight tracking-tight md:text-5xl lg:text-6xl">
            Prenez soin de votre <span className="text-primary">bien-être</span> naturellement
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Découvrez notre sélection de compléments alimentaires naturels, fabriqués en France avec des ingrédients de
            qualité premium pour votre équilibre au quotidien.
          </p>
          <div className="mt-8">
            <Link
              href="/produits"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              Découvrir les produits
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Badges confiance */}
      <section className="border-y bg-card py-8">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-8 px-4 md:gap-12">
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
              <span className="text-2xl">🌿</span>
            </div>
            <span className="font-medium">100% Naturel</span>
            <span className="text-xs text-muted-foreground">Ingrédients naturels</span>
          </div>
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
              <span className="text-2xl">🚚</span>
            </div>
            <span className="font-medium">Livraison rapide</span>
            <span className="text-xs text-muted-foreground">24h/48h</span>
          </div>
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
              <span className="text-2xl">💬</span>
            </div>
            <span className="font-medium">Service client</span>
            <span className="text-xs text-muted-foreground">Disponible 7j/7</span>
          </div>
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
              <span className="text-2xl">🔒</span>
            </div>
            <span className="font-medium">Paiement sécurisé</span>
            <span className="text-xs text-muted-foreground">Cryptage SSL</span>
          </div>
        </div>
      </section>

      {/* Nos produits phares */}
      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold md:text-4xl">Nos produits phares</h2>
            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
              Découvrez notre sélection de compléments alimentaires naturels, fabriqués en France avec des ingrédients de
              qualité premium pour votre équilibre au quotidien.
            </p>
          </div>

          {featured.length > 0 ? (
            <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {featured.map((p) => (
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
                    <h3 className="font-medium">{p.title}</h3>
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
          ) : (
            <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {recent.slice(0, 4).map((p) => (
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
                    <h3 className="font-medium">{p.title}</h3>
                    <p className="text-sm text-muted-foreground">{p.sale_price} €</p>
                  </Link>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-12 text-center">
            <Link
              href="/produits"
              className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              Voir tous les produits
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary py-16 text-center text-primary-foreground">
        <div className="mx-auto max-w-xl px-4">
          <h2 className="text-3xl font-bold md:text-4xl">Prêt à commencer votre cure ?</h2>
          <p className="mt-4 opacity-90">Profitez de -20% sur votre première commande avec le code BIENVENUE</p>
          <Link
            href="/produits"
            className="mt-8 inline-block rounded-lg bg-white px-6 py-3 text-sm font-medium text-primary hover:bg-white/90"
          >
            Découvrir le catalogue
          </Link>
        </div>
      </section>
    </main>
  )
}
