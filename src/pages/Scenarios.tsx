import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

const Scenarios = () => {
  const { user } = useAuth();
  const [scenarios, setScenarios] = useState<Tables<"scenarios">[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [chosenIdx, setChosenIdx] = useState<number | null>(null);
  const [selectedValues, setSelectedValues] = useState<string[]>([]);
  const [tensionMH, setTensionMH] = useState([50]);
  const [tensionDR, setTensionDR] = useState([50]);
  const [reflection, setReflection] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    supabase.from("scenarios").select("*").then(({ data }) => data && setScenarios(data));
    if (user) {
      supabase.from("progress").upsert({ user_id: user.id, module_key: "scenarios", status: "in_progress", updated_at: new Date().toISOString() }, { onConflict: "user_id,module_key" });
    }
  }, [user]);

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
    setSubmitted(true);
    toast.success("התשובה נשמרה!");
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

  return (
    <AppShell>
      <div className="p-4 max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-primary">מעבדת דילמות</h1>
          <span className="text-sm text-muted-foreground">{currentIdx + 1}/{scenarios.length}</span>
        </div>

        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="text-lg">{scenario.title_he}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-line leading-relaxed mb-4">{scenario.story_he}</p>

            {chosenIdx === null && (
              <>
                <p className="text-sm font-medium text-primary mb-3">רגע לפני שאתה בוחר—איזה ערך פה מתנגש לך בראש?</p>
                <div className="space-y-2">
                  {choices.map((c, i) => (
                    <Button key={i} variant="outline" className="w-full text-right justify-start h-auto py-3 px-4" onClick={() => setChosenIdx(i)}>
                      {c}
                    </Button>
                  ))}
                </div>
              </>
            )}

            {chosenIdx !== null && !submitted && (
              <div className="space-y-5 mt-4">
                {/* Feedback */}
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-sm font-medium text-primary mb-1">אין פה שחור־לבן. בוא נפרק לערכים + השלכות.</p>
                  <p className="text-sm">{feedbacks[chosenIdx]}</p>
                </div>

                {/* Value selector */}
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

                {/* Tension Meter */}
                <div className="space-y-4">
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

                {/* Reflection */}
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
                ) : (
                  <p className="text-sm text-muted-foreground">סיימת את כל התרחישים! 🎉</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
};

export default Scenarios;
