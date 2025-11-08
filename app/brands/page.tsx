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
    <div className="space-y-8">
      <section className="glass p-6 sm:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <p className="text-[11px] uppercase tracking-[0.32em] text-[color:var(--muted)]">Brand system</p>
            <h1 className="text-3xl font-semibold text-[color:var(--text)]">Your libraries & guardrails</h1>
            <p className="text-sm text-[color:var(--muted)]">Tune missions, tones, and topic decks for every brand you manage.</p>
          </div>
          <Link href="/brands/new">
            <Button size="lg" className="bg-[color:var(--accent)] text-white hover:bg-[color:var(--accent)]/90">
              <Plus className="mr-2 h-4 w-4" />
              New brand
            </Button>
          </Link>
        </div>
      </section>

      {brands.length === 0 ? (
        <Card className="text-center">
          <div className="flex flex-col items-center gap-5 py-12">
            <div className="glass flex h-14 w-14 items-center justify-center">
              <Layers className="h-8 w-8 text-[color:var(--accent)]" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-[color:var(--text)]">No brands yet</h3>
              <p className="text-sm text-[color:var(--muted)]">Create your first brand to start generating content.</p>
            </div>
            <Link href="/brands/new">
              <Button size="lg" className="bg-[color:var(--accent)] text-white hover:bg-[color:var(--accent)]/90">
                <Plus className="mr-2 h-4 w-4" />
                Create first brand
              </Button>
            </Link>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {brands.map((brand: any) => (
            <Link key={brand.id} href={`/brands/${brand.id}`}>
              <Card className="h-full cursor-pointer p-5 transition hover:bg-white/12">
                <div className="flex items-center gap-3">
                  <div className="glass flex h-9 w-9 items-center justify-center">
                    <Layers className="h-4 w-4 text-[color:var(--accent)]" />
                  </div>
                  <div>
                    <CardTitle className="text-lg text-[color:var(--text)]">{brand.name}</CardTitle>
                    <CardDescription className="text-xs text-[color:var(--muted)]">
                      Created {formatDate(brand.created_at)}
                    </CardDescription>
                  </div>
                </div>
                <CardContent className="mt-3 space-y-3 p-0">
                  <p className="text-sm text-[color:var(--muted)] line-clamp-3">
                    {brand.mission || "No mission statement"}
                  </p>
                  <div className="flex flex-wrap gap-2 text-xs text-[color:var(--muted)]">
                    {brand.dos?.slice(0, 3).map((item: string, i: number) => (
                      <span key={i} className="glass px-2.5 py-1">
                        {item}
                      </span>
                    ))}
                    {brand.dos && brand.dos.length > 3 && (
                      <span className="glass px-2.5 py-1">
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
