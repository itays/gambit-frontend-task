import { Boxes } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

export function ApplicationsView({
  onBrowseResources,
}: {
  onBrowseResources: () => void
}) {
  return (
    <Empty className="border">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Boxes />
        </EmptyMedia>
        <EmptyTitle>No applications yet</EmptyTitle>
        <EmptyDescription>
          Select Resources in the inventory and group them into an Application
          to see the business function they deliver.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button onClick={onBrowseResources}>Go to Resources</Button>
      </EmptyContent>
    </Empty>
  )
}
