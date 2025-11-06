"use client"

import { WorkflowStepper } from "@/components/workflow-stepper"

type WorkflowStepperWrapperProps = {
  contentItem: any
  generations: any[]
}

export function WorkflowStepperWrapper({ contentItem, generations }: WorkflowStepperWrapperProps) {
  const handleUpdate = () => {
    window.location.reload()
  }

  return (
    <WorkflowStepper
      contentItem={contentItem}
      generations={generations}
      onUpdate={handleUpdate}
    />
  )
}
