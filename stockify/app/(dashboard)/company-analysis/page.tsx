"use client"

import { useCompany } from "@/components/company-context"
import { CompanyAnalysisTabs } from "@/components/company-analysis/company-tab-nav"
import { AnalysisBootGraphic } from "@/components/company-analysis/analysis-boot-graphic"

export default function Page() {
  const { selectedCompany, isLoading, error } = useCompany()

  if (error) {
    return (
      <div className="flex flex-1 items-center justify-center p-6 text-sm text-muted-foreground">
        Couldn&apos;t load companies: {error}
      </div>
    )
  }

  if (isLoading || !selectedCompany) {
    return <AnalysisBootGraphic />
  }

  return (
    <div className="flex flex-1 flex-col">
      <CompanyAnalysisTabs
        symbol={selectedCompany.symbol}
        companyName={selectedCompany.name}
        industry={selectedCompany.industry}
      />
    </div>
  )
}
