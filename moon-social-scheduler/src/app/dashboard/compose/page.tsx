import { ComposerWorkspace } from "@/components/composer/composer-workspace"
import { CaptionAssistant } from "@/components/composer/caption-assistant"
import { QuickStart } from "@/components/onboarding/quick-start"

export default function ComposePage() {
  return (
    <div className="flex flex-col gap-6">
      <QuickStart />
      <CaptionAssistant />
      <ComposerWorkspace />
    </div>
  )
}
