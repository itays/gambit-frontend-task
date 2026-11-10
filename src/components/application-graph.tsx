import {
  Background,
  BackgroundVariant,
  Controls,
  Handle,
  type NodeProps,
  type NodeTypes,
  Position,
  ReactFlow,
} from "@xyflow/react"
import { Boxes } from "lucide-react"
import type { CSSProperties } from "react"

import { CriticalityBadge } from "@/components/criticality-badge"
import { Badge } from "@/components/ui/badge"
import type { Application, Criticality, Resource } from "@/domain"
import {
  type ApplicationNode,
  applicationGraph,
  RESOURCE_NODE_WIDTH,
  type ResourceNode,
} from "@/lib/application-graph"
import { cn } from "@/lib/utils"

const CRITICALITY_BORDER: Record<Criticality, string> = {
  critical: "border-red-500/70",
  high: "border-orange-500/70",
  medium: "border-amber-500/70",
  low: "border-sky-500/70",
}

// Edges run center to center, so both ends anchor on an invisible handle at the node's middle.
const CENTER_HANDLE: CSSProperties = {
  top: "50%",
  opacity: 0,
  pointerEvents: "none",
}

function ApplicationNodeView({ data, selected }: NodeProps<ApplicationNode>) {
  return (
    <div
      className={cn(
        "bg-primary text-primary-foreground flex max-w-56 items-center gap-2 rounded-xl px-4 py-3 shadow-md",
        selected && "ring-ring ring-offset-background ring-2 ring-offset-2"
      )}
    >
      <Boxes className="size-5 shrink-0" aria-hidden />
      <span className="truncate font-semibold">{data.application.name}</span>
      <Handle
        type="source"
        position={Position.Top}
        isConnectable={false}
        style={CENTER_HANDLE}
      />
    </div>
  )
}

function ResourceNodeView({ data, selected }: NodeProps<ResourceNode>) {
  const { resource } = data
  return (
    <div
      style={{ width: RESOURCE_NODE_WIDTH }}
      className={cn(
        "bg-card text-card-foreground flex flex-col gap-2 rounded-lg border-2 p-3 text-xs shadow-sm",
        CRITICALITY_BORDER[resource.criticality],
        selected && "ring-ring ring-2"
      )}
    >
      <div className="min-w-0">
        <p className="truncate text-sm font-medium" title={resource.name}>
          {resource.name}
        </p>
        <p className="text-muted-foreground">{resource.type}</p>
      </div>
      <div className="flex gap-1">
        <CriticalityBadge criticality={resource.criticality} />
        <Badge variant="secondary">{resource.provider}</Badge>
      </div>
      <dl className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-0.5">
        <dt className="text-muted-foreground">Region</dt>
        <dd>{resource.region}</dd>
        <dt className="text-muted-foreground">Owner</dt>
        <dd>{resource.owner}</dd>
      </dl>
      {resource.tags.length > 0 && (
        <ul aria-label="Tags" className="flex flex-wrap gap-1">
          {resource.tags.map((tag) => (
            <li key={tag}>
              <Badge variant="outline">{tag}</Badge>
            </li>
          ))}
        </ul>
      )}
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={false}
        style={CENTER_HANDLE}
      />
    </div>
  )
}

const nodeTypes: NodeTypes = {
  application: ApplicationNodeView,
  resource: ResourceNodeView,
}

export function ApplicationGraph({
  application,
  members,
}: {
  application: Application
  members: readonly Resource[]
}) {
  const { nodes, edges } = applicationGraph(application, members)
  return (
    <div className="bg-card h-[32rem] overflow-hidden rounded-xl border">
      <ReactFlow
        aria-label={`${application.name} graph`}
        defaultNodes={nodes}
        defaultEdges={edges}
        nodeTypes={nodeTypes}
        nodeOrigin={[0.5, 0.5]}
        fitView
        minZoom={0.1}
        nodesConnectable={false}
        edgesReconnectable={false}
        deleteKeyCode={null}
      >
        <Background variant={BackgroundVariant.Dots} />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  )
}
