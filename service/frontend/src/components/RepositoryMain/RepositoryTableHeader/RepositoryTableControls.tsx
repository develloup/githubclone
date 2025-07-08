import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function RepositoryTableControls() {
  return (
    <div className="flex items-center space-x-2">
      <Input placeholder="Search…" className="h-8" />
      <Button size="sm">Add File</Button>
      <Button size="sm">Code</Button>
    </div>
  )
}
