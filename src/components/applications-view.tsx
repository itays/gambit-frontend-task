import { Boxes } from "lucide-react"
import { useId } from "react"

import { ApplicationGraph } from "@/components/application-graph"
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
  const headingId = useId()

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
  const membersOf = (application: Application) =>
    application.resourceIds.flatMap((id) => resourcesById.get(id) ?? [])
  const selected =
    applications.find(({ id }) => id === selectedApplicationId) ??
    applications[0]

  return (
    <div className="grid items-start gap-6 md:grid-cols-[20rem_minmax(0,1fr)]">
      <ul aria-label="Applications" className="flex flex-col gap-2">
        {applications.map((application) => {
          const members = membersOf(application)
          const criticality = highestCriticality(members)
          const isSelected = application.id === selected.id
          return (
            <li key={application.id}>
              <Item
                render={<button type="button" />}
                variant="outline"
                size="sm"
                aria-current={isSelected || undefined}
                className={cn(
                  "hover:bg-muted/50 cursor-pointer text-left",
                  isSelected && "border-primary bg-primary/5 hover:bg-primary/5"
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
                <ItemFooter className="flex-wrap justify-start">
                  <span className="text-muted-foreground mr-auto text-xs">
                    {members.length}{" "}
                    {members.length === 1 ? "Resource" : "Resources"}
                  </span>
                  {criticality && (
                    <CriticalityBadge criticality={criticality} />
                  )}
                  {providersOf(members).map((provider) => (
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
      <section aria-labelledby={headingId} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2 id={headingId} className="text-lg font-semibold">
            {selected.name}
          </h2>
          {selected.description && (
            <p className="text-muted-foreground text-sm">
              {selected.description}
            </p>
          )}
        </div>
        <ApplicationGraph
          key={selected.id}
          application={selected}
          members={membersOf(selected)}
        />
      </section>
    </div>
  )
}
