import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ExternalLink, ArrowRight, CheckCircle, ChevronDown } from "lucide-react";
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

        <div className="flex flex-col gap-3 pb-4">
          {values.map((v) => {
            const isViewed = viewedIds.includes(v.id);
            return (
              <Card
                key={v.id}
                className={`cursor-pointer hover:shadow-md transition-all border-r-4 ${isViewed ? "border-r-green-500" : "border-r-primary/20"}`}
                onClick={() => openValue(v)}
                role="button"
                tabIndex={0}
                aria-label={`ערך: ${v.title_he}`}
                onKeyDown={(e) => e.key === "Enter" && openValue(v)}
              >
                <div className="flex items-center gap-3 p-3">
                  {isViewed && <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm">{v.title_he}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{v.youth_microcopy_he}</p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {values.length > 5 && (
          <div className="flex justify-center py-2 text-muted-foreground animate-bounce">
            <ChevronDown className="h-5 w-5" />
          </div>
        )}
      </div>

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-md max-h-[70vh] overflow-y-auto p-4" dir="rtl">
          {selected && (
            <div className="space-y-3">
              <DialogHeader className="text-right pb-0 pr-0 pl-8">
                <DialogTitle className="text-lg text-right leading-snug">{selected.title_he}</DialogTitle>
                <DialogDescription className="text-right text-xs">ערך מתוך רוח צה״ל</DialogDescription>
              </DialogHeader>

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
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AppShell>
  );
};

export default Values;
