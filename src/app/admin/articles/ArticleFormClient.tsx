"use client"

import { useState, useCallback, useMemo } from "react"
import Link from "next/link"
import Image from "next/image"
import { createClientComponent } from "@/lib/supabase/client"
import { Constants } from "@/types/supabase"
import type { ArticleRow } from "@/types/supabase"

const inputClass =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
const labelClass = "text-sm font-medium"

function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
}

const STORAGE_BUCKET = "images"
const ARTICLE_IMAGE_PREFIX = "articles"

interface ArticleFormClientProps {
  initialData?: ArticleRow | null
}

export function ArticleFormClient({ initialData }: ArticleFormClientProps) {
  const isEdit = !!initialData?.id
  const supabase = useMemo(() => createClientComponent(), [])
  const [title, setTitle] = useState(initialData?.title ?? "")
  const [slug, setSlug] = useState(initialData?.slug ?? "")
  const [excerpt, setExcerpt] = useState(initialData?.excerpt ?? "")
  const [content, setContent] = useState(initialData?.content ?? "")
  const [category, setCategory] = useState<
    (typeof Constants.public.Enums.article_category)[number]
  >(initialData?.category ?? "bien_etre")
  const [coverImage, setCoverImage] = useState<string | null>(
    initialData?.cover_image ?? null
  )
  const [isPublished, setIsPublished] = useState(
    initialData?.is_published ?? false
  )

  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const syncSlugFromTitle = useCallback(() => {
    if (title) setSlug(slugify(title))
  }, [title])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!supabase) {
      setError("Supabase non configuré")
      return
    }
    setUploading(true)
    setError(null)
    try {
      const ext = file.name.split(".").pop() || "jpg"
      const path = `${ARTICLE_IMAGE_PREFIX}/${crypto.randomUUID()}.${ext}`
      const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Upload trop long — vérifiez votre connexion et réessayez")), 30000)
      )
      const uploadPromise = supabase.storage
        .from(STORAGE_BUCKET)
        .upload(path, file, { cacheControl: "3600", upsert: false })
      const { error: uploadError } = await Promise.race([uploadPromise, timeout])
      if (uploadError) {
        setError(uploadError.message)
        return
      }
      const { data: urlData } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path)
      setCoverImage(urlData.publicUrl)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur upload inattendue")
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    if (!supabase) {
      setError("Supabase non configuré")
      return
    }
    const payload = {
      title,
      slug: slug.trim() || slugify(title),
      excerpt,
      content,
      category,
      cover_image: coverImage,
      is_published: isPublished,
      ...(isPublished && !initialData?.published_at
        ? { published_at: new Date().toISOString() }
        : {}),
    }

    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Délai dépassé — vérifiez votre connexion et réessayez")), 15000)
    )

    setSaving(true)
    try {
      if (isEdit && initialData) {
        const { error: updateError } = await Promise.race([
          supabase.from("articles").update(payload).eq("id", initialData.id),
          timeout,
        ])
        if (updateError) {
          setError(updateError.message)
          return
        }
        setSuccess(true)
      } else {
        const { error: insertError } = await Promise.race([
          supabase.from("articles").insert(payload),
          timeout,
        ])
        if (insertError) {
          setError(insertError.message)
          return
        }
        setSuccess(true)
        setTitle("")
        setSlug("")
        setExcerpt("")
        setContent("")
        setCategory("bien_etre")
        setCoverImage(null)
        setIsPublished(false)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inattendue")
    } finally {
      setSaving(false)
    }
  }

  if (success && isEdit) {
    return (
      <div className="space-y-4 rounded-lg border bg-card p-8">
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-green-800">
          Article mis à jour.
        </div>
        <Link
          href="/admin"
          className="inline-block text-sm text-primary hover:underline"
        >
          ← Retour à l&apos;admin
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 rounded-lg border bg-card p-8">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">
          {isEdit ? "Modifier l'article" : "Ajouter un article"}
        </h2>
        <Link href="/admin" className="text-sm text-primary hover:underline">
          ← Retour
        </Link>
      </div>

      {error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="title" className={labelClass}>
            Titre *
          </label>
          <input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={syncSlugFromTitle}
            required
            className={inputClass}
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="slug" className={labelClass}>
            Slug (URL)
          </label>
          <input
            id="slug"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="auto depuis le titre"
            className={inputClass}
          />
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="excerpt" className={labelClass}>
          Extrait *
        </label>
        <textarea
          id="excerpt"
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          required
          rows={2}
          className={inputClass}
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="content" className={labelClass}>
          Contenu *
        </label>
        <textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
          rows={14}
          className={`${inputClass} min-h-[320px] font-mono text-sm`}
          placeholder="HTML ou texte. Un éditeur riche (ex. TipTap) pourra être ajouté plus tard."
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="category" className={labelClass}>
          Catégorie
        </label>
        <select
          id="category"
          value={category}
          onChange={(e) =>
            setCategory(
              e.target.value as (typeof Constants.public.Enums.article_category)[number]
            )
          }
          className={inputClass}
        >
          {Constants.public.Enums.article_category.map((c) => (
            <option key={c} value={c}>
              {c.replace(/_/g, " ")}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <span className={labelClass}>Image de couverture</span>
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          disabled={uploading}
          className="block w-full text-sm text-muted-foreground file:mr-4 file:rounded file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:text-primary-foreground file:hover:opacity-90"
        />
        {uploading && <p className="text-sm text-muted-foreground">Upload…</p>}
        {coverImage && (
          <div className="relative mt-2 aspect-video max-w-md overflow-hidden rounded bg-muted">
            <Image
              src={coverImage}
              alt=""
              fill
              className="object-cover"
              sizes="400px"
            />
          </div>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <input
            id="is_published"
            type="checkbox"
            checked={isPublished}
            onChange={(e) => setIsPublished(e.target.checked)}
            className="h-4 w-4 rounded border-input"
          />
          <label htmlFor="is_published" className={labelClass}>
            Publié (visible sur le blog)
          </label>
        </div>
      </div>

      <button
        type="submit"
        disabled={saving || uploading}
        className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
      >
        {saving ? "Enregistrement…" : uploading ? "Upload en cours…" : isEdit ? "Enregistrer" : "Créer l'article"}
      </button>
    </form>
  )
}
