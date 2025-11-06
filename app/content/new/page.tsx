import { getBrands } from "@/lib/actions/brands"
import { Card } from "@/components/ui/card"
import ContentGenerator from "@/components/content-generator"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export const dynamic = "force-dynamic"

export default async function NewContentPage() {
  const { brands } = await getBrands()
  const hasBrands = Array.isArray(brands) && brands.length > 0

  if (!hasBrands) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <Card className="w-full max-w-3xl space-y-4 p-10 text-center">
          <h1 className="text-3xl font-semibold">Generate content</h1>
          <p className="text-white/70">
            You need at least one brand profile before you can generate prompts. Create a brand to define mission, tone,
            and topics.
          </p>
          <Button asChild className="rounded-full bg-[#ff2a2a] text-white hover:bg-[#ff2a2a]/90">
            <Link href="/brands/new">Create a brand</Link>
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="hero-panel p-6 sm:p-10">
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.4em] text-white/50">Generator</p>
          <h1 className="text-4xl font-semibold">Spin up a new content drop</h1>
          <p className="text-white/70">
            Pick a brand, topic, platform, and target date—then let the brain spin up ready-to-execute prompts.
          </p>
        </div>
      </Card>

      <ContentGenerator brands={brands || []} />
    </div>
  )
}
