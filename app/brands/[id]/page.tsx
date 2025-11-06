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
    <div className="min-h-screen p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/brands">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Brands
            </Button>
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">{brand.name}</h1>
              <p className="text-white/60">{brand.mission}</p>
            </div>
            <div className="flex gap-3">
              <Link href={`/brands/${brand.id}/edit`}>
                <Button>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </Link>
              <DeleteBrandButton brandId={brand.id} brandName={brand.name} />
            </div>
          </div>
        </div>

        {/* Brand Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Audience & Tone */}
          <Card className="glass">
            <CardHeader>
              <CardTitle>Audience & Tone</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="text-sm font-semibold text-white/60 mb-2">Target Audience</h4>
                <p className="text-sm">{brand.target_audience || "Not specified"}</p>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white/60 mb-2">Voice Tone</h4>
                <p className="text-sm">{brand.voice_tone || "Not specified"}</p>
              </div>
            </CardContent>
          </Card>

          {/* Visual Lexicon */}
          <Card className="glass">
            <CardHeader>
              <CardTitle>Visual Lexicon</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {brand.visual_lexicon?.split(", ").map((keyword: string, i: number) => (
                  <Badge key={i} variant="secondary" className="glass">
                    {keyword}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Content Rules */}
          <Card className="glass">
            <CardHeader>
              <CardTitle>Content Rules</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="text-sm font-semibold text-green-400 mb-2">Do's</h4>
                <ul className="space-y-1">
                  {brand.dos?.map((item: string, i: number) => (
                    <li key={i} className="text-sm text-white/60">• {item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-red-400 mb-2">Don'ts</h4>
                <ul className="space-y-1">
                  {brand.donts?.map((item: string, i: number) => (
                    <li key={i} className="text-sm text-white/60">• {item}</li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Proof Points & CTAs */}
          <Card className="glass">
            <CardHeader>
              <CardTitle>Proof Points & CTAs</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="text-sm font-semibold text-white/60 mb-2">Proof Points</h4>
                <div className="flex flex-wrap gap-2">
                  {brand.proof_points?.map((item: string, i: number) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      {item}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white/60 mb-2">CTAs</h4>
                <div className="flex flex-wrap gap-2">
                  {brand.cta_library?.map((item: string, i: number) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      {item}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Platforms */}
          <Card className="glass">
            <CardHeader>
              <CardTitle>Active Platforms</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {platformConstraints?.platforms?.tiktok && (
                  <Badge className="bg-primary/20 text-primary">TikTok</Badge>
                )}
                {platformConstraints?.platforms?.instagram && (
                  <Badge className="bg-primary/20 text-primary">Instagram</Badge>
                )}
                {platformConstraints?.platforms?.youtube && (
                  <Badge className="bg-primary/20 text-primary">YouTube</Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Topics */}
          <Card className="glass">
            <CardHeader>
              <CardTitle>Topic Deck ({topics.length})</CardTitle>
              <CardDescription>Content topics and weights</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topics.map((topic: any) => (
                  <div key={topic.id} className="flex items-center justify-between">
                    <span className="text-sm">{topic.label}</span>
                    <Badge variant="secondary" className="glass">
                      Weight: {topic.weight}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
