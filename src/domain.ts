export type Provider = "AWS" | "GCP" | "Azure"
export type Environment = "production" | "staging" | "development"
export type Criticality = "low" | "medium" | "high" | "critical"

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
