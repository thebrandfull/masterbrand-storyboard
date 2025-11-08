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
          <h1 className="text-3xl font-semibold text-[color:var(--text)]">Generate content</h1>
          <p className="text-sm text-[color:var(--muted)]">
            You need at least one brand profile before you can generate prompts. Create a brand to define mission, tone,
            and topics.
          </p>
          <Button asChild className="bg-[color:var(--accent)] text-white hover:bg-[color:var(--accent)]/90">
            <Link href="/brands/new">Create a brand</Link>
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="glass p-6 sm:p-8">
        <div className="space-y-3">
          <p className="text-[11px] uppercase tracking-[0.32em] text-[color:var(--muted)]">Generator</p>
          <h1 className="text-3xl font-semibold text-[color:var(--text)]">Spin up a new content drop</h1>
          <p className="text-sm text-[color:var(--muted)]">
            Pick a brand, topic, platform, and target date—then let the brain spin up ready-to-execute prompts.
          </p>
        </div>
      </Card>

      <ContentGenerator brands={brands || []} />
    </div>
  )
}
