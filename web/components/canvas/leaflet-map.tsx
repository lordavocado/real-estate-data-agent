"use client";

import * as React from "react";
import { CircleMarker, MapContainer, Popup, TileLayer } from "react-leaflet";

type Point = {
  lat: number;
  lng: number;
  label?: string;
  detail?: string;
};

const OSM_TILES =
  "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

/**
 * Leaflet/React-Leaflet body of the map artifact. Loaded dynamically and
 * with `ssr: false` so we don't try to touch `window` server-side.
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
  const valid = points.filter(
    (p) => Number.isFinite(p.lat) && Number.isFinite(p.lng)
  );

  const fallbackCenter: [number, number] = center
    ? [center.lat, center.lng]
    : valid.length
    ? [
        valid.reduce((s, p) => s + p.lat, 0) / valid.length,
        valid.reduce((s, p) => s + p.lng, 0) / valid.length,
      ]
    : [55.6761, 12.5683]; // Copenhagen

  return (
    <MapContainer
      center={fallbackCenter}
      zoom={zoom}
      scrollWheelZoom
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url={OSM_TILES}
      />
      {valid.map((p, i) => (
        <CircleMarker
          key={i}
          center={[p.lat, p.lng]}
          radius={10}
          pathOptions={{
            color: "#0a0a0a",
            fillColor: "#0a0a0a",
            fillOpacity: 0.6,
            weight: 2,
          }}
        >
          {(p.label || p.detail) && (
            <Popup>
              <div className="text-sm">
                {p.label && (
                  <div className="font-semibold">{p.label}</div>
                )}
                {p.detail && (
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    {p.detail}
                  </div>
                )}
              </div>
            </Popup>
          )}
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
