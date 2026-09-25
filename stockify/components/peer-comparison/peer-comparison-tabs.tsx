"use client"

import { useState } from "react"
import { BotIcon, ColumnsIcon, SlidersHorizontalIcon } from "lucide-react"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { cn } from "cn"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { EmptyPanel } from "@/components/company-analysis/company-tab-nav"
import { ComparisonChartsPanel } from "@/components/peer-comparison/comparison/comparison-panel"
import { StockPicker } from "@/components/peer-comparison/stock-picker"
import { WeightagePanel } from "@/components/peer-comparison/weightage/weightage-panel"
import type { Company } from "@/lib/companies"

const SECTION_TABS = [
  { value: "comparison", label: "Comparison", shortLabel: "Compare", icon: ColumnsIcon },
  {
    value: "weightage",
    label: "Weightage Based Comparison",
    shortLabel: "Weightage",
    icon: SlidersHorizontalIcon,
  },
  { value: "agentic", label: "Agentic Comparison", shortLabel: "Agentic", icon: BotIcon },
] as const

type SectionTab = (typeof SECTION_TABS)[number]["value"]

// Track padding (p-1) and segment radius (rounded-md), mirrored in the
// clip-path maths below so the revealed segment lands exactly on a column.
const TRACK_PAD = "4px"
const SEGMENT_RADIUS = "8px"

function segmentClip(index: number) {
  const column = `(100% - 2 * ${TRACK_PAD}) / ${SECTION_TABS.length}`
  const left = `calc(${TRACK_PAD} + ${index} * ${column})`
  const right = `calc(${TRACK_PAD} + ${SECTION_TABS.length - 1 - index} * ${column})`
  return `inset(${TRACK_PAD} ${right} ${TRACK_PAD} ${left} round ${SEGMENT_RADIUS})`
}

function SegmentContent({ tab }: { tab: (typeof SECTION_TABS)[number] }) {
  const Icon = tab.icon
  return (
    <>
      <Icon className="hidden size-4 sm:block" />
      <span className="truncate sm:hidden">{tab.shortLabel}</span>
      <span className="hidden truncate sm:inline">{tab.label}</span>
    </>
  )
}

function SegmentedNav({ activeTab }: { activeTab: SectionTab }) {
  const activeIndex = SECTION_TABS.findIndex((tab) => tab.value === activeTab)

  return (
    <div className="relative w-full rounded-xl bg-muted">
      <TabsList
        className={cn(
          "grid w-full grid-cols-3 rounded-xl bg-transparent p-1",
          "group-data-horizontal/tabs:h-auto"
        )}
      >
        {SECTION_TABS.map((tab) => (
          <TabsTrigger
            key={tab.value}
            value={tab.value}
            className={cn(
              "h-9 min-w-0 gap-2 rounded-md px-2 text-muted-foreground transition-colors duration-150 sm:px-3",
              "hover:text-foreground focus-visible:border-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              "data-active:bg-transparent data-active:shadow-none!",
              "dark:data-active:border-transparent dark:data-active:bg-transparent"
            )}
          >
            <SegmentContent tab={tab} />
          </TabsTrigger>
        ))}
      </TabsList>

      {/* An inverted duplicate of the tab row, clipped down to the active
          column. Moving one clip-path means the fill and the label colour
          change as a single reveal instead of two tweens drifting apart. */}
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-0 grid grid-cols-3 rounded-xl bg-primary p-1 text-primary-foreground",
          "transition-[clip-path] duration-[240ms] ease-[cubic-bezier(0.77,0,0.175,1)] motion-reduce:transition-none"
        )}
        style={{ clipPath: segmentClip(activeIndex) }}
      >
        {SECTION_TABS.map((tab) => (
          <div
            key={tab.value}
            className="flex h-9 min-w-0 items-center justify-center gap-2 px-2 text-sm font-medium whitespace-nowrap sm:px-3"
          >
            <SegmentContent tab={tab} />
          </div>
        ))}
      </div>
    </div>
  )
}

function PanelReveal({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  )
}

const PANEL_COPY: Record<SectionTab, { title: string; description: string }> = {
  comparison: {
    title: "Comparison",
    description: "Compare the selected stocks side by side on key financial metrics.",
  },
  weightage: {
    title: "Weightage Based Comparison",
    description: "Pick at least two stocks, or a whole industry, then weight each metric to rank them by a combined score.",
  },
  agentic: {
    title: "Agentic Comparison",
    description: "Let an AI agent analyse and compare the selected stocks for you.",
  },
}

// The weighted scorecard ranks against the average of the whole set, so it
// needs room for an entire industry rather than a handful of names.
const WEIGHTAGE_MAX = 50

function ComparisonPanel({
  tab,
  selection,
  onSelectionChange,
}: {
  tab: (typeof SECTION_TABS)[number]
  selection: Company[]
  onSelectionChange: (companies: Company[]) => void
}) {
  const copy = PANEL_COPY[tab.value]
  const needed = Math.max(0, 2 - selection.length)
  const isWeightage = tab.value === "weightage"
  const isComparison = tab.value === "comparison"
  const showWeightage = isWeightage && needed === 0
  const showComparison = isComparison && needed === 0
  const reduceMotion = useReducedMotion()

  return (
    <div className="flex flex-col gap-6">
      <StockPicker
        value={selection}
        onChange={onSelectionChange}
        max={isWeightage ? WEIGHTAGE_MAX : undefined}
      />
      <AnimatePresence mode="wait" initial={false}>
        {showWeightage ? (
          <motion.div
            key="weightage"
            initial={{ opacity: 0, y: reduceMotion ? 0 : 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: reduceMotion ? 0 : -4 }}
            transition={{ duration: reduceMotion ? 0.15 : 0.22, ease: [0.23, 1, 0.32, 1] }}
          >
            <WeightagePanel selection={selection} />
          </motion.div>
        ) : showComparison ? (
          <motion.div
            key="comparison"
            initial={{ opacity: 0, y: reduceMotion ? 0 : 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: reduceMotion ? 0 : -4 }}
            transition={{ duration: reduceMotion ? 0.15 : 0.22, ease: [0.23, 1, 0.32, 1] }}
          >
            <ComparisonChartsPanel selection={selection} />
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
          >
            <EmptyPanel
              icon={tab.icon}
              title={
                needed === 2
                  ? "Add stocks to compare"
                  : needed === 1
                    ? "Add one more stock"
                    : `${selection.length} stocks ready for ${copy.title.toLowerCase()}`
              }
              description={
                needed > 0
                  ? copy.description
                  : "This view is still being built. Your selection is kept while you switch tabs."
              }
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function PeerComparisonTabs() {
  const [activeTab, setActiveTab] = useState<SectionTab>("comparison")
  // Each tab keeps its own basket so a weighted ranking can use a different
  // set than the plain side-by-side view.
  const [selections, setSelections] = useState<Record<SectionTab, Company[]>>({
    comparison: [],
    weightage: [],
    agentic: [],
  })

  return (
    <Tabs
      value={activeTab}
      onValueChange={(value) => setActiveTab(value as SectionTab)}
      className="gap-0"
    >
      <div className="border-b bg-background px-4 py-3 lg:px-6">
        <SegmentedNav activeTab={activeTab} />
      </div>

      <div className="px-4 py-6 lg:px-6">
        {SECTION_TABS.map((tab) => (
          <TabsContent key={tab.value} value={tab.value}>
            <PanelReveal>
              <ComparisonPanel
                tab={tab}
                selection={selections[tab.value]}
                onSelectionChange={(companies) =>
                  setSelections((current) => ({ ...current, [tab.value]: companies }))
                }
              />
            </PanelReveal>
          </TabsContent>
        ))}
      </div>
    </Tabs>
  )
}
