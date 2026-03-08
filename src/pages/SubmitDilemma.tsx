import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { AlertTriangle } from "lucide-react";

const SubmitDilemma = () => {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [story, setStory] = useState("");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !title.trim() || !story.trim()) return;
    setSaving(true);
    const { error } = await supabase.from("user_dilemmas").insert({ user_id: user.id, title_he: title, story_he: story });
    if (error) { toast.error("שגיאה בשליחה"); } else { setDone(true); toast.success("הדילמה נשלחה לאישור!"); }
    setSaving(false);
  };

  return (
    <AppShell>
      <div className="p-4 max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-primary mb-4">📤 העלאת דילמה</h1>

        <Card className="mb-4 border-warning/50 bg-warning/5">
          <CardContent className="pt-4 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
            <p className="text-sm">
              לא כותבים פרטים מזהים/מבצעיים. שומרים בט״מ. תוקפים רעיון, לא בן אדם.
            </p>
          </CardContent>
        </Card>

        {done ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-lg font-medium text-primary">✓ הדילמה נשלחה!</p>
              <p className="text-sm text-muted-foreground mt-2">היא תופיע לאחר אישור.</p>
              <Button className="mt-4" onClick={() => { setDone(false); setTitle(""); setStory(""); }}>שלח עוד</Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="pt-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-sm font-medium">כותרת</label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="תן שם קצר לדילמה" required />
                </div>
                <div>
                  <label className="text-sm font-medium">הסיפור</label>
                  <Textarea value={story} onChange={(e) => setStory(e.target.value)} placeholder="ספר את הדילמה..." rows={5} required />
                </div>
                <Button type="submit" className="w-full" disabled={saving}>{saving ? "שולח..." : "שלח"}</Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  );
};

export default SubmitDilemma;
