"use client";

import * as React from "react";
import L from "leaflet";

type Point = {
  lat: number;
  lng: number;
  label?: string;
  detail?: string;
};

const OSM_TILES = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

function computeCenter(
  points: Point[],
  center?: { lat: number; lng: number }
): [number, number] {
  if (center) return [center.lat, center.lng];
  const valid = points.filter(
    (p) => Number.isFinite(p.lat) && Number.isFinite(p.lng)
  );
  if (valid.length) {
    return [
      valid.reduce((s, p) => s + p.lat, 0) / valid.length,
      valid.reduce((s, p) => s + p.lng, 0) / valid.length,
    ];
  }
  return [55.6761, 12.5683];
}

/**
 * Imperative Leaflet map — avoids react-leaflet MapContainer re-init errors
 * ("Map container is already initialized") under React Strict Mode / streaming.
 */
export default function LeafletMap({
  points,
  center,
  zoom = 12,
}: {
  points: Point[];
  center?: { lat: number; lng: number };
  zoom?: number;
}) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const mapRef = React.useRef<L.Map | null>(null);
  const markersRef = React.useRef<L.LayerGroup | null>(null);

  const valid = React.useMemo(
    () => points.filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng)),
    [points]
  );

  const mapCenter = React.useMemo(
    () => computeCenter(valid, center),
    [valid, center]
  );

  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // Strict-mode / HMR can leave a stale Leaflet id on the same DOM node.
    const leafletEl = el as HTMLDivElement & { _leaflet_id?: number };
    if (leafletEl._leaflet_id != null) {
      delete leafletEl._leaflet_id;
      el.replaceChildren();
    }

    const map = L.map(el, { scrollWheelZoom: true }).setView(mapCenter, zoom);
    L.tileLayer(OSM_TILES, { attribution: OSM_ATTRIBUTION }).addTo(map);

    mapRef.current = map;
    markersRef.current = L.layerGroup().addTo(map);

    const ro = new ResizeObserver(() => map.invalidateSize());
    ro.observe(el);
    requestAnimationFrame(() => map.invalidateSize());

    return () => {
      ro.disconnect();
      map.remove();
      mapRef.current = null;
      markersRef.current = null;
    };
    // Init once per DOM mount — center/zoom/points sync in effects below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    mapRef.current?.setView(mapCenter, zoom, { animate: false });
  }, [mapCenter, zoom]);

  React.useEffect(() => {
    const map = mapRef.current;
    const group = markersRef.current;
    if (!map || !group) return;

    group.clearLayers();

    for (const p of valid) {
      const marker = L.circleMarker([p.lat, p.lng], {
        radius: 10,
        color: "#0a0a0a",
        fillColor: "#0a0a0a",
        fillOpacity: 0.6,
        weight: 2,
      });

      if (p.label || p.detail) {
        const parts: string[] = [];
        if (p.label) parts.push(`<strong>${escapeHtml(p.label)}</strong>`);
        if (p.detail) {
          parts.push(
            `<div style="font-size:12px;color:#737373;margin-top:2px">${escapeHtml(p.detail)}</div>`
          );
        }
        marker.bindPopup(
          `<div style="font-size:14px;line-height:1.4">${parts.join("")}</div>`
        );
      }

      marker.addTo(group);
    }

    if (valid.length > 1) {
      const bounds = L.latLngBounds(
        valid.map((p) => [p.lat, p.lng] as [number, number])
      );
      map.fitBounds(bounds, { padding: [24, 24], maxZoom: zoom });
    } else if (valid.length === 1) {
      map.setView([valid[0]!.lat, valid[0]!.lng], zoom, { animate: false });
    }
  }, [valid, zoom]);

  return (
    <div
      ref={containerRef}
      className="leaflet-host h-full w-full min-h-[280px]"
    />
  );
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
