import type { Edge, Node } from "@xyflow/react"

import type { Application, Resource } from "@/domain"

export type ApplicationNode = Node<{ application: Application }, "application">
export type ResourceNode = Node<{ resource: Resource }, "resource">
export type ApplicationGraphNode = ApplicationNode | ResourceNode

export const RESOURCE_NODE_WIDTH = 224
const MIN_RADIUS = 280
const NODE_GAP = 48

export function applicationGraph(
  application: Application,
  members: readonly Resource[]
): { nodes: ApplicationGraphNode[]; edges: Edge[] } {
  const center: ApplicationNode = {
    id: `application-${application.id}`,
    type: "application",
    position: { x: 0, y: 0 },
    data: { application },
    ariaLabel: application.name,
  }
  // Neighbors sit one chord apart, 2r·sin(π/n); size r so a chord fits a node plus a gap.
  const radius = Math.max(
    MIN_RADIUS,
    (RESOURCE_NODE_WIDTH + NODE_GAP) /
      (2 * Math.sin(Math.PI / Math.max(members.length, 2)))
  )
  const resourceNodes = members.map((resource, index): ResourceNode => {
    const angle = -Math.PI / 2 + (2 * Math.PI * index) / members.length
    return {
      id: `resource-${resource.id}`,
      type: "resource",
      position: { x: radius * Math.cos(angle), y: radius * Math.sin(angle) },
      data: { resource },
      ariaLabel: resource.name,
    }
  })
  return {
    nodes: [center, ...resourceNodes],
    edges: resourceNodes.map((node) => ({
      id: `${center.id}->${node.id}`,
      source: center.id,
      target: node.id,
      type: "straight",
      ariaLabel: `${application.name} includes ${node.data.resource.name}`,
    })),
  }
}
