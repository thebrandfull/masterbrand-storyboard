import { getContentItemById, getGenerationsByContentItem } from "@/lib/actions/generations"
import { WorkflowStepperWrapper } from "@/components/workflow-stepper-wrapper"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { formatDate, getStatusColor } from "@/lib/utils"
import { WORKFLOW_STAGES, getStageMeta } from "@/lib/constants/workflow"

export const dynamic = "force-dynamic"

export default async function ContentDetailPage({ params }: { params: { id: string } }) {
  const { item } = await getContentItemById(params.id)
  const { generations } = await getGenerationsByContentItem(params.id)

  if (!item) {
    notFound()
  }

  const itemData = item as any
  const brand = itemData.brands
  const stageMeta = getStageMeta(itemData.status)
  const stageIndex = WORKFLOW_STAGES.findIndex((stage) => stage.key === stageMeta.key)
  const upcomingStage = WORKFLOW_STAGES[stageIndex + 1]

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white">
      <div className="mx-auto max-w-6xl space-y-10 px-4 py-10 sm:px-6 lg:px-0">
        <Link href="/">
          <Button
            variant="ghost"
            className="mb-6 flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 text-white shadow-lg shadow-black/40 hover:bg-white/10"
          >
            <ArrowLeft className="h-4 w-4" /> Back to dashboard
          </Button>
        </Link>

        <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-[#1d1d1d] via-[#121212] to-[#050505] p-6 sm:p-10 shadow-[0_40px_120px_rgba(0,0,0,0.6)]">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_320px]">
            <div className="space-y-6">
              <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-white/10 bg-black/50">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#2a2a2a,transparent),linear-gradient(135deg,#1a1a1a,transparent)]" />
                <div className="absolute inset-0 flex flex-col justify-between p-5">
                  <div className="flex items-center gap-2 text-sm text-white/70">
                    <span className="inline-flex h-2 w-2 animate-pulse rounded-full bg-[#ff2a2a]" />
                    {itemData.platform} preview
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.4em] text-white/50">Brand</p>
                    <p className="text-2xl font-semibold capitalize">{brand?.name ?? "Unassigned"}</p>
                  </div>
                </div>
              </div>

              <div>
                <h1 className="text-3xl font-bold capitalize sm:text-4xl">{itemData.platform} content</h1>
                <p className="mt-3 text-white/70">{brand?.name} • {formatDate(itemData.date_target)}</p>
              </div>

              <div className="flex flex-wrap gap-3 text-sm text-white/70">
                <Badge className="border-0 bg-[#ff2a2a] text-white">{itemData.platform}</Badge>
                <Badge variant="outline" className="border-white/20 text-white/70">
                  {brand?.name ?? "No brand"}
                </Badge>
                <span className="text-white/60">Target {formatDate(itemData.date_target)}</span>
              </div>
            </div>

            <div className="space-y-4 rounded-2xl border border-white/10 bg-[#111111]/80 p-5">
              <div>
                <p className="text-xs uppercase tracking-[0.4em] text-white/50">Status</p>
                <div className="mt-3 flex items-center justify-between">
                  <div>
                    <p className="text-lg font-semibold">{stageMeta.label}</p>
                    <p className="text-sm text-white/60">{stageMeta.description}</p>
                  </div>
                  <Badge className={`${getStatusColor(itemData.status)} border-0`}>{stageMeta.label}</Badge>
                </div>
              </div>

              <div className="rounded-2xl border border-white/5 bg-black/30 p-4 text-sm text-white/70">
                <p className="text-xs uppercase tracking-[0.4em] text-white/50">Upcoming</p>
                <p className="mt-2 font-semibold">
                  {upcomingStage ? upcomingStage.label : "All stages complete"}
                </p>
                <p className="text-white/60">
                  {upcomingStage
                    ? upcomingStage.description
                    : "This campaign is fully published and ready for performance tracking."}
                </p>
              </div>

              <div className="rounded-2xl border border-white/5 bg-black/40 p-4 text-sm text-white/70">
                <p className="font-semibold text-white">Launch window</p>
                <p className="text-white/60">{formatDate(itemData.date_target)}</p>
                <p className="text-xs text-white/40">Use the workflow below to keep every edit, note, and attachment aligned.</p>
              </div>
            </div>
          </div>
        </section>

        <WorkflowStepperWrapper contentItem={itemData} generations={generations} />
      </div>
    </div>
  )
}
