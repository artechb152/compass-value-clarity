import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import type { Tables, Json } from "@/integrations/supabase/types";

const Weekly = () => {
  const { user } = useAuth();
  const [poll, setPoll] = useState<Tables<"weekly_polls"> | null>(null);
  const [voted, setVoted] = useState(false);
  const [myVote, setMyVote] = useState<number | null>(null);
  const [results, setResults] = useState<{ option_index: number; count: number }[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data: polls } = await supabase.from("weekly_polls").select("*").order("created_at", { ascending: false }).limit(1);
      if (!polls?.length) return;
      const p = polls[0];
      setPoll(p);

      if (user) {
        const { data: vote } = await supabase.from("weekly_votes").select("option_index").eq("user_id", user.id).eq("poll_id", p.id).maybeSingle();
        if (vote) { setVoted(true); setMyVote(vote.option_index); }
      }

      // Get results
      const { data: res } = await supabase.rpc("get_poll_results", { p_poll_id: p.id });
      if (res) setResults(res as any);
    };
    load();
  }, [user]);

  const handleVote = async (idx: number) => {
    if (!user || !poll) return;
    const { error } = await supabase.from("weekly_votes").insert({ user_id: user.id, poll_id: poll.id, option_index: idx });
    if (error) { toast.error(error.message); return; }
    setVoted(true);
    setMyVote(idx);
    toast.success("ההצבעה נשמרה!");
    const { data: res } = await supabase.rpc("get_poll_results", { p_poll_id: poll.id });
    if (res) setResults(res as any);
  };

  if (!poll) return <AppShell><div className="p-4 text-center text-muted-foreground">אין סקר שבועי כרגע</div></AppShell>;

  const options = (poll.options_json as string[]) || [];
  const total = results.reduce((s, r) => s + r.count, 0);

  return (
    <AppShell>
      <div className="p-4 max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-primary mb-1">📊 דילמת השבוע</h1>
        <p className="text-muted-foreground text-sm mb-6">הצבעה אנונימית – פעם אחת לסקר</p>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{poll.question_he}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {options.map((opt, i) => {
              const count = results.find((r) => r.option_index === i)?.count || 0;
              const pct = total > 0 ? Math.round((count / total) * 100) : 0;

              return (
                <div key={i}>
                  {!voted ? (
                    <Button variant="outline" className="w-full text-right justify-start h-auto py-3" onClick={() => handleVote(i)}>
                      {opt}
                    </Button>
                  ) : (
                    <div className={`rounded-lg p-3 ${myVote === i ? "bg-primary/10 border border-primary/30" : "bg-muted/50"}`}>
                      <div className="flex justify-between text-sm mb-1">
                        <span>{opt}</span>
                        <span className="font-bold">{pct}%</span>
                      </div>
                      <Progress value={pct} className="h-2" />
                    </div>
                  )}
                </div>
              );
            })}
            {voted && <p className="text-xs text-center text-muted-foreground mt-2">{total} הצבעות</p>}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
};

export default Weekly;
