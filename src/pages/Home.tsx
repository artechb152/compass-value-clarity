import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BookOpen, Shield, FlaskConical, MessageCircleQuestion } from "lucide-react";

const modules = [
  { key: "values", title: "רוח צה״ל – הערכים", icon: BookOpen, to: "/values", description: "10 ערכי יסוד של רוח צה״ל", total: 10 },
  { key: "orders", title: "פקודות", icon: Shield, to: "/orders", description: "חוקית / בלתי חוקית / בלתי חוקית בעליל", total: 3 },
  { key: "scenarios", title: "מעבדת דילמות", icon: FlaskConical, to: "/scenarios", description: "תרחישים אינטראקטיביים עם התנגשויות ערכיות", total: 8 },
];

const Home = () => {
  const { user } = useAuth();
  const [progressMap, setProgressMap] = useState<Record<string, { completed: number; total: number }>>({});
  const [introChecked, setIntroChecked] = useState(false);
  const [introCompleted, setIntroCompleted] = useState(true);

  useEffect(() => {
    if (!user) return;

    supabase.from("user_meta").select("intro_video_completed").eq("user_id", user.id).maybeSingle().then(({ data }) => {
      if (!data?.intro_video_completed) {
        setIntroCompleted(false);
      }
      setIntroChecked(true);
    });

    const loadProgress = async () => {
      const { data: responses } = await supabase.from("responses").select("scenario_id").eq("user_id", user.id);
      const scenarioCount = new Set(responses?.map(r => r.scenario_id)).size;

      const map: Record<string, { completed: number; total: number }> = {
        values: { completed: 0, total: 10 },
        orders: { completed: 0, total: 3 },
        scenarios: { completed: scenarioCount, total: 8 },
      };

      const viewedValues = JSON.parse(localStorage.getItem(`viewed_values_${user.id}`) || "[]");
      map.values.completed = viewedValues.length;

      const viewedOrders = JSON.parse(localStorage.getItem(`viewed_orders_${user.id}`) || "[]");
      map.orders.completed = viewedOrders.length;

      setProgressMap(map);
    };
    loadProgress();
  }, [user]);

  if (!introChecked) {
    return (
      <AppShell>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </AppShell>
    );
  }

  if (!introCompleted) {
    return <Navigate to="/intro" replace />;
  }

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

        <div className="flex justify-center pt-4">
          <Link to="/weekly">
            <Card className="text-center p-3 hover:shadow transition-shadow">
              <MessageCircleQuestion className="h-6 w-6 mx-auto text-primary mb-1" />
              <span className="text-xs">דילמת השבוע</span>
            </Card>
          </Link>
        </div>
      </div>
    </AppShell>
  );
};

export default Home;
