import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, BarChart3 } from "lucide-react";
import { Skeleton } from "@/components/ui/Skeleton";
import { skillApi } from "@/features/skills/skillApi";

export const SkillMatrixPage = () => {
  const query = useQuery({ queryKey: ["skills", "heatmap"], queryFn: skillApi.heatmap });
  const spofQuery = useQuery({ queryKey: ["skills", "spof"], queryFn: skillApi.spof });

  const spofSkills = useMemo(() => {
    return new Set(spofQuery.data?.items.map((item) => item.skillName) ?? []);
  }, [spofQuery.data]);

  const matrix = useMemo(() => {
    const employees = new Map<string, { name: string; ratings: Map<string, number> }>();
    const skills = new Set<string>();
    for (const row of query.data?.items ?? []) {
      if (!row.employee) continue;
      skills.add(row.skill.name);
      const current = employees.get(row.employee._id) ?? { name: `${row.employee.firstName} ${row.employee.lastName}`, ratings: new Map<string, number>() };
      current.ratings.set(row.skill.name, row.verifiedRating ?? 0);
      employees.set(row.employee._id, current);
    }
    return { skills: [...skills].sort(), employees: [...employees.values()] };
  }, [query.data]);

  return (
    <main className="flex-1 px-5 py-8 sm:px-8">
      <div className="mx-auto max-w-[1440px]">
        <div>
          <p className="text-sm font-medium text-brand-700">Capability & Succession</p>
          <h1 className="mt-1 text-3xl font-semibold">Verified Skill Matrix & Risk Analysis</h1>
          <p className="mt-2 text-sm text-slate-500">
            Find company expertise, capability concentrations, and Single Point of Failure (SPOF) risks across critical competencies.
          </p>
        </div>

        {/* Matrix Grid */}
        <section className="mt-7 overflow-hidden rounded-2xl border bg-white shadow-soft">
          <div className="border-b p-5">
            <h2 className="font-semibold text-slate-900">Capability Heatmap</h2>
            <p className="text-xs text-slate-400">Verified employee competency ratings (1–10). Columns marked with warning icons represent SPOF competencies.</p>
          </div>
          {query.isLoading ? (
            <div className="p-5"><Skeleton className="h-64"/></div>
          ) : matrix.employees.length === 0 ? (
            <div className="grid min-h-72 place-items-center text-center">
              <div>
                <BarChart3 className="mx-auto text-slate-300"/>
                <p className="mt-3 font-medium">No verified ratings yet</p>
                <p className="mt-1 text-sm text-slate-400">The matrix populates after skills are verified.</p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b bg-slate-50 text-xs text-slate-500">
                  <tr>
                    <th className="sticky left-0 bg-slate-50 px-5 py-3 font-semibold">Employee</th>
                    {matrix.skills.map((skill) => {
                      const isSpof = spofSkills.has(skill);
                      return (
                        <th className={`px-4 py-3 text-center whitespace-nowrap ${isSpof ? "bg-amber-50/70 text-amber-900" : ""}`} key={skill}>
                          <div className="flex items-center justify-center gap-1">
                            {isSpof && <span title="Single Point of Failure"><AlertTriangle size={12} className="text-amber-600" /></span>}
                            <span>{skill}</span>
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {matrix.employees.map((employee) => (
                    <tr key={employee.name}>
                      <td className="sticky left-0 whitespace-nowrap bg-white px-5 py-4 font-medium">{employee.name}</td>
                      {matrix.skills.map((skill) => {
                        const rating = employee.ratings.get(skill);
                        const isSpof = spofSkills.has(skill);
                        return (
                          <td className={`px-4 py-4 text-center ${isSpof && rating ? "bg-amber-50/30" : ""}`} key={skill}>
                            {rating ? (
                              <span
                                className={`inline-grid size-8 place-items-center rounded-lg font-semibold ${rating >= 8 ? "bg-violet-50 text-violet-700" : rating >= 6 ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}
                                aria-label={`${rating} out of 10`}
                              >
                                {rating}
                              </span>
                            ) : (
                              <span className="text-slate-300">—</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
};
