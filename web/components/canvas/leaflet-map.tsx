"use client";

import * as React from "react";
import L from "leaflet";

export type MapPoint = {
  lat: number;
  lng: number;
  label?: string;
  detail?: string;
  /** Optional status accent — rendered as a 10px dot per DESIGN.md */
  color?: string;
};

/** CARTO Positron — light, minimal basemap (matches present_map "positron" style) */
const TILE_URL =
  "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";
const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>';

function computeCenter(
  points: MapPoint[],
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

function createMarkerIcon(color?: string): L.DivIcon {
  const statusDot = color
    ? `<span class="resights-marker-status" style="background:${escapeAttr(color)}"></span>`
    : "";
  return L.divIcon({
    className: "resights-marker-icon",
    html: `<span class="resights-marker-pin">${statusDot}</span>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    popupAnchor: [0, -12],
  });
}

function popupHtml(point: MapPoint): string {
  const parts: string[] = [];
  if (point.label) {
    parts.push(`<div class="resights-map-popup-title">${escapeHtml(point.label)}</div>`);
  }
  if (point.detail) {
    parts.push(`<div class="resights-map-popup-detail">${escapeHtml(point.detail)}</div>`);
  }
  return parts.length ? `<div class="resights-map-popup">${parts.join("")}</div>` : "";
}

/**
 * Imperative Leaflet map — avoids react-leaflet MapContainer re-init errors
 * under React Strict Mode / streaming re-renders.
 */
export default function LeafletMap({
  points,
  center,
  zoom = 12,
}: {
  points: MapPoint[];
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

    const leafletEl = el as HTMLDivElement & { _leaflet_id?: number };
    if (leafletEl._leaflet_id != null) {
      delete leafletEl._leaflet_id;
      el.replaceChildren();
    }

    const map = L.map(el, {
      scrollWheelZoom: true,
      zoomControl: false,
    }).setView(mapCenter, zoom);

    L.control.zoom({ position: "topright" }).addTo(map);

    L.tileLayer(TILE_URL, {
      attribution: TILE_ATTRIBUTION,
      maxZoom: 20,
      subdomains: "abcd",
    }).addTo(map);

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
      const marker = L.marker([p.lat, p.lng], {
        icon: createMarkerIcon(p.color),
      });

      const html = popupHtml(p);
      if (html) marker.bindPopup(html, { className: "resights-leaflet-popup" });

      marker.addTo(group);
    }

    if (valid.length > 1) {
      const bounds = L.latLngBounds(
        valid.map((p) => [p.lat, p.lng] as [number, number])
      );
      map.fitBounds(bounds, { padding: [32, 32], maxZoom: 15 });
    } else if (valid.length === 1) {
      map.setView([valid[0]!.lat, valid[0]!.lng], Math.max(zoom, 14), {
        animate: false,
      });
    }
  }, [valid, zoom]);

  return (
    <div
      ref={containerRef}
      className="leaflet-host h-full w-full min-h-[280px]"
      aria-label="Interactive map"
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

function escapeAttr(value: string): string {
  return value.replace(/["'<>]/g, "");
}
