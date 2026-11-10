import { describe, expect, it } from "vitest"

import { resources } from "@/data/resources"
import type { Application, Resource } from "@/domain"
import { applicationGraph, RESOURCE_NODE_WIDTH } from "@/lib/application-graph"

function graphFor(members: Resource[]) {
  const application: Application = {
    id: "app-1",
    name: "Payments API",
    resourceIds: members.map((resource) => resource.id),
  }
  return applicationGraph(application, members)
}

function resourceCenters(members: Resource[]) {
  return graphFor(members)
    .nodes.filter((node) => node.type === "resource")
    .map((node) => node.position)
}

describe("applicationGraph", () => {
  it("centers the Application and links it to one node per member Resource", () => {
    const members = resources.slice(0, 3)
    const { nodes, edges } = graphFor(members)

    expect(nodes[0]).toMatchObject({
      type: "application",
      position: { x: 0, y: 0 },
      data: { application: { name: "Payments API" } },
    })
    expect(nodes.slice(1).map((node) => node.data)).toEqual(
      members.map((resource) => ({ resource }))
    )
    expect(edges.map(({ source, target }) => ({ source, target }))).toEqual(
      nodes.slice(1).map((node) => ({ source: nodes[0].id, target: node.id }))
    )
  })

  it("spaces Resources evenly on a circle around the Application", () => {
    const centers = resourceCenters(resources.slice(0, 5))
    const radius = Math.hypot(centers[0].x, centers[0].y)

    for (const center of centers) {
      expect(Math.hypot(center.x, center.y)).toBeCloseTo(radius)
    }
    for (let i = 0; i < centers.length; i++) {
      const next = centers[(i + 1) % centers.length]
      const gap =
        (Math.atan2(next.y, next.x) -
          Math.atan2(centers[i].y, centers[i].x) +
          2 * Math.PI) %
        (2 * Math.PI)
      expect(gap).toBeCloseTo((2 * Math.PI) / centers.length)
    }
  })

  it("grows the circle with the member count so neighbors never overlap", () => {
    const radii = [1, 2, 6, 12].map((count) => {
      const centers = resourceCenters(resources.slice(0, count))
      for (let i = 0; i < centers.length - 1; i++) {
        const [a, b] = [centers[i], centers[i + 1]]
        expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeGreaterThan(
          RESOURCE_NODE_WIDTH
        )
      }
      return Math.hypot(centers[0].x, centers[0].y)
    })

    expect(radii[0]).toBeGreaterThan(RESOURCE_NODE_WIDTH)
    expect(radii[3]).toBeGreaterThan(radii[2])
  })

  it("draws an Application with no resolvable members as a lone node", () => {
    expect(graphFor([])).toMatchObject({
      nodes: [{ type: "application" }],
      edges: [],
    })
  })
})
