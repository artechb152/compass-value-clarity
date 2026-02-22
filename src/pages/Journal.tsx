import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

const Journal = () => {
  const { user } = useAuth();
  const [entries, setEntries] = useState<Tables<"journal_entries">[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from("journal_entries").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    if (data) setEntries(data);
  };

  useEffect(() => { load(); }, [user]);

  const handleSave = async () => {
    if (!user || !title.trim()) return;
    setSaving(true);
    const { error } = await supabase.from("journal_entries").insert({ user_id: user.id, title_he: title, body_he: body });
    if (error) { toast.error("שגיאה בשמירה"); } else { toast.success("נשמר!"); setTitle(""); setBody(""); setShowForm(false); load(); }
    setSaving(false);
  };

  return (
    <AppShell>
      <div className="p-4 max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-primary">📓 יומן אישי</h1>
          <Button size="sm" onClick={() => setShowForm(!showForm)}><Plus className="h-4 w-4 ml-1" /> חדש</Button>
        </div>
        <p className="text-xs text-muted-foreground mb-4">🔒 רק את/ה רואה את הרשומות האלו</p>

        {showForm && (
          <Card className="mb-4">
            <CardContent className="pt-4 space-y-3">
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="כותרת" />
              <Textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="מה עובר לך בראש?" rows={4} />
              <div className="flex gap-2">
                <Button onClick={handleSave} disabled={saving}>{saving ? "שומר..." : "שמור/י"}</Button>
                <Button variant="outline" onClick={() => setShowForm(false)}>ביטול</Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="space-y-3">
          {entries.length === 0 && <p className="text-center text-muted-foreground py-8">אין עדיין רשומות. התחל/י לכתוב!</p>}
          {entries.map((e) => (
            <Card key={e.id}>
              <CardHeader className="pb-1">
                <CardTitle className="text-sm">{e.title_he}</CardTitle>
                <span className="text-xs text-muted-foreground">{new Date(e.created_at!).toLocaleDateString("he-IL")}</span>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-line">{e.body_he}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppShell>
  );
};

export default Journal;
