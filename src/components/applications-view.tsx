import { Boxes } from "lucide-react"

import { CriticalityBadge } from "@/components/criticality-badge"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemFooter,
  ItemTitle,
} from "@/components/ui/item"
import {
  type Application,
  highestCriticality,
  providersOf,
  type Resource,
} from "@/domain"
import { cn } from "@/lib/utils"

export function ApplicationsView({
  applications,
  resources,
  selectedApplicationId,
  onSelectApplication,
  onBrowseResources,
}: {
  applications: readonly Application[]
  resources: readonly Resource[]
  selectedApplicationId: string | undefined
  onSelectApplication: (id: string) => void
  onBrowseResources: () => void
}) {
  if (applications.length === 0) {
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

  const resourcesById = new Map(
    resources.map((resource) => [resource.id, resource])
  )
  const selectedId = selectedApplicationId ?? applications[0].id

  return (
    <ul aria-label="Applications" className="flex max-w-md flex-col gap-2">
      {applications.map((application) => {
        const applicationResources = application.resourceIds.flatMap(
          (id) => resourcesById.get(id) ?? []
        )
        const criticality = highestCriticality(applicationResources)
        const selected = application.id === selectedId
        return (
          <li key={application.id}>
            <Item
              render={<button type="button" />}
              variant="outline"
              size="sm"
              aria-current={selected || undefined}
              className={cn(
                "hover:bg-muted/50 cursor-pointer text-left",
                selected && "border-primary bg-primary/5 hover:bg-primary/5"
              )}
              onClick={() => onSelectApplication(application.id)}
            >
              <ItemContent className="min-w-0">
                <ItemTitle>{application.name}</ItemTitle>
                {application.description && (
                  <ItemDescription className="line-clamp-1">
                    {application.description}
                  </ItemDescription>
                )}
              </ItemContent>
              <ItemFooter className="justify-start">
                <span className="text-muted-foreground mr-auto text-xs">
                  {applicationResources.length}{" "}
                  {applicationResources.length === 1 ? "Resource" : "Resources"}
                </span>
                {criticality && <CriticalityBadge criticality={criticality} />}
                {providersOf(applicationResources).map((provider) => (
                  <Badge key={provider} variant="secondary">
                    {provider}
                  </Badge>
                ))}
              </ItemFooter>
            </Item>
          </li>
        )
      })}
    </ul>
  )
}
