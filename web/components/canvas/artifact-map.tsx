"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MapPayload } from "@/lib/artifacts";

const LeafletMap = dynamic(() => import("./leaflet-map"), {
  ssr: false,
  loading: () => (
    <div className="grid h-full min-h-[280px] w-full place-items-center bg-muted text-sm text-muted-foreground">
      Loading map…
    </div>
  ),
});

export interface ArtifactMapProps {
  data: MapPayload;
  className?: string;
  /** Hide title when parent already shows one */
  hideTitle?: boolean;
}

export function ArtifactMap({ data, className, hideTitle }: ArtifactMapProps) {
  const points = data.points ?? [];
  const hasPoints = points.some(
    (p) => typeof p?.lat === "number" && typeof p?.lng === "number"
  );

  if (!hasPoints) {
    return (
      <div
        className={cn(
          "grid h-full min-h-[200px] w-full place-items-center rounded-md bg-muted text-sm text-muted-foreground",
          className
        )}
      >
        <div className="flex items-center gap-2">
          <MapPin className="size-4 shrink-0" aria-hidden />
          No coordinates in this map.
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex h-full w-full min-w-0 flex-col gap-2", className)}>
      {!hideTitle && data.title ? (
        <div className="flex items-baseline justify-between gap-2 px-0.5">
          <h3 className="text-sm font-medium tracking-tight text-foreground">
            {data.title}
          </h3>
          <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
            {points.length} {points.length === 1 ? "marker" : "markers"}
          </span>
        </div>
      ) : null}
      <div className="min-h-[280px] flex-1 overflow-hidden rounded-md shadow-border">
        <LeafletMap
          points={points}
          center={data.center}
          zoom={data.zoom}
        />
      </div>
    </div>
  );
}
