import { useMemo, useState } from "react";
import type { GeoNodeDto } from "@mobius-ems/shared";
import { CircleMarker, MapContainer, Popup, TileLayer, useMapEvents } from "react-leaflet";
import { salesMapTiles } from "./mapTiles";
import type { EmployeeMapItem } from "../salesApi";

export type EmployeeMapMode = "INDIVIDUAL" | "DEPARTMENT" | "DESIGNATION" | "MANAGER" | "DENSITY" | "SALES_TERRITORY";
const hashColor = (value: string) => { let hash = 0; for (const character of value) hash = Math.imul(31, hash) + character.charCodeAt(0) | 0; return `hsl(${Math.abs(hash) % 360} 68% 43%)`; };
const idOf = (value: unknown): string | undefined => typeof value === "string" ? value : value && typeof value === "object" && "_id" in value ? String((value as { _id: unknown })._id) : undefined;
const ZoomListener = ({ onZoom }: { onZoom: (zoom: number) => void }) => { useMapEvents({ zoomend: (event) => onZoom(event.target.getZoom()) }); return null; };

export const EmployeeMapCanvas = ({ employees, geography, mode }: { employees: EmployeeMapItem[]; geography: GeoNodeDto[]; mode: EmployeeMapMode }) => {
  const [zoom, setZoom] = useState(2);
  const locations = useMemo(() => new Map(geography.filter((node) => node.location).map((node) => [node._id, node.location!.coordinates])), [geography]);
  const points = employees.flatMap((employee) => {
    const own = employee.workLocation?.coordinates?.coordinates;
    const geoId = idOf(employee.workLocation?.geoNode);
    const point = own ?? (geoId ? locations.get(geoId) : undefined);
    if (!point) return [];
    const coordinates: [number, number] = [point[0], point[1]];
    const groupId = mode === "DEPARTMENT" ? idOf(employee.department) : mode === "DESIGNATION" ? idOf(employee.designation) : mode === "MANAGER" ? idOf(employee.reportingManager) : mode === "SALES_TERRITORY" ? idOf(employee.salesTerritory) : employee._id;
    const color = mode === "INDIVIDUAL" ? employee.markerColor : mode === "DENSITY" ? "#dc2626" : hashColor(groupId ?? "unassigned");
    return [{ employee, coordinates, color }];
  });
  const precision = zoom < 5 ? 0 : zoom < 9 ? 1 : 3;
  const clusters = new Map<string, typeof points>();
  if (zoom < 10) for (const point of points) { const key = `${point.coordinates[0].toFixed(precision)}:${point.coordinates[1].toFixed(precision)}`; const group = clusters.get(key) ?? []; group.push(point); clusters.set(key, group); }
  const rendered = zoom < 10 ? [...clusters.values()].map((group) => ({ ...group[0], count: group.length })) : points.map((point, index) => { const angle = (index * 137.5) * Math.PI / 180; return { ...point, coordinates: [point.coordinates[0] + Math.cos(angle) * .002, point.coordinates[1] + Math.sin(angle) * .002] as [number, number], count: 1 }; });
  return <div className="h-[500px] overflow-hidden rounded-2xl border bg-slate-100"><MapContainer center={[20, 10]} zoom={2} className="h-full w-full" scrollWheelZoom><ZoomListener onZoom={setZoom}/><TileLayer {...salesMapTiles}/>{rendered.map(({ employee, coordinates, color, count }, index) => <CircleMarker key={`${employee._id}-${index}`} center={[coordinates[1], coordinates[0]]} radius={count > 1 ? Math.min(24, 8 + count) : 8} pathOptions={{ color, fillColor: color, fillOpacity: .78, weight: 2 }}><Popup>{count > 1 ? <strong>{count} employees</strong> : <><strong>{employee.firstName} {employee.lastName}</strong><br/>{employee.department?.name ?? "No department"}<br/>{employee.designation?.name ?? "No designation"}{employee.salesTerritory ? <><br/>{employee.salesTerritory.name}</> : null}<br/><a href={`/employees/${employee._id}`} className="text-brand-700 underline">Open Employee 360</a></>}</Popup></CircleMarker>)}</MapContainer></div>;
};
