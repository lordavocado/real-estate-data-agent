"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MapPayload } from "@/lib/artifacts";

/**
 * Leaflet must run only in the browser (it expects `window`). We swallow the
 * import via a dynamic `ssr: false` loader and render a friendly skeleton
 * while it hydrates. The inner LeafletMap component is in a separate file so
 * the SSR boundary is honored.
 */
const LeafletMap = dynamic(() => import("./leaflet-map"), {
  ssr: false,
  loading: () => (
    <div className="grid h-full w-full place-items-center bg-muted/40 text-sm text-muted-foreground">
      Loading map…
    </div>
  ),
});

export interface ArtifactMapProps {
  data: MapPayload;
  className?: string;
}

export function ArtifactMap({ data, className }: ArtifactMapProps) {
  const hasPoints = (data.points ?? []).some(
    (p) => typeof p?.lat === "number" && typeof p?.lng === "number"
  );
  if (!hasPoints) {
    return (
      <div
        className={cn(
          "grid h-full w-full place-items-center bg-muted/40 text-sm text-muted-foreground",
          className
        )}
      >
        <div className="flex items-center gap-2">
          <MapPin className="size-4" />
          No coordinates in this artifact.
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex h-full w-full flex-col gap-3", className)}>
      {data.title && (
        <h3 className="text-base font-semibold tracking-tight">{data.title}</h3>
      )}
      <div className="min-h-[280px] flex-1 overflow-hidden rounded-[10px] border border-border">
        <LeafletMap points={data.points ?? []} center={data.center} zoom={data.zoom} />
      </div>
    </div>
  );
}
