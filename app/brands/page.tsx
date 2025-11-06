import Link from "next/link"
import { getBrands } from "@/lib/actions/brands"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Layers } from "lucide-react"
import { formatDate } from "@/lib/utils"

export const dynamic = "force-dynamic"

export default async function BrandsPage() {
  const { brands } = await getBrands()

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Brands</h1>
            <p className="text-white/60">Manage your brand profiles</p>
          </div>
          <Link href="/brands/new">
            <Button size="lg">
              <Plus className="h-5 w-5 mr-2" />
              New Brand
            </Button>
          </Link>
        </div>

        {brands.length === 0 ? (
          <Card className="glass text-center py-16">
            <div className="flex flex-col items-center gap-4">
              <div className="rounded-full bg-primary/20 p-6">
                <Layers className="h-12 w-12 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">No brands yet</h3>
                <p className="text-white/60 mb-6">
                  Create your first brand to start generating content
                </p>
                <Link href="/brands/new">
                  <Button size="lg">
                    <Plus className="h-5 w-5 mr-2" />
                    Create First Brand
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {brands.map((brand: any) => (
              <Link key={brand.id} href={`/brands/${brand.id}`}>
                <Card className="glass glass-hover cursor-pointer h-full">
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="rounded-lg bg-primary/20 p-2">
                        <Layers className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle>{brand.name}</CardTitle>
                        <CardDescription className="text-xs text-white/40">
                          Created {formatDate(brand.created_at)}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-white/60 line-clamp-3">
                      {brand.mission || "No mission statement"}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {brand.dos?.slice(0, 2).map((item: string, i: number) => (
                        <span
                          key={i}
                          className="text-xs px-2 py-1 rounded glass border border-white/10"
                        >
                          {item}
                        </span>
                      ))}
                      {brand.dos && brand.dos.length > 2 && (
                        <span className="text-xs px-2 py-1 rounded glass border border-white/10">
                          +{brand.dos.length - 2} more
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
    </div>
  )
}
