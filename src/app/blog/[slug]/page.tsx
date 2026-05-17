import { createServerClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { MarkdownContent } from "@/components/content/MarkdownContent"
import { RelatedProducts } from "@/components/blog/RelatedProducts"

export const revalidate = 60

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://pharmacie-provencale.com"

export async function generateStaticParams() {
  const supabase = createServerClient()
  if (!supabase) return []
  const { data: articles } = await supabase
    .from("articles")
    .select("slug")
    .or("is_published.eq.true,is_published.is.null")
    .limit(100)
  return (articles ?? []).map((a) => ({ slug: a.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const supabase = createServerClient()
  if (!supabase) return { title: "Blog" }
  const { data: article } = await supabase
    .from("articles")
    .select("title, meta_description, excerpt, cover_image, published_at, updated_at, author_name")
    .eq("slug", slug)
    .single()
  if (!article) return { title: "Article introuvable" }
  const description = article.meta_description ?? article.excerpt?.slice(0, 160) ?? ""
  const canonical = `${BASE_URL}/blog/${slug}`
  const images = article.cover_image
    ? [{ url: article.cover_image, width: 1200, height: 630, alt: article.title }]
    : []
  const authorName = article.author_name ?? "Pharmacie Provençale"
  const modifiedTime = article.updated_at ?? article.published_at ?? undefined
  return {
    title: { absolute: article.title },
    description: description || undefined,
    authors: [{ name: authorName }],
    alternates: { canonical },
    robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
    openGraph: {
      title: article.title,
      description: description || undefined,
      images,
      type: "article",
      url: canonical,
      publishedTime: article.published_at ?? undefined,
      modifiedTime,
      authors: [authorName],
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description: description || undefined,
      images: article.cover_image ? [article.cover_image] : [],
    },
    other: {
      "article:modified_time": modifiedTime ?? "",
    },
  }
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = createServerClient()
  if (!supabase) notFound()
  const { data: article } = await supabase
    .from("articles")
    .select("*")
    .eq("slug", slug)
    .or("is_published.eq.true,is_published.is.null")
    .single()
  if (!article) notFound()

  const pageUrl = `${BASE_URL}/blog/${slug}`
  const authorName = article.author_name ?? "Pharmacie Provençale"
  const datePublished = article.published_at ?? article.created_at
  const dateModified = article.updated_at ?? datePublished
  const hasBeenUpdated = article.updated_at && article.updated_at !== datePublished

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.meta_description ?? article.excerpt ?? "",
    image: article.cover_image ? [article.cover_image] : [],
    datePublished,
    dateModified,
    author: {
      "@type": "Person",
      name: authorName,
      ...(article.author_title && { jobTitle: article.author_title }),
    },
    publisher: {
      "@type": "Organization",
      name: "Pharmacie Provençale",
      url: BASE_URL,
    },
    url: pageUrl,
    mainEntityOfPage: pageUrl,
  }

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Accueil", item: BASE_URL },
      { "@type": "ListItem", position: 2, name: "Blog", item: `${BASE_URL}/blog` },
      { "@type": "ListItem", position: 3, name: article.title, item: pageUrl },
    ],
  }

  const faqs = Array.isArray(article.faqs) && article.faqs.length > 0 ? article.faqs : null
  const faqJsonLd = faqs
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: (faqs as Array<{ question: string; answer: string }>).map((faq) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: { "@type": "Answer", text: faq.answer },
        })),
      }
    : null

  return (
    <main className="min-h-screen p-6 md:p-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      {faqJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      )}
      <div className="mx-auto max-w-3xl">
        <nav aria-label="Fil d'Ariane" className="mb-6 text-sm text-muted-foreground">
          <Link href="/">Accueil</Link>
          <span className="mx-2" aria-hidden="true">/</span>
          <Link href="/blog">Blog</Link>
          <span className="mx-2" aria-hidden="true">/</span>
          <span>{article.title}</span>
        </nav>
        <article>
          {article.cover_image && (
            <div className="relative mb-8 aspect-video overflow-hidden rounded-lg bg-muted">
              <Image
                src={article.cover_image}
                alt={article.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 800px"
                priority
              />
            </div>
          )}
          <h1 className="text-3xl font-bold">{article.title}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            {authorName && (
              <span>
                Par <span className="font-medium text-foreground">{authorName}</span>
                {article.author_title && (
                  <span className="text-muted-foreground">, {article.author_title}</span>
                )}
              </span>
            )}
            {datePublished && (
              <span>
                Publié le{" "}
                <time dateTime={datePublished}>
                  {new Date(datePublished).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </time>
              </span>
            )}
            {hasBeenUpdated && (
              <span>
                · Mis à jour le{" "}
                <time dateTime={dateModified}>
                  {new Date(dateModified).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </time>
              </span>
            )}
            {article.reading_time && (
              <span>{article.reading_time} min de lecture</span>
            )}
          </div>
          <MarkdownContent
            content={article.content}
            size="lg"
            className="mt-8"
          />
          {(article.author_name || article.author_bio) && (
            <div className="mt-10 rounded-lg border bg-muted/30 p-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                À propos de l&apos;auteur
              </p>
              <p className="mt-1 font-semibold text-foreground">
                {article.author_name}
                {article.author_title && (
                  <span className="ml-2 text-sm font-normal text-muted-foreground">
                    — {article.author_title}
                  </span>
                )}
              </p>
              {article.author_bio && (
                <p className="mt-2 text-sm text-muted-foreground">{article.author_bio}</p>
              )}
            </div>
          )}
        </article>
        <section className="mt-12 border-t pt-8">
          <RelatedProducts category={article.category} />
        </section>
      </div>
    </main>
  )
}
