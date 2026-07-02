"use client";

import * as React from "react";

const ALIGN_CLASS: Record<string, string> = {
  left: "text-left",
  right: "text-right",
  center: "text-center",
};

export interface ArtifactTableProps {
  title?: string;
  footer?: string;
  rows?: Array<Record<string, unknown>>;
  columns?: Array<{
    header: string;
    key: string;
    align?: "left" | "right" | "center";
    format?:
      | "number"
      | "currency_dkk"
      | "currency_eur"
      | "percentage"
      | "area_m2"
      | "date"
      | "text";
  }>;
  className?: string;
}

/**
 * Renders the `present_table` tool output. Columns are rendered with the
 * same format helpers as the underlying tool, including Danish-style number
 * and currency. Falls back to the markdown body the tool exposes when no
 * structured rows/columns are available.
 */
export function ArtifactTable({
  title,
  footer,
  rows = [],
  columns = [],
  className,
}: ArtifactTableProps) {
  if (!rows.length || !columns.length) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        Empty table.
      </div>
    );
  }

  return (
    <div className={"flex h-full w-full flex-col gap-3 " + (className ?? "")}>
      {title && (
        <h3 className="text-base font-semibold tracking-tight">{title}</h3>
      )}
      <div className="flex-1 overflow-auto rounded-[10px] border border-border scrollable">
        <table className="w-full caption-bottom text-sm">
          <thead className="sticky top-0 z-10 bg-muted/80 backdrop-blur supports-[backdrop-filter]:bg-muted/60">
            <tr>
              {columns.map((c) => (
                <th
                  key={c.key}
                  scope="col"
                  className={
                    "px-3 py-2 font-medium text-muted-foreground " +
                    (ALIGN_CLASS[c.align ?? "left"] ?? "text-left")
                  }
                >
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr
                key={idx}
                className="border-t border-border hover:bg-muted/40 transition-colors"
              >
                {columns.map((c) => {
                  const value = resolveKey(row, c.key);
                  return (
                    <td
                      key={c.key}
                      className={
                        "px-3 py-2 align-top " +
                        (ALIGN_CLASS[c.align ?? "left"] ?? "text-left")
                      }
                    >
                      {formatCellvalue(value, c.format)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {footer && (
        <p className="text-xs italic text-muted-foreground">{footer}</p>
      )}
    </div>
  );
}

function resolveKey(obj: unknown, key: string): unknown {
  if (obj === null || obj === undefined) return null;
  if (typeof obj !== "object") return null;
  const parts = key.split(".");
  let cur: unknown = obj;
  for (const p of parts) {
    if (typeof cur !== "object" || cur === null) return null;
    cur = (cur as Record<string, unknown>)[p];
  }
  return cur;
}

function formatCellvalue(value: unknown, format?: string): string {
  if (value === null || value === undefined) return "—";
  switch (format) {
    case "number":
      return typeof value === "number"
        ? value.toLocaleString("da-DK")
        : String(value);
    case "currency_dkk":
      return typeof value === "number"
        ? `${value.toLocaleString("da-DK")} kr.`
        : String(value);
    case "currency_eur":
      return typeof value === "number"
        ? `€${value.toLocaleString("da-DK")}`
        : String(value);
    case "percentage":
      return typeof value === "number"
        ? `${value.toFixed(1)}%`
        : String(value);
    case "area_m2":
      return typeof value === "number"
        ? `${value.toLocaleString("da-DK")} m²`
        : String(value);
    case "date": {
      if (typeof value === "string" || typeof value === "number") {
        const d = new Date(value);
        if (!isNaN(d.getTime()))
          return d.toLocaleDateString("da-DK", {
            year: "numeric",
            month: "short",
            day: "2-digit",
          });
      }
      return String(value);
    }
    default:
      return typeof value === "object"
        ? JSON.stringify(value)
        : String(value);
  }
}
