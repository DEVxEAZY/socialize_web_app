"use client";

import { useState, useEffect, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Category } from "@/types";

/** Alinhado ao seed da API (doc); usado se GET /api/categories vier vazio. */
const FALLBACK_EVENT_CATEGORIES: Category[] = [
  { id: 1, slug: "esporte", name: "Esporte", isEventCategory: true, isInterestCategory: true },
  { id: 2, slug: "cultura", name: "Cultura", isEventCategory: true, isInterestCategory: true },
  { id: 3, slug: "musica", name: "Musica", isEventCategory: true, isInterestCategory: true },
  { id: 4, slug: "trilha", name: "Trilha", isEventCategory: true, isInterestCategory: true },
  { id: 5, slug: "yoga", name: "Yoga", isEventCategory: true, isInterestCategory: true },
];

export default function CreateEventPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [usedCategoryFallback, setUsedCategoryFallback] = useState(false);

  const [categoryId, setCategoryId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [locationText, setLocationText] = useState("");
  const [visibility, setVisibility] = useState<"public" | "friends" | "private">("public");
  const submitDisabled = loading || categoriesLoading || categories.length === 0;

  useEffect(() => {
    let active = true;

    api
      .getCategories()
      .then((res) => {
        if (!active) return;
        const forEvents = res.categories.filter((c) => c.isEventCategory);
        if (forEvents.length > 0) {
          setUsedCategoryFallback(false);
          setCategories(forEvents);
          return;
        }
        // API vazia ou sem flags de evento: permite escolher com lista padrao do seed (doc).
        setUsedCategoryFallback(true);
        setCategories(FALLBACK_EVENT_CATEGORIES);
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Erro ao carregar categorias");
      })
      .finally(() => {
        if (active) {
          setCategoriesLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    const trimmedTitle = title.trim();
    const trimmedDescription = description.trim();
    const trimmedLocation = locationText.trim();
    const startsAtDate = startsAt ? new Date(startsAt) : null;
    const endsAtDate = endsAt ? new Date(endsAt) : null;

    if (!trimmedTitle) {
      setError("Informe o titulo do evento");
      return;
    }

    if (!categoryId) {
      setError("Selecione uma categoria");
      return;
    }

    if (!startsAtDate || Number.isNaN(startsAtDate.getTime())) {
      setError("Informe uma data de inicio valida");
      return;
    }

    if (endsAtDate && Number.isNaN(endsAtDate.getTime())) {
      setError("Informe uma data de termino valida");
      return;
    }

    if (startsAtDate && endsAtDate && endsAtDate <= startsAtDate) {
      setError("A data de termino precisa ser maior que a de inicio");
      return;
    }

    setLoading(true);

    try {
      await api.createEvent({
        categoryId: Number(categoryId),
        title: trimmedTitle,
        startsAt: startsAtDate.toISOString(),
        endsAt: endsAtDate?.toISOString(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        locationText: trimmedLocation || undefined,
        description: trimmedDescription || undefined,
        visibility,
      });
      router.push("/feed");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar evento");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 px-4 pb-6 pt-4">
      <h1 className="text-2xl font-semibold text-gradient-ig">Criar evento</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-sm bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <Input
          label="Titulo"
          type="text"
          placeholder="Nome do evento"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        <div className="w-full">
          <label
            htmlFor="event-category"
            className="mb-1.5 block text-sm font-semibold text-ig-text"
          >
            Categoria
          </label>
          <select
            id="event-category"
            name="categoryId"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            required
            disabled={categoriesLoading || categories.length === 0}
            className="relative z-10 min-h-[44px] w-full rounded-[3px] border border-ig-border bg-[#fafafa] px-3 py-2.5 text-sm text-ig-text
              focus:border-ig-muted focus:bg-white focus:outline-none focus:ring-0
              disabled:cursor-not-allowed disabled:bg-ig-bg disabled:text-ig-muted"
          >
            <option value="">
              {categoriesLoading
                ? "Carregando categorias..."
                : categories.length === 0
                  ? "Nenhuma categoria disponivel"
                  : "Selecione..."}
            </option>
            {categories.map((cat) => (
              <option key={cat.id} value={String(cat.id)}>
                {cat.name}
              </option>
            ))}
          </select>
          {!categoriesLoading && usedCategoryFallback && (
            <p className="mt-2 rounded-sm border border-ig-border bg-ig-bg px-3 py-2 text-sm text-ig-text">
              A API nao retornou categorias; estamos mostrando as categorias padrao do produto. Se
              criar falhar, rode <code className="text-xs">npm run db:seed</code> no servidor e
              confira <code className="text-xs">NEXT_PUBLIC_API_URL</code>.
            </p>
          )}
        </div>

        <div className="w-full">
          <label className="mb-1.5 block text-sm font-semibold text-ig-text">
            Descricao
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descreva o evento..."
            rows={3}
            className="w-full resize-none rounded-[3px] border border-ig-border bg-[#fafafa] px-3 py-2.5 text-sm text-ig-text
              placeholder:text-ig-muted focus:border-ig-muted focus:bg-white focus:outline-none focus:ring-0"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Inicio"
            type="datetime-local"
            value={startsAt}
            onChange={(e) => setStartsAt(e.target.value)}
            required
          />
          <Input
            label="Termino (opcional)"
            type="datetime-local"
            value={endsAt}
            onChange={(e) => setEndsAt(e.target.value)}
          />
        </div>

        <Input
          label="Local"
          type="text"
          placeholder="Onde sera o evento?"
          value={locationText}
          onChange={(e) => setLocationText(e.target.value)}
        />

        <div className="w-full">
          <label className="mb-1.5 block text-sm font-semibold text-ig-text">
            Visibilidade
          </label>
          <div className="flex gap-2">
            {(["public", "friends", "private"] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setVisibility(v)}
                className={`flex-1 rounded-md px-3 py-2 text-sm font-semibold transition-colors
                  ${visibility === v
                    ? "bg-ig-text text-white"
                    : "border border-ig-border bg-white text-ig-muted hover:text-ig-text"
                  }`}
              >
                {v === "public" ? "Publico" : v === "friends" ? "Amigos" : "Privado"}
              </button>
            ))}
          </div>
        </div>

        <Button type="submit" loading={loading} disabled={submitDisabled} className="w-full" size="lg">
          Criar evento
        </Button>
      </form>
    </div>
  );
}
