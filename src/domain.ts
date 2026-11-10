export const PROVIDERS = ["AWS", "GCP", "Azure"] as const
export type Provider = (typeof PROVIDERS)[number]

export const ENVIRONMENTS = ["production", "staging", "development"] as const
export type Environment = (typeof ENVIRONMENTS)[number]

export const CRITICALITIES = ["critical", "high", "medium", "low"] as const
export type Criticality = (typeof CRITICALITIES)[number]

export interface Resource {
  id: string
  name: string
  type: string
  provider: Provider
  region: string
  environment: Environment
  criticality: Criticality
  owner: string
  tags: string[]
  openIssues: number
}

export interface Application {
  id: string
  name: string
  description?: string
  resourceIds: string[]
}

export const CRITICALITY_RANK: Record<Criticality, number> = {
  low: 0,
  medium: 1,
  high: 2,
  critical: 3,
}
