import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

const Values = () => {
  const { user } = useAuth();
  const [values, setValues] = useState<Tables<"values">[]>([]);
  const [selected, setSelected] = useState<Tables<"values"> | null>(null);
  const [selectedConflicts, setSelectedConflicts] = useState<string[]>([]);

  useEffect(() => {
    supabase.from("values").select("*").then(({ data }) => data && setValues(data));
    // Mark progress
    if (user) {
      supabase.from("progress").upsert({ user_id: user.id, module_key: "values", status: "in_progress", updated_at: new Date().toISOString() }, { onConflict: "user_id,module_key" });
    }
  }, [user]);

  const toggleConflict = (title: string) => {
    setSelectedConflicts((prev) =>
      prev.includes(title) ? prev.filter((v) => v !== title) : prev.length < 2 ? [...prev, title] : prev
    );
  };

  return (
    <AppShell>
      <div className="p-4 max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-primary mb-1">רוח צה״ל – הערכים</h1>
        <p className="text-muted-foreground text-sm mb-6">10 ערכי יסוד. לחצ/י על ערך כדי ללמוד ולתרגל.</p>

        <div className="grid grid-cols-2 gap-3">
          {values.map((v) => (
            <Card
              key={v.id}
              className="cursor-pointer hover:shadow-lg transition-all hover:scale-[1.02] border-t-4 border-t-primary/20"
              onClick={() => { setSelected(v); setSelectedConflicts([]); }}
              role="button"
              tabIndex={0}
              aria-label={`ערך: ${v.title_he}`}
              onKeyDown={(e) => e.key === "Enter" && setSelected(v)}
            >
              <CardHeader className="pb-1">
                <CardTitle className="text-sm leading-tight">{v.title_he}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground line-clamp-2">{v.youth_microcopy_he}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" dir="rtl">
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
                  <h3 className="font-semibold text-sm text-primary mb-1">💬 בשפה שלנו</h3>
                  <p className="text-sm">{selected.youth_microcopy_he}</p>
                </div>

                <div className="bg-accent/10 rounded-lg p-3">
                  <h3 className="font-semibold text-sm text-primary mb-1">⚡ תרגול זריז</h3>
                  <p className="text-sm mb-3">{selected.quick_exercise_question_he}</p>

                  <p className="text-xs text-muted-foreground mb-2">בחר/י 2 ערכים שהתנגשו פה:</p>
                  <div className="flex flex-wrap gap-2">
                    {values.filter((v) => v.id !== selected.id).map((v) => (
                      <Badge
                        key={v.id}
                        variant={selectedConflicts.includes(v.title_he) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => toggleConflict(v.title_he)}
                      >
                        {v.title_he}
                      </Badge>
                    ))}
                  </div>
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
