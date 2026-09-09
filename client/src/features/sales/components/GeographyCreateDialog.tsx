import { useEffect, useMemo, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import type { GeoNodeDto } from "@mobius-ems/shared";
import countryMaster from "world-countries";
import { Globe2, MapPin, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

type GeoLevel = Exclude<GeoNodeDto["type"], "GLOBAL">;
export interface CreateGeographyInput { name: string; code: string; type: GeoLevel; parent: string; location?: { type: "Point"; coordinates: [number, number] } }

const parentTypes: Record<GeoLevel, GeoNodeDto["type"]> = {
  COUNTRY: "GLOBAL",
  STATE: "COUNTRY",
  DISTRICT: "STATE",
  CITY: "DISTRICT",
  AREA: "CITY",
  PINCODE: "AREA",
};
const levels: { value: GeoLevel; label: string; help: string }[] = [
  { value: "COUNTRY", label: "Country", help: "Choose from the ISO country master." },
  { value: "STATE", label: "State / Province", help: "Add below an existing country." },
  { value: "DISTRICT", label: "District / County", help: "Add below an existing state or province." },
  { value: "CITY", label: "City", help: "Add below an existing district." },
  { value: "AREA", label: "Area", help: "Add a local sales area below a city." },
  { value: "PINCODE", label: "Pincode / Postal code", help: "Add below an existing area." },
];
const countryOptions = countryMaster
  .map((country) => ({ code: country.cca2, name: country.name.common, latitude: country.latlng[0], longitude: country.latlng[1] }))
  .sort((a, b) => a.name.localeCompare(b.name));

export const GeographyCreateDialog = ({
  open,
  nodes,
  pending,
  error,
  onClose,
  onSubmit,
}: {
  open: boolean;
  nodes: GeoNodeDto[];
  pending: boolean;
  error?: string;
  onClose: () => void;
  onSubmit: (input: CreateGeographyInput) => void;
}) => {
  const [level, setLevel] = useState<GeoLevel>("COUNTRY");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [parent, setParent] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const globalNode = nodes.find((node) => node.type === "GLOBAL");
  const expectedParentType = parentTypes[level];
  const parentOptions = nodes.filter((node) => node.type === expectedParentType);
  const existingCountryCodes = useMemo(() => new Set(nodes.filter((node) => node.type === "COUNTRY").map((node) => node.code.toUpperCase())), [nodes]);
  const availableCountries = countryOptions.filter((country) => !existingCountryCodes.has(country.code));

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", closeOnEscape);
    return () => { document.body.style.overflow = previousOverflow; window.removeEventListener("keydown", closeOnEscape); };
  }, [onClose, open]);

  useEffect(() => {
    if (!open) return;
    setLevel("COUNTRY"); setName(""); setCode(""); setParent(globalNode?._id ?? ""); setLatitude(""); setLongitude("");
  }, [globalNode?._id, open]);

  if (!open) return null;
  const levelMeta = levels.find((item) => item.value === level)!;
  const valid = Boolean(name && code && parent);
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!valid) return;
    const lat = Number(latitude); const lng = Number(longitude);
    onSubmit({ name, code, type: level, parent, ...(latitude && longitude && Number.isFinite(lat) && Number.isFinite(lng) ? { location: { type: "Point", coordinates: [lng, lat] as [number, number] } } : {}) });
  };
  const changeLevel = (next: GeoLevel) => {
    setLevel(next); setName(""); setCode(""); setLatitude(""); setLongitude("");
    const expected = parentTypes[next];
    const preferredParent = next === "COUNTRY" ? globalNode?._id : nodes.find((node) => node.type === expected)?._id;
    setParent(preferredParent ?? "");
  };
  const selectCountry = (countryCode: string) => {
    const country = countryOptions.find((item) => item.code === countryCode);
    setCode(country?.code ?? ""); setName(country?.name ?? ""); setLatitude(country ? String(country.latitude) : ""); setLongitude(country ? String(country.longitude) : ""); setParent(globalNode?._id ?? "");
  };

  return createPortal(
    <div className="fixed inset-0 z-[2000] grid place-items-center overflow-y-auto bg-ink/45 p-4 backdrop-blur-sm" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <form role="dialog" aria-modal="true" aria-labelledby="add-geography-title" className="relative z-[2001] my-6 w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl" onSubmit={submit}>
        <div className="flex items-start justify-between border-b px-6 py-5"><div><p className="text-xs font-semibold uppercase tracking-widest text-brand-700">Geographic master</p><h2 id="add-geography-title" className="mt-1 text-xl font-semibold">Add sales geography</h2><p className="mt-1 text-sm text-slate-500">Build coverage in the correct geographic hierarchy.</p></div><button type="button" aria-label="Close" className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700" onClick={onClose}><X size={18}/></button></div>
        <div className="max-h-[calc(100vh-13rem)] overflow-y-auto p-6">
          <div className="rounded-xl bg-brand-50 p-4 text-sm text-brand-900"><div className="flex items-center gap-2 font-medium"><Globe2 size={17}/> World → Country → State → District → City → Area</div><p className="mt-1 text-xs text-brand-700">Only configured sales geographies appear on the map; the complete country master is available below.</p></div>
          <div className="mt-5 space-y-4">
            <label className="block text-sm font-medium">Geography level<select className="mt-2 h-11 w-full rounded-xl border bg-white px-3" value={level} onChange={(event) => changeLevel(event.target.value as GeoLevel)}>{levels.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select><span className="mt-1 block text-xs font-normal text-slate-400">{levelMeta.help}</span></label>
            {level === "COUNTRY" ? <label className="block text-sm font-medium">Country<select required className="mt-2 h-11 w-full rounded-xl border bg-white px-3" value={code} onChange={(event) => selectCountry(event.target.value)}><option value="">Select country</option>{availableCountries.map((country) => <option key={country.code} value={country.code}>{country.name} ({country.code})</option>)}</select><span className="mt-1 block text-xs font-normal text-slate-400">Name, ISO code and map position are filled automatically.</span></label> : <><label className="block text-sm font-medium">Name<Input required className="mt-2" value={name} onChange={(event) => setName(event.target.value)}/></label><label className="block text-sm font-medium">Code<Input required className="mt-2" value={code} onChange={(event) => setCode(event.target.value.toUpperCase())}/><span className="mt-1 block text-xs font-normal text-slate-400">Use a short unique code, for example MH or RAIPUR.</span></label><div className="grid grid-cols-2 gap-3"><label className="block text-sm font-medium">Latitude<Input type="number" min="-90" max="90" step="any" className="mt-2" value={latitude} onChange={(event) => setLatitude(event.target.value)}/></label><label className="block text-sm font-medium">Longitude<Input type="number" min="-180" max="180" step="any" className="mt-2" value={longitude} onChange={(event) => setLongitude(event.target.value)}/></label></div><p className="text-xs text-slate-400">Coordinates are optional, but required for this location to receive its own marker on the map.</p></>}
            <label className="block text-sm font-medium">Parent geography<select required disabled={level === "COUNTRY" && Boolean(globalNode)} className="mt-2 h-11 w-full rounded-xl border bg-white px-3 disabled:bg-slate-50 disabled:text-slate-500" value={parent} onChange={(event) => setParent(event.target.value)}><option value="">Select {expectedParentType.toLowerCase()}</option>{parentOptions.map((node) => <option key={node._id} value={node._id}>{node.name} ({node.code})</option>)}</select></label>
            {!parentOptions.length && <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">Create or request the required {expectedParentType.toLowerCase()} parent before adding this level.</div>}
            {name && code && <div className="flex items-center gap-3 rounded-xl border p-3"><span className="grid size-9 place-items-center rounded-lg bg-brand-50 text-brand-700"><MapPin size={17}/></span><div><p className="text-sm font-medium">{name}</p><p className="text-xs text-slate-400">{levelMeta.label} · {code}</p></div></div>}
          </div>
          {error && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        </div>
        <div className="flex justify-end gap-2 border-t bg-slate-50 px-6 py-4"><Button type="button" variant="ghost" onClick={onClose}>Cancel</Button><Button disabled={!valid || pending}>{pending ? "Saving..." : "Add geography"}</Button></div>
      </form>
    </div>,
    document.body,
  );
};
