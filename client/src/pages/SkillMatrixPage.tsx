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

  const spofItems = spofQuery.data?.items ?? [];

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

        {/* SPOF Operational Risk Alerts */}
        {spofItems.length > 0 && (
          <section className="mt-7 rounded-2xl border border-amber-200 bg-amber-50/60 p-5 shadow-soft">
            <div className="flex items-start gap-3">
              <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-amber-100 text-amber-700">
                <AlertTriangle size={20} />
              </div>
              <div className="flex-1">
                <div className="flex flex-col justify-between gap-1 sm:flex-row sm:items-center">
                  <h2 className="text-base font-semibold text-amber-900">
                    Single Point of Failure (SPOF) Alert: {spofItems.length} Competenc{spofItems.length === 1 ? "y" : "ies"} at Risk
                  </h2>
                  <span className="w-fit rounded-full bg-amber-200/80 px-2.5 py-0.5 text-xs font-bold text-amber-900">
                    Cross-Training Needed
                  </span>
                </div>
                <p className="mt-1 text-xs leading-5 text-amber-800">
                  The following competencies have exactly one qualified employee. If they are absent, overburdened, or leave the company, there is zero backup coverage.
                </p>

                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {spofItems.map((item) => (
                    <div key={item.skillId} className="rounded-xl border border-amber-200 bg-white p-3.5 shadow-sm">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-sm text-slate-900">{item.skillName}</p>
                          <span className="text-[10px] font-medium text-slate-400">{item.category}</span>
                        </div>
                        <span className="rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                          Rating {item.verifiedRating}/10
                        </span>
                      </div>
                      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2 text-xs">
                        <div>
                          <p className="font-medium text-slate-800">{item.employeeName}</p>
                          <p className="text-[10px] text-slate-400">{item.employeeCode} · {item.departmentName}</p>
                        </div>
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
                          Sole Holder
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

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
