import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

const typeConfig: Record<string, { icon: React.ElementType; color: string; bgColor: string }> = {
  legal: { icon: CheckCircle, color: "text-green-700", bgColor: "bg-green-50 border-green-200" },
  illegal: { icon: AlertTriangle, color: "text-yellow-700", bgColor: "bg-yellow-50 border-yellow-200" },
  manifestly_illegal: { icon: XCircle, color: "text-red-700", bgColor: "bg-red-50 border-red-200" },
};

const Orders = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Tables<"orders">[]>([]);
  const [selected, setSelected] = useState<Tables<"orders"> | null>(null);
  const [miniChoice, setMiniChoice] = useState<number | null>(null);

  useEffect(() => {
    supabase.from("orders").select("*").then(({ data }) => data && setOrders(data));
    if (user) {
      supabase.from("progress").upsert({ user_id: user.id, module_key: "orders", status: "in_progress", updated_at: new Date().toISOString() }, { onConflict: "user_id,module_key" });
    }
  }, [user]);

  return (
    <AppShell>
      <div className="p-4 max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-primary mb-1">פקודות</h1>
        <p className="text-muted-foreground text-sm mb-6">חוקית / בלתי חוקית / בלתי חוקית בעליל</p>

        <div className="space-y-4">
          {orders.map((o) => {
            const cfg = typeConfig[o.type] || typeConfig.legal;
            const Icon = cfg.icon;
            return (
              <Card
                key={o.id}
                className={`cursor-pointer hover:shadow-lg transition-all ${cfg.bgColor} border`}
                onClick={() => { setSelected(o); setMiniChoice(null); }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && setSelected(o)}
              >
                <CardHeader className="flex-row items-center gap-3">
                  <Icon className={`h-8 w-8 ${cfg.color}`} />
                  <div>
                    <CardTitle className="text-lg">{o.title_he}</CardTitle>
                    <p className="text-sm text-muted-foreground line-clamp-2">{o.official_definition_he?.slice(0, 80)}…</p>
                  </div>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      </div>

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" dir="rtl">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl">{selected.title_he}</DialogTitle>
                <DialogDescription>סוג פקודה</DialogDescription>
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

                <div className="bg-destructive/5 rounded-lg p-3">
                  <h3 className="font-semibold text-sm text-destructive mb-2">🚩 Red Flags</h3>
                  <ul className="space-y-1">
                    {(selected.red_flags_json as string[] || []).map((flag, i) => (
                      <li key={i} className="text-sm flex items-start gap-2">
                        <span className="text-destructive">•</span> {flag}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-muted/50 rounded-lg p-3">
                  <h3 className="font-semibold text-sm text-primary mb-2">✅ מה עושים?</h3>
                  <ol className="space-y-1">
                    {(selected.what_to_do_steps_json as string[] || []).map((step, i) => (
                      <li key={i} className="text-sm flex items-start gap-2">
                        <span className="font-bold text-primary">{i + 1}.</span> {step}
                      </li>
                    ))}
                  </ol>
                </div>

                {/* Mini scenario */}
                <div className="bg-accent/10 rounded-lg p-3">
                  <h3 className="font-semibold text-sm text-primary mb-2">🎯 מיני-תרחיש</h3>
                  <p className="text-sm mb-3">{selected.mini_scenario_he}</p>
                  <div className="space-y-2">
                    {(selected.mini_choices_json as string[] || []).map((choice, i) => (
                      <Button
                        key={i}
                        variant={miniChoice === i ? "default" : "outline"}
                        className="w-full text-right justify-start h-auto py-2 px-3"
                        onClick={() => setMiniChoice(i)}
                      >
                        {choice}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              <Button onClick={() => setSelected(null)} className="w-full mt-2">סגור</Button>
            </>
          )}
        </DialogContent>
      </Dialog>
    </AppShell>
  );
};

export default Orders;
