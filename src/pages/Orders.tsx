import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AppShell } from "@/components/AppShell";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import SegmentedProgress from "@/components/SegmentedProgress";
import { ExternalLink, AlertTriangle, CheckCircle, XCircle, ArrowRight } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

interface MiniFeedback { choice_index: number; title: string; text: string; }

const typeConfig: Record<string, { icon: React.ElementType; color: string; bgColor: string }> = {
  legal: { icon: CheckCircle, color: "text-green-700", bgColor: "bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800" },
  illegal: { icon: AlertTriangle, color: "text-yellow-700 dark:text-yellow-400", bgColor: "bg-yellow-50 border-yellow-200 dark:bg-yellow-950/30 dark:border-yellow-800" },
  manifestly_illegal: { icon: XCircle, color: "text-red-700 dark:text-red-400", bgColor: "bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800" },
};

const Orders = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Tables<"orders">[]>([]);
  const [selected, setSelected] = useState<Tables<"orders"> | null>(null);
  const [miniChoice, setMiniChoice] = useState<number | null>(null);
  const [feedbackModal, setFeedbackModal] = useState<MiniFeedback | null>(null);
  const [viewedIds, setViewedIds] = useState<string[]>([]);
  const [miniScenarioError, setMiniScenarioError] = useState(false);

  useEffect(() => {
    supabase.from("orders").select("*").then(({ data }) => data && setOrders(data));
    if (user) {
      const stored = JSON.parse(localStorage.getItem(`viewed_orders_${user.id}`) || "[]");
      setViewedIds(stored);
      supabase.from("progress").upsert({ user_id: user.id, module_key: "orders", status: "in_progress", updated_at: new Date().toISOString() }, { onConflict: "user_id,module_key" });
    }
  }, [user]);

  const openOrder = (o: Tables<"orders">) => {
    setSelected(o);
    setMiniChoice(null);
    setMiniScenarioError(false);
    if (user && !viewedIds.includes(o.id)) {
      const updated = [...viewedIds, o.id];
      setViewedIds(updated);
      localStorage.setItem(`viewed_orders_${user.id}`, JSON.stringify(updated));
      if (updated.length >= orders.length && orders.length > 0) {
        supabase.from("progress").upsert({ user_id: user.id, module_key: "orders", status: "completed", updated_at: new Date().toISOString() }, { onConflict: "user_id,module_key" });
      }
    }
  };

  const handleCloseOrder = (open: boolean) => {
    if (!open) {
      setSelected(null);
      setMiniScenarioError(false);
      if (user) {
        const currentViewed = JSON.parse(localStorage.getItem(`viewed_orders_${user.id}`) || "[]");
        if (currentViewed.length >= orders.length && orders.length > 0) {
          navigate("/");
        }
      }
    }
  };

  const progressPct = orders.length > 0 ? Math.round((viewedIds.length / orders.length) * 100) : 0;

  return (
    <AppShell>
      <div className="p-4 max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="shrink-0 hover:bg-primary hover:text-primary-foreground">
            <ArrowRight className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-primary">פקודות</h1>
            <p className="text-muted-foreground text-sm">חוקית / בלתי חוקית / בלתי חוקית בעליל</p>
          </div>
        </div>

        <div className="flex items-center gap-3 mb-6">
          <SegmentedProgress completed={viewedIds.length} total={orders.length || 3} />
          <span className="text-xs text-muted-foreground whitespace-nowrap">{viewedIds.length}/{orders.length}</span>
        </div>

        <div className="space-y-4">
          {orders.map((o) => {
            const cfg = typeConfig[o.type] || typeConfig.legal;
            const Icon = cfg.icon;
            const isViewed = viewedIds.includes(o.id);
            return (
              <Card
                key={o.id}
                className={`cursor-pointer hover:shadow-lg transition-all ${cfg.bgColor} border ${isViewed ? "ring-2 ring-success/40 border-success/50" : ""}`}
                onClick={() => openOrder(o)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && openOrder(o)}
              >
                <CardHeader className="flex-row items-center gap-3">
                  <Icon className={`h-8 w-8 ${cfg.color}`} />
                  <div className="flex-1">
                    <CardTitle className="text-lg">{o.title_he}</CardTitle>
                  </div>
                  {isViewed && <CheckCircle className="h-5 w-5 text-success shrink-0" />}
                </CardHeader>
              </Card>
            );
          })}
        </div>
      </div>

      <Dialog open={!!selected} onOpenChange={handleCloseOrder}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" dir="rtl">
          {selected && (
            <>
              <DialogHeader className="text-right">
                <DialogTitle className="text-xl text-right">{selected.title_he}</DialogTitle>
                <DialogDescription className="sr-only">פרטי פקודה</DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-sm text-primary mb-1">הגדרה רשמית</h3>
                  <p className="text-sm leading-relaxed">{selected.official_definition_he}</p>
                  {selected.source_url && (
                    <a href={selected.source_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-1">
                      מקור <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>

                <div className="bg-destructive/5 rounded-lg p-3" dir="rtl">
                  <h3 className="font-semibold text-sm text-destructive mb-2">דגל אדום</h3>
                  <ul className="space-y-1">
                    {(selected.red_flags_json as string[] || []).map((flag, i) => (
                      <li key={i} className="text-sm flex items-start gap-2" style={{ direction: "rtl" }}>
                        <span className="text-destructive shrink-0 mt-0.5">•</span>
                        <span className="text-right flex-1">{flag}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-muted/50 rounded-lg p-3">
                  <h3 className="font-semibold text-sm text-primary mb-2">מה עושים?</h3>
                  <ol className="space-y-1">
                    {(selected.what_to_do_steps_json as string[] || []).map((step, i) => (
                      <li key={i} className="text-sm flex items-start gap-2">
                        <span className="font-bold text-primary">{i + 1}.</span> {step}
                      </li>
                    ))}
                  </ol>
                </div>

                <div className={`rounded-lg p-3 transition-all ${miniScenarioError && miniChoice === null ? "bg-destructive/10 ring-2 ring-destructive" : "bg-accent/10"}`}>
                  <h3 className="font-semibold text-sm text-primary mb-2">מיני-תרחיש</h3>
                  <p className="text-sm mb-3">{selected.mini_scenario_he}</p>
                  {miniScenarioError && miniChoice === null && (
                    <p className="text-xs text-destructive mb-2 font-medium">יש לענות על המיני-תרחיש לפני סגירה</p>
                  )}
                  <div className="space-y-2">
                    {(selected.mini_choices_json as string[] || []).map((choice, i) => (
                      <Button
                        key={i}
                        variant={miniChoice === i ? "default" : "outline"}
                        className="w-full text-right justify-start h-auto py-2 px-3"
                        onClick={() => {
                          setMiniChoice(i);
                          setMiniScenarioError(false);
                          const feedbacks = (selected as any).mini_feedback_json as MiniFeedback[] | null;
                          if (feedbacks) {
                            const fb = feedbacks.find(f => f.choice_index === i);
                            if (fb) setFeedbackModal(fb);
                          }
                        }}
                      >
                        {choice}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!feedbackModal} onOpenChange={() => setFeedbackModal(null)}>
        <DialogContent className="max-w-sm" dir="rtl" role="dialog" aria-modal="true">
          {feedbackModal && (
            <>
              <DialogHeader className="text-right">
                <DialogTitle className="text-lg text-right">{feedbackModal.title}</DialogTitle>
                <DialogDescription className="sr-only">משוב על הבחירה</DialogDescription>
              </DialogHeader>
              <p className="text-sm leading-relaxed">{feedbackModal.text}</p>
              <Button onClick={() => setFeedbackModal(null)} className="w-full mt-2">הבנתי</Button>
            </>
          )}
        </DialogContent>
      </Dialog>
    </AppShell>
  );
};

export default Orders;
