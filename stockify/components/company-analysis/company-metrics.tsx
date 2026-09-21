import type { MetricCategory } from "@/lib/financial-metrics"

function CategoryCard({ category }: { category: MetricCategory }) {
  return (
    <div className="rounded-2xl border bg-card p-4">
      <p className="mb-3 text-sm font-medium">{category.title}</p>

      {category.rows.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {category.rows.map((row) => (
            <div
              key={row.label}
              className="flex flex-col gap-1.5 rounded-xl border bg-background px-3 py-2.5"
            >
              <span className="text-[11px] leading-tight text-muted-foreground">{row.label}</span>
              <span className="text-sm font-semibold tabular-nums">{row.value}</span>
              {row.sub && <span className="text-[11px] text-muted-foreground">{row.sub}</span>}
            </div>
          ))}
        </div>
      ) : null}

      {category.note && (
        <p className="mt-3 text-xs text-muted-foreground">{category.note}</p>
      )}
    </div>
  )
}

export function MetricCategoryGrid({ categories }: { categories: MetricCategory[] }) {
  return (
    <div className="flex flex-col gap-4">
      {categories.map((category) => (
        <CategoryCard key={category.title} category={category} />
      ))}
    </div>
  )
}
