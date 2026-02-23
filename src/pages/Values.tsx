import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ExternalLink, ArrowRight, CheckCircle } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

const Values = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [values, setValues] = useState<Tables<"values">[]>([]);
  const [selected, setSelected] = useState<Tables<"values"> | null>(null);
  const [selectedConflicts, setSelectedConflicts] = useState<string[]>([]);
  const [viewedIds, setViewedIds] = useState<string[]>([]);

  useEffect(() => {
    supabase.from("values").select("*").then(({ data }) => data && setValues(data));
    if (user) {
      const stored = JSON.parse(localStorage.getItem(`viewed_values_${user.id}`) || "[]");
      setViewedIds(stored);
      supabase.from("progress").upsert({ user_id: user.id, module_key: "values", status: "in_progress", updated_at: new Date().toISOString() }, { onConflict: "user_id,module_key" });
    }
  }, [user]);

  const openValue = (v: Tables<"values">) => {
    setSelected(v);
    setSelectedConflicts([]);
    if (user && !viewedIds.includes(v.id)) {
      const updated = [...viewedIds, v.id];
      setViewedIds(updated);
      localStorage.setItem(`viewed_values_${user.id}`, JSON.stringify(updated));
      // Mark completed if all viewed
      if (updated.length >= values.length && values.length > 0) {
        supabase.from("progress").upsert({ user_id: user.id, module_key: "values", status: "completed", updated_at: new Date().toISOString() }, { onConflict: "user_id,module_key" });
      }
    }
  };

  const toggleConflict = (title: string) => {
    setSelectedConflicts((prev) =>
      prev.includes(title) ? prev.filter((v) => v !== title) : prev.length < 2 ? [...prev, title] : prev
    );
  };

  const progressPct = values.length > 0 ? Math.round((viewedIds.length / values.length) * 100) : 0;

  return (
    <AppShell>
      <div className="p-4 max-w-2xl mx-auto">
        {/* Header with back button */}
        <div className="flex items-center gap-3 mb-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="shrink-0">
            <ArrowRight className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-primary">רוח צה״ל – הערכים</h1>
            <p className="text-muted-foreground text-sm">10 ערכי יסוד. לחצ/י על ערך כדי ללמוד ולתרגל.</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-3 mb-6">
          <Progress value={progressPct} className="h-2 flex-1" />
          <span className="text-xs text-muted-foreground whitespace-nowrap">{viewedIds.length}/{values.length}</span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {values.map((v) => {
            const isViewed = viewedIds.includes(v.id);
            return (
              <Card
                key={v.id}
                className={`cursor-pointer hover:shadow-lg transition-all hover:scale-[1.02] border-t-4 ${isViewed ? "border-t-green-500" : "border-t-primary/20"}`}
                onClick={() => openValue(v)}
                role="button"
                tabIndex={0}
                aria-label={`ערך: ${v.title_he}`}
                onKeyDown={(e) => e.key === "Enter" && openValue(v)}
              >
                <CardHeader className="pb-2 pt-3 px-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base leading-tight">{v.title_he}</CardTitle>
                    {isViewed && <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />}
                  </div>
                </CardHeader>
                <CardContent className="px-3 pb-3">
                  <p className="text-xs text-muted-foreground line-clamp-2">{v.youth_microcopy_he}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-lg h-[80vh] overflow-y-auto" dir="rtl">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl">{selected.title_he}</DialogTitle>
                <DialogDescription>ערך מתוך רוח צה״ל</DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-sm text-primary mb-1">ההגדרה הרשמית</h3>
                  <p className="text-sm leading-relaxed">{selected.official_definition_he}</p>
                  {selected.source_url && (
                    <a href={selected.source_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-1">
                      מקור <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>

                <div className="bg-muted/50 rounded-lg p-3">
                  <h3 className="font-semibold text-sm text-primary mb-1">💬 מה זה אומר בפועל?</h3>
                  <p className="text-sm">{selected.youth_microcopy_he}</p>
                </div>

                <div className="bg-accent/10 rounded-lg p-3">
                  <h3 className="font-semibold text-sm text-primary mb-1">⚡ תרגול זריז</h3>
                  <p className="text-sm mb-3">{selected.quick_exercise_question_he}</p>

                  <p className="text-xs font-medium text-primary mb-2">👆 לחצ/י על 2 ערכים שלדעתך מתנגשים כאן:</p>
                  <div className="flex flex-wrap gap-2">
                    {values.filter((v) => v.id !== selected.id).map((v) => (
                      <Badge
                        key={v.id}
                        variant={selectedConflicts.includes(v.title_he) ? "default" : "outline"}
                        className="cursor-pointer text-sm py-1 px-3"
                        onClick={() => toggleConflict(v.title_he)}
                      >
                        {v.title_he}
                      </Badge>
                    ))}
                  </div>
                  {selectedConflicts.length === 2 && (
                    <p className="text-xs text-green-600 mt-2">✓ בחרת: {selectedConflicts.join(" ↔ ")}</p>
                  )}
                </div>

                {selected.example_safe_he && (
                  <div className="text-xs text-muted-foreground border-r-2 border-primary/30 pr-3">
                    💡 דוגמה: {selected.example_safe_he}
                  </div>
                )}
              </div>

              <Button onClick={() => setSelected(null)} className="w-full mt-2">סגור</Button>
            </>
          )}
        </DialogContent>
      </Dialog>
    </AppShell>
  );
};

export default Values;
