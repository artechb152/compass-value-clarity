import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AppShell } from "@/components/AppShell";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import SegmentedProgress from "@/components/SegmentedProgress";
import { AlertTriangle, CheckCircle, XCircle, ArrowRight } from "lucide-react";
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
  const [activePage, setActivePage] = useState<1 | 2>(1);
  const [miniChoice, setMiniChoice] = useState<number | null>(null);
  const [feedbackModal, setFeedbackModal] = useState<MiniFeedback | null>(null);
  const [feedbackIsCorrect, setFeedbackIsCorrect] = useState<boolean>(false);
  const [isCurrentCorrect, setIsCurrentCorrect] = useState<boolean | null>(null);
  const [viewedIds, setViewedIds] = useState<string[]>([]);
  const [correctIds, setCorrectIds] = useState<string[]>([]);
  const [wrongIds, setWrongIds] = useState<string[]>([]);
  const [shakeModal, setShakeModal] = useState(false);
  const shakeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    supabase.from("orders").select("*").then(({ data }) => data && setOrders(data));
    if (user) {
      const stored = JSON.parse(localStorage.getItem(`viewed_orders_${user.id}`) || "[]");
      setViewedIds(stored);
      const storedCorrect = JSON.parse(localStorage.getItem(`correct_orders_${user.id}`) || "[]");
      setCorrectIds(storedCorrect);
      const storedWrong = JSON.parse(localStorage.getItem(`wrong_orders_${user.id}`) || "[]");
      setWrongIds(storedWrong);
      supabase.from("progress").upsert({ user_id: user.id, module_key: "orders", status: "in_progress", updated_at: new Date().toISOString() }, { onConflict: "user_id,module_key" });
    }
  }, [user]);

  const openOrder = (o: Tables<"orders">) => {
    setSelected(o);
    setActivePage(1);
    setMiniChoice(null);
    setFeedbackModal(null);
    setFeedbackIsCorrect(false);
    setIsCurrentCorrect(null);
    setShakeModal(false);
    if (user && !viewedIds.includes(o.id)) {
      const updated = [...viewedIds, o.id];
      setViewedIds(updated);
      localStorage.setItem(`viewed_orders_${user.id}`, JSON.stringify(updated));
    }
  };

  const handleChoiceClick = (i: number) => {
    if (!selected) return;
    const correctIdx = selected.mini_correct_index;
    const isCorrect = correctIdx !== null && correctIdx !== undefined && i === correctIdx;

    setMiniChoice(i);
    setIsCurrentCorrect(isCorrect);

    if (user) {
      if (isCorrect) {
        let updatedCorrect = correctIds;
        if (!correctIds.includes(selected.id)) {
          updatedCorrect = [...correctIds, selected.id];
          setCorrectIds(updatedCorrect);
          localStorage.setItem(`correct_orders_${user.id}`, JSON.stringify(updatedCorrect));
          if (updatedCorrect.length >= orders.length && orders.length > 0) {
            supabase.from("progress").upsert({ user_id: user.id, module_key: "orders", status: "completed", updated_at: new Date().toISOString() }, { onConflict: "user_id,module_key" });
          }
        }
        if (wrongIds.includes(selected.id)) {
          const updatedWrong = wrongIds.filter(id => id !== selected.id);
          setWrongIds(updatedWrong);
          localStorage.setItem(`wrong_orders_${user.id}`, JSON.stringify(updatedWrong));
        }
        // Auto-close after correct - check if all 3 done
        setTimeout(() => {
          setSelected(null);
          // If all orders correct, navigate to orders list
          if (updatedCorrect.length >= orders.length && orders.length > 0) {
            navigate("/");
          }
        }, 600);
      } else {
        if (!correctIds.includes(selected.id) && !wrongIds.includes(selected.id)) {
          const updatedWrong = [...wrongIds, selected.id];
          setWrongIds(updatedWrong);
          localStorage.setItem(`wrong_orders_${user.id}`, JSON.stringify(updatedWrong));
        }
        const feedbacks = (selected as any).mini_feedback_json as MiniFeedback[] | null;
        if (feedbacks) {
          const fb = feedbacks.find(f => f.choice_index === i);
          if (fb) {
            setFeedbackModal({ ...fb, title: fb.title || "לא מדויק" });
            setFeedbackIsCorrect(false);
          }
        }
      }
    }
  };

  const handleRetry = () => {
    setFeedbackModal(null);
    setMiniChoice(null);
    setIsCurrentCorrect(null);
  };

  const handleCloseOrder = (open: boolean) => {
    if (!open) {
      // Block close if exercise not completed
      if (selected && isCurrentCorrect !== true) {
        setShakeModal(true);
        if (shakeTimeout.current) clearTimeout(shakeTimeout.current);
        shakeTimeout.current = setTimeout(() => setShakeModal(false), 800);
        return;
      }
      setSelected(null);
      setActivePage(1);
    }
  };

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
          <SegmentedProgress completed={correctIds.length} total={orders.length || 3} />
          <span className="text-xs text-muted-foreground whitespace-nowrap">{correctIds.length}/{orders.length}</span>
        </div>

        <div className="space-y-4">
          {orders.map((o) => {
            const cfg = typeConfig[o.type] || typeConfig.legal;
            const Icon = cfg.icon;
            const isCorrect = correctIds.includes(o.id);
            const isWrong = wrongIds.includes(o.id) && !isCorrect;
            return (
              <Card
                key={o.id}
                className={`cursor-pointer hover:shadow-lg transition-all ${cfg.bgColor} border ${isCorrect ? "border-success" : isWrong ? "border-destructive" : ""}`}
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
                  {isCorrect && <CheckCircle className="h-5 w-5 text-success shrink-0" />}
                  {isWrong && <XCircle className="h-5 w-5 text-destructive shrink-0" />}
                </CardHeader>
              </Card>
            );
          })}
        </div>
      </div>

      {/* 2-page Order Modal */}
      <Dialog open={!!selected} onOpenChange={handleCloseOrder}>
        <DialogContent
          className={`max-w-lg max-h-[90vh] overflow-y-auto scrollbar-hide transition-all ${shakeModal ? "border-destructive ring-2 ring-destructive/30 animate-shake" : ""} ${isCurrentCorrect !== true ? "[&>button:last-child]:hidden" : ""}`}
          dir="rtl"
          onPointerDownOutside={(e) => {
            if (isCurrentCorrect !== true) {
              e.preventDefault();
              setShakeModal(true);
              if (shakeTimeout.current) clearTimeout(shakeTimeout.current);
              shakeTimeout.current = setTimeout(() => setShakeModal(false), 800);
            }
          }}
          onEscapeKeyDown={(e) => {
            if (isCurrentCorrect !== true) {
              e.preventDefault();
              setShakeModal(true);
              if (shakeTimeout.current) clearTimeout(shakeTimeout.current);
              shakeTimeout.current = setTimeout(() => setShakeModal(false), 800);
            }
          }}
        >
          {selected && (
            <>
              <DialogHeader className="text-right">
                <DialogTitle className="text-xl text-right">{selected.title_he}</DialogTitle>
                <DialogDescription className="sr-only">פרטי פקודה</DialogDescription>
              </DialogHeader>

              {/* Tab indicators */}
              <div className="flex gap-2 mb-2">
                <button
                  onClick={() => setActivePage(1)}
                  className={`flex-1 py-1.5 text-sm font-medium rounded-lg transition-colors ${activePage === 1 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-primary/15"}`}
                >
                  תוכן
                </button>
                <button
                  onClick={() => setActivePage(2)}
                  className={`flex-1 py-1.5 text-sm font-medium rounded-lg transition-colors ${activePage === 2 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-primary/15"}`}
                >
                  תרגיל
                </button>
              </div>

              {/* Page 1: Content */}
              {activePage === 1 && (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-sm text-primary mb-1">הגדרה רשמית</h3>
                    <p className="text-sm leading-relaxed">{selected.official_definition_he}</p>
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

                  <Button onClick={() => setActivePage(2)} className="w-full">
                    לתרגול ←
                  </Button>
                </div>
              )}

              {/* Page 2: Exercise */}
              {activePage === 2 && (
                <div className="space-y-4">
                  <div className="rounded-lg p-3 bg-accent/10">
                    <h3 className="font-semibold text-sm text-primary mb-2">תרגיל</h3>
                    <p className="text-sm mb-3">{selected.mini_scenario_he}</p>

                    <div className="space-y-2">
                      {(selected.mini_choices_json as string[] || []).map((choice, i) => {
                        const correctIdx = selected.mini_correct_index;
                        const isSelected = miniChoice === i;
                        const isCorrectChoice = isSelected && correctIdx !== null && correctIdx !== undefined && i === correctIdx;
                        const isWrongChoice = isSelected && correctIdx !== null && correctIdx !== undefined && i !== correctIdx;
                        const isDisabled = miniChoice !== null && !isSelected;
                        return (
                          <Button
                            key={i}
                            variant={isSelected ? "default" : "outline"}
                            disabled={isDisabled}
                            className={`w-full text-right justify-start h-auto py-2 px-3 gap-2 ${
                              isCorrectChoice
                                ? "bg-success text-success-foreground hover:bg-success/90 border-success"
                                : isWrongChoice
                                ? "bg-destructive text-destructive-foreground hover:bg-destructive/90 border-destructive"
                                : "hover:!bg-primary hover:!text-primary-foreground hover:!border-primary"
                            }`}
                            onClick={() => handleChoiceClick(i)}
                          >
                            <span className="flex-1 text-right">{choice}</span>
                            {isCorrectChoice && <CheckCircle className="h-4 w-4 shrink-0" />}
                            {isWrongChoice && <XCircle className="h-4 w-4 shrink-0" />}
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Feedback Modal */}
      <Dialog open={!!feedbackModal} onOpenChange={(open) => {
        if (!open) {
          if (!feedbackIsCorrect) return;
          setFeedbackModal(null);
        }
      }}>
        <DialogContent className={`max-w-lg max-h-[90vh] overflow-y-auto scrollbar-hide border-2 border-destructive ${!feedbackIsCorrect ? "[&>button:last-child]:hidden" : ""}`} dir="rtl" role="dialog" aria-modal="true">
          {feedbackModal && (
            <>
              <DialogHeader className="text-right">
                <DialogTitle className="text-lg text-right">{feedbackModal.title}</DialogTitle>
                <DialogDescription className="sr-only">משוב על הבחירה</DialogDescription>
              </DialogHeader>
              <p className="text-sm leading-relaxed">{feedbackModal.text}</p>
              {!feedbackIsCorrect && (
                <p className="text-xs text-muted-foreground">לא נורא - נסה שוב.</p>
              )}
              <Button onClick={() => {
                if (feedbackIsCorrect) {
                  setFeedbackModal(null);
                } else {
                  handleRetry();
                }
              }} className="w-full mt-2">
                {feedbackIsCorrect ? "המשך" : "נסה שנית"}
              </Button>
            </>
          )}
        </DialogContent>
      </Dialog>
    </AppShell>
  );
};

export default Orders;