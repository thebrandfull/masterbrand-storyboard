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
      <div className="min-h-screen p-8">
        <div className="max-w-3xl mx-auto space-y-6">
          <Card className="glass p-6 space-y-4">
            <h1 className="text-3xl font-bold">Generate content</h1>
            <p className="text-white/60">
              You need at least one brand profile before you can generate prompts. Create a brand to define mission,
              tone, and topics.
            </p>
            <Button asChild>
              <Link href="/brands/new">Create a brand</Link>
            </Button>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <Card className="glass p-6">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold">Generate Content</h1>
            <p className="text-white/60">
              Pick a brand, topic, platform, and target date—then let the brain spin up ready-to-execute prompts.
            </p>
          </div>
        </Card>

        <ContentGenerator brands={brands || []} />
      </div>
    </div>
  )
}
