import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { getBrands } from "@/lib/actions/brands"
import { supabase } from "@/lib/supabase"
import { cn, formatDate, getStatusColor } from "@/lib/utils"
import type { Database } from "@/types/database"
import { Plus, ArrowUpRight } from "lucide-react"
import { ContentBrandFilter } from "@/components/content-brand-filter"

type Brand = Database["public"]["Tables"]["brands"]["Row"]
type ContentItem = Database["public"]["Tables"]["content_items"]["Row"] & {
  brands: Pick<Brand, "id" | "name"> | null
  generations: {
    prompt_text: string
    model_params: Database["public"]["Tables"]["generations"]["Row"]["model_params"]
    created_at: string
  }[] | null
}

const STATUS_PIPELINE = [
  { key: "idea", label: "Idea" },
  { key: "prompted", label: "Prompted" },
  { key: "generated", label: "Generated" },
  { key: "enhanced", label: "Enhanced" },
  { key: "qc", label: "QC" },
  { key: "scheduled", label: "Scheduled" },
  { key: "published", label: "Published" },
] as const

export const dynamic = "force-dynamic"

interface ContentPageProps {
  searchParams?: {
    brand?: string
  }
}

export default async function ContentPage({ searchParams }: ContentPageProps) {
  const { brands } = await getBrands()
  const brandList = Array.isArray(brands) ? (brands as Brand[]) : []

  if (brandList.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6 text-center">
        <Card className="w-full max-w-xl space-y-4 p-10">
          <p className="text-xs uppercase tracking-[0.4em] text-white/50">Content hub</p>
          <h1 className="text-3xl font-semibold">Add a brand to start shipping</h1>
          <p className="text-white/70">
            Once a brand exists, every piece of content will flow through this pipeline—from idea to publish.
          </p>
          <Button asChild className="rounded-full bg-[#ff2a2a] hover:bg-[#ff2a2a]/90">
            <Link href="/brands">Create a brand</Link>
          </Button>
        </Card>
      </div>
    )
  }

  const activeBrandId = searchParams?.brand || brandList[0].id
  const items = await fetchContentItems(activeBrandId)
  const statusSummary = STATUS_PIPELINE.map((stage) => ({
    ...stage,
    total: items.filter((item) => item.status === stage.key).length,
  }))

  return (
    <div className="space-y-10">
      <section className="hero-panel p-6 sm:p-10">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-white/50">Content hub</p>
            <h1 className="text-4xl font-semibold">Every piece, every stage</h1>
            <p className="mt-2 text-white/70">
              Track content for {brandList.find((brand) => brand.id === activeBrandId)?.name || "your brand"} from idea
              to publish.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <ContentBrandFilter brands={brandList} activeBrandId={activeBrandId} />
            <Button asChild className="rounded-full bg-[#ff2a2a] hover:bg-[#ff2a2a]/90">
              <Link href="/content/new">
                <Plus className="mr-2 h-4 w-4" />
                New content
              </Link>
            </Button>
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statusSummary.map((stage) => (
            <div key={stage.key} className="rounded-2xl border border-white/10 bg-black/30 px-4 py-5">
              <p className="text-xs uppercase tracking-[0.4em] text-white/40">{stage.label}</p>
              <p className="mt-2 text-3xl font-semibold">{stage.total}</p>
            </div>
          ))}
        </div>
      </section>

      <Card className="p-6 sm:p-8">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-white">Upcoming content</h2>
            <p className="text-sm text-white/60">
              Showing the next {items.length} items for{" "}
              {brandList.find((brand) => brand.id === activeBrandId)?.name || "selected brand"}.
            </p>
          </div>
          <Button variant="ghost" asChild className="rounded-full border border-white/10 text-white hover:bg-white/5">
            <Link href={`/calendar?brand=${activeBrandId}`}>
              Calendar sync
              <ArrowUpRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>

        {items.length === 0 ? (
          <div className="mt-8 rounded-3xl border border-dashed border-white/15 p-10 text-center text-white/60">
            No content yet for this brand. Generate your first piece.
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex flex-col gap-4 rounded-3xl border border-white/5 bg-black/20 px-5 py-4 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <p className="text-xs uppercase tracking-[0.4em] text-white/40">{formatDate(item.date_target)}</p>
                  <h3 className="mt-2 text-lg font-semibold text-white">{deriveTopic(item)}</h3>
                  <p className="text-sm text-white/60">
                    {item.brands?.name || "Unknown brand"} • {item.platform}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className={cn("capitalize", getStatusColor(item.status))}>
                    {item.status}
                  </Badge>
                  <Button variant="secondary" asChild size="sm" className="rounded-full border border-white/10">
                    <Link href={`/content/${item.id}`}>Open</Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}

async function fetchContentItems(brandId: string): Promise<ContentItem[]> {
  const { data, error } = await supabase
    .from("content_items")
    .select("*, brands(id, name), generations(prompt_text, model_params, created_at)")
    .eq("brand_id", brandId)
    .order("date_target", { ascending: true })
    .limit(30)
    .order("created_at", { referencedTable: "generations", ascending: false })

  if (error) {
    console.error("Failed to load content items", error.message)
    return []
  }

  return (data as ContentItem[] | null) ?? []
}

function deriveTopic(item: ContentItem): string {
  if (item.notes && item.notes.trim()) {
    return item.notes.trim()
  }

  const firstGeneration = item.generations?.[0]
  const params = (firstGeneration?.model_params as Record<string, unknown> | null) ?? null
  if (params && typeof params["topic"] === "string") {
    const inferredTopic = (params["topic"] as string).trim()
    if (inferredTopic) {
      return inferredTopic
    }
  }

  if (firstGeneration?.prompt_text) {
    return firstGeneration.prompt_text.slice(0, 120)
  }

  return "Untitled concept"
}
