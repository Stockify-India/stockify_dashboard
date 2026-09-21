"use client"

import { usePathname } from "next/navigation"

import { CompanySearch } from "@/components/company-analysis/company-search"
import { useCompany } from "@/components/company-context"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"

const sectionTitles: Record<string, string> = {
  "/": "Dashboard",
  "/dashboard": "Dashboard",
  "/company-analysis": "Company analysis",
  "/industry-research": "Industry research",
  "/peer-comparison": "Peer comparison",
  "/agent-discussion": "Agent discussion",
  "/formulas-template-analysis": "Formulas and template analysis",
  "/personal-data-tracking": "Personal data tracking",
}

function titleForPathname(pathname: string) {
  if (sectionTitles[pathname]) return sectionTitles[pathname]
  const segment = pathname.split("/").filter(Boolean).at(-1)
  if (!segment) return "Dashboard"
  const label = segment.replaceAll("-", " ")
  return label.charAt(0).toUpperCase() + label.slice(1)
}

export function SiteHeader() {
  const pathname = usePathname()
  const isCompanyAnalysis = pathname === "/company-analysis"
  const { companies, selectedCompany, setSelectedCompany } = useCompany()

  return (
    <header className="relative z-20 flex shrink-0 flex-col border-b bg-background transition-[height] ease-linear sm:h-(--header-height) sm:flex-row sm:items-center group-has-data-[collapsible=icon]/sidebar-wrapper:sm:h-(--header-height)">
      <div className="flex h-(--header-height) w-full shrink-0 items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 h-4 data-vertical:self-auto"
        />
        <h1 className="min-w-0 truncate text-base font-medium">{titleForPathname(pathname)}</h1>
      </div>
      {isCompanyAnalysis && selectedCompany && (
        <div className="w-full px-4 pb-3 sm:absolute sm:inset-y-0 sm:left-1/2 sm:flex sm:w-auto sm:-translate-x-1/2 sm:items-center sm:px-0 sm:pb-0">
          <CompanySearch
            companies={companies}
            selected={selectedCompany}
            onSelect={setSelectedCompany}
          />
        </div>
      )}
    </header>
  )
}
