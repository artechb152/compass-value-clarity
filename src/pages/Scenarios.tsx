import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import SegmentedProgress from "@/components/SegmentedProgress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { ArrowRight, Trophy } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

function seededShuffle<T>(arr: T[], seed: string): T[] {
  const copy = [...arr];
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash + seed.charCodeAt(i)) | 0;
  }
  for (let i = copy.length - 1; i > 0; i--) {
    hash = ((hash << 5) - hash + i) | 0;
    const j = Math.abs(hash) % (i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

const SCENARIOS_PER_USER = 8;

const Scenarios = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [allScenarios, setAllScenarios] = useState<Tables<"scenarios">[]>([]);
  const [currentIdx, setCurrentIdx] = useState<number | null>(null);
  const [initialIdxSet, setInitialIdxSet] = useState(false);
  const [chosenIdx, setChosenIdx] = useState<number | null>(null);
  const [selectedValues, setSelectedValues] = useState<string[]>([]);
  const [valueImpacts, setValueImpacts] = useState<Record<string, number>>({});
  const [reflection, setReflection] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [showCompletionDialog, setShowCompletionDialog] = useState(false);

  useEffect(() => {
    supabase.from("scenarios").select("*").then(({ data }) => data && setAllScenarios(data));
    if (user) {
      supabase.from("progress").upsert({ user_id: user.id, module_key: "scenarios", status: "in_progress", updated_at: new Date().toISOString() }, { onConflict: "user_id,module_key" });
      supabase.from("responses").select("scenario_id").eq("user_id", user.id).then(({ data }) => {
        if (data) {
          const completed = new Set(data.map(r => r.scenario_id).filter(Boolean) as string[]);
          setCompletedIds(completed);
        }
      });
    }
  }, [user]);

  const scenarios = useMemo(() => {
    if (!user || allScenarios.length === 0) return [];
    const shuffled = seededShuffle(allScenarios, user.id);
    return shuffled.slice(0, SCENARIOS_PER_USER);
  }, [allScenarios, user]);

  useEffect(() => {
    if (initialIdxSet || scenarios.length === 0) return;
    if (completedIds.size === 0 && allScenarios.length > 0) {
      setCurrentIdx(0);
      setInitialIdxSet(true);
      return;
    }
    const firstIncomplete = scenarios.findIndex(s => !completedIds.has(s.id));
    if (firstIncomplete >= 0) {
      setCurrentIdx(firstIncomplete);
    } else {
      setCurrentIdx(0);
    }
    setInitialIdxSet(true);
  }, [scenarios, completedIds, initialIdxSet, allScenarios.length]);

  const scenario = currentIdx !== null ? scenarios[currentIdx] : null;
  if (!scenario) return <AppShell><div className="p-4 text-center text-muted-foreground">טוען תרחישים...</div></AppShell>;

  const choices = (scenario.choices_json as string[]) || [];
  const feedbacks = (scenario.feedback_json as string[]) || [];
  const conflicts = (scenario.value_conflicts_json as string[]) || [];
  const contextHe = (scenario as any).context_he as string | null;
  const dilemmaQuestion = (scenario as any).dilemma_question_he as string | null;
  const closingFeedback = (scenario as any).closing_feedback_json as any;

  const toggleValue = (v: string) => {
    setSelectedValues((prev) => prev.includes(v) ? prev.filter((x) => x !== v) : prev.length < 2 ? [...prev, v] : prev);
  };

  const impactValues = conflicts.slice(0, 3);
  const canShowSummary = chosenIdx !== null && selectedValues.length === 2 && reflection.trim().length >= 1;

  const handleSubmit = async () => {
    if (!user) return;
    await supabase.from("responses").insert({
      user_id: user.id,
      scenario_id: scenario.id,
      choice: chosenIdx,
      selected_values_json: selectedValues,
      value_impacts_json: valueImpacts,
      reflection_text: reflection,
    } as any);
    setCompletedIds(prev => {
      const newCompleted = new Set([...prev, scenario.id]);
      const allDone = scenarios.every(s => newCompleted.has(s.id));
      if (allDone) {
        supabase.from("progress").upsert({ user_id: user.id, module_key: "scenarios", status: "completed", updated_at: new Date().toISOString() }, { onConflict: "user_id,module_key" });
      }
      return newCompleted;
    });
    setSubmitted(true);
    setShowSummaryModal(true);
    toast.success("התשובה נשמרה!");
  };

  const goNext = () => {
    setShowSummaryModal(false);
    const allDone = scenarios.every(s => completedIds.has(s.id));
    if (allDone) {
      setShowCompletionDialog(true);
      return;
    }
    if (currentIdx !== null && currentIdx < scenarios.length - 1) {
      setCurrentIdx(currentIdx + 1);
      resetState();
    }
  };

  const resetState = () => {
    setChosenIdx(null);
    setSelectedValues([]);
    setValueImpacts({});
    setReflection("");
    setSubmitted(false);
  };

  const completedCount = scenarios.filter(s => completedIds.has(s.id)).length;
  const progressPct = Math.round((completedCount / SCENARIOS_PER_USER) * 100);

  const choiceLabel = chosenIdx !== null ? choices[chosenIdx] : "";
  const valuesLabel = selectedValues.join(" ו-");

  return (
    <AppShell>
      <div className="p-4 max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="shrink-0 hover:bg-primary hover:text-primary-foreground">
            <ArrowRight className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-primary">מעבדת דילמות</h1>
          </div>
        </div>

        <div className="flex items-center gap-3 mb-4">
          <SegmentedProgress completed={completedCount} total={SCENARIOS_PER_USER} />
          <span className="text-xs text-muted-foreground whitespace-nowrap">{completedCount}/{SCENARIOS_PER_USER}</span>
        </div>

        <Card className="mb-4 max-w-lg mx-auto">
          <CardHeader className="p-3 sm:p-6">
            <CardTitle className="text-base sm:text-lg leading-snug break-words">{scenario.title_he}</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            {contextHe && (
              <p className="text-sm text-muted-foreground italic mb-3 break-words">{contextHe}</p>
            )}
            <p className="text-sm whitespace-pre-line leading-relaxed mb-3 break-words">{scenario.story_he}</p>
            {dilemmaQuestion && (
              <p className="text-sm font-semibold text-foreground mb-4">{dilemmaQuestion}</p>
            )}

            {chosenIdx === null && !completedIds.has(scenario.id) && (
              <div className="space-y-2">
                {choices.map((c, i) => (
                  <Button key={i} variant="outline" className="w-full text-right justify-start h-auto py-2.5 px-3 text-xs sm:text-sm leading-snug break-words whitespace-normal hover:bg-primary hover:text-primary-foreground" onClick={() => setChosenIdx(i)}>
                    {c}
                  </Button>
                ))}
              </div>
            )}

            {completedIds.has(scenario.id) && chosenIdx === null && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground text-center">תרחיש זה הושלם. בחר שוב או המשך הלאה.</p>
                <div className="space-y-2">
                  {choices.map((c, i) => (
                    <Button key={i} variant="outline" className="w-full text-right justify-start h-auto py-2.5 px-3 text-xs sm:text-sm leading-snug break-words whitespace-normal hover:bg-primary hover:text-primary-foreground" onClick={() => setChosenIdx(i)}>
                      {c}
                    </Button>
                  ))}
                </div>
                <Button variant="secondary" onClick={goNext} className="w-full">
                  {currentIdx !== null && currentIdx < scenarios.length - 1 ? "ממשיכים לתרחיש הבא →" : "סיום"}
                </Button>
              </div>
            )}

            {chosenIdx !== null && !submitted && (
              <div className="space-y-5 mt-4">
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-sm font-medium text-primary mb-1">אין פה שחור-לבן. בוא נפרק את זה.</p>
                  <p className="text-sm">{feedbacks[chosenIdx]}</p>
                </div>

                <div>
                  <p className="text-sm font-medium mb-2">בחר 2 ערכים שהתנגשו פה:</p>
                  <div className="flex flex-wrap gap-2">
                    {conflicts.map((v) => (
                      <button
                        key={v}
                        className={`cursor-pointer px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${selectedValues.includes(v) ? "bg-primary text-primary-foreground border-primary" : "bg-background text-foreground border-input hover:bg-primary/15 hover:text-primary hover:border-primary/30"}`}
                        onClick={() => toggleValue(v)}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <p className="text-sm font-medium text-primary">כמה לפי דעתך הערכים באו לידי פגיעה:</p>
                  {impactValues.map((val) => (
                    <div key={val}>
                      <p className="text-xs font-medium text-foreground mb-1">{val}</p>
                      <Slider value={[valueImpacts[val] ?? 5]} onValueChange={(v) => setValueImpacts(prev => ({ ...prev, [val]: v[0] }))} min={1} max={10} step={1} aria-label={`מידת פגיעה: ${val}`} />
                      <div className="flex justify-between text-[10px] text-muted-foreground mt-1" dir="ltr">
                        {Array.from({ length: 10 }, (_, i) => (
                          <span key={i}>{i + 1}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div>
                  <p className="text-sm font-medium mb-1">משפט אחד לעצמך ‑ מה אתה לוקח מהסיטואציה?</p>
                  <Textarea value={reflection} onChange={(e) => setReflection(e.target.value)} placeholder={scenario.reflection_question_he || ""} rows={2} className="resize-none" />
                </div>

                <Button variant="outline" onClick={handleSubmit} className="w-full hover:bg-primary hover:text-primary-foreground" disabled={!canShowSummary}>
                  סיכום והמשך
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Summary Modal */}
      <Dialog open={showSummaryModal} onOpenChange={(open) => { setShowSummaryModal(open); if (!open) resetState(); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto scrollbar-hide" dir="rtl" role="dialog" aria-modal="true">
          <DialogHeader className="text-right">
            <DialogTitle className="text-lg text-right">המשוב שלך</DialogTitle>
            <DialogDescription className="sr-only">סיכום הדילמה</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-sm text-right">
            <p>• <strong>בחרת:</strong> {choiceLabel}</p>
            <p>• <strong>ערכים שהתנגשו:</strong> {selectedValues.join(" ו‑")}</p>
            <p>• <strong>מידת פגיעה בערכים:</strong> {Object.entries(valueImpacts).map(([k, v]) => `${k} (${v})`).join(", ")}</p>
            {reflection && <p>• <strong>השורה שלך:</strong> "{reflection}"</p>}
            {closingFeedback?.summary_text && (
              <p className="font-semibold text-primary mt-2">{closingFeedback.summary_text}</p>
            )}
          </div>
          <Button onClick={goNext} className="w-full mt-2">
            {currentIdx < scenarios.length - 1 ? "ממשיכים לתרחיש הבא →" : "סיום"}
          </Button>
        </DialogContent>
      </Dialog>

      {/* Completion Dialog */}
      <Dialog open={showCompletionDialog} onOpenChange={(open) => { setShowCompletionDialog(open); if (!open) navigate("/"); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto scrollbar-hide text-center" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-2xl text-right">כל הכבוד!</DialogTitle>
            <DialogDescription className="text-base mt-2 text-right">
              סיימת את כל הדילמות בהצלחה. עכשיו המשך לדילמת השבוע.
            </DialogDescription>
          </DialogHeader>
          <Trophy className="h-16 w-16 text-primary mx-auto my-4" />
          <Button onClick={() => { setShowCompletionDialog(false); navigate("/"); }} className="w-full" size="lg">
            חזרה למסך הבית
          </Button>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
};

export default Scenarios;
