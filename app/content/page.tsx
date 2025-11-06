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
      <div className="min-h-screen p-8 flex flex-col items-center justify-center text-center space-y-4">
        <h1 className="text-3xl font-bold">Content hub</h1>
        <p className="text-white/60 max-w-lg">
          Add your first brand to start generating content. Once a brand exists, this hub will track every piece of
          content across the workflow.
        </p>
        <Button asChild>
          <Link href="/brands">Create a brand</Link>
        </Button>
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
    <div className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Content hub</h1>
            <p className="text-white/60">Track every piece of content from idea to publish for this brand.</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <ContentBrandFilter brands={brandList} activeBrandId={activeBrandId} />
            <Button asChild>
              <Link href="/content/new">
                <Plus className="h-4 w-4 mr-2" />
                New content
              </Link>
            </Button>
          </div>
        </div>

        <Card className="glass p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {statusSummary.map((stage) => (
              <div key={stage.key} className="glass rounded-xl border border-white/10 p-4">
                <p className="text-xs text-white/50 uppercase tracking-wide">{stage.label}</p>
                <p className="text-2xl font-semibold">{stage.total}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="glass p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold">Upcoming content</h2>
              <p className="text-white/60 text-sm">
                Showing the next {items.length} items for{" "}
                {brandList.find((brand) => brand.id === activeBrandId)?.name || "selected brand"}.
              </p>
            </div>
            <Button variant="ghost" asChild>
              <Link href={`/calendar?brand=${activeBrandId}`}>
                View calendar
                <ArrowUpRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </div>

          {items.length === 0 ? (
            <div className="border border-dashed border-white/10 rounded-xl p-8 text-center text-white/60">
              No content yet for this brand. Generate your first piece.
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="glass rounded-xl border border-white/5 px-5 py-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <p className="text-xs uppercase tracking-wide text-white/40">{formatDate(item.date_target)}</p>
                    <h3 className="text-lg font-semibold mt-1">{deriveTopic(item)}</h3>
                    <p className="text-sm text-white/60">
                      {item.brands?.name || "Unknown brand"} • {item.platform}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className={cn("capitalize", getStatusColor(item.status))}>
                      {item.status}
                    </Badge>
                    <Button variant="secondary" asChild size="sm">
                      <Link href={`/content/${item.id}`}>Open</Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
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
