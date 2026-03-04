import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import ruachPoster from "@/assets/ruach-tzahal-poster.png";

const IntroVideo = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    if (!user) return;
    setLoading(true);
    try {
      await supabase.from("user_meta").update({ intro_video_completed: true }).eq("user_id", user.id);
      navigate("/");
    } catch {
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background" dir="rtl">
      <div className="max-w-lg w-full space-y-6 text-center">
        <img src={ruachPoster} alt="רוח צה״ל" className="w-48 h-auto mx-auto" />

        <h1 className="text-3xl font-bold text-primary">רגע לפני רוח צה״ל</h1>

        <div className="text-right space-y-4 text-foreground leading-relaxed">
          <p>
            רוח צה״ל היא מסמך הערכים והנורמות של צבא ההגנה לישראל.
            היא מגדירה את הערכים שעל פיהם פועל כל חייל ומפקד בצה״ל.
          </p>
          <p>
            המסמך כולל 11 ערכי יסוד שמנחים את ההתנהגות בשדה הקרב ובשגרה -
            ולעיתים הם מתנגשים זה בזה. הכרת הערכים והיכולת לנווט בין התנגשויות
            היא חלק בלתי נפרד מהמקצועיות הצבאית.
          </p>
          <p>
            במהלך הלמידה תכיר את הערכים, תתרגל זיהוי פקודות חוקיות ובלתי חוקיות,
            ותתמודד עם דילמות ערכיות מהשטח.
          </p>
        </div>

        <Button onClick={handleContinue} disabled={loading} size="lg" className="w-full text-lg">
          {loading ? "ממשיך..." : "בואו נתחיל"}
        </Button>
      </div>
    </div>
  );
};

export default IntroVideo;
