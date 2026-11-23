import type { SizeGuide } from "@/lib/types"
import { cn } from "@/lib/utils"

export function SizeGuideTable({ guide }: { guide: SizeGuide }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-stone">
            {guide.columns.map((c) => (
              <th
                key={c}
                className="py-3 pr-4 text-left text-[11px] font-normal tracking-[0.16em] whitespace-nowrap text-muted-foreground uppercase"
              >
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {guide.rows.map((row) => (
            <tr key={row.label} className="border-b border-stone last:border-0">
              {row.values.map((v, i) => (
                <td
                  key={i}
                  className={cn(
                    "py-3 pr-4 whitespace-nowrap",
                    i === 0 ? "font-heading text-lg" : "text-muted-foreground"
                  )}
                >
                  {v}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
