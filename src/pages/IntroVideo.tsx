import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { PlayCircle, RotateCcw, Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";
import ruachImage from "@/assets/ruach-tzahal.png";

const IntroVideo = () => {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [showScrollHint, setShowScrollHint] = useState(true);
  const [isReturningUser, setIsReturningUser] = useState(false);
  const [showResumeDialog, setShowResumeDialog] = useState(false);

  // Check if user is returning (same ID number, 2nd+ login)
  useEffect(() => {
    if (!user) return;
    const isReturning = sessionStorage.getItem("is_returning_user") === "true";
    supabase.from("user_meta").select("intro_video_completed").eq("user_id", user.id).maybeSingle().then(({ data }) => {
      if (data?.intro_video_completed) {
        setIsReturningUser(true);
      }
      // Show resume dialog only for returning users (2nd+ login with same ID)
      if (isReturning && data?.intro_video_completed) {
        const resumeShownKey = `resume_shown_${user.id}`;
        if (!sessionStorage.getItem(resumeShownKey)) {
          setShowResumeDialog(true);
          sessionStorage.setItem(resumeShownKey, "1");
        }
      }
      setChecking(false);
    });
    // Clear the flag so it doesn't persist across manual navigations
    sessionStorage.removeItem("is_returning_user");
  }, [user, navigate]);

  useEffect(() => {
    if (checking) return;
    const handleScroll = () => {
      const scrollBottom = window.innerHeight + window.scrollY;
      const docHeight = document.documentElement.scrollHeight;
      if (docHeight - scrollBottom < 100) {
        setShowScrollHint(false);
      } else {
        setShowScrollHint(true);
      }
    };
    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [checking]);

  const handleProceed = async () => {
    if (!user) return;
    await supabase.from("user_meta").upsert({ user_id: user.id, intro_video_completed: true });
    navigate("/", { replace: true });
  };

  const handleRestart = async () => {
    if (!user) return;
    localStorage.removeItem(`viewed_values_${user.id}`);
    localStorage.removeItem(`viewed_orders_${user.id}`);
    await supabase.from("progress").delete().eq("user_id", user.id);
    await supabase.from("responses").delete().eq("user_id", user.id);
    await supabase.from("journal_entries").delete().eq("user_id", user.id);
    await supabase.from("user_dilemmas").delete().eq("user_id", user.id);
    setShowResumeDialog(false);
  };

  

  if (checking) return <div className="flex min-h-screen items-center justify-center"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/10 to-background flex flex-col items-center p-4 relative" dir="rtl">
      <Button variant="ghost" size="icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="absolute top-4 left-4 text-muted-foreground" aria-label="החלף מצב תצוגה">
        {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
      </Button>
      <div className="w-full max-w-2xl mt-8">
        <h1 className="text-3xl font-bold text-primary text-center mb-1">רגע רוח צה״ל</h1>
        <p className="text-center text-muted-foreground mb-6">לפני שמתחילים – 3 דקות על מה שמוביל אותנו</p>

        <div className="bg-card rounded-xl overflow-hidden shadow-lg mb-4">
          <div className="relative aspect-video">
            <iframe
              className="w-full h-full"
              src="https://www.youtube.com/embed/OfpjyRBhAYc"
              title="סרטון רוח צה״ל"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
          <p className="text-xs text-muted-foreground text-center py-2 px-3">
            הסרטון מתוך ערוץ היוטיוב של צה״ל. כל הזכויות שמורות ליוצרים.
          </p>
        </div>

        <div className="bg-card rounded-xl shadow px-4 py-5 mb-6 space-y-4">
          <h2 className="text-xl font-bold text-primary text-center">אז מה זה בעצם רוח צה״ל?</h2>
          <p className="text-sm leading-relaxed text-foreground/80">
            רוח צה״ל מגדירה את הערכים, העקרונות והנורמות שמנחים את הלוחמים והלוחמות בצה״ל.
            היא כוללת עשרה ערכים מרכזיים: דבקות במשימה, אחריות, אמינות, דוגמה אישית, חיי אדם, טוהר הנשק, מקצועיות, משמעת, רעות ושליחות.
          </p>
          <p className="text-sm leading-relaxed text-foreground/80">
            ערכים אלו עשויים להתנגש זה בזה – וכאן נכנס שיקול הדעת.
            הקורס הזה נועד לעזור לך לזהות את ההתנגשויות, לחשוב עליהן, ולפתח כלים להתמודדות.
            אין תשובות שחורות-לבנות. יש חשיבה, רפלקציה, ובחירה מודעת.
          </p>
          <img
            src={ruachImage}
            alt="מסמך רוח צה״ל המקורי – ערכי היסוד"
            className="w-full rounded-lg shadow-md"
          />
        </div>

        <Button
          onClick={isReturningUser ? () => navigate("/", { replace: true }) : handleProceed}
          className="w-full text-lg py-6"
          size="lg"
        >
          קדימה, מתחילים
        </Button>
      </div>

      <Dialog open={showResumeDialog} onOpenChange={setShowResumeDialog}>
        <DialogContent className="max-w-sm" dir="rtl">
          <DialogHeader>
            <DialogTitle>ברוך/ה השב/ה!</DialogTitle>
            <DialogDescription>יש לך התקדמות קודמת. מה תרצה/י לעשות?</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 mt-2">
            <Button onClick={() => { setShowResumeDialog(false); navigate("/", { replace: true }); }} className="w-full gap-2">
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

      {showScrollHint && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-bounce">
          <span className="text-sm text-muted-foreground bg-background/90 border border-border rounded-full px-4 py-1.5 backdrop-blur-sm shadow-lg">
            גלול למטה ↓
          </span>
        </div>
      )}
    </div>
  );
};

export default IntroVideo;
