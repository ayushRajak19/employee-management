import { useEffect, useState } from "react";
import {
  AlertTriangle,
  Award,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  HelpCircle,
  Trophy,
  XCircle
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { skillApi, type Assessment, type AssessmentAnswer, type AssessmentQuestion } from "@/features/skills/skillApi";

interface AssessmentTestRunnerProps {
  assessmentId: string;
  onClose: () => void;
  onCompleted: () => void;
}

export const AssessmentTestRunner = ({
  assessmentId,
  onClose,
  onCompleted,
}: AssessmentTestRunnerProps) => {
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Test state: "INTRO" | "RUNNING" | "SUBMITTED"
  const [testPhase, setTestPhase] = useState<"INTRO" | "RUNNING" | "SUBMITTED">("INTRO");
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [secondsRemaining, setSecondsRemaining] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Load assessment details
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setIsLoading(true);
        const res = await skillApi.getAssessment(assessmentId);
        if (mounted) {
          setAssessment(res.item);
          if (res.item.status === "COMPLETED") {
            setTestPhase("SUBMITTED");
          } else {
            // Restore any previously answered questions if resuming
            const existingAnswers: Record<string, number> = {};
            res.item.answers?.forEach((a) => {
              if (typeof a.selectedOption === "number") {
                existingAnswers[a.questionId] = a.selectedOption;
              }
            });
            setAnswers(existingAnswers);
            setSecondsRemaining((res.item.timeLimitMinutes || 30) * 60);
          }
        }
      } catch (err: any) {
        if (mounted) setError(err?.message || "Failed to load assessment.");
      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [assessmentId]);

  // Live countdown timer
  useEffect(() => {
    if (testPhase !== "RUNNING" || secondsRemaining <= 0) return;

    const timer = setInterval(() => {
      setSecondsRemaining((prev: number) => {
        if (prev <= 1) {
          clearInterval(timer);
          // Auto-submit when timer expires
          handleSubmitTest(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [testPhase, secondsRemaining]);

  const handleStartTest = async () => {
    try {
      setIsLoading(true);
      const res = await skillApi.startAssessment(assessmentId);
      setAssessment(res.item);
      setTestPhase("RUNNING");
      setSecondsRemaining((res.item.timeLimitMinutes || 30) * 60);
    } catch (err: any) {
      setError(err?.message || "Failed to start assessment.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectOption = (questionId: string, optionIdx: number) => {
    setAnswers((prev: Record<string, number>) => ({
      ...prev,
      [questionId]: optionIdx,
    }));
  };

  const handleSubmitTest = async (_isAutoSubmit = false) => {
    if (!assessment) return;
    try {
      setIsSubmitting(true);
      const formattedAnswers = (assessment.questions || []).map((q: AssessmentQuestion) => ({
        questionId: q.id,
        selectedOption: answers[q.id],
      }));

      const res = await skillApi.submitAssessment(assessment._id, {
        answers: formattedAnswers,
      });

      setAssessment(res.item);
      setTestPhase("SUBMITTED");
      setShowConfirmModal(false);
      onCompleted();
    } catch (err: any) {
      alert(err?.message || "Failed to submit assessment answers. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainderSecs = secs % 60;
    return `${mins}:${remainderSecs.toString().padStart(2, "0")}`;
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-sm">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-2xl">
          <div className="mx-auto size-10 animate-spin rounded-full border-4 border-brand-500 border-t-transparent mb-4" />
          <h3 className="font-semibold text-slate-800">Loading Assessment Environment...</h3>
          <p className="mt-1 text-xs text-slate-500">Preparing test questions and verification session.</p>
        </div>
      </div>
    );
  }

  if (error || !assessment) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-sm">
        <div className="max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-2xl">
          <AlertTriangle className="mx-auto text-amber-500 mb-3" size={36} />
          <h3 className="text-lg font-bold text-slate-800">Unable to Open Assessment</h3>
          <p className="mt-2 text-xs text-slate-500">{error || "Assessment not found."}</p>
          <Button className="mt-6" onClick={onClose}>
            Back to Assessments
          </Button>
        </div>
      </div>
    );
  }

  const questions = assessment.questions || [];
  const currentQ: AssessmentQuestion | undefined = questions[currentQuestionIdx];
  const answeredCount = Object.keys(answers).length;
  const isUrgentTimer = secondsRemaining < 120;
  const isWarningTimer = secondsRemaining < 300;

  // ==========================================
  // PHASE 1: INTRO / INSTRUCTIONS SCREEN
  // ==========================================
  if (testPhase === "INTRO") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/70 p-4 backdrop-blur-sm">
        <div className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-8 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-brand-50 text-brand-700 mb-3">
              <Award size={28} />
            </div>
            <span className="inline-block rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              {assessment.difficulty} Level · Official Assessment
            </span>
            <h1 className="text-2xl font-bold text-slate-900">{assessment.name}</h1>
            {assessment.jobDescription && (
              <p className="mx-auto max-w-lg text-xs text-slate-500 line-clamp-3">
                {assessment.jobDescription}
              </p>
            )}
          </div>

          {/* Test Metrics Overview */}
          <div className="grid grid-cols-3 gap-3 rounded-2xl border border-slate-100 bg-slate-50/60 p-4 text-center">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Questions</p>
              <p className="mt-1 text-xl font-bold text-slate-800">{questions.length}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Time Limit</p>
              <p className="mt-1 text-xl font-bold text-brand-700">{assessment.timeLimitMinutes} mins</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Passing Score</p>
              <p className="mt-1 text-xl font-bold text-emerald-600">{assessment.passingScore}%</p>
            </div>
          </div>

          {/* Assessment Instructions */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-2 text-xs text-slate-600">
            <h4 className="font-bold text-slate-800 flex items-center gap-2">
              <HelpCircle size={15} className="text-brand-600" /> Instructions & Rules
            </h4>
            <ul className="list-disc pl-5 space-y-1 text-[11px] text-slate-500 leading-5">
              <li>Each question has 4 options with exactly one correct answer.</li>
              <li>You can navigate back and forth between questions anytime before submitting.</li>
              <li>
                The live timer starts immediately when you click <strong>&ldquo;Begin Assessment&rdquo;</strong>.
              </li>
              <li>
                If the timer reaches 00:00, your current answers will be automatically submitted.
              </li>
              <li>Once submitted, your test will be instantly scored and locked.</li>
            </ul>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleStartTest}
              className="bg-brand-600 hover:bg-brand-700 text-white shadow-md shadow-brand-600/20 px-6"
            >
              Begin Assessment
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // PHASE 3: SUBMITTED / RESULTS SCORECARD
  // ==========================================
  if (testPhase === "SUBMITTED") {
    const isPassed = assessment.result === "PASSED";
    const answersMap = new Map<string, AssessmentAnswer>(
      assessment.answers?.map((a: AssessmentAnswer) => [a.questionId, a])
    );

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/70 p-4 backdrop-blur-sm">
        <div className="flex max-h-[92vh] w-full max-w-4xl flex-col rounded-3xl border border-slate-200 bg-white shadow-2xl">
          {/* Result Header Banner */}
          <div
            className={`p-6 text-center rounded-t-3xl border-b ${
              isPassed
                ? "bg-gradient-to-br from-emerald-500 to-teal-700 text-white"
                : "bg-gradient-to-br from-amber-500 to-orange-600 text-white"
            }`}
          >
            <div className="mx-auto grid size-16 place-items-center rounded-3xl bg-white/20 backdrop-blur mb-3">
              {isPassed ? <Trophy size={32} /> : <AlertTriangle size={32} />}
            </div>
            <span className="inline-block rounded-full bg-white/25 px-3 py-0.5 text-xs font-bold uppercase tracking-wider">
              {isPassed ? "Assessment Passed" : "Needs Improvement"}
            </span>
            <h1 className="mt-2 text-2xl font-bold">{assessment.name}</h1>
            <p className="mt-1 text-xs opacity-90">
              Completed on {new Date(assessment.completedAt || Date.now()).toLocaleString()}
            </p>
          </div>

          {/* Score Statistics Cards */}
          <div className="grid grid-cols-2 gap-3 border-b border-slate-100 bg-slate-50/50 p-6 sm:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-3.5 text-center">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Score</p>
              <p className="mt-1 text-2xl font-black text-slate-800">
                {assessment.score} <span className="text-xs font-normal text-slate-400">/ {assessment.maximumScore}</span>
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-3.5 text-center">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Percentage</p>
              <p
                className={`mt-1 text-2xl font-black ${
                  isPassed ? "text-emerald-600" : "text-amber-600"
                }`}
              >
                {assessment.percentage}%
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-3.5 text-center">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Required Passing</p>
              <p className="mt-1 text-2xl font-black text-slate-700">{assessment.passingScore}%</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-3.5 text-center">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Result Status</p>
              <span
                className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-bold ${
                  isPassed
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-amber-100 text-amber-800"
                }`}
              >
                {assessment.result}
              </span>
            </div>
          </div>

          {/* Detailed Question Review List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800">
                Detailed Question Review ({questions.length})
              </h3>
              <span className="text-xs text-slate-400">
                {assessment.answers?.filter((a: AssessmentAnswer) => a.isCorrect).length || 0} of {questions.length} correct
              </span>
            </div>

            <div className="space-y-4">
              {questions.map((q: AssessmentQuestion, idx: number) => {
                const userAns = answersMap.get(q.id);
                const isCorrect = userAns?.isCorrect;
                const selectedOpt = userAns?.selectedOption;
                const correctOpt = q.correctOptionIndex;

                return (
                  <div
                    key={q.id || idx}
                    className={`rounded-2xl border p-4 text-xs transition ${
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
                          <p className="font-bold text-slate-800 leading-5">{q.question}</p>
                          <span className="mt-1 inline-block text-[10px] text-slate-400">
                            Points: {userAns?.earnedPoints || 0} / {q.points || 10}
                          </span>
                        </div>
                      </div>
                      <div className="shrink-0">
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

                    {/* Options Review */}
                    <div className="mt-3 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                      {q.options.map((opt: string, optIdx: number) => {
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
                            <div className="flex items-center gap-2 min-w-0 pr-2">
                              <span className="font-bold text-xs">{String.fromCharCode(65 + optIdx)}.</span>
                              <span className="truncate">{opt}</span>
                            </div>
                            <div className="shrink-0">
                              {isTheCorrectOne && (
                                <span className="text-[10px] font-bold text-emerald-700">
                                  ✓ Correct
                                </span>
                              )}
                              {wasChosen && !isTheCorrectOne && (
                                <span className="text-[10px] font-bold text-red-600">
                                  ✗ Your answer
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Explanation */}
                    {q.explanation && (
                      <div className="mt-3 rounded-xl border border-slate-200/80 bg-slate-50 p-2.5 text-[11px] text-slate-600 leading-relaxed">
                        <strong className="text-slate-800">Concept Explanation: </strong>
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
            <Button onClick={onClose} className="bg-brand-600 hover:bg-brand-700 text-white">
              Return to Assessments
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // PHASE 2: LIVE TEST RUNNER
  // ==========================================
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 p-3 sm:p-6 backdrop-blur-md">
      <div className="flex h-full max-h-[96vh] w-full max-w-4xl flex-col rounded-3xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
        {/* Top Bar: Timer, Title, Progress */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/70 px-6 py-3.5">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {assessment.difficulty} Assessment
            </span>
            <h2 className="text-base font-bold text-slate-900">{assessment.name}</h2>
          </div>

          <div className="flex items-center gap-4">
            {/* Countdown Badge */}
            <div
              className={`flex items-center gap-2 rounded-2xl px-3.5 py-1.5 text-xs font-bold transition shadow-sm ${
                isUrgentTimer
                  ? "bg-red-500 text-white animate-pulse"
                  : isWarningTimer
                  ? "bg-amber-100 text-amber-800"
                  : "bg-slate-800 text-white"
              }`}
            >
              <Clock size={15} />
              <span>{formatTime(secondsRemaining)}</span>
            </div>

            <Button
              onClick={() => setShowConfirmModal(true)}
              className="h-8 px-3 text-xs bg-brand-600 hover:bg-brand-700 text-white font-semibold"
            >
              Submit Test
            </Button>
          </div>
        </div>

        {/* Question Palette / Progress Bar */}
        <div className="border-b border-slate-100 bg-white px-6 py-2.5">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span>
              Question <strong className="text-slate-800">{currentQuestionIdx + 1}</strong> of{" "}
              <strong className="text-slate-800">{questions.length}</strong>
            </span>
            <span>
              <strong>{answeredCount}</strong> answered (
              {Math.round((answeredCount / (questions.length || 1)) * 100)}%)
            </span>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto py-1">
            {questions.map((q: AssessmentQuestion, idx: number) => {
              const isAnswered = answers[q.id] !== undefined;
              const isCurrent = currentQuestionIdx === idx;

              let style = "bg-slate-100 text-slate-500 border-transparent hover:bg-slate-200";
              if (isCurrent) {
                style = "bg-brand-600 text-white font-bold ring-2 ring-brand-400 ring-offset-1";
              } else if (isAnswered) {
                style = "bg-emerald-50 text-emerald-700 border border-emerald-300 font-semibold";
              }

              return (
                <button
                  key={q.id || idx}
                  onClick={() => setCurrentQuestionIdx(idx)}
                  className={`size-7 shrink-0 rounded-lg text-xs transition ${style}`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>
        </div>

        {/* Active Question Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {currentQ ? (
            <div className="space-y-6">
              {/* Question Statement */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="rounded-md bg-brand-50 px-2.5 py-0.5 text-xs font-bold text-brand-700">
                    Question {currentQuestionIdx + 1}
                  </span>
                  <span className="text-xs text-slate-400">({currentQ.points || 10} points)</span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 leading-relaxed">
                  {currentQ.question}
                </h3>
              </div>

              {/* 4 Interactive Option Cards */}
              <div className="space-y-2.5">
                {currentQ.options.map((optionText, optIdx) => {
                  const isSelected = answers[currentQ.id] === optIdx;

                  return (
                    <div
                      key={optIdx}
                      onClick={() => handleSelectOption(currentQ.id, optIdx)}
                      className={`flex cursor-pointer items-center justify-between rounded-2xl border p-4 text-sm transition ${
                        isSelected
                          ? "border-brand-500 bg-brand-50/70 text-brand-950 font-medium shadow-sm ring-1 ring-brand-500"
                          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50 text-slate-700"
                      }`}
                    >
                      <div className="flex items-center gap-3.5 min-w-0 pr-3">
                        <span
                          className={`grid size-7 shrink-0 place-items-center rounded-xl text-xs font-bold transition ${
                            isSelected
                              ? "bg-brand-600 text-white"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {String.fromCharCode(65 + optIdx)}
                        </span>
                        <span className="leading-5">{optionText}</span>
                      </div>

                      <input
                        type="radio"
                        checked={isSelected}
                        onChange={() => {}}
                        className="size-4 text-brand-600 accent-brand-600 shrink-0"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <p className="text-center text-xs text-slate-400">No question selected.</p>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/60 px-6 py-4">
          <Button
            variant="secondary"
            onClick={() => setCurrentQuestionIdx((p: number) => Math.max(0, p - 1))}
            disabled={currentQuestionIdx === 0}
            className="h-9 px-3.5 text-xs gap-1.5"
          >
            <ChevronLeft size={16} /> Previous
          </Button>

          <div className="flex items-center gap-2">
            {currentQuestionIdx < questions.length - 1 ? (
              <Button
                onClick={() => setCurrentQuestionIdx((p: number) => Math.min(questions.length - 1, p + 1))}
                className="h-9 px-3.5 text-xs gap-1.5 bg-brand-600 hover:bg-brand-700 text-white"
              >
                Next <ChevronRight size={16} />
              </Button>
            ) : (
              <Button
                onClick={() => setShowConfirmModal(true)}
                className="h-9 px-3.5 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <CheckCircle2 size={16} /> Finish & Submit
              </Button>
            )}
          </div>
        </div>

        {/* Confirmation Modal */}
        {showConfirmModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4">
              <h3 className="text-lg font-bold text-slate-800">Submit Assessment?</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                You have answered <strong>{answeredCount}</strong> of <strong>{questions.length}</strong> questions.
                {answeredCount < questions.length && (
                  <span className="block mt-2 text-amber-600 font-medium">
                    ⚠️ You still have {questions.length - answeredCount} unanswered questions.
                  </span>
                )}
              </p>
              <p className="text-xs text-slate-400">
                Once submitted, answers cannot be modified and your score will be permanently calculated.
              </p>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button variant="ghost" onClick={() => setShowConfirmModal(false)} disabled={isSubmitting}>
                  Keep Reviewing
                </Button>
                <Button
                  onClick={() => handleSubmitTest(false)}
                  disabled={isSubmitting}
                  className="bg-brand-600 hover:bg-brand-700 text-white"
                >
                  {isSubmitting ? "Submitting..." : "Yes, Submit Now"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
