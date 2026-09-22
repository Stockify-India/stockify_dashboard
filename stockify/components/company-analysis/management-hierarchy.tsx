"use client"

import { CrownIcon, IdCardIcon, NetworkIcon, ShieldCheckIcon, UserCogIcon, UsersIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { EmptyPanel } from "@/components/company-analysis/company-tab-nav"
import { formatDate } from "@/lib/format"
import type { ManagementGroup, ManagementHierarchy, ManagementTier } from "@/lib/management"

// Same cascade every other data table in this page uses (StatementTable,
// PeerTable, ShareholdingTable, DocumentRowItem) — kept local per-file like
// those, not shared, matching the existing convention.
const STAGGER_ITEM =
  "motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-1 fill-mode-backwards duration-300"

function staggerDelay(index: number) {
  return { animationDelay: `${index * 40}ms` }
}

const TIER_ICON: Record<ManagementTier, React.ComponentType<{ className?: string }>> = {
  chairperson: CrownIcon,
  executive: UserCogIcon,
  "non-executive": ShieldCheckIcon,
  kmp: IdCardIcon,
  other: UsersIcon,
}

function GroupTable({ group }: { group: ManagementGroup }) {
  const Icon = TIER_ICON[group.tier]

  return (
    <div className="overflow-hidden rounded-2xl border bg-card">
      <div className="flex flex-wrap items-center gap-2.5 border-b px-4 py-3">
        <Icon className="size-3.5 shrink-0 text-muted-foreground" />
        <span className="text-sm font-medium">{group.label}</span>
        <Badge variant="secondary" className="h-5 px-1.5 text-[11px] tabular-nums">
          {group.people.length}
        </Badge>
        <span className="ml-auto text-xs text-muted-foreground">{group.description}</span>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Designation</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {group.people.map((person, index) => (
            <TableRow
              key={`${person.name}-${index}`}
              className={STAGGER_ITEM}
              style={staggerDelay(index)}
            >
              <TableCell className="font-medium text-foreground/90">{person.name}</TableCell>
              <TableCell className="text-muted-foreground">{person.designation}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

export function ManagementPanel({ hierarchy }: { hierarchy: ManagementHierarchy }) {
  if (hierarchy.groups.length === 0) {
    return (
      <EmptyPanel
        icon={NetworkIcon}
        title="No management data"
        description="Board and management details haven't been synced from the exchange yet for this company."
      />
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-card px-4 py-3">
        <div className="flex items-center gap-2.5">
          <NetworkIcon className="size-4 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">Board & Management</p>
            <p className="text-xs text-muted-foreground">
              {hierarchy.totalCount} {hierarchy.totalCount === 1 ? "member" : "members"} disclosed
              in the latest corporate filing
            </p>
          </div>
        </div>
        {hierarchy.asOf && (
          <Badge variant="secondary" className="font-mono text-[11px]">
            Synced {formatDate(hierarchy.asOf)}
          </Badge>
        )}
      </div>

      {hierarchy.groups.map((group) => (
        <GroupTable key={group.tier} group={group} />
      ))}
    </div>
  )
}
