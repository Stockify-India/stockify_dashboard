"use client"

import {
  BookOpenIcon,
  ExternalLinkIcon,
  FileTextIcon,
  MessageSquareTextIcon,
  PlayCircleIcon,
  PresentationIcon,
  ShieldCheckIcon,
} from "lucide-react"
import { cn } from "cn"

import { Badge } from "@/components/ui/badge"
import { EmptyPanel } from "@/components/company-analysis/company-tab-nav"
import type { DocumentGroup, DocumentRow, DocumentType } from "@/lib/documents"

const STAGGER_ITEM =
  "motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-1 fill-mode-backwards duration-300"

function staggerDelay(index: number) {
  return { animationDelay: `${index * 30}ms` }
}

const GROUP_ICON: Record<DocumentType, React.ComponentType<{ className?: string }>> = {
  annual_report: BookOpenIcon,
  concall_transcript: MessageSquareTextIcon,
  concall_ppt: PresentationIcon,
  concall_rec: PlayCircleIcon,
  credit_rating: ShieldCheckIcon,
}

// Groups with a large backlog (some concall archives run 100+ entries) get a
// scroll cap so one company's history doesn't push every other tab off screen.
const SCROLL_THRESHOLD = 8

function DocumentRowItem({ doc, index }: { doc: DocumentRow; index: number }) {
  const label = doc.title?.trim() || doc.period?.trim() || "Document"
  const showPeriod = Boolean(doc.period) && doc.period !== label

  return (
    <a
      href={doc.url}
      target="_blank"
      rel="noreferrer"
      className={cn(
        STAGGER_ITEM,
        "group flex items-center justify-between gap-3 px-4 py-2.5 transition-colors hover:bg-foreground/[0.03]"
      )}
      style={staggerDelay(index)}
    >
      <div className="flex min-w-0 flex-col">
        <span className="truncate text-sm font-medium text-foreground/90 group-hover:text-foreground">
          {label}
        </span>
        {showPeriod && <span className="text-xs text-muted-foreground">{doc.period}</span>}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {doc.source && (
          <Badge variant="secondary" className="text-[11px] uppercase">
            {doc.source}
          </Badge>
        )}
        <ExternalLinkIcon className="size-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
      </div>
    </a>
  )
}

function DocumentGroupCard({ group }: { group: DocumentGroup }) {
  const Icon = GROUP_ICON[group.docType]
  const scrollable = group.documents.length > SCROLL_THRESHOLD

  return (
    <div className="overflow-hidden rounded-2xl border bg-card">
      <div className="flex flex-wrap items-center gap-2.5 border-b px-4 py-3">
        <Icon className="size-3.5 shrink-0 text-muted-foreground" />
        <span className="text-sm font-medium">{group.label}</span>
        <Badge variant="secondary" className="h-5 px-1.5 text-[11px] tabular-nums">
          {group.documents.length}
        </Badge>
      </div>
      <div className={cn("divide-y", scrollable && "max-h-80 overflow-y-auto")}>
        {group.documents.map((doc, index) => (
          <DocumentRowItem key={doc.id} doc={doc} index={index} />
        ))}
      </div>
    </div>
  )
}

export function DocumentsPanel({ groups }: { groups: DocumentGroup[] }) {
  if (groups.length === 0) {
    return (
      <EmptyPanel
        icon={FileTextIcon}
        title="No documents available"
        description="Announcements and filings for this company haven't been synced from the exchange yet."
      />
    )
  }

  const totalCount = groups.reduce((sum, group) => sum + group.documents.length, 0)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-card px-4 py-3">
        <div className="flex items-center gap-2.5">
          <FileTextIcon className="size-4 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">Filings & Documents</p>
            <p className="text-xs text-muted-foreground">
              {totalCount} {totalCount === 1 ? "document" : "documents"} synced from the exchange
            </p>
          </div>
        </div>
      </div>

      {groups.map((group) => (
        <DocumentGroupCard key={group.docType} group={group} />
      ))}
    </div>
  )
}
