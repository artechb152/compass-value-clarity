import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Progress } from "@/components/ui/progress";

const TRANSCRIPT = `רוח צה"ל מגדירה את הערכים, העקרונות והנורמות שמנחים את הלוחמים והלוחמות בצה"ל.
היא כוללת עשרה ערכים מרכזיים: דבקות במשימה, אחריות, אמינות, דוגמה אישית, חיי אדם, טוהר הנשק, מקצועיות, משמעת, רעות ושליחות.
ערכים אלו עשויים להתנגש זה בזה – וכאן נכנס שיקול הדעת.
הקורס הזה נועד לעזור לך לזהות את ההתנגשויות, לחשוב עליהן, ולפתח כלים להתמודדות.
אין תשובות שחורות-לבנות. יש חשיבה, רפלקציה, ובחירה מודעת.`;

const IntroVideo = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [progress, setProgress] = useState(0);
  const [canProceed, setCanProceed] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase.from("user_meta").select("intro_video_completed").eq("user_id", user.id).maybeSingle().then(({ data }) => {
      if (data?.intro_video_completed) {
        navigate("/", { replace: true });
      }
      setChecking(false);
    });
  }, [user, navigate]);

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const pct = (videoRef.current.currentTime / videoRef.current.duration) * 100;
    setProgress(pct);
    if (pct >= 85) setCanProceed(true);
  };

  const handleProceed = async () => {
    if (!user) return;
    await supabase.from("user_meta").upsert({ user_id: user.id, intro_video_completed: true });
    navigate("/", { replace: true });
  };

  // Allow skip for placeholder since there's no real video
  const handleSkipPlaceholder = () => setCanProceed(true);

  if (checking) return <div className="flex min-h-screen items-center justify-center"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/10 to-background flex flex-col items-center p-4" dir="rtl">
      <div className="w-full max-w-2xl mt-8">
        <h1 className="text-3xl font-bold text-primary text-center mb-1">🧭 רגע מצפן</h1>
        <p className="text-center text-muted-foreground mb-6">לפני שמתחילים – 2 דקות על מה שמוביל אותנו</p>

        {/* Placeholder video */}
        <div className="bg-card rounded-xl overflow-hidden shadow-lg mb-4">
          <div className="relative aspect-video bg-primary/20 flex items-center justify-center">
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              onTimeUpdate={handleTimeUpdate}
              onEnded={() => setCanProceed(true)}
              controls
              aria-label="סרטון רוח צה״ל"
            >
              <track kind="captions" label="עברית" srcLang="he" default />
              הדפדפן שלך לא תומך בנגן וידאו.
            </video>
            {!videoRef.current?.src && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-primary/10">
                <span className="text-6xl">🎬</span>
                <p className="text-muted-foreground text-sm">סרטון placeholder – יתעדכן בהמשך</p>
                <Button variant="outline" size="sm" onClick={handleSkipPlaceholder}>
                  דלג/י (placeholder)
                </Button>
              </div>
            )}
          </div>
          <div className="px-4 py-2">
            <Progress value={progress} className="h-2" />
          </div>
        </div>

        {/* Transcript */}
        <Accordion type="single" collapsible className="bg-card rounded-xl shadow px-4 mb-6">
          <AccordionItem value="transcript">
            <AccordionTrigger>תמלול מלא</AccordionTrigger>
            <AccordionContent>
              <p className="whitespace-pre-line text-sm leading-relaxed text-foreground/80">{TRANSCRIPT}</p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <Button
          onClick={handleProceed}
          disabled={!canProceed}
          className="w-full text-lg py-6"
          size="lg"
        >
          {canProceed ? "סיימתי, קדימה 🚀" : "צפו בסרטון כדי להמשיך"}
        </Button>
      </div>
    </div>
  );
};

export default IntroVideo;
