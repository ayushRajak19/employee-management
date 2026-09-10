import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import countries from "world-countries";
import type { GeoNodeDto } from "@mobius-ems/shared";
import { salesApi } from "../salesApi";
import { GeoSalesMap } from "./GeoSalesMap";

export const CountrySales = () => {
  const query = useQuery({ queryKey: ["sales", "countries"], queryFn: salesApi.countries });
  const [selected, setSelected] = useState("");
  const rows = new Map<string, NonNullable<typeof query.data>["items"][number]>();
  const nodes: GeoNodeDto[] = [];
  for (const item of query.data?.items ?? []) {
    const name = item.country.trim().toLowerCase();
    const country = countries.find((entry) => [entry.name.common, entry.name.official, entry.cca2, entry.cca3, ...entry.altSpellings].some((alias) => alias.toLowerCase() === name));
    const key = country?.name.common ?? item.country;
    const existing = rows.get(key);
    if (existing) {
      existing.leads += item.leads; existing.customers += item.customers; existing.partners += item.partners; existing.converted += item.converted;
      for (const field of ["pipeline", "revenue"] as const) for (const [currency, amount] of Object.entries(item[field])) existing[field][currency] = (existing[field][currency] || 0) + amount;
    } else {
      rows.set(key, { ...item, country: key, pipeline: { ...item.pipeline }, revenue: { ...item.revenue } });
      if (country) nodes.push({ _id: key, name: key, code: country.cca2, type: "COUNTRY", ancestors: [], depth: 1, location: { type: "Point", coordinates: [country.latlng[1], country.latlng[0]] } });
    }
  }
  const active = rows.get(selected);
  const money = (values: Record<string, number>) => Object.entries(values).map(([currency, amount]) => currency + " " + amount.toLocaleString("en-IN")).join(" · ") || "0";
  return <section className="mt-6 space-y-5">
    <h2 className="text-xl font-semibold">Sales by country</h2>
    <p className="text-sm text-slate-500">All-time records you can access. Select a country or click pins on the map to see exact lead and customer locations.</p>
    {query.isLoading ? <p>Loading countries…</p> : query.isError ? <p role="alert" className="text-red-600">{query.error.message}</p> : <>
      <GeoSalesMap nodes={nodes} locations={query.data?.locations} selectedId={selected} onSelect={setSelected} metricLabel="Customers" metricValue={active ? String(active.customers) : undefined}/>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{[...rows.values()].sort((a,b) => a.country.localeCompare(b.country)).map((row) => <button key={row.country} aria-pressed={selected === row.country} onClick={() => setSelected(row.country)} className="rounded-xl border bg-white p-4 text-left hover:border-teal-600"><strong>{row.country}</strong><p>{row.customers} customers · {row.leads} leads</p></button>)}</div>
      {!rows.size && <p>Add a lead with its country to see your first country here.</p>}
      {active && <section aria-live="polite" className="rounded-xl border bg-white p-5"><h3 className="text-xl font-semibold">{active.country} dashboard</h3><div className="mt-4 grid gap-4 sm:grid-cols-3"><p>Leads: {active.leads}</p><p>Customers: {active.customers}</p><p>Converted leads: {active.converted}</p><p>Partners: {active.partners}</p><p>Open pipeline: {money(active.pipeline)}</p><p>Recorded revenue: {money(active.revenue)}</p></div><p className="mt-4 text-sm text-slate-500">Revenue includes confirmed lead sales and won deals. Create a new deal only for additional business with an existing customer.</p></section>}
    </>}
  </section>;
};
