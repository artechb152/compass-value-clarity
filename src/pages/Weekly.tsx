import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { ArrowRight } from "lucide-react";
import type { Tables, Json } from "@/integrations/supabase/types";

// Get current ISO week key
function getCurrentWeekKey(): string {
  const now = new Date();
  const jan1 = new Date(now.getFullYear(), 0, 1);
  const days = Math.floor((now.getTime() - jan1.getTime()) / 86400000);
  const week = Math.ceil((days + jan1.getDay() + 1) / 7);
  return `${now.getFullYear()}-W${String(week).padStart(2, "0")}`;
}

// Deterministic hash to pick a poll for a user+week combo
function hashSeed(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

const Weekly = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [poll, setPoll] = useState<Tables<"weekly_polls"> | null>(null);
  const [voted, setVoted] = useState(false);
  const [myVote, setMyVote] = useState<number | null>(null);
  const [results, setResults] = useState<{ option_index: number; count: number }[]>([]);

  useEffect(() => {
    const load = async () => {
      // Get all BANK polls
      const { data: allPolls } = await supabase.from("weekly_polls").select("*");
      if (!allPolls?.length) return;

      const weekKey = getCurrentWeekKey();

      // Pick a random poll per user per week using hash
      const seed = `${user?.id || "anon"}-${weekKey}`;
      const idx = hashSeed(seed) % allPolls.length;
      const p = allPolls[idx];
      setPoll(p);

      if (user) {
        const { data: vote } = await supabase.from("weekly_votes").select("option_index").eq("user_id", user.id).eq("poll_id", p.id).maybeSingle();
        if (vote) { setVoted(true); setMyVote(vote.option_index); }
      }

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
    // Auto-redirect to home after a short delay so completion popup can trigger
    // Clear the final completion flag so it shows after weekly is done
    if (user) sessionStorage.removeItem(`final_completion_shown_${user.id}`);
    setTimeout(() => {
      navigate("/");
      window.location.reload();
    }, 2000);
  };

  if (!poll) return <AppShell><div className="p-4 text-center text-muted-foreground">אין סקר שבועי כרגע</div></AppShell>;

  const options = (poll.options_json as string[]) || [];
  const total = results.reduce((s, r) => s + r.count, 0);

  return (
    <AppShell>
      <div className="p-4 max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="shrink-0 hover:bg-primary hover:text-primary-foreground">
            <ArrowRight className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-primary">📊 דילמת השבוע</h1>
            <p className="text-muted-foreground text-sm">הצבעה אנונימית – פעם אחת לסקר</p>
          </div>
        </div>

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
