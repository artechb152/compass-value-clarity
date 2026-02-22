import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

const Admin = () => {
  const [dilemmas, setDilemmas] = useState<Tables<"user_dilemmas">[]>([]);
  const [responses, setResponses] = useState<Tables<"responses">[]>([]);
  const [polls, setPolls] = useState<Tables<"weekly_polls">[]>([]);

  const loadDilemmas = async () => {
    const { data } = await supabase.from("user_dilemmas").select("*").order("created_at", { ascending: false });
    if (data) setDilemmas(data);
  };

  useEffect(() => {
    loadDilemmas();
    supabase.from("responses").select("*").order("created_at", { ascending: false }).limit(50).then(({ data }) => data && setResponses(data));
    supabase.from("weekly_polls").select("*").order("created_at", { ascending: false }).then(({ data }) => data && setPolls(data));
  }, []);

  const updateDilemmaStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("user_dilemmas").update({ status }).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success(`סטטוס עודכן ל-${status}`); loadDilemmas(); }
  };

  const statusColor: Record<string, string> = { pending: "bg-yellow-100 text-yellow-800", approved: "bg-green-100 text-green-800", rejected: "bg-red-100 text-red-800" };

  // Stats
  const choiceDistribution: Record<string, Record<number, number>> = {};
  responses.forEach((r) => {
    if (!r.scenario_id || r.choice === null) return;
    if (!choiceDistribution[r.scenario_id]) choiceDistribution[r.scenario_id] = {};
    choiceDistribution[r.scenario_id][r.choice!] = (choiceDistribution[r.scenario_id][r.choice!] || 0) + 1;
  });

  const avgTensionMH = responses.filter((r) => r.tension_mission_human !== null).reduce((s, r) => s + r.tension_mission_human!, 0) / (responses.filter((r) => r.tension_mission_human !== null).length || 1);
  const avgTensionDR = responses.filter((r) => r.tension_discipline_responsibility !== null).reduce((s, r) => s + r.tension_discipline_responsibility!, 0) / (responses.filter((r) => r.tension_discipline_responsibility !== null).length || 1);

  return (
    <AppShell>
      <div className="p-4 max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-primary mb-4">⚙️ פאנל ניהול</h1>

        <Tabs defaultValue="dilemmas">
          <TabsList className="w-full mb-4">
            <TabsTrigger value="dilemmas" className="flex-1">דילמות ({dilemmas.filter((d) => d.status === "pending").length})</TabsTrigger>
            <TabsTrigger value="stats" className="flex-1">סטטיסטיקות</TabsTrigger>
            <TabsTrigger value="polls" className="flex-1">סקרים</TabsTrigger>
          </TabsList>

          <TabsContent value="dilemmas" className="space-y-3">
            {dilemmas.map((d) => (
              <Card key={d.id}>
                <CardHeader className="pb-2 flex-row items-start justify-between">
                  <div>
                    <CardTitle className="text-sm">{d.title_he}</CardTitle>
                    <span className="text-xs text-muted-foreground">{new Date(d.created_at!).toLocaleDateString("he-IL")}</span>
                  </div>
                  <Badge className={statusColor[d.status] || ""}>{d.status}</Badge>
                </CardHeader>
                <CardContent>
                  <p className="text-sm mb-3">{d.story_he}</p>
                  {d.status === "pending" && (
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => updateDilemmaStatus(d.id, "approved")}>אישור</Button>
                      <Button size="sm" variant="destructive" onClick={() => updateDilemmaStatus(d.id, "rejected")}>דחייה</Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
            {dilemmas.length === 0 && <p className="text-center text-muted-foreground py-8">אין דילמות</p>}
          </TabsContent>

          <TabsContent value="stats">
            <div className="space-y-4">
              <Card>
                <CardHeader><CardTitle className="text-sm">Tension Meter ממוצעים</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>משימה ↔ כבוד האדם</span>
                    <span className="font-bold">{Math.round(avgTensionMH)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>משמעת ↔ אחריות אישית</span>
                    <span className="font-bold">{Math.round(avgTensionDR)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{responses.length} תשובות</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-sm">פילוח בחירות לפי תרחיש</CardTitle></CardHeader>
                <CardContent>
                  {Object.entries(choiceDistribution).map(([sid, dist]) => (
                    <div key={sid} className="mb-3">
                      <p className="text-xs font-medium mb-1">{sid}</p>
                      <div className="flex gap-2">
                        {Object.entries(dist).map(([choice, count]) => (
                          <Badge key={choice} variant="outline">בחירה {Number(choice) + 1}: {count}</Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="polls" className="space-y-3">
            {polls.map((p) => (
              <Card key={p.id}>
                <CardHeader>
                  <CardTitle className="text-sm">{p.question_he}</CardTitle>
                  <span className="text-xs text-muted-foreground">{p.week_key}</span>
                </CardHeader>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
};

export default Admin;
