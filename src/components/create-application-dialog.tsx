import { type FormEvent, useId, useState } from "react"

import { CriticalityBadge } from "@/components/criticality-badge"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import type { Application, ApplicationDraft, Resource } from "@/domain"

function nameError(name: string, applications: readonly Application[]) {
  if (name === "") return "Name is required"
  const lowerName = name.toLowerCase()
  if (applications.some((app) => app.name.toLowerCase() === lowerName)) {
    return `An Application named "${name}" already exists`
  }
  return null
}

export function CreateApplicationDialog({
  open,
  onOpenChange,
  resources,
  applications,
  onCreate,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  resources: readonly Resource[]
  applications: readonly Application[]
  onCreate: (draft: ApplicationDraft) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Application</DialogTitle>
          <DialogDescription>
            Group {resources.length} selected{" "}
            {resources.length === 1 ? "Resource" : "Resources"} into a named
            Application.
          </DialogDescription>
        </DialogHeader>
        <CreateApplicationForm
          resources={resources}
          applications={applications}
          onCreate={onCreate}
        />
      </DialogContent>
    </Dialog>
  )
}

function CreateApplicationForm({
  resources,
  applications,
  onCreate,
}: {
  resources: readonly Resource[]
  applications: readonly Application[]
  onCreate: (draft: ApplicationDraft) => void
}) {
  const id = useId()
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [error, setError] = useState<string | null>(null)

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const trimmedName = name.trim()
    const message = nameError(trimmedName, applications)
    if (message) {
      setError(message)
      return
    }
    onCreate({
      name: trimmedName,
      description: description.trim() || undefined,
      resourceIds: resources.map((resource) => resource.id),
    })
  }

  return (
    <form noValidate onSubmit={submit} className="flex flex-col gap-6">
      <FieldGroup className="gap-4">
        <Field data-invalid={error !== null}>
          <FieldLabel htmlFor={`${id}-name`}>Name</FieldLabel>
          <Input
            id={`${id}-name`}
            autoComplete="off"
            placeholder="e.g. Payments API"
            value={name}
            aria-invalid={error !== null}
            aria-describedby={error ? `${id}-name-error` : undefined}
            onChange={(event) => {
              setName(event.target.value)
              setError(null)
            }}
          />
          <FieldError id={`${id}-name-error`}>{error}</FieldError>
        </Field>
        <Field>
          <FieldLabel htmlFor={`${id}-description`}>Description</FieldLabel>
          <Textarea
            id={`${id}-description`}
            placeholder="Optional"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </Field>
      </FieldGroup>
      <ul
        aria-label="Resources in this Application"
        className="max-h-48 divide-y overflow-y-auto rounded-md border"
      >
        {resources.map((resource) => (
          <li
            key={resource.id}
            className="flex items-center gap-2 px-3 py-2 text-sm"
          >
            <span className="mr-auto truncate font-medium">
              {resource.name}
            </span>
            <Badge variant="secondary">{resource.provider}</Badge>
            <CriticalityBadge criticality={resource.criticality} />
          </li>
        ))}
      </ul>
      <DialogFooter>
        <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
        <Button type="submit">Create</Button>
      </DialogFooter>
    </form>
  )
}
