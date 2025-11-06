import { getBrands } from "@/lib/actions/brands"
import { Card } from "@/components/ui/card"
import BrandChat from "@/components/brand-chat"

export const dynamic = "force-dynamic"

export default async function BrandBrainPage() {
  const { brands } = await getBrands()

  return (
    <div className="space-y-8">
      <Card className="hero-panel p-6 sm:p-10">
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.4em] text-white/50">Brand Brain</p>
          <h1 className="text-4xl font-semibold text-white">Talk to your playbook</h1>
          <p className="text-white/70">
            Ask strategy questions, generate prompts, and turn replies into action without leaving the studio.
          </p>
        </div>
      </Card>

      <BrandChat brands={brands || []} />
    </div>
  )
}
