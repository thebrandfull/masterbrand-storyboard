import { getBrands } from "@/lib/actions/brands"
import { Card } from "@/components/ui/card"
import BrandChat from "@/components/brand-chat"

export const dynamic = "force-dynamic"

export default async function BrandBrainPage() {
  const { brands } = await getBrands()

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <Card className="glass p-6">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold">Brand Chat</h1>
            <p className="text-white/60">
              Talk to your brand brain, get instant answers, and convert replies into actions.
            </p>
          </div>
        </Card>

        <BrandChat brands={brands || []} />
      </div>
    </div>
  )
}
