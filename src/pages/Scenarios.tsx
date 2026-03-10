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
import { ArrowRight, ArrowLeft, Trophy, ChevronDown } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

const RUACH_VALUES = [
  "דבקות במשימה וחתירה לניצחון",
  "אחריות",
  "אמינות",
  "דוגמה אישית",
  "חיי אדם",
  "טוהר הנשק",
  "מקצועיות",
  "משמעת",
  "רעות",
  "שליחות",
  "ממלכתיות",
];

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
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [showCompletionDialog, setShowCompletionDialog] = useState(false);

  // State
  const [choice1, setChoice1] = useState<number | null>(null);
  const [choice2, setChoice2] = useState<number | null>(null);
  const [selectedValues, setSelectedValues] = useState<string[]>([]);
  const [scaleValues, setScaleValues] = useState<Record<string, number>>({});
  const [reflection, setReflection] = useState("");
  const [conclusion, setConclusion] = useState("");
  


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

  const choices1 = (scenario.choices_json as string[]) || [];
  const choices2 = ((scenario as any).choices2_json as string[]) || [];
  const escalationText = ((scenario as any).escalation_he as string) || "";

  const toggleValue = (v: string) => {
    setSelectedValues((prev) => {
      if (prev.includes(v)) {
        setScaleValues(sv => { const next = { ...sv }; delete next[v]; return next; });
        return prev.filter((x) => x !== v);
      }
      if (prev.length < 2) {
        setScaleValues(sv => ({ ...sv, [v]: 5 }));
        return [...prev, v];
      }
      return prev;
    });
  };

  const canSubmit = choice1 !== null && choice2 !== null && selectedValues.length === 2 && selectedValues.every(v => scaleValues[v] !== undefined) && reflection.trim().length >= 1;

  const didChangeDirection = choice1 !== null && choice2 !== null && choice1 !== choice2;

  const generateConclusion = () => {
    if (!scenario || choice1 === null || choice2 === null || selectedValues.length < 2) return;
    const val1 = selectedValues[0];
    const val2 = selectedValues[1];
    const s1 = scaleValues[val1] ?? 5;
    const s2 = scaleValues[val2] ?? 5;
    const moreImpacted = s1 > s2 ? val1 : s2 > s1 ? val2 : null;

    const directionLine = didChangeDirection
      ? "אחרי שהדילמה החמירה, בחרת לשנות כיוון - מה שמעיד שהמחיר של ההחלטה הראשונה נעשה מבחינתך כבד יותר."
      : "גם כשהמצב החמיר, נשארת באותו כיוון - מה שמעיד על עקביות בשיקול הדעת שלך.";

    const impactLine = moreImpacted
      ? `סימנת שההתנגשות המרכזית הייתה בין ${val1} לבין ${val2}, ולפי הסקלה שלך הרגשת שהפגיעה המרכזית הייתה דווקא ב${moreImpacted}.`
      : `סימנת שההתנגשות המרכזית הייתה בין ${val1} לבין ${val2}, ולפי הסקלה שלך שניהם נפגעו באופן דומה - מה שמעיד על דילמה עמוקה במיוחד.`;

    const reflectionLine = reflection.trim().length > 0
      ? `ברפלקציה שלך עלה שהשיקול המרכזי קשור ל${reflection.trim().length > 40 ? reflection.trim().substring(0, 40) + "..." : reflection.trim()}, וזה מחזק את ההבנה שפעלת מתוך מודעות לערכים שהתנגשו.`
      : "";

    const lines = [
      `הבחירה שלך מראה שניסית לאזן בין ערכים שונים במצב שאין בו תשובה אחת נכונה.`,
      directionLine,
      impactLine,
      reflectionLine,
    ].filter(Boolean);

    setConclusion(lines.join("\n"));
  };

  const handleSubmit = async () => {
    if (!user) return;
    await supabase.from("responses").insert({
      user_id: user.id,
      scenario_id: scenario.id,
      choice: choice1,
      choice2: choice2,
      selected_values_json: selectedValues,
      value_impacts_json: { [selectedValues[0]]: scaleValues[selectedValues[0]] ?? 5, [selectedValues[1]]: scaleValues[selectedValues[1]] ?? 5 },
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
    setShowSummaryModal(true);
    toast.success("התשובה נשמרה!");
    generateConclusion();
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
    setChoice1(null);
    setChoice2(null);
    setSelectedValues([]);
    setScaleValues({});
    setReflection("");
    setConclusion("");
    
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const completedCount = scenarios.filter(s => completedIds.has(s.id)).length;


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

        <p className="text-sm text-muted-foreground mb-4">
          כאן אין תשובה אחת נכונה. בכל דילמה תידרש לבחור בין אפשרויות שיש להן מחיר שונה, להבין איזה ערכים מתנגשים, ולבדוק אם היית נשאר באותה החלטה גם כשהמצב מחמיר.
        </p>

        <div className="flex items-center gap-3 mb-4">
          <SegmentedProgress completed={completedCount} total={SCENARIOS_PER_USER} />
          <span className="text-xs text-muted-foreground whitespace-nowrap">{completedCount}/{SCENARIOS_PER_USER}</span>
        </div>

        <Card className="mb-4 max-w-lg mx-auto">
          <CardHeader className="p-3 sm:p-6">
            <CardTitle className="text-base sm:text-lg leading-snug">{scenario.title_he}</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0 space-y-5">
            {/* Story */}
            <p className="text-sm whitespace-pre-line leading-relaxed">{scenario.story_he}</p>

            {/* Choice 1 */}
            <div className="space-y-2">
              <p className="text-sm font-bold text-foreground">מה אתה עושה</p>
              {choices1.map((c, i) => (
                <Button key={i} variant={choice1 === i ? "default" : "outline"} className="w-full text-right justify-start h-auto py-2.5 px-3 text-xs sm:text-sm leading-snug whitespace-normal hover:bg-primary hover:text-primary-foreground hover:border-primary" onClick={() => setChoice1(i)}>
                  {c}
                </Button>
              ))}
            </div>

            {/* Escalation */}
            {choice1 !== null && (
              <div className="bg-amber-50 border border-amber-300 rounded-lg p-3">
                <p className="text-sm font-bold text-amber-800 mb-1">⚠️ המצב מחמיר</p>
                <p className="text-sm text-amber-900">{escalationText}</p>
              </div>
            )}

            {/* Choice 2 */}
            {choice1 !== null && (
              <div className="space-y-2">
                <p className="text-sm font-bold text-foreground">מה אתה עושה עכשיו</p>
                {choices2.map((c, i) => (
                  <Button key={i} variant={choice2 === i ? "default" : "outline"} className="w-full text-right justify-start h-auto py-2.5 px-3 text-xs sm:text-sm leading-snug whitespace-normal hover:bg-primary hover:text-primary-foreground hover:border-primary" onClick={() => setChoice2(i)}>
                    {c}
                  </Button>
                ))}
              </div>
            )}

            {/* Values */}
            {choice2 !== null && (
              <div className="space-y-3">
                <p className="text-sm font-bold text-foreground">בחר 2 ערכים שהתנגשו בדילמה</p>
                <div className="flex flex-wrap gap-1.5">
                  {RUACH_VALUES.map((v) => (
                    <button
                      key={v}
                      className={`cursor-pointer px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${selectedValues.includes(v) ? "bg-primary text-primary-foreground border-primary" : "bg-background text-foreground border-input hover:bg-primary/15"}`}
                      onClick={() => toggleValue(v)}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Sliders */}
            {selectedValues.length === 2 && (
              <div className="space-y-4">
                <p className="text-sm font-bold text-foreground">עד כמה לדעתך הערך נפגע מההחלטה שלך</p>
                {selectedValues.map((val) => (
                  <div key={val} className="bg-muted/30 rounded-lg p-3">
                    <p className="text-xs font-semibold text-primary text-right mb-3">{val}</p>
                    <Slider value={[scaleValues[val] ?? 5]} onValueChange={(v) => setScaleValues(prev => ({ ...prev, [val]: v[0] }))} min={1} max={10} step={1} />
                    <div className="flex justify-between text-[10px] text-muted-foreground mt-1 px-0.5" dir="ltr">
                      {Array.from({ length: 10 }, (_, i) => (
                        <span key={i + 1} className={scaleValues[val] === i + 1 ? "font-bold text-primary" : ""}>{i + 1}</span>
                      ))}
                    </div>
                    <div className="flex justify-between text-[10px] text-muted-foreground mt-0.5">
                      <span>נפגע מאוד</span>
                      <span>כמעט לא נפגע</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Reflection */}
            {selectedValues.length === 2 && (
              <div>
                <p className="text-sm font-bold text-foreground mb-1">ריפלקציה אישית</p>
                <p className="text-xs text-muted-foreground mb-2">מה היה השיקול המרכזי שלך בהחלטה</p>
                <Textarea value={reflection} onChange={(e) => setReflection(e.target.value)} placeholder="כתוב כאן..." rows={3} className="resize-none" />
              </div>
            )}

            {/* Submit */}
            {selectedValues.length === 2 && (
              <Button variant={canSubmit ? "default" : "outline"} onClick={handleSubmit} className="w-full" disabled={!canSubmit}>
                סיכום והמשך <ArrowLeft className="h-4 w-4 mr-2" />
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Subtle scroll indicator */}
        <div className="flex justify-center pb-4 animate-bounce opacity-30">
          <ChevronDown className="h-5 w-5 text-muted-foreground" />
        </div>
      </div>


      {/* Summary Modal */}
      <Dialog open={showSummaryModal} onOpenChange={(open) => { setShowSummaryModal(open); if (!open) resetState(); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto scrollbar-hide" dir="rtl">
          <DialogHeader className="text-right">
            <DialogTitle className="text-lg text-right">הסיכום שלך</DialogTitle>
            <DialogDescription className="sr-only">סיכום הדילמה</DialogDescription>
          </DialogHeader>

          {/* Part 1 - Choice Summary */}
          <div className="space-y-2 text-sm text-right">
            <p className="font-bold text-foreground mb-2">סיכום הבחירות שלך</p>
            <p>• הבחירה הראשונה שלך הייתה: <strong>{choice1 !== null ? choices1[choice1] : ""}</strong></p>
            <p>• אחרי ההחמרה בחרת: <strong>{choice2 !== null ? choices2[choice2] : ""}</strong></p>
            <p>• {didChangeDirection ? "שינית כיוון אחרי ההחמרה" : "נשארת באותו כיוון גם אחרי ההחמרה"}</p>
            <p>• סימנת שההתנגשות המרכזית הייתה בין <strong>{selectedValues[0]}</strong> לבין <strong>{selectedValues[1]}</strong></p>
            {selectedValues.map(v => (
              <p key={v}>• בסקלה סימנת ש<strong>{v}</strong> נפגע ברמה של <strong>{scaleValues[v] ?? 5}/10</strong></p>
            ))}
            {reflection && <p>• ברפלקציה כתבת: ״{reflection}״</p>}
          </div>

          {/* Part 2 - Personalized Feedback */}
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 mt-3">
            <p className="font-bold text-foreground text-sm mb-2">משוב מותאם אישית</p>
            {conclusion ? (
              <p className="text-sm leading-relaxed whitespace-pre-line">{conclusion}</p>
            ) : (
              <p className="text-sm text-muted-foreground">לא הצלחנו לייצר משוב, אפשר להמשיך לדילמה הבאה.</p>
            )}
          </div>

          <Button onClick={goNext} className="w-full mt-2">
            {currentIdx !== null && currentIdx < scenarios.length - 1 ? "ממשיכים לדילמה הבאה" : "סיום"} <ArrowLeft className="h-4 w-4 mr-2" />
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
