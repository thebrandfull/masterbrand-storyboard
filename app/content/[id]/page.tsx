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
    <div className="space-y-8">
      <Link href="/">
        <Button
          variant="ghost"
          className="flex items-center gap-2 border border-white/10 text-[color:var(--text)] hover:bg-white/10"
        >
          <ArrowLeft className="h-4 w-4" /> Back to dashboard
        </Button>
      </Link>

      <section className="glass p-6 sm:p-8">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_320px]">
          <div className="space-y-6">
            <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-white/10 bg-black/30">
              <div className="absolute inset-0 flex flex-col justify-between p-5">
                <div className="flex items-center gap-2 text-sm text-[color:var(--muted)]">
                  <span className="inline-flex h-2 w-2 animate-pulse rounded-lg bg-[color:var(--accent)]" />
                  {itemData.platform} preview
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.32em] text-[color:var(--muted)]">Brand</p>
                  <p className="text-2xl font-semibold capitalize text-[color:var(--text)]">{brand?.name ?? "Unassigned"}</p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h1 className="text-3xl font-semibold capitalize text-[color:var(--text)] sm:text-4xl">{itemData.platform} content</h1>
              <p className="text-sm text-[color:var(--muted)]">{brand?.name} • {formatDate(itemData.date_target)}</p>
            </div>

            <div className="flex flex-wrap gap-3 text-sm text-[color:var(--muted)]">
              <Badge className="border-0 bg-[color:var(--accent)] text-white">{itemData.platform}</Badge>
              <Badge variant="outline" className="border-white/15 text-[color:var(--text)]/80">
                {brand?.name ?? "No brand"}
              </Badge>
              <span>Target {formatDate(itemData.date_target)}</span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="glass p-4">
              <p className="text-[10px] uppercase tracking-[0.32em] text-[color:var(--muted)]">Status</p>
              <div className="mt-3 flex items-center justify-between">
                <div>
                  <p className="text-lg font-semibold text-[color:var(--text)]">{stageMeta.label}</p>
                  <p className="text-sm text-[color:var(--muted)]">{stageMeta.description}</p>
                </div>
                <Badge className={`${getStatusColor(itemData.status)} border-0`}>{stageMeta.label}</Badge>
              </div>
            </div>

            <div className="glass p-4 text-sm text-[color:var(--muted)]">
              <p className="text-[10px] uppercase tracking-[0.32em]">Upcoming</p>
              <p className="mt-2 font-semibold text-[color:var(--text)]">
                {upcomingStage ? upcomingStage.label : "All stages complete"}
              </p>
              <p>
                {upcomingStage
                  ? upcomingStage.description
                  : "This campaign is fully published and ready for performance tracking."}
              </p>
            </div>

            <div className="glass p-4 text-sm text-[color:var(--muted)]">
              <p className="font-semibold text-[color:var(--text)]">Launch window</p>
              <p>{formatDate(itemData.date_target)}</p>
              <p className="text-xs text-[color:var(--muted)]/80">
                Use the workflow below to keep every edit, note, and attachment aligned.
              </p>
            </div>
          </div>
        </div>
      </section>

      <WorkflowStepperWrapper contentItem={itemData} generations={generations} />
    </div>
  )
}
