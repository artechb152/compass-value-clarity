import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
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
  const [currentIdx, setCurrentIdx] = useState(0);
  const [chosenIdx, setChosenIdx] = useState<number | null>(null);
  const [selectedValues, setSelectedValues] = useState<string[]>([]);
  const [tensionMH, setTensionMH] = useState([50]);
  const [tensionDR, setTensionDR] = useState([50]);
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
    if (scenarios.length === 0 || completedIds.size === 0) return;
    const firstIncomplete = scenarios.findIndex(s => !completedIds.has(s.id));
    if (firstIncomplete > 0) {
      setCurrentIdx(firstIncomplete);
    }
  }, [scenarios, completedIds]);

  const scenario = scenarios[currentIdx];
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

  const canShowSummary = chosenIdx !== null && selectedValues.length === 2 && reflection.trim().length >= 5;

  const handleSubmit = async () => {
    if (!user) return;
    await supabase.from("responses").insert({
      user_id: user.id,
      scenario_id: scenario.id,
      choice: chosenIdx,
      selected_values_json: selectedValues,
      tension_mission_human: tensionMH[0],
      tension_discipline_responsibility: tensionDR[0],
      reflection_text: reflection,
    });
    setCompletedIds(prev => new Set([...prev, scenario.id]));
    setSubmitted(true);
    setShowSummaryModal(true);
    toast.success("התשובה נשמרה!");

    const newCompleted = new Set([...completedIds, scenario.id]);
    const allDone = scenarios.every(s => newCompleted.has(s.id));
    if (allDone) {
      supabase.from("progress").upsert({ user_id: user.id, module_key: "scenarios", status: "completed", updated_at: new Date().toISOString() }, { onConflict: "user_id,module_key" });
    }
  };

  const goNext = () => {
    setShowSummaryModal(false);
    if (currentIdx < scenarios.length - 1) {
      setCurrentIdx((i) => i + 1);
      resetState();
    } else {
      const newCompleted = new Set([...completedIds, scenario.id]);
      if (scenarios.every(s => newCompleted.has(s.id))) {
        setShowCompletionDialog(true);
      }
    }
  };

  const resetState = () => {
    setChosenIdx(null);
    setSelectedValues([]);
    setTensionMH([50]);
    setTensionDR([50]);
    setReflection("");
    setSubmitted(false);
  };

  const completedCount = scenarios.filter(s => completedIds.has(s.id)).length;
  const progressPct = Math.round((completedCount / SCENARIOS_PER_USER) * 100);

  // Build summary text for modal
  const choiceLabel = chosenIdx !== null ? choices[chosenIdx] : "";
  const valuesLabel = selectedValues.join(" ו-");

  return (
    <AppShell>
      <div className="p-4 max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="shrink-0">
            <ArrowRight className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-primary">מעבדת דילמות</h1>
          </div>
        </div>

        <div className="flex items-center gap-3 mb-4">
          <Progress value={progressPct} className="h-2 flex-1" />
          <span className="text-xs text-muted-foreground whitespace-nowrap">{completedCount}/{SCENARIOS_PER_USER}</span>
        </div>

        <Card className="mb-4">
          <CardHeader className="p-3 sm:p-6">
            <CardTitle className="text-base sm:text-lg leading-snug break-words">{scenario.title_he}</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            {contextHe && (
              <p className="text-sm text-muted-foreground italic mb-3 break-words">{contextHe}</p>
            )}
            <p className="text-sm whitespace-pre-line leading-relaxed mb-3 break-words">{scenario.story_he}</p>
            {dilemmaQuestion && (
              <p className="text-sm font-semibold text-primary mb-4">{dilemmaQuestion}</p>
            )}

            {/* Show choices if not yet chosen and not already completed */}
            {chosenIdx === null && !completedIds.has(scenario.id) && (
              <>
                <p className="text-sm font-medium text-primary mb-3">רגע לפני שאתה בוחר—איזה ערכים מתנגשים לך בראש?</p>
                <div className="space-y-2">
                  {choices.map((c, i) => (
                    <Button key={i} variant="outline" className="w-full text-right justify-start h-auto py-2.5 px-3 text-xs sm:text-sm leading-snug break-words whitespace-normal" onClick={() => setChosenIdx(i)}>
                      {c}
                    </Button>
                  ))}
                </div>
              </>
            )}

            {/* Already completed - just show next button */}
            {completedIds.has(scenario.id) && chosenIdx === null && (
              <div className="text-center py-4">
                {currentIdx < scenarios.length - 1 && (
                  <Button onClick={goNext}>ממשיכים לתרחיש הבא →</Button>
                )}
              </div>
            )}

            {/* After choosing - show feedback + inputs */}
            {chosenIdx !== null && !submitted && (
              <div className="space-y-5 mt-4">
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-sm font-medium text-primary mb-1">אין פה שחור־לבן. בוא נפרק את זה.</p>
                  <p className="text-sm">{feedbacks[chosenIdx]}</p>
                </div>

                <div>
                  <p className="text-sm font-medium mb-2">בחר 2 ערכים שהתנגשו פה:</p>
                  <div className="flex flex-wrap gap-2">
                    {conflicts.map((v) => (
                      <Badge
                        key={v}
                        variant={selectedValues.includes(v) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => toggleValue(v)}
                      >
                        {v}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <p className="text-sm font-medium text-primary">סמן איפה זה יושב אצלך:</p>
                  <div>
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>משימה</span>
                      <span>כבוד האדם</span>
                    </div>
                    <Slider value={tensionMH} onValueChange={setTensionMH} max={100} step={1} aria-label="מתח: משימה מול כבוד האדם" />
                  </div>
                  <div>
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>משמעת</span>
                      <span>אחריות אישית</span>
                    </div>
                    <Slider value={tensionDR} onValueChange={setTensionDR} max={100} step={1} aria-label="מתח: משמעת מול אחריות אישית" />
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium mb-1">משפט אחד לעצמך—מה אתה לוקח מהסיטואציה?</p>
                  <Textarea value={reflection} onChange={(e) => setReflection(e.target.value)} placeholder={scenario.reflection_question_he || ""} rows={2} />
                </div>

                <Button onClick={handleSubmit} className="w-full" disabled={!canShowSummary}>
                  סיכום והמשך
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Summary Modal */}
      <Dialog open={showSummaryModal} onOpenChange={setShowSummaryModal}>
        <DialogContent className="max-w-sm" dir="rtl" role="dialog" aria-modal="true">
          <DialogHeader className="text-right pe-10 ps-0">
            <DialogTitle className="text-lg text-right">המשוב שלך</DialogTitle>
            <DialogDescription className="sr-only">סיכום הדילמה</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <p>• <strong>בחרת:</strong> {choiceLabel}</p>
            <p>• <strong>ערכים שהתנגשו:</strong> {valuesLabel}</p>
            <p>• <strong>המדדים שלך:</strong> משימה↔כבוד האדם ({tensionMH[0]}), משמעת↔אחריות ({tensionDR[0]})</p>
            {reflection && <p>• <strong>השורה שלך:</strong> "{reflection}"</p>}
            {closingFeedback?.summary_text && (
              <p className="text-muted-foreground mt-2">{closingFeedback.summary_text}</p>
            )}
          </div>
          <Button onClick={goNext} className="w-full mt-2">
            {currentIdx < scenarios.length - 1 ? "ממשיכים לתרחיש הבא →" : "סיום"}
          </Button>
        </DialogContent>
      </Dialog>

      {/* Completion Dialog */}
      <Dialog open={showCompletionDialog} onOpenChange={setShowCompletionDialog}>
        <DialogContent className="max-w-sm text-center" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-2xl">כל הכבוד!</DialogTitle>
            <DialogDescription className="text-base mt-2">
              סיימת את כל התכנים והדילמות בהצלחה. עכשיו יש לך כלים טובים יותר לשיקול דעת ערכי.
            </DialogDescription>
          </DialogHeader>
          <Trophy className="h-16 w-16 text-primary mx-auto my-4" />
          <Button onClick={() => navigate("/")} className="w-full" size="lg">
            חזרה למסך הראשי
          </Button>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
};

export default Scenarios;
