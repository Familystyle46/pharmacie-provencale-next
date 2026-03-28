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
    .select("title, meta_description, excerpt, cover_image, published_at, author_name")
    .eq("slug", slug)
    .single()
  if (!article) return { title: "Article introuvable" }
  const description = article.meta_description ?? article.excerpt?.slice(0, 160) ?? ""
  const canonical = `${BASE_URL}/blog/${slug}`
  const images = article.cover_image
    ? [{ url: article.cover_image, width: 1200, height: 630, alt: article.title }]
    : []
  return {
    title: article.title,
    description: description || undefined,
    alternates: { canonical },
    robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
    openGraph: {
      title: article.title,
      description: description || undefined,
      images,
      type: "article",
      url: canonical,
      publishedTime: article.published_at ?? undefined,
      authors: article.author_name ? [article.author_name] : ["Pharmacie Provençale"],
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description: description || undefined,
      images: article.cover_image ? [article.cover_image] : [],
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

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.meta_description ?? article.excerpt ?? "",
    image: article.cover_image ? [article.cover_image] : [],
    datePublished: article.published_at ?? article.created_at,
    dateModified: article.updated_at ?? article.published_at ?? article.created_at,
    author: {
      "@type": "Person",
      name: article.author_name ?? "Pharmacie Provençale",
    },
    publisher: {
      "@type": "Organization",
      name: "Pharmacie Provençale",
      url: BASE_URL,
    },
    url: `${BASE_URL}/blog/${slug}`,
    mainEntityOfPage: `${BASE_URL}/blog/${slug}`,
  }

  const faqs = Array.isArray(article.faqs) && article.faqs.length > 0 ? article.faqs : null
  const faqJsonLd = faqs
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqs.map((faq: { question: string; answer: string }) => ({
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
      {faqJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      )}
      <div className="mx-auto max-w-3xl">
        <nav className="mb-6 text-sm text-muted-foreground">
          <Link href="/blog">Blog</Link>
          <span className="mx-2">/</span>
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
          {article.published_at && (
            <p className="mt-2 text-sm text-muted-foreground">
              {new Date(article.published_at).toLocaleDateString("fr-FR")}
            </p>
          )}
          <MarkdownContent
            content={article.content}
            size="lg"
            className="mt-8"
          />
        </article>
        <section className="mt-12 border-t pt-8">
          <RelatedProducts category={article.category} />
        </section>
      </div>
    </main>
  )
}
