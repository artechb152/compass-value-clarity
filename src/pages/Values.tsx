import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import SegmentedProgress from "@/components/SegmentedProgress";
import { ArrowRight, CheckCircle, ChevronDown } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

const Values = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [values, setValues] = useState<Tables<"values">[]>([]);
  const [selected, setSelected] = useState<Tables<"values"> | null>(null);
  const [viewedIds, setViewedIds] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showScrollHint, setShowScrollHint] = useState(true);

  useEffect(() => {
    supabase.from("values").select("*").order("display_order", { ascending: true }).then(({ data }) => data && setValues(data));
    if (user) {
      const stored = JSON.parse(localStorage.getItem(`viewed_values_${user.id}`) || "[]");
      setViewedIds(stored);
      supabase.from("progress").upsert({ user_id: user.id, module_key: "values", status: "in_progress", updated_at: new Date().toISOString() }, { onConflict: "user_id,module_key" });
    }
  }, [user]);

  const openValue = (v: Tables<"values">) => {
    setSelected(v);
    if (user && !viewedIds.includes(v.id)) {
      const updated = [...viewedIds, v.id];
      setViewedIds(updated);
      localStorage.setItem(`viewed_values_${user.id}`, JSON.stringify(updated));
      if (updated.length >= values.length && values.length > 0) {
        supabase.from("progress").upsert({ user_id: user.id, module_key: "values", status: "completed", updated_at: new Date().toISOString() }, { onConflict: "user_id,module_key" });
      }
    }
  };

  const handleCloseValue = (open: boolean) => {
    if (!open) {
      setSelected(null);
      if (user) {
        const currentViewed = JSON.parse(localStorage.getItem(`viewed_values_${user.id}`) || "[]");
        if (currentViewed.length >= values.length && values.length > 0) {
          navigate("/");
        }
      }
    }
  };

  const progressPct = values.length > 0 ? Math.round((viewedIds.length / values.length) * 100) : 0;

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
    setShowScrollHint(!atBottom);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener("scroll", checkScroll);
    window.addEventListener("resize", checkScroll);
    return () => {
      el.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, [checkScroll, values]);

  return (
    <AppShell>
      <div className="p-4 max-w-2xl mx-auto h-[calc(100vh-56px)] flex flex-col overflow-hidden">
        <div className="flex items-center gap-3 mb-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="shrink-0 hover:bg-primary [&:hover_svg]:text-white">
            <ArrowRight className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-primary">רוח צה״ל - הערכים</h1>
            <p className="text-muted-foreground text-sm">11 ערכי יסוד. לחץ על ערך כדי ללמוד ולתרגל.</p>
          </div>
        </div>

        <div className="flex items-center gap-3 mb-6">
          <SegmentedProgress completed={viewedIds.length} total={values.length || 11} />
          <span className="text-xs text-muted-foreground whitespace-nowrap">{viewedIds.length}/{values.length}</span>
        </div>

        <div className="flex flex-col gap-3 pb-4 overflow-y-auto flex-1 scrollbar-hide" ref={scrollRef}>
          {values.map((v) => {
            const isViewed = viewedIds.includes(v.id);
            return (
              <Card
                key={v.id}
                className={`cursor-pointer hover:shadow-md transition-all border-r-4 ${isViewed ? "border-r-success" : "border-r-primary/20"}`}
                onClick={() => openValue(v)}
                role="button"
                tabIndex={0}
                aria-label={`ערך: ${v.title_he}`}
                onKeyDown={(e) => e.key === "Enter" && openValue(v)}
              >
                <div className="flex items-center gap-3 p-3">
                  {isViewed && <CheckCircle className="h-5 w-5 text-success shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm">{v.title_he}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{v.official_definition_he}</p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {values.length > 5 && showScrollHint && (
          <div className="flex justify-center py-2 pointer-events-none transition-opacity duration-300">
            <ChevronDown className="h-6 w-6 text-muted-foreground/40 animate-bounce" />
          </div>
        )}
      </div>

      <Dialog open={!!selected} onOpenChange={handleCloseValue}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto scrollbar-hide" dir="rtl">
          {selected && (
            <>
              <DialogHeader className="text-right">
                <DialogTitle className="text-xl text-right">{selected.title_he}</DialogTitle>
                <DialogDescription className="sr-only">ערך מתוך רוח צה״ל</DialogDescription>
              </DialogHeader>

              <div>
                <h3 className="font-semibold text-sm text-primary mb-1">ההגדרה הרשמית</h3>
                <p className="text-sm leading-relaxed">{selected.official_definition_he}</p>
              </div>

              {(selected as any).what_it_means_in_practice_he && (
                <div className="bg-muted/50 rounded-lg p-3">
                  <h3 className="font-semibold text-sm text-primary mb-1">מה זה אומר בפועל?</h3>
                  <p className="text-sm">{(selected as any).what_it_means_in_practice_he}</p>
                </div>
              )}

              {/* Embedded video if exists */}
              {(selected as any).video_url && (
                <div>
                  <h3 className="font-semibold text-sm text-primary mb-1">סרטון</h3>
                  <div className="relative aspect-video rounded-lg overflow-hidden">
                    <iframe
                      className="w-full h-full"
                      src={(selected as any).video_url}
                      title={`סרטון - ${selected.title_he}`}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                </div>
              )}

              {/* Next value button */}
              {values.length > 0 && (() => {
                const currentIndex = values.findIndex(v => v.id === selected.id);
                const nextIndex = currentIndex + 1;
                if (nextIndex < values.length) {
                  return (
                    <div className="flex justify-center pt-2">
                      <Button
                        variant="outline"
                        onClick={() => openValue(values[nextIndex])}
                        className="hover:bg-primary hover:text-primary-foreground gap-2 [&:hover_svg]:text-white"
                      >
                        <span>לערך הבא</span>
                        <ArrowRight className="h-4 w-4 rotate-180 text-primary" />
                      </Button>
                    </div>
                  );
                }
                return null;
              })()}
            </>
          )}
        </DialogContent>
      </Dialog>
    </AppShell>
  );
};

export default Values;