import { supabase } from "@/lib/supabase"

export type DocumentType =
  | "annual_report"
  | "concall_transcript"
  | "concall_ppt"
  | "concall_rec"
  | "credit_rating"

export type DocumentRow = {
  id: number
  docType: DocumentType
  title: string | null
  url: string
  period: string | null
  source: string | null
}

export type DocumentGroup = {
  docType: DocumentType
  label: string
  documents: DocumentRow[]
}

const GROUP_ORDER: DocumentType[] = [
  "annual_report",
  "concall_transcript",
  "concall_ppt",
  "concall_rec",
  "credit_rating",
]

const GROUP_LABEL: Record<DocumentType, string> = {
  annual_report: "Annual Reports",
  concall_transcript: "Concall Transcripts",
  concall_ppt: "Concall Presentations",
  concall_rec: "Concall Recordings",
  credit_rating: "Credit Ratings",
}

export async function fetchDocuments(symbol: string): Promise<DocumentGroup[]> {
  const { data, error } = await supabase
    .from("documents")
    .select("id, doc_type, title, url, period, source")
    .eq("symbol", symbol)
    .order("id", { ascending: true })

  if (error) throw error

  const rows = (data ?? []) as {
    id: number
    doc_type: string
    title: string | null
    url: string
    period: string | null
    source: string | null
  }[]

  return GROUP_ORDER.map((docType) => ({
    docType,
    label: GROUP_LABEL[docType],
    documents: rows
      .filter((row) => row.doc_type === docType)
      .map((row) => ({
        id: row.id,
        docType,
        title: row.title,
        url: row.url,
        period: row.period,
        source: row.source,
      })),
  })).filter((group) => group.documents.length > 0)
}
