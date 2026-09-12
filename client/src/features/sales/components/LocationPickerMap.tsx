import { useEffect, useMemo } from "react";
import { CircleMarker, MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { salesMapTiles } from "./mapTiles";
import { MapPin } from "lucide-react";

interface LocationPickerMapProps {
  lat?: number;
  lng?: number;
  onChange: (lat: number, lng: number) => void;
  label?: string;
  zoom?: number;
}

const pinIcon = L.divIcon({
  className: "custom-location-pin",
  html: `<div style="display:flex;align-items:center;justify-content:center;width:28px;height:28px;background:#0f766e;color:white;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:2px solid #ffffff;box-shadow:0 3px 6px rgba(0,0,0,0.35);cursor:grab;"><div style="width:8px;height:8px;background:#ffffff;border-radius:50%;transform:rotate(45deg);"></div></div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 28],
  popupAnchor: [0, -28],
});

const MapClickHandler = ({ onClick }: { onClick: (lat: number, lng: number) => void }) => {
  useMapEvents({
    click(event) {
      onClick(event.latlng.lat, event.latlng.lng);
    },
  });
  return null;
};

const MapPanTo = ({ lat, lng, zoom }: { lat: number; lng: number; zoom?: number }) => {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], zoom ?? Math.max(map.getZoom(), 7));
  }, [lat, lng, zoom, map]);
  return null;
};

export const LocationPickerMap = ({
  lat,
  lng,
  onChange,
  label,
  zoom = 6,
}: LocationPickerMapProps) => {
  const hasCoords = typeof lat === "number" && typeof lng === "number" && !Number.isNaN(lat) && !Number.isNaN(lng);
  const centerLat = hasCoords ? lat : 20.5937;
  const centerLng = hasCoords ? lng : 78.9629;

  const eventHandlers = useMemo(
    () => ({
      dragend(event: L.DragEndEvent) {
        const marker = event.target as L.Marker;
        const position = marker.getLatLng();
        onChange(position.lat, position.lng);
      },
    }),
    [onChange],
  );

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-3 py-2 text-xs text-slate-600">
        <div className="flex items-center gap-1.5 font-medium text-slate-800">
          <MapPin size={14} className="text-teal-600" />
          <span>{label || "Pinpoint exact location"}</span>
        </div>
        {hasCoords ? (
          <span className="font-mono text-[11px] text-slate-500">
            {lat.toFixed(4)}° N, {lng.toFixed(4)}° E
          </span>
        ) : (
          <span className="text-[11px] text-slate-400">Click map to pin</span>
        )}
      </div>

      <div className="relative isolate z-0 h-[210px] w-full">
        <MapContainer
          center={[centerLat, centerLng]}
          zoom={hasCoords ? zoom : 4}
          className="h-full w-full"
          scrollWheelZoom={false}
        >
          <TileLayer
            {...salesMapTiles}
          />
          <MapClickHandler onClick={onChange} />
          {hasCoords && (
            <>
              <MapPanTo lat={lat} lng={lng} zoom={zoom} />
              <Marker
                position={[lat, lng]}
                icon={pinIcon}
                draggable
                eventHandlers={eventHandlers}
              >
                <Popup>
                  <div className="text-xs">
                    <strong>Selected Location</strong>
                    <br />
                    Lat: {lat.toFixed(5)}, Lng: {lng.toFixed(5)}
                  </div>
                </Popup>
              </Marker>
              <CircleMarker
                center={[lat, lng]}
                radius={16}
                pathOptions={{
                  color: "#0f766e",
                  fillColor: "#14b8a6",
                  fillOpacity: 0.2,
                  weight: 1.5,
                }}
              />
            </>
          )}
        </MapContainer>
      </div>

      <div className="bg-white px-3 py-1.5 text-right text-[11px] text-slate-400">
        Click or drag the pin to set the perfect location on the map
      </div>
    </div>
  );
};
