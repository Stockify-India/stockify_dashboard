"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"

import { fetchCompanies, type Company } from "@/lib/companies"

type CompanyContextValue = {
  companies: Company[]
  isLoading: boolean
  error: string | null
  selectedCompany: Company | null
  setSelectedCompany: (company: Company) => void
}

const CompanyContext = createContext<CompanyContextValue | null>(null)

export function CompanyProvider({ children }: { children: ReactNode }) {
  const [companies, setCompanies] = useState<Company[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)

  useEffect(() => {
    let cancelled = false

    fetchCompanies()
      .then((result) => {
        if (cancelled) return
        setCompanies(result)
        setSelectedCompany((current) => current ?? result[0] ?? null)
      })
      .catch((err) => {
        if (cancelled) return
        setError(err instanceof Error ? err.message : "Failed to load companies")
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <CompanyContext.Provider
      value={{ companies, isLoading, error, selectedCompany, setSelectedCompany }}
    >
      {children}
    </CompanyContext.Provider>
  )
}

export function useCompany() {
  const context = useContext(CompanyContext)
  if (!context) {
    throw new Error("useCompany must be used within a CompanyProvider")
  }
  return context
}
