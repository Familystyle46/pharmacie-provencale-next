import { createServerClient } from "@/lib/supabase/server"
import type { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { ArrowRight } from "lucide-react"

export const revalidate = 3600

export const metadata: Metadata = {
  title: "Blog",
  description: "Conseils santé, actualités et dossiers par la Pharmacie Provençale.",
  robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
}

const CATEGORY_LABELS: Record<string, string> = {
  bien_etre: "Bien-être",
  nutrition: "Nutrition",
  conseils: "Conseils",
  actualites: "Actualités",
  probiotiques_digestion: "Digestion",
  sommeil_stress: "Sommeil & stress",
  minceur_detox: "Minceur & détox",
  sommeil_confort: "Sommeil",
  sante_masculine: "Santé masculine",
  detox_minceur: "Détox & minceur",
  glycemie_diabete: "Glycémie",
  articulations: "Articulations",
  cardio_tension: "Cardio & tension",
  parasites_immunite: "Immunité",
  transversal: "Transversal",
}

const CATEGORY_BADGE_COLORS: Record<string, string> = {
  bien_etre: "bg-emerald-100 text-emerald-800",
  nutrition: "bg-amber-100 text-amber-800",
  conseils: "bg-sky-100 text-sky-800",
  actualites: "bg-violet-100 text-violet-800",
  probiotiques_digestion: "bg-teal-100 text-teal-800",
  sommeil_stress: "bg-indigo-100 text-indigo-800",
  minceur_detox: "bg-rose-100 text-rose-800",
  sommeil_confort: "bg-indigo-100 text-indigo-800",
  sante_masculine: "bg-blue-100 text-blue-800",
  detox_minceur: "bg-rose-100 text-rose-800",
  glycemie_diabete: "bg-lime-100 text-lime-800",
  articulations: "bg-orange-100 text-orange-800",
  cardio_tension: "bg-red-100 text-red-800",
  parasites_immunite: "bg-green-100 text-green-800",
  transversal: "bg-slate-100 text-slate-800",
}

function formatShortDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

export default async function BlogPage() {
  const supabase = createServerClient()
  let list: {
    id: string
    title: string
    slug: string
    excerpt: string
    cover_image: string | null
    published_at: string | null
    category: string
  }[] = []
  if (supabase) {
    const { data: articles } = await supabase
      .from("articles")
      .select("id, title, slug, excerpt, cover_image, published_at, category")
      .or("is_published.eq.true,is_published.is.null")
      .order("published_at", { ascending: false })
    list = (articles ?? []).map((a) => ({
      ...a,
      category: a.category ?? "transversal",
    }))
  }

  return (
    <main className="min-h-screen p-6 md:p-10">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-8 text-3xl font-bold">Blog</h1>
        <ul className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {list.map((a) => (
            <li key={a.id}>
              <Link
                href={`/blog/${a.slug}`}
                className="flex h-full flex-col overflow-hidden rounded-lg border bg-white transition hover:shadow-xl"
              >
                {a.cover_image ? (
                  <div className="relative aspect-square w-full overflow-hidden bg-muted">
                    <Image
                      src={a.cover_image}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  </div>
                ) : (
                  <div className="aspect-square w-full bg-muted" />
                )}
                <div className="flex flex-1 flex-col p-4">
                  <span
                    className={`mb-2 inline-block w-fit rounded-full px-2.5 py-0.5 text-xs font-medium ${CATEGORY_BADGE_COLORS[a.category] ?? CATEGORY_BADGE_COLORS.transversal}`}
                  >
                    {CATEGORY_LABELS[a.category] ?? a.category}
                  </span>
                  <h2 className="line-clamp-2 text-lg font-semibold leading-snug">
                    {a.title}
                  </h2>
                  {a.excerpt && (
                    <p className="mt-2 line-clamp-3 flex-1 text-sm text-muted-foreground">
                      {a.excerpt}
                    </p>
                  )}
                  <div className="mt-3 flex items-center justify-between gap-2">
                    {a.published_at && (
                      <time className="text-xs text-muted-foreground" dateTime={a.published_at}>
                        {formatShortDate(a.published_at)}
                      </time>
                    )}
                    <span className="inline-flex items-center gap-1 text-sm font-medium text-primary">
                      Lire la suite
                      <ArrowRight className="h-4 w-4 shrink-0" />
                    </span>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </main>
  )
}
