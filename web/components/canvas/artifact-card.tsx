"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { CardPayload } from "@/lib/artifacts";

const BADGE_VARIANT: Record<
  string,
  "default" | "secondary" | "outline"
> = {
  green: "default",
  yellow: "outline",
  red: "secondary",
  blue: "default",
  gray: "secondary",
};

export interface ArtifactCardViewProps {
  data: CardPayload;
  className?: string;
}

/**
 * Renders the `present_card` tool output as a structured info card:
 * title row with status badge, key/value fields grouped into optional
 * sections, and a footer note.
 */
export function ArtifactCardView({
  data,
  className,
}: ArtifactCardViewProps) {
  return (
    <article
      className={cn(
        "flex h-full w-full flex-col gap-5 overflow-auto scrollable pr-1",
        className
      )}
    >
      <header className="flex flex-col gap-1">
        <div className="flex items-start gap-2">
          <h3 className="text-lg font-semibold tracking-tight">
            {data.title ?? "Card"}
          </h3>
          {data.badge && (
            <Badge
              variant={
                BADGE_VARIANT[data.badge.color ?? "blue"] ?? "secondary"
              }
            >
              {data.badge.text}
            </Badge>
          )}
        </div>
        {data.subtitle && (
          <p className="text-sm text-muted-foreground">{data.subtitle}</p>
        )}
      </header>

      {data.fields?.length ? <FieldGroup fields={data.fields} /> : null}

      {data.sections?.map((section, i) => (
        <section key={i} className="flex flex-col gap-3">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {section.heading}
          </h4>
          <FieldGroup fields={section.fields} />
        </section>
      ))}

      {data.footer && (
        <footer className="border-t border-border pt-3 text-xs italic text-muted-foreground">
          {data.footer}
        </footer>
      )}
    </article>
  );
}

function FieldGroup({
  fields,
}: {
  fields: NonNullable<CardPayload["fields"]>;
}) {
  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-5 gap-y-2.5 text-sm">
      {fields.map((f, i) => (
        <React.Fragment key={i}>
          <dt className="text-muted-foreground">{f.label}</dt>
          <dd
            className={cn(
              "min-w-0",
              f.emphasis && "font-semibold text-foreground"
            )}
          >
            <span className="whitespace-pre-wrap break-words">{f.value}</span>
            {f.detail && (
              <div className="mt-0.5 text-xs text-muted-foreground">
                {f.detail}
              </div>
            )}
          </dd>
        </React.Fragment>
      ))}
    </dl>
  );
}
