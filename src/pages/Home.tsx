import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BookOpen, Shield, FlaskConical, MessageCircleQuestion, RotateCcw, PlayCircle } from "lucide-react";

const modules = [
  { key: "values", title: "רוח צה״ל – הערכים", icon: BookOpen, to: "/values", description: "10 ערכי יסוד של רוח צה״ל", total: 10 },
  { key: "orders", title: "פקודות", icon: Shield, to: "/orders", description: "חוקית / בלתי חוקית / בלתי חוקית בעליל", total: 3 },
  { key: "scenarios", title: "מעבדת דילמות", icon: FlaskConical, to: "/scenarios", description: "תרחישים אינטראקטיביים עם התנגשויות ערכיות", total: 8 },
];

const Home = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [progressMap, setProgressMap] = useState<Record<string, { completed: number; total: number }>>({});
  const [checkingVideo, setCheckingVideo] = useState(true);
  const [showResumeDialog, setShowResumeDialog] = useState(false);
  const [hasProgress, setHasProgress] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("user_meta").select("intro_video_completed").eq("user_id", user.id).maybeSingle().then(({ data }) => {
      if (!data?.intro_video_completed) {
        navigate("/intro", { replace: true });
      }
      setCheckingVideo(false);
    });

    // Load progress: count completed items per module from responses/progress
    const loadProgress = async () => {
      // Values: count distinct values opened (stored in progress detail or we track via localStorage approach)
      // For now use progress table status
      const { data: prog } = await supabase.from("progress").select("module_key, status").eq("user_id", user.id);
      
      // Count scenario responses
      const { data: responses } = await supabase.from("responses").select("scenario_id").eq("user_id", user.id);
      const scenarioCount = new Set(responses?.map(r => r.scenario_id)).size;

      const map: Record<string, { completed: number; total: number }> = {
        values: { completed: 0, total: 10 },
        orders: { completed: 0, total: 3 },
        scenarios: { completed: scenarioCount, total: 8 },
      };

      // Check values progress from localStorage
      const viewedValues = JSON.parse(localStorage.getItem(`viewed_values_${user.id}`) || "[]");
      map.values.completed = viewedValues.length;

      const viewedOrders = JSON.parse(localStorage.getItem(`viewed_orders_${user.id}`) || "[]");
      map.orders.completed = viewedOrders.length;

      setProgressMap(map);

      // Check if user has any progress at all
      const totalCompleted = map.values.completed + map.orders.completed + map.scenarios.completed;
      if (totalCompleted > 0) {
        setHasProgress(true);
        // Show resume dialog only once per session
        const sessionKey = `shown_resume_${user.id}`;
        if (!sessionStorage.getItem(sessionKey)) {
          setShowResumeDialog(true);
          sessionStorage.setItem(sessionKey, "1");
        }
      }
    };
    loadProgress();
  }, [user, navigate]);

  const handleRestart = async () => {
    if (!user) return;
    // Clear localStorage
    localStorage.removeItem(`viewed_values_${user.id}`);
    localStorage.removeItem(`viewed_orders_${user.id}`);
    // Clear DB progress
    await supabase.from("progress").delete().eq("user_id", user.id);
    await supabase.from("responses").delete().eq("user_id", user.id);
    setProgressMap({
      values: { completed: 0, total: 10 },
      orders: { completed: 0, total: 3 },
      scenarios: { completed: 0, total: 8 },
    });
    setShowResumeDialog(false);
  };

  if (checkingVideo) return <div className="flex min-h-screen items-center justify-center"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;

  return (
    <AppShell>
      <div className="p-4 max-w-2xl mx-auto space-y-6">
        <div className="text-center py-6">
          <h1 className="text-3xl font-bold text-primary mb-1">רוח צה״ל</h1>
          <p className="text-muted-foreground">התנגשות בין ערכים – המסלול שלך</p>
        </div>

        <div className="space-y-4">
          {modules.map((mod, i) => {
            const prog = progressMap[mod.key] || { completed: 0, total: mod.total };
            const pct = Math.round((prog.completed / prog.total) * 100);
            const label = prog.completed >= prog.total ? "הושלם ✓" : `${prog.completed}/${prog.total}`;
            return (
              <Link to={mod.to} key={mod.key}>
                <Card className="hover:shadow-lg transition-shadow border-r-4 border-r-primary/30 mb-2">
                  <CardHeader className="pb-2 flex-row items-center gap-3">
                    <div className="bg-primary/10 p-2 rounded-lg">
                      <mod.icon className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg">{`${i + 1}. ${mod.title}`}</CardTitle>
                      <p className="text-sm text-muted-foreground">{mod.description}</p>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-3">
                      <Progress value={pct} className="h-2 flex-1" />
                      <span className="text-xs text-muted-foreground whitespace-nowrap">{label}</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* Quick Access */}
        <div className="flex justify-center pt-4">
          <Link to="/weekly">
            <Card className="text-center p-3 hover:shadow transition-shadow">
              <MessageCircleQuestion className="h-6 w-6 mx-auto text-primary mb-1" />
              <span className="text-xs">דילמת השבוע</span>
            </Card>
          </Link>
        </div>
      </div>

      <Dialog open={showResumeDialog} onOpenChange={setShowResumeDialog}>
        <DialogContent className="max-w-sm" dir="rtl">
          <DialogHeader>
            <DialogTitle>ברוך/ה השב/ה!</DialogTitle>
            <DialogDescription>יש לך התקדמות קודמת. מה תרצה/י לעשות?</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 mt-2">
            <Button onClick={() => setShowResumeDialog(false)} className="w-full gap-2">
              <PlayCircle className="h-4 w-4" />
              להמשיך מאיפה שעצרתי
            </Button>
            <Button variant="outline" onClick={handleRestart} className="w-full gap-2">
              <RotateCcw className="h-4 w-4" />
              להתחיל מחדש
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
};

export default Home;
