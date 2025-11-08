import { getBrandById } from "@/lib/actions/brands"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DeleteBrandButton } from "@/components/delete-brand-button"
import { Edit, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"

export const dynamic = "force-dynamic"

export default async function BrandDetailPage({ params }: { params: { id: string } }) {
  const result: any = await getBrandById(params.id)

  if (!result.success || !result.brand) {
    notFound()
  }

  const brand = result.brand
  const topics = result.topics || []
  const platformConstraints = brand.platform_constraints

  return (
    <div className="space-y-8">
      <Link href="/brands">
        <Button variant="ghost" className="border border-white/10 text-[color:var(--text)] hover:bg-white/10">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to brands
        </Button>
      </Link>

      <section className="glass p-6 sm:p-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="space-y-3">
            <p className="text-[11px] uppercase tracking-[0.32em] text-[color:var(--muted)]">Brand profile</p>
            <h1 className="text-3xl font-semibold text-[color:var(--text)]">{brand.name}</h1>
            <p className="max-w-2xl text-sm text-[color:var(--muted)]">{brand.mission}</p>
          </div>
          <div className="flex gap-3">
            <Link href={`/brands/${brand.id}/edit`}>
              <Button className="border border-white/10 bg-white/5 text-[color:var(--text)] hover:bg-white/10">
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
            </Link>
            <DeleteBrandButton brandId={brand.id} brandName={brand.name} />
          </div>
        </div>
      </section>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="p-6">
          <CardHeader className="p-0">
            <CardTitle>Audience & Tone</CardTitle>
          </CardHeader>
          <CardContent className="mt-4 space-y-4 p-0">
            <div>
              <h4 className="text-[10px] uppercase tracking-[0.3em] text-[color:var(--muted)]">Target audience</h4>
              <p className="mt-1 text-sm text-[color:var(--muted)]">{brand.target_audience || "Not specified"}</p>
            </div>
            <div>
              <h4 className="text-[10px] uppercase tracking-[0.3em] text-[color:var(--muted)]">Voice tone</h4>
              <p className="mt-1 text-sm text-[color:var(--muted)]">{brand.voice_tone || "Not specified"}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="p-6">
          <CardHeader className="p-0">
            <CardTitle>Visual Lexicon</CardTitle>
          </CardHeader>
          <CardContent className="mt-4 p-0">
            <div className="flex flex-wrap gap-2">
              {brand.visual_lexicon?.split(", ").map((keyword: string, i: number) => (
                <Badge key={i} className="bg-white/10 text-xs text-[color:var(--text)]/80">
                  {keyword}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="p-6">
          <CardHeader className="p-0">
            <CardTitle>Content Rules</CardTitle>
          </CardHeader>
          <CardContent className="mt-4 grid gap-4 p-0">
            <div>
              <h4 className="text-[10px] uppercase tracking-[0.3em] text-emerald-300/80">Do&apos;s</h4>
              <ul className="mt-2 space-y-1 text-sm text-[color:var(--muted)]">
                {brand.dos?.map((item: string, i: number) => (
                  <li key={i}>• {item}</li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-[10px] uppercase tracking-[0.3em] text-rose-300/80">Don&apos;ts</h4>
              <ul className="mt-2 space-y-1 text-sm text-[color:var(--muted)]">
                {brand.donts?.map((item: string, i: number) => (
                  <li key={i}>• {item}</li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card className="p-6">
          <CardHeader className="p-0">
            <CardTitle>Proof Points & CTAs</CardTitle>
          </CardHeader>
          <CardContent className="mt-4 space-y-5 p-0">
            <div>
              <h4 className="text-[10px] uppercase tracking-[0.3em] text-[color:var(--muted)]">Proof points</h4>
              <div className="mt-2 flex flex-wrap gap-2">
                {brand.proof_points?.map((item: string, i: number) => (
                  <Badge key={i} variant="outline" className="text-xs text-[color:var(--text)]/80">
                    {item}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-[10px] uppercase tracking-[0.3em] text-[color:var(--muted)]">CTAs</h4>
              <div className="mt-2 flex flex-wrap gap-2">
                {brand.cta_library?.map((item: string, i: number) => (
                  <Badge key={i} variant="outline" className="text-xs text-[color:var(--text)]/80">
                    {item}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="p-6">
          <CardHeader className="p-0">
            <CardTitle>Active Platforms</CardTitle>
          </CardHeader>
          <CardContent className="mt-4 p-0">
            <div className="flex flex-wrap gap-2">
              {platformConstraints?.platforms?.tiktok && (
                <Badge className="bg-[color:var(--accent)]/15 text-[color:var(--accent)]">TikTok</Badge>
              )}
              {platformConstraints?.platforms?.instagram && (
                <Badge className="bg-[color:var(--accent)]/15 text-[color:var(--accent)]">Instagram</Badge>
              )}
              {platformConstraints?.platforms?.youtube && (
                <Badge className="bg-[color:var(--accent)]/15 text-[color:var(--accent)]">YouTube</Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="p-6">
          <CardHeader className="p-0">
            <CardTitle>Topic Deck ({topics.length})</CardTitle>
            <CardDescription className="mt-1 text-[color:var(--muted)]">Content topics and weights</CardDescription>
          </CardHeader>
          <CardContent className="mt-4 space-y-3 p-0">
            {topics.map((topic: any) => (
              <div key={topic.id} className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-4 py-3">
                <span className="text-sm text-[color:var(--muted)]">{topic.label}</span>
                <Badge className="bg-white/10 text-[color:var(--text)]/80">Weight: {topic.weight}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
