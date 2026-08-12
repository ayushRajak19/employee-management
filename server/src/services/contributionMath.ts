export interface ScoredArea { key:string; score:number; configuredWeight:number; available:boolean }
export const normalizeContributionAreas = <T extends ScoredArea>(areas:T[]) => {
  const evidenceWeight=areas.filter((area)=>area.available).reduce((sum,area)=>sum+area.configuredWeight,0);
  const components=areas.map((area)=>{const effectiveWeight=area.available&&evidenceWeight?area.configuredWeight/evidenceWeight*100:0;return {...area,effectiveWeight:Number(effectiveWeight.toFixed(1)),contribution:Number((area.score*effectiveWeight/100).toFixed(1))};});
  return { evidenceWeight, components, totalScore:Number(components.reduce((sum,area)=>sum+area.contribution,0).toFixed(1)) };
};
export const reliabilityEligible = (task:{blocker?:{external?:boolean}}) => !task.blocker?.external;
