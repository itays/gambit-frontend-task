import { ListFilter } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function AttributeFilter({
  label,
  values,
  selected,
  onSelectedChange,
}: {
  label: string
  values: readonly string[]
  selected: readonly string[]
  onSelectedChange: (selected: string[]) => void
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="outline" size="sm" />}
        aria-label={`Filter by ${label}${selected.length > 0 ? `, ${selected.length} selected` : ""}`}
      >
        <ListFilter />
        {label}
        {selected.length > 0 && (
          <Badge variant="secondary" className="rounded-sm px-1.5">
            {selected.length}
          </Badge>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {values.map((value) => (
          <DropdownMenuCheckboxItem
            key={value}
            className="capitalize"
            onCheckedChange={(checked) =>
              onSelectedChange(
                checked
                  ? [...selected, value]
                  : selected.filter((selectedValue) => selectedValue !== value)
              )
            }
            checked={selected.includes(value)}
          >
            {value}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
