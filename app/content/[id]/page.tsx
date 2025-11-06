import { getContentItemById, getGenerationsByContentItem } from "@/lib/actions/generations"
import { WorkflowStepper } from "@/components/workflow-stepper"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { formatDate } from "@/lib/utils"

export const dynamic = "force-dynamic"

export default async function ContentDetailPage({ params }: { params: { id: string } }) {
  const { item } = await getContentItemById(params.id)
  const { generations } = await getGenerationsByContentItem(params.id)

  if (!item) {
    notFound()
  }

  const itemData = item as any
  const brand = itemData.brands

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2 capitalize">
                {itemData.platform} Content
              </h1>
              <p className="text-white/60">
                {brand?.name} • {formatDate(itemData.date_target)}
              </p>
            </div>
          </div>
        </div>

        {/* Content Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="glass">
            <CardHeader>
              <CardTitle className="text-sm">Brand</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-semibold">{brand?.name}</p>
            </CardContent>
          </Card>

          <Card className="glass">
            <CardHeader>
              <CardTitle className="text-sm">Platform</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-semibold capitalize">{itemData.platform}</p>
            </CardContent>
          </Card>

          <Card className="glass">
            <CardHeader>
              <CardTitle className="text-sm">Target Date</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-semibold">{formatDate(itemData.date_target)}</p>
            </CardContent>
          </Card>
        </div>

        {/* Workflow Stepper - Make it client-side */}
        <WorkflowStepperWrapper item={itemData} generations={generations} />
      </div>
    </div>
  )
}

// Client wrapper to handle updates
function WorkflowStepperWrapper({ item, generations }: { item: any; generations: any[] }) {
  "use client"

  const handleUpdate = () => {
    window.location.reload()
  }

  return <WorkflowStepper contentItem={item} generations={generations} onUpdate={handleUpdate} />
}
