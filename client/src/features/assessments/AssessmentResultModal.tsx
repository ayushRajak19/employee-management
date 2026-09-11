import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Trophy, X, XCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { skillApi, type Assessment, type AssessmentAnswer, type AssessmentQuestion } from "@/features/skills/skillApi";

interface AssessmentResultModalProps {
  assessmentId: string;
  onClose: () => void;
}

export const AssessmentResultModal = ({
  assessmentId,
  onClose,
}: AssessmentResultModalProps) => {
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setIsLoading(true);
        const res = await skillApi.getAssessment(assessmentId);
        if (mounted) setAssessment(res.item);
      } catch (err) {
        console.error("Failed to load result", err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [assessmentId]);

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
        <div className="rounded-3xl border bg-white p-8 text-center shadow-2xl">
          <div className="mx-auto size-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent mb-3" />
          <p className="text-xs text-slate-500">Loading scorecard...</p>
        </div>
      </div>
    );
  }

  if (!assessment) return null;

  const isPassed = assessment.result === "PASSED";
  const questions: AssessmentQuestion[] = assessment.questions || [];
  const answersMap = new Map<string, AssessmentAnswer>(
    assessment.answers?.map((a: AssessmentAnswer) => [a.questionId, a])
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="flex max-h-[92vh] w-full max-w-4xl flex-col rounded-3xl border border-slate-200 bg-white shadow-2xl">
        {/* Banner */}
        <div
          className={`relative p-6 text-center rounded-t-3xl border-b ${
            isPassed
              ? "bg-gradient-to-br from-emerald-500 to-teal-700 text-white"
              : "bg-gradient-to-br from-amber-500 to-orange-600 text-white"
          }`}
        >
          <button
            onClick={onClose}
            className="absolute right-4 top-4 grid size-8 place-items-center rounded-full bg-white/20 text-white hover:bg-white/30 transition"
          >
            <X size={18} />
          </button>

          <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-white/20 backdrop-blur mb-3">
            {isPassed ? <Trophy size={28} /> : <AlertTriangle size={28} />}
          </div>
          <span className="inline-block rounded-full bg-white/25 px-3 py-0.5 text-xs font-bold uppercase tracking-wider">
            {isPassed ? "Assessment Passed" : "Needs Improvement"}
          </span>
          <h1 className="mt-1 text-2xl font-bold">{assessment.name}</h1>
          <p className="mt-1 text-xs opacity-90">
            Employee: {assessment.assignedEmployee?.firstName} {assessment.assignedEmployee?.lastName} ({assessment.assignedEmployee?.employeeId})
          </p>
        </div>

        {/* Score Statistics */}
        <div className="grid grid-cols-2 gap-3 border-b border-slate-100 bg-slate-50/50 p-5 sm:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-3 text-center">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Score</p>
            <p className="mt-1 text-xl font-black text-slate-800">
              {assessment.score ?? 0} <span className="text-xs font-normal text-slate-400">/ {assessment.maximumScore}</span>
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-3 text-center">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Percentage</p>
            <p
              className={`mt-1 text-xl font-black ${
                isPassed ? "text-emerald-600" : "text-amber-600"
              }`}
            >
              {assessment.percentage ?? Math.round(((assessment.score || 0) / (assessment.maximumScore || 1)) * 100)}%
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-3 text-center">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Passing Mark</p>
            <p className="mt-1 text-xl font-black text-slate-700">{assessment.passingScore}%</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-3 text-center">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Result</p>
            <span
              className={`mt-1.5 inline-block rounded-full px-2.5 py-0.5 text-xs font-bold ${
                isPassed
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-amber-100 text-amber-800"
              }`}
            >
              {assessment.result ?? "COMPLETED"}
            </span>
          </div>
        </div>

        {/* Question Review List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800">
              Scorecard & Question Breakdown ({questions.length})
            </h3>
            <span className="text-xs text-slate-500">
              {assessment.answers?.filter((a) => a.isCorrect).length || 0} of {questions.length} answered correctly
            </span>
          </div>

          <div className="space-y-3">
            {questions.map((q, idx) => {
              const userAns = answersMap.get(q.id);
              const isCorrect = userAns?.isCorrect;
              const selectedOpt = userAns?.selectedOption;
              const correctOpt = q.correctOptionIndex;

              return (
                <div
                  key={q.id || idx}
                  className={`rounded-2xl border p-4 text-xs ${
                    isCorrect
                      ? "border-emerald-200 bg-emerald-50/20"
                      : "border-red-200 bg-red-50/20"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      <span className="grid size-6 shrink-0 place-items-center rounded-lg bg-slate-100 text-[11px] font-bold text-slate-700">
                        {idx + 1}
                      </span>
                      <div>
                        <p className="font-bold text-slate-800">{q.question}</p>
                        <span className="text-[10px] text-slate-400">
                          Points: {userAns?.earnedPoints || 0} / {q.points || 10}
                        </span>
                      </div>
                    </div>
                    <div>
                      {isCorrect ? (
                        <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
                          <CheckCircle2 size={12} /> Correct
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-[10px] font-bold text-red-800">
                          <XCircle size={12} /> Incorrect
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Options */}
                  <div className="mt-3 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                    {q.options.map((opt, optIdx) => {
                      const wasChosen = selectedOpt === optIdx;
                      const isTheCorrectOne = correctOpt === optIdx;

                      let style = "border-slate-200 bg-white text-slate-600";
                      if (isTheCorrectOne) {
                        style = "border-emerald-300 bg-emerald-50 text-emerald-900 font-semibold";
                      } else if (wasChosen && !isTheCorrectOne) {
                        style = "border-red-300 bg-red-50 text-red-900 font-medium";
                      }

                      return (
                        <div
                          key={optIdx}
                          className={`flex items-center justify-between rounded-xl border px-3 py-2 ${style}`}
                        >
                          <span className="truncate pr-2">
                            <strong>{String.fromCharCode(65 + optIdx)}.</strong> {opt}
                          </span>
                          <span className="text-[10px] font-bold shrink-0">
                            {isTheCorrectOne && "✓ Correct"}
                            {wasChosen && !isTheCorrectOne && "✗ Selected"}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {q.explanation && (
                    <div className="mt-3 rounded-xl border border-slate-200/70 bg-slate-50 p-2.5 text-[11px] text-slate-600 leading-relaxed">
                      <strong className="text-slate-800">Explanation: </strong>
                      {q.explanation}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end border-t border-slate-100 bg-slate-50/60 px-6 py-4 rounded-b-3xl">
          <Button onClick={onClose} variant="secondary">
            Close Scorecard
          </Button>
        </div>
      </div>
    </div>
  );
};
