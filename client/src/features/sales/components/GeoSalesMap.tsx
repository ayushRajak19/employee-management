import type { GeoNodeDto } from "@mobius-ems/shared";
import { CircleMarker, MapContainer, Popup, TileLayer } from "react-leaflet";

export const GeoSalesMap = ({ nodes, selectedId, onSelect, metricLabel, metricValue }: {
  nodes: GeoNodeDto[];
  selectedId?: string;
  onSelect: (id: string) => void;
  metricLabel: string;
  metricValue?: string;
}) => {
  const located = nodes.filter((node) => node.type !== "GLOBAL" && node.location?.coordinates.length === 2);
  return <div className="relative isolate z-0 h-[420px] overflow-hidden rounded-2xl border bg-slate-100"><MapContainer center={[20, 10]} zoom={2} className="h-full w-full" scrollWheelZoom><TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/>{located.map((node) => { const [longitude, latitude] = node.location!.coordinates; const selected = node._id === selectedId; return <CircleMarker key={node._id} center={[latitude, longitude]} radius={selected ? 13 : 8} pathOptions={{ color: selected ? "#0f766e" : "#2563eb", fillColor: selected ? "#14b8a6" : "#60a5fa", fillOpacity: .75, weight: selected ? 3 : 2 }} eventHandlers={{ click: () => onSelect(node._id) }}><Popup><strong>{node.name}</strong><br/>{node.type}{selected && metricValue ? <><br/>{metricLabel}: {metricValue}</> : null}</Popup></CircleMarker>; })}</MapContainer></div>;
};
