import { useEffect } from "react";
import type { GeoNodeDto } from "@mobius-ems/shared";
import { CircleMarker, MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import { salesMapTiles } from "./mapTiles";
import type { SalesLocationPin } from "../salesApi";

interface GeoSalesMapProps {
  nodes: GeoNodeDto[];
  locations?: SalesLocationPin[];
  selectedId?: string;
  onSelect: (id: string) => void;
  metricLabel: string;
  metricValue?: string;
}

const customerPin = L.divIcon({
  className: "custom-customer-pin",
  html: `<div style="display:flex;align-items:center;justify-content:center;width:24px;height:24px;background:#059669;color:white;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:2px solid #ffffff;box-shadow:0 2px 5px rgba(0,0,0,0.3);"><div style="width:6px;height:6px;background:#ffffff;border-radius:50%;transform:rotate(45deg);"></div></div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 24],
  popupAnchor: [0, -24],
});

const leadPin = L.divIcon({
  className: "custom-lead-pin",
  html: `<div style="display:flex;align-items:center;justify-content:center;width:24px;height:24px;background:#2563eb;color:white;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:2px solid #ffffff;box-shadow:0 2px 5px rgba(0,0,0,0.3);"><div style="width:6px;height:6px;background:#ffffff;border-radius:50%;transform:rotate(45deg);"></div></div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 24],
  popupAnchor: [0, -24],
});

const MapPanToSelected = ({
  nodes,
  selectedId,
}: {
  nodes: GeoNodeDto[];
  selectedId?: string;
}) => {
  const map = useMap();
  useEffect(() => {
    if (!selectedId) return;
    const found = nodes.find((node) => node._id === selectedId);
    if (found?.location?.coordinates?.length === 2) {
      const [lng, lat] = found.location.coordinates;
      map.flyTo([lat, lng], 5, { duration: 1.2 });
    }
  }, [selectedId, nodes, map]);
  return null;
};

export const GeoSalesMap = ({
  nodes,
  locations = [],
  selectedId,
  onSelect,
  metricLabel,
  metricValue,
}: GeoSalesMapProps) => {
  const located = nodes.filter((node) => node.type !== "GLOBAL" && node.location?.coordinates.length === 2);

  return (
    <div className="relative isolate z-0 h-[460px] overflow-hidden rounded-2xl border bg-slate-100 shadow-soft">
      <MapContainer
        center={[20, 10]}
        zoom={2}
        className="h-full w-full"
        scrollWheelZoom
      >
        <TileLayer
          {...salesMapTiles}
        />
        <MapPanToSelected nodes={nodes} selectedId={selectedId} />

        {/* Country Overview Centroids */}
        {located.map((node) => {
          const [longitude, latitude] = node.location!.coordinates;
          const selected = node._id === selectedId;
          return (
            <CircleMarker
              key={node._id}
              center={[latitude, longitude]}
              radius={selected ? 14 : 9}
              pathOptions={{
                color: selected ? "#0f766e" : "#0284c7",
                fillColor: selected ? "#14b8a6" : "#38bdf8",
                fillOpacity: 0.65,
                weight: selected ? 3 : 2,
              }}
              eventHandlers={{ click: () => onSelect(node._id) }}
            >
              <Popup>
                <div className="text-xs">
                  <span className="font-bold text-slate-900">{node.name}</span>
                  <br />
                  <span className="text-slate-500">{node.type} overview</span>
                  {selected && metricValue ? (
                    <>
                      <br />
                      <span className="font-medium text-teal-700">
                        {metricLabel}: {metricValue}
                      </span>
                    </>
                  ) : null}
                </div>
              </Popup>
            </CircleMarker>
          );
        })}

        {/* Precise Lead and Customer Pins */}
        {locations.map((loc) => {
          const [lng, lat] = loc.coordinates;
          const isCustomer = loc.entity === "customer";
          return (
            <Marker
              key={`${loc.entity}-${loc._id}`}
              position={[lat, lng]}
              icon={isCustomer ? customerPin : leadPin}
            >
              <Popup>
                <div className="min-w-[170px] space-y-1 text-xs">
                  <div className="flex items-center justify-between gap-2 border-b pb-1">
                    <span className="font-semibold text-slate-900">{loc.name}</span>
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                        isCustomer ? "bg-emerald-100 text-emerald-800" : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {isCustomer ? "Customer" : "Lead"}
                    </span>
                  </div>
                  {loc.companyName && (
                    <div className="text-slate-600">
                      Company: <span className="font-medium text-slate-800">{loc.companyName}</span>
                    </div>
                  )}
                  <div className="text-slate-500">
                    Location: <span className="font-medium text-slate-700">{loc.state ? `${loc.state}, ` : ""}{loc.country}</span>
                  </div>
                  <div className="text-[10px] text-slate-400">
                    📍 {lat.toFixed(4)}° N, {lng.toFixed(4)}° E
                  </div>
                  {Boolean(loc.value) && (
                    <div className="border-t pt-1 font-semibold text-emerald-700">
                      Value: {loc.currency ?? "INR"} {Math.round(loc.value ?? 0).toLocaleString("en-IN")}
                    </div>
                  )}
                  {loc.phone && (
                    <div className="text-slate-500">
                      Phone: <span className="text-slate-700">{loc.phone}</span>
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Map Legend */}
      <div className="pointer-events-none absolute bottom-3 right-3 z-[1000] rounded-xl border border-slate-200/80 bg-white/95 px-3 py-2 text-[11px] font-medium shadow-md backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-blue-600"></span>
            <span className="text-slate-700">Leads</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-600"></span>
            <span className="text-slate-700">Customers</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-sky-400"></span>
            <span className="text-slate-700">Country Area</span>
          </div>
        </div>
      </div>
    </div>
  );
};
