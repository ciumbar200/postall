import { BrandAgentStudio } from "@/components/agent/brand-agent-studio"
import { BrandProfileForm } from "@/components/brand/brand-profile-form"

export default function AgentPage() {
  return (
    <div className="space-y-8">
      <BrandAgentStudio />
      <BrandProfileForm />
    </div>
  )
}
