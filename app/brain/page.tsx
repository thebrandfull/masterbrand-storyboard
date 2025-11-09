import { getBrands } from "@/lib/actions/brands"
import BrandChat from "@/components/brand-chat"
import { LuminousPanel } from "@/components/ui/luminous-panel"

export const dynamic = "force-dynamic"

export default async function BrandBrainPage() {
  const { brands } = await getBrands()

  return (
    <div className="space-y-8">
      <LuminousPanel className="p-6 sm:p-10">
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.4em] text-white/50">Brand Brain</p>
          <h1 className="text-4xl font-semibold text-white">Talk to your playbook</h1>
          <p className="text-white/70">
            Ask strategy questions, generate prompts, and turn replies into action without leaving the studio.
          </p>
        </div>
      </LuminousPanel>

      <BrandChat brands={brands || []} />
    </div>
  )
}
