import type { SalesTrendPoint } from "@mobius-ems/shared";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export const SalesTrendChart = ({ items }: { items: SalesTrendPoint[] }) => <div className="h-72 w-full" aria-label="Revenue trend chart"><ResponsiveContainer width="100%" height="100%"><LineChart data={items}><CartesianGrid strokeDasharray="3 3" vertical={false}/><XAxis dataKey="_id" tickLine={false}/><YAxis tickLine={false}/><Tooltip/><Line type="monotone" dataKey="revenue" stroke="#0f766e" strokeWidth={3} dot={{ r: 4 }}/></LineChart></ResponsiveContainer></div>;
