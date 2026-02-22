import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { BookOpen, Shield, FlaskConical, NotebookPen, MessageCircleQuestion, Upload } from "lucide-react";

const modules = [
  { key: "values", title: "רוח צה״ל – הערכים", icon: BookOpen, to: "/values", description: "10 ערכי יסוד של רוח צה״ל" },
  { key: "orders", title: "פקודות", icon: Shield, to: "/orders", description: "חוקית / בלתי חוקית / בלתי חוקית בעליל" },
  { key: "scenarios", title: "מעבדת דילמות", icon: FlaskConical, to: "/scenarios", description: "תרחישים אינטראקטיביים עם התנגשויות ערכיות" },
];

const statusLabel: Record<string, string> = {
  not_started: "טרם התחיל",
  in_progress: "בתהליך",
  completed: "הושלם ✓",
};

const statusPct: Record<string, number> = {
  not_started: 0,
  in_progress: 50,
  completed: 100,
};

const Home = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [progressMap, setProgressMap] = useState<Record<string, string>>({});
  const [checkingVideo, setCheckingVideo] = useState(true);

  useEffect(() => {
    if (!user) return;
    // Check intro video
    supabase.from("user_meta").select("intro_video_completed").eq("user_id", user.id).maybeSingle().then(({ data }) => {
      if (!data?.intro_video_completed) {
        navigate("/intro", { replace: true });
      }
      setCheckingVideo(false);
    });
    // Load progress
    supabase.from("progress").select("module_key, status").eq("user_id", user.id).then(({ data }) => {
      const map: Record<string, string> = {};
      data?.forEach((p) => { map[p.module_key] = p.status; });
      setProgressMap(map);
    });
  }, [user, navigate]);

  if (checkingVideo) return <div className="flex min-h-screen items-center justify-center"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;

  return (
    <AppShell>
      <div className="p-4 max-w-2xl mx-auto space-y-6">
        <div className="text-center py-6">
          <h1 className="text-3xl font-bold text-primary mb-1">🧭 מצפן</h1>
          <p className="text-muted-foreground">התנגשות בין ערכים – המסלול שלך</p>
        </div>

        {/* Modules */}
        <div className="space-y-4">
          {modules.map((mod, i) => {
            const status = progressMap[mod.key] || "not_started";
            return (
              <Link to={mod.to} key={mod.key}>
                <Card className="hover:shadow-lg transition-shadow border-r-4 border-r-primary/30">
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
                      <Progress value={statusPct[status]} className="h-2 flex-1" />
                      <span className="text-xs text-muted-foreground whitespace-nowrap">{statusLabel[status]}</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* Quick Access */}
        <div className="grid grid-cols-3 gap-3 pt-4">
          <Link to="/journal">
            <Card className="text-center p-3 hover:shadow transition-shadow">
              <NotebookPen className="h-6 w-6 mx-auto text-primary mb-1" />
              <span className="text-xs">יומן אישי</span>
            </Card>
          </Link>
          <Link to="/weekly">
            <Card className="text-center p-3 hover:shadow transition-shadow">
              <MessageCircleQuestion className="h-6 w-6 mx-auto text-primary mb-1" />
              <span className="text-xs">דילמת השבוע</span>
            </Card>
          </Link>
          <Link to="/submit">
            <Card className="text-center p-3 hover:shadow transition-shadow">
              <Upload className="h-6 w-6 mx-auto text-primary mb-1" />
              <span className="text-xs">העלאת דילמה</span>
            </Card>
          </Link>
        </div>
      </div>
    </AppShell>
  );
};

export default Home;
