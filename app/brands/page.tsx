import Link from "next/link"
import { getBrands } from "@/lib/actions/brands"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card"
import { Plus, Layers } from "lucide-react"
import { formatDate } from "@/lib/utils"

export const dynamic = "force-dynamic"

export default async function BrandsPage() {
  const { brands } = await getBrands()

  return (
    <div className="space-y-10">
      <section className="hero-panel p-6 sm:p-10">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-white/50">Brand system</p>
            <h1 className="text-4xl font-semibold">Your libraries & guardrails</h1>
            <p className="mt-2 text-white/70">Tune missions, tones, and topic decks for every brand you manage.</p>
          </div>
          <Link href="/brands/new">
            <Button size="lg" className="rounded-full bg-[#ff2a2a] text-white hover:bg-[#ff2a2a]/90">
              <Plus className="mr-2 h-5 w-5" />
              New Brand
            </Button>
          </Link>
        </div>
      </section>

      {brands.length === 0 ? (
        <Card className="text-center">
          <div className="flex flex-col items-center gap-4 py-16">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <Layers className="h-12 w-12 text-[#ff2a2a]" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-semibold">No brands yet</h3>
              <p className="text-white/70">Create your first brand to start generating content.</p>
            </div>
            <Link href="/brands/new">
              <Button size="lg" className="rounded-full bg-[#ff2a2a] text-white hover:bg-[#ff2a2a]/90">
                <Plus className="mr-2 h-5 w-5" />
                Create First Brand
              </Button>
            </Link>
          </div>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {brands.map((brand: any) => (
            <Link key={brand.id} href={`/brands/${brand.id}`}>
              <Card className="h-full cursor-pointer border-white/10 bg-[#111111]/70 p-6 transition hover:-translate-y-1 hover:border-[#ff2a2a]/40">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                    <Layers className="h-5 w-5 text-[#ff2a2a]" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">{brand.name}</CardTitle>
                    <CardDescription className="text-xs text-white/40">
                      Created {formatDate(brand.created_at)}
                    </CardDescription>
                  </div>
                </div>
                <CardContent className="mt-4 space-y-3 p-0">
                  <p className="text-sm text-white/70 line-clamp-3">
                    {brand.mission || "No mission statement"}
                  </p>
                  <div className="flex flex-wrap gap-2 text-xs text-white/60">
                    {brand.dos?.slice(0, 3).map((item: string, i: number) => (
                      <span key={i} className="rounded-full border border-white/10 px-3 py-1">
                        {item}
                      </span>
                    ))}
                    {brand.dos && brand.dos.length > 3 && (
                      <span className="rounded-full border border-white/10 px-3 py-1">
                        +{brand.dos.length - 3} more
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
