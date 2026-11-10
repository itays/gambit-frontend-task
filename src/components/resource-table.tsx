import {
  type Column,
  type ColumnSort,
  columnFilteringFeature,
  constructFilterFn,
  createColumnHelper,
  createFilteredRowModel,
  createSortedRowModel,
  filterFn_includesString,
  rowSelectionFeature,
  rowSortingFeature,
  type SortingState,
  sortFn_text,
  tableFeatures,
  useTable,
} from "@tanstack/react-table"
import { ArrowDown, ArrowUp, ArrowUpDown, SearchX, X } from "lucide-react"
import { useState } from "react"
import { useDebounceCallback, useEventCallback } from "usehooks-ts"

import { AttributeFilter } from "@/components/attribute-filter"
import {
  type ApplicationDraft,
  CreateApplicationDialog,
} from "@/components/create-application-dialog"
import { CriticalityBadge } from "@/components/criticality-badge"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  type Application,
  CRITICALITIES,
  CRITICALITY_RANK,
  ENVIRONMENTS,
  PROVIDERS,
  type Resource,
} from "@/domain"

// Keeps a row whose value is any of the chosen values, so values picked
// within one attribute combine with OR.
const filterFn_includesAnyOf = constructFilterFn({
  filter: (dataValue: unknown, filterValue: readonly unknown[]) =>
    filterValue.includes(dataValue),
  autoRemove: (filterValue: unknown) =>
    !Array.isArray(filterValue) || filterValue.length === 0,
})

const features = tableFeatures({
  columnFilteringFeature,
  rowSelectionFeature,
  rowSortingFeature,
  filteredRowModel: createFilteredRowModel(),
  sortedRowModel: createSortedRowModel(),
  filterFns: {
    includesString: filterFn_includesString,
    includesAnyOf: filterFn_includesAnyOf,
  },
  sortFns: { text: sortFn_text },
})

const columnHelper = createColumnHelper<typeof features, Resource>()

const columns = columnHelper.columns([
  columnHelper.display({
    id: "select",
    header: ({ table }) => {
      const rows = table.getRowModel().rows
      const selectedCount = rows.filter((row) => row.getIsSelected()).length
      const allSelected = rows.length > 0 && selectedCount === rows.length
      return (
        <Checkbox
          aria-label="Select all matching Resources"
          checked={allSelected}
          indeterminate={selectedCount > 0 && !allSelected}
          disabled={rows.length === 0}
          // Without pagination the page is every row matching the filters, so
          // Resources hidden by filters keep their selection.
          onCheckedChange={() => table.toggleAllPageRowsSelected(!allSelected)}
        />
      )
    },
    cell: ({ row }) => (
      <Checkbox
        aria-label={`Select ${row.original.name}`}
        checked={row.getIsSelected()}
        onCheckedChange={(checked) => row.toggleSelected(checked)}
      />
    ),
  }),
  columnHelper.accessor("name", {
    header: "Name",
    sortFn: "text",
    filterFn: "includesString",
    cell: (info) => <span className="font-medium">{info.getValue()}</span>,
  }),
  columnHelper.accessor("type", {
    header: "Resource Type",
    enableSorting: false,
    cell: (info) => (
      <span className="text-muted-foreground">{info.getValue()}</span>
    ),
  }),
  columnHelper.accessor("provider", {
    header: "Provider",
    enableSorting: false,
    filterFn: "includesAnyOf",
    cell: (info) => <Badge variant="secondary">{info.getValue()}</Badge>,
  }),
  columnHelper.accessor("environment", {
    header: "Environment",
    enableSorting: false,
    filterFn: "includesAnyOf",
    cell: (info) => (
      <Badge variant="outline" className="capitalize">
        {info.getValue()}
      </Badge>
    ),
  }),
  columnHelper.accessor("criticality", {
    header: "Criticality",
    sortDescFirst: true,
    filterFn: "includesAnyOf",
    sortFn: (a, b) =>
      CRITICALITY_RANK[a.original.criticality] -
      CRITICALITY_RANK[b.original.criticality],
    cell: (info) => <CriticalityBadge criticality={info.getValue()} />,
  }),
  columnHelper.accessor("openIssues", {
    header: "Open Issues",
    sortDescFirst: true,
    cell: (info) => (
      <span
        className={
          info.getValue() === 0 ? "text-muted-foreground" : "font-medium"
        }
      >
        {info.getValue()}
      </span>
    ),
  }),
])

const NAME_ASCENDING: ColumnSort = { id: "name", desc: false }

// Name is always the tiebreaker, so rows with equal Criticality or Open Issues
// keep a stable, readable order.
function sortingBy(sort: ColumnSort): SortingState {
  return sort.id === NAME_ASCENDING.id ? [sort] : [sort, NAME_ASCENDING]
}

const DEFAULT_SORTING = sortingBy({ id: "criticality", desc: true })

const SORT_INDICATOR = {
  asc: { ariaSort: "ascending", Icon: ArrowUp },
  desc: { ariaSort: "descending", Icon: ArrowDown },
} as const

const ATTRIBUTE_FILTERS = [
  { columnId: "provider", label: "Provider", values: PROVIDERS },
  { columnId: "environment", label: "Environment", values: ENVIRONMENTS },
  { columnId: "criticality", label: "Criticality", values: CRITICALITIES },
] as const

const SEARCH_DEBOUNCE_MS = 250

export function ResourceTable({
  resources,
  applications,
  onCreateApplication,
}: {
  resources: Resource[]
  applications: readonly Application[]
  onCreateApplication: (draft: ApplicationDraft) => void
}) {
  const [search, setSearch] = useState("")
  const [creating, setCreating] = useState(false)
  const table = useTable({
    features,
    columns,
    data: resources,
    getRowId: (resource) => resource.id,
    initialState: { sorting: DEFAULT_SORTING },
  })

  const setNameFilter = useEventCallback((value: string) =>
    table.getColumn("name")?.setFilterValue(value)
  )
  const applySearch = useDebounceCallback(setNameFilter, SEARCH_DEBOUNCE_MS)

  // Only the primary sort column shows a direction; the name tiebreaker is
  // an implementation detail of every non-name sort.
  const primaryDirection = (column: Column<typeof features, Resource>) =>
    column.getSortIndex() === 0 ? column.getIsSorted() : false

  const toggleSort = (column: Column<typeof features, Resource>) => {
    const direction = primaryDirection(column)
    const desc = direction
      ? direction === "asc"
      : column.getFirstSortDir() === "desc"
    table.setSorting(sortingBy({ id: column.id, desc }))
  }

  const isFiltered = search !== "" || table.state.columnFilters.length > 0

  const changeSearch = (value: string) => {
    setSearch(value)
    applySearch(value)
  }

  const clearFilters = () => {
    applySearch.cancel()
    setSearch("")
    table.resetColumnFilters(true)
  }

  const rows = table.getRowModel().rows
  const selectedResources = table
    .getSelectedRowModel()
    .rows.map((row) => row.original)

  const createApplication = (draft: ApplicationDraft) => {
    onCreateApplication(draft)
    table.resetRowSelection(true)
    setCreating(false)
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          type="search"
          aria-label="Search Resources by name"
          placeholder="Search by name…"
          className="h-8 w-full sm:w-64"
          value={search}
          onChange={(event) => changeSearch(event.target.value)}
        />
        {ATTRIBUTE_FILTERS.map(({ columnId, label, values }) => {
          const column = table.getColumn(columnId)
          return (
            <AttributeFilter
              key={columnId}
              label={label}
              values={values}
              selected={
                (column?.getFilterValue() as string[] | undefined) ?? []
              }
              onSelectedChange={(selected) => column?.setFilterValue(selected)}
            />
          )
        })}
        {isFiltered && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            Clear filters
            <X />
          </Button>
        )}
        <p role="status" className="text-muted-foreground ml-auto text-sm">
          {rows.length} of {resources.length} Resources
        </p>
      </div>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent">
                {headerGroup.headers.map((header) => {
                  const direction = primaryDirection(header.column)
                  const indicator = direction ? SORT_INDICATOR[direction] : null
                  const SortIcon = indicator?.Icon ?? ArrowUpDown
                  return (
                    <TableHead
                      key={header.id}
                      aria-sort={indicator?.ariaSort}
                      className="px-3"
                    >
                      {header.column.getCanSort() ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="-ml-2.5"
                          onClick={() => toggleSort(header.column)}
                        >
                          <table.FlexRender header={header} />
                          <SortIcon
                            className={indicator ? "" : "text-muted-foreground"}
                          />
                        </Button>
                      ) : (
                        <table.FlexRender header={header} />
                      )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {rows.length > 0 ? (
              rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() ? "selected" : undefined}
                >
                  {row.getAllCells().map((cell) => (
                    <TableCell key={cell.id} className="px-3">
                      <table.FlexRender cell={cell} />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={columns.length}>
                  <Empty>
                    <EmptyHeader>
                      <EmptyMedia variant="icon">
                        <SearchX />
                      </EmptyMedia>
                      <EmptyTitle>No matching Resources</EmptyTitle>
                      <EmptyDescription>
                        No Resources match the current search and filters.
                      </EmptyDescription>
                    </EmptyHeader>
                    <EmptyContent>
                      <Button variant="outline" onClick={clearFilters}>
                        Clear filters
                      </Button>
                    </EmptyContent>
                  </Empty>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {selectedResources.length > 0 && (
        <section
          aria-label="Selected Resources"
          className="bg-background sticky bottom-4 flex items-center gap-2 rounded-lg border p-2 pl-4 shadow-md"
        >
          <span className="mr-auto text-sm font-medium">
            {selectedResources.length} selected
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => table.resetRowSelection(true)}
          >
            Clear
          </Button>
          <Button size="sm" onClick={() => setCreating(true)}>
            Create Application
          </Button>
        </section>
      )}
      <CreateApplicationDialog
        open={creating}
        onOpenChange={setCreating}
        resources={selectedResources}
        applications={applications}
        onCreate={createApplication}
      />
    </div>
  )
}
