import {
  type Column,
  type ColumnSort,
  createColumnHelper,
  createSortedRowModel,
  rowSortingFeature,
  type SortingState,
  sortFn_text,
  tableFeatures,
  useTable,
} from "@tanstack/react-table"
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react"

import { CriticalityBadge } from "@/components/criticality-badge"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { CRITICALITY_RANK, type Resource } from "@/domain"

const features = tableFeatures({
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
  sortFns: { text: sortFn_text },
})

const columnHelper = createColumnHelper<typeof features, Resource>()

const columns = columnHelper.columns([
  columnHelper.accessor("name", {
    header: "Name",
    sortFn: "text",
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
    cell: (info) => <Badge variant="secondary">{info.getValue()}</Badge>,
  }),
  columnHelper.accessor("environment", {
    header: "Environment",
    enableSorting: false,
    cell: (info) => (
      <Badge variant="outline" className="capitalize">
        {info.getValue()}
      </Badge>
    ),
  }),
  columnHelper.accessor("criticality", {
    header: "Criticality",
    sortDescFirst: true,
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

export function ResourceTable({ resources }: { resources: Resource[] }) {
  const table = useTable({
    features,
    columns,
    data: resources,
    getRowId: (resource) => resource.id,
    initialState: { sorting: DEFAULT_SORTING },
  })

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

  return (
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
          {table.getRowModel().rows.map((row) => (
            <TableRow key={row.id}>
              {row.getAllCells().map((cell) => (
                <TableCell key={cell.id} className="px-3">
                  <table.FlexRender cell={cell} />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
