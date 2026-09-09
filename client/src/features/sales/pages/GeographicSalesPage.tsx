import { CountrySales } from "../components/CountrySales";

export const GeographicSalesPage = () => <main className="flex-1 px-5 py-8 sm:px-8"><div className="mx-auto max-w-[1440px]"><p className="text-sm font-medium text-brand-700">Sales Intelligence</p><h1 className="mt-1 text-3xl font-semibold">Country sales &amp; map</h1><p className="mt-2 text-sm text-slate-500">See where your leads and customers are located. Country is selected while creating a lead or customer.</p><CountrySales/></div></main>;
