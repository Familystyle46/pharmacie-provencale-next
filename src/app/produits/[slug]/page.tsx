import { createServerClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { ProductJsonLd } from "@/components/seo/ProductJsonLd"
import { ProductFAQ } from "@/components/product/ProductFAQ"
import { ReviewsList } from "@/components/product/ReviewsList"
import { MarkdownContent } from "@/components/content/MarkdownContent"

export const revalidate = 60

export async function generateStaticParams() {
  const supabase = createServerClient()
  if (!supabase) return []
  const { data: produits } = await supabase
    .from("products")
    .select("slug")
    .or("is_active.eq.true,is_active.is.null")
    .limit(200)
  return (produits ?? []).map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const supabase = createServerClient()
  if (!supabase) return { title: "Produit" }
  const { data: produit } = await supabase
    .from("products")
    .select("title, short_description, description, images")
    .eq("slug", slug)
    .single()
  if (!produit) return { title: "Produit introuvable" }
  const image = produit.images?.[0]
  const description =
    produit.short_description ??
    (typeof produit.description === "string"
      ? produit.description.slice(0, 160)
      : "")
  return {
    title: produit.title,
    description: description || undefined,
    openGraph: {
      title: produit.title,
      description: description || undefined,
      images: image ? [{ url: image }] : [],
      type: "website",
    },
  }
}

export default async function ProduitPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = createServerClient()
  if (!supabase) notFound()
  const { data: produit } = await supabase
    .from("products")
    .select("*")
    .eq("slug", slug)
    .single()
  if (!produit) notFound()

  const { data: reviewsData } = await supabase
    .from("reviews")
    .select("id, author_name, comment, rating, created_at, is_verified")
    .eq("product_id", produit.id)
  const imageUrl = produit.images?.[0]
  const faqRaw = produit.faq
  const faq = Array.isArray(faqRaw)
    ? (faqRaw as Array<{ question?: string; answer?: string }>).filter(
        (x) => x && typeof x.question === "string" && typeof x.answer === "string"
      ) as { question: string; answer: string }[]
    : []
  const reviews = reviewsData ?? []

  return (
    <main className="min-h-screen p-6 md:p-10">
      <ProductJsonLd
        produit={{
          nom: produit.title,
          description:
            produit.short_description ?? (produit.description || ""),
          prix: produit.sale_price,
          image_url: imageUrl ?? "",
          slug: produit.slug,
          disponible: (produit.stock ?? 0) > 0,
        }}
      />
      <div className="mx-auto max-w-4xl">
        <nav className="mb-6 text-sm text-muted-foreground">
          <Link href="/produits">Produits</Link>
          <span className="mx-2">/</span>
          <span>{produit.title}</span>
        </nav>
        <article className="grid gap-8 md:grid-cols-2">
          <div className="relative aspect-square overflow-hidden rounded-lg bg-muted">
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={produit.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                Pas d’image
              </div>
            )}
          </div>
          <div>
            <h1 className="text-3xl font-bold">{produit.title}</h1>
            <p className="mt-4 text-2xl font-semibold text-primary">
              {produit.sale_price} €
              {produit.original_price > produit.sale_price && (
                <span className="ml-2 text-base font-normal text-muted-foreground line-through">
                  {produit.original_price} €
                </span>
              )}
            </p>
            {produit.short_description && (
              <p className="mt-4 text-muted-foreground">
                {produit.short_description}
              </p>
            )}
            <MarkdownContent
              content={produit.description ?? ""}
              size="sm"
              className="mt-6"
            />
            {/* Lien affilié */}
            {produit.affiliate_link &&
              (produit.stock === 0 ? (
                <span className="mt-6 flex w-full cursor-not-allowed items-center justify-center rounded-lg bg-muted px-4 py-3 text-center font-medium text-muted-foreground">
                  Rupture de stock
                </span>
              ) : (
                <a
                  href={produit.affiliate_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-center font-medium text-primary-foreground hover:opacity-90"
                >
                  Commander maintenant
                </a>
              ))}
          </div>
        </article>

        {faq.length > 0 && (
          <>
            <hr className="my-12 border-t" />
            <ProductFAQ faq={faq} />
          </>
        )}

        <hr className="my-12 border-t" />
        <ReviewsList reviews={reviews} />
      </div>
    </main>
  )
}
