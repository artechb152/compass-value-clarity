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
import { ArrowRight, CheckCircle, Trophy } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

// Deterministic shuffle based on user id
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
  const [showCompletionDialog, setShowCompletionDialog] = useState(false);

  useEffect(() => {
    supabase.from("scenarios").select("*").then(({ data }) => data && setAllScenarios(data));
    if (user) {
      supabase.from("progress").upsert({ user_id: user.id, module_key: "scenarios", status: "in_progress", updated_at: new Date().toISOString() }, { onConflict: "user_id,module_key" });
      // Load completed scenario ids
      supabase.from("responses").select("scenario_id").eq("user_id", user.id).then(({ data }) => {
        if (data) {
          const completed = new Set(data.map(r => r.scenario_id).filter(Boolean) as string[]);
          setCompletedIds(completed);
        }
      });
    }
  }, [user]);

  // Pick 8 scenarios deterministically per user
  const scenarios = useMemo(() => {
    if (!user || allScenarios.length === 0) return [];
    const shuffled = seededShuffle(allScenarios, user.id);
    return shuffled.slice(0, SCENARIOS_PER_USER);
  }, [allScenarios, user]);

  // Auto-advance to first incomplete scenario on load
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

  const toggleValue = (v: string) => {
    setSelectedValues((prev) => prev.includes(v) ? prev.filter((x) => x !== v) : prev.length < 2 ? [...prev, v] : prev);
  };

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
    toast.success("התשובה נשמרה!");

    // Check if all 8 completed
    const newCompleted = new Set([...completedIds, scenario.id]);
    const allDone = scenarios.every(s => newCompleted.has(s.id));
    if (allDone) {
      supabase.from("progress").upsert({ user_id: user.id, module_key: "scenarios", status: "completed", updated_at: new Date().toISOString() }, { onConflict: "user_id,module_key" });
    }
  };

  const goNext = () => {
    if (currentIdx < scenarios.length - 1) {
      setCurrentIdx((i) => i + 1);
      resetState();
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
  const allDone = completedCount >= SCENARIOS_PER_USER;
  const progressPct = Math.round((completedCount / SCENARIOS_PER_USER) * 100);


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

        {/* Progress bar */}
        <div className="flex items-center gap-3 mb-4">
          <Progress value={progressPct} className="h-2 flex-1" />
          <span className="text-xs text-muted-foreground whitespace-nowrap">{completedCount}/{SCENARIOS_PER_USER}</span>
        </div>

        <Card className="mb-4">
          <CardHeader className="p-3 sm:p-6">
            <CardTitle className="text-base sm:text-lg leading-snug break-words">{scenario.title_he}</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            <p className="text-sm whitespace-pre-line leading-relaxed mb-4 break-words">{scenario.story_he}</p>

            {chosenIdx === null && !completedIds.has(scenario.id) && (
              <>
                <p className="text-sm font-medium text-primary mb-3">רגע לפני שאתה בוחר—איזה ערך פה מתנגש לך בראש?</p>
                <div className="space-y-2">
                  {choices.map((c, i) => (
                    <Button key={i} variant="outline" className="w-full text-right justify-start h-auto py-2.5 px-3 text-xs sm:text-sm leading-snug break-words whitespace-normal" onClick={() => setChosenIdx(i)}>
                      {c}
                    </Button>
                  ))}
                </div>
              </>
            )}

            {completedIds.has(scenario.id) && chosenIdx === null && (
              <div className="text-center py-4 space-y-3">
                <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <p className="text-green-600 font-medium">תרחיש זה כבר הושלם ✓</p>
                {currentIdx < scenarios.length - 1 && (
                  <Button onClick={goNext}>ממשיכים לתרחיש הבא →</Button>
                )}
              </div>
            )}

            {chosenIdx !== null && !submitted && (
              <div className="space-y-5 mt-4">
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-sm font-medium text-primary mb-1">אין פה שחור־לבן. בוא נפרק לערכים + השלכות.</p>
                  <p className="text-sm">{feedbacks[chosenIdx]}</p>
                </div>

                <div>
                  <p className="text-sm font-medium mb-2">בחר/י 2 ערכים שהתנגשו פה:</p>
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
                  <p className="text-sm font-medium text-primary">הזיזו את הסמן לפי מה שהרגשתם בדילמה:</p>
                  <div>
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>משימה</span>
                      <span>כבוד האדם</span>
                    </div>
                    <Slider value={tensionMH} onValueChange={setTensionMH} max={100} step={1} aria-label="מתח: משימה מול כבוד האדם" />
                    <p className="text-[11px] text-muted-foreground mt-1 text-center">לאן נוטה הדילמה הזו מבחינתך?</p>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>משמעת</span>
                      <span>אחריות אישית</span>
                    </div>
                    <Slider value={tensionDR} onValueChange={setTensionDR} max={100} step={1} aria-label="מתח: משמעת מול אחריות אישית" />
                    <p className="text-[11px] text-muted-foreground mt-1 text-center">לאן נוטה הדילמה הזו מבחינתך?</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium mb-1">משפט אחד לעצמך—מה לקחת מזה?</p>
                  <Textarea value={reflection} onChange={(e) => setReflection(e.target.value)} placeholder={scenario.reflection_question_he || ""} rows={2} />
                </div>

                <Button onClick={handleSubmit} className="w-full">שמור/י</Button>
              </div>
            )}

            {submitted && (
              <div className="text-center py-4 space-y-3">
                <p className="text-primary font-medium">✓ התשובה נשמרה</p>
                {currentIdx < scenarios.length - 1 ? (
                  <Button onClick={goNext}>ממשיכים לתרחיש הבא →</Button>
                ) : allDone ? (
                  <div className="space-y-3">
                    <Button onClick={() => setShowCompletionDialog(true)} className="w-full" size="lg">
                      סיום הקורס
                    </Button>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">סיימת את כל התרחישים!</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

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
