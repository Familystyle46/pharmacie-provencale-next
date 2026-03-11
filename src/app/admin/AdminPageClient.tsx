"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import Image from "next/image"
import { Plus, Pencil, Trash2, Package, FileText } from "lucide-react"
import { createClientComponent } from "@/lib/supabase/client"
import type { Database } from "@/types/supabase"

type ProductRow = Database["public"]["Tables"]["products"]["Row"]
type ArticleRow = Database["public"]["Tables"]["articles"]["Row"]

const CATEGORY_LABELS: Record<string, string> = {
  equilibre: "Équilibre",
  minceur: "Minceur",
  energie: "Énergie",
  beaute: "Beauté",
  immunite: "Immunité",
  digestion: "Digestion",
}

export function AdminPageClient() {
  const supabase = createClientComponent()
  const [activeTab, setActiveTab] = useState<"produits" | "articles">("produits")
  const [products, setProducts] = useState<ProductRow[]>([])
  const [articles, setArticles] = useState<ArticleRow[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingProduct, setDeletingProduct] = useState<string | null>(null)
  const [deletingArticle, setDeletingArticle] = useState<string | null>(null)

  const fetchProducts = useCallback(async () => {
    if (!supabase) return setProducts([])
    const { data } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false })
    setProducts(data ?? [])
  }, [supabase])

  const fetchArticles = useCallback(async () => {
    if (!supabase) return setArticles([])
    const { data } = await supabase
      .from("articles")
      .select("*")
      .order("created_at", { ascending: false })
    setArticles(data ?? [])
  }, [supabase])

  useEffect(() => {
    let mounted = true
    const load = async () => {
      await Promise.all([fetchProducts(), fetchArticles()])
      if (mounted) setLoading(false)
    }
    load()
    return () => { mounted = false }
  }, [fetchProducts, fetchArticles])

  const handleToggleProduct = async (p: ProductRow) => {
    if (!supabase) return
    await supabase
      .from("products")
      .update({ is_active: !p.is_active })
      .eq("id", p.id)
    await fetchProducts()
  }

  const handleDeleteProduct = async (id: string) => {
    if (!supabase) return
    setDeletingProduct(id)
    await supabase.from("products").delete().eq("id", id)
    await fetchProducts()
    setDeletingProduct(null)
  }

  const handleToggleArticle = async (a: ArticleRow) => {
    if (!supabase) return
    await supabase
      .from("articles")
      .update({
        is_published: !a.is_published,
        published_at: !a.is_published ? new Date().toISOString() : null,
      })
      .eq("id", a.id)
    await fetchArticles()
  }

  const handleDeleteArticle = async (id: string) => {
    if (!supabase) return
    setDeletingArticle(id)
    await supabase.from("articles").delete().eq("id", id)
    await fetchArticles()
    setDeletingArticle(null)
  }

  if (!supabase) {
    return (
      <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
        Configuration Supabase manquante.
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div>
      <div className="flex gap-2 border-b">
        <button
          type="button"
          onClick={() => setActiveTab("produits")}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 font-medium ${
            activeTab === "produits"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Package className="h-4 w-4" />
          Produits
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("articles")}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 font-medium ${
            activeTab === "articles"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <FileText className="h-4 w-4" />
          Articles
        </button>
      </div>

      {activeTab === "produits" && (
        <div className="pt-8">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold">Gestion des produits</h2>
            <span className="text-muted-foreground">
              {products.length} produit(s) au total
            </span>
            <Link
              href="/admin/produits/nouveau"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              <Plus className="h-4 w-4" />
              Ajouter un produit
            </Link>
          </div>
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="p-3 font-medium">Image</th>
                  <th className="p-3 font-medium">Titre</th>
                  <th className="p-3 font-medium">Catégorie</th>
                  <th className="p-3 font-medium">Prix</th>
                  <th className="p-3 font-medium">Stock</th>
                  <th className="p-3 font-medium">Statut</th>
                  <th className="p-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id} className="border-b last:border-0">
                    <td className="p-3">
                      {p.images?.[0] ? (
                        <div className="relative h-12 w-12 overflow-hidden rounded">
                          <Image
                            src={p.images[0]}
                            alt=""
                            fill
                            className="object-cover"
                            sizes="48px"
                          />
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="max-w-xs truncate p-3 font-medium">{p.title}</td>
                    <td className="p-3">{CATEGORY_LABELS[p.category] ?? p.category}</td>
                    <td className="p-3">
                      {p.sale_price}€
                      {p.original_price > p.sale_price && (
                        <span className="ml-1 line-through text-muted-foreground">
                          {p.original_price}€
                        </span>
                      )}
                    </td>
                    <td className="p-3">{p.stock ?? "—"}</td>
                    <td className="p-3">
                      <button
                        type="button"
                        onClick={() => handleToggleProduct(p)}
                        className={`rounded-full px-2 py-1 text-xs font-medium ${
                          p.is_active
                            ? "bg-green-100 text-green-800"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {p.is_active ? "Actif" : "Inactif"}
                      </button>
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <Link
                          href={`/admin/produits/${p.id}`}
                          className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                          title="Modifier"
                        >
                          <Pencil className="h-4 w-4" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleDeleteProduct(p.id)}
                          disabled={deletingProduct === p.id}
                          className="rounded p-1 text-muted-foreground hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                          title="Supprimer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "articles" && (
        <div className="pt-8">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold">Gestion des articles</h2>
            <span className="text-muted-foreground">
              {articles.length} article(s) au total
            </span>
            <Link
              href="/admin/articles/nouveau"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              <Plus className="h-4 w-4" />
              Ajouter un article
            </Link>
          </div>
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="p-3 font-medium">Image</th>
                  <th className="p-3 font-medium">Titre</th>
                  <th className="p-3 font-medium">Catégorie</th>
                  <th className="p-3 font-medium">Publié</th>
                  <th className="p-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {articles.map((a) => (
                  <tr key={a.id} className="border-b last:border-0">
                    <td className="p-3">
                      {a.cover_image ? (
                        <div className="relative h-12 w-12 overflow-hidden rounded">
                          <Image
                            src={a.cover_image}
                            alt=""
                            fill
                            className="object-cover"
                            sizes="48px"
                          />
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="max-w-xs truncate p-3 font-medium">{a.title}</td>
                    <td className="p-3">{a.category}</td>
                    <td className="p-3">
                      <button
                        type="button"
                        onClick={() => handleToggleArticle(a)}
                        className={`rounded-full px-2 py-1 text-xs font-medium ${
                          a.is_published
                            ? "bg-green-100 text-green-800"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {a.is_published ? "Publié" : "Brouillon"}
                      </button>
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <Link
                          href={`/admin/articles/${a.id}`}
                          className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                          title="Modifier"
                        >
                          <Pencil className="h-4 w-4" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleDeleteArticle(a.id)}
                          disabled={deletingArticle === a.id}
                          className="rounded p-1 text-muted-foreground hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                          title="Supprimer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
