import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";

const Login = () => {
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"login" | "signup">("login");

  if (user) return <Navigate to="/" replace />;

  const handleEmailPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } });
        if (error) throw error;
        toast.success("נרשמת בהצלחה! בדוק/י את המייל לאימות.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err: any) {
      toast.error(err.message || "שגיאה בהתחברות");
    } finally {
      setLoading(false);
    }
  };

  const handleMagicLink = async () => {
    if (!email) { toast.error("הכנס/י כתובת מייל"); return; }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin } });
      if (error) throw error;
      toast.success("נשלח לינק למייל שלך!");
    } catch (err: any) {
      toast.error(err.message || "שגיאה בשליחה");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-primary/10 to-background" dir="rtl">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="text-5xl mb-2">🧭</div>
          <CardTitle className="text-2xl">מצפן</CardTitle>
          <CardDescription>התנגשות בין ערכים – קורס אינטראקטיבי</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={mode} onValueChange={(v) => setMode(v as "login" | "signup")}>
            <TabsList className="w-full mb-4">
              <TabsTrigger value="login" className="flex-1">כניסה</TabsTrigger>
              <TabsTrigger value="signup" className="flex-1">הרשמה</TabsTrigger>
            </TabsList>
            <TabsContent value="login">
              <form onSubmit={handleEmailPassword} className="space-y-4">
                <div>
                  <Label htmlFor="email">אימייל</Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" dir="ltr" required />
                </div>
                <div>
                  <Label htmlFor="password">סיסמה</Label>
                  <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" dir="ltr" required />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>{loading ? "מתחבר/ת..." : "כניסה"}</Button>
              </form>
            </TabsContent>
            <TabsContent value="signup">
              <form onSubmit={handleEmailPassword} className="space-y-4">
                <div>
                  <Label htmlFor="email-signup">אימייל</Label>
                  <Input id="email-signup" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" dir="ltr" required />
                </div>
                <div>
                  <Label htmlFor="password-signup">סיסמה</Label>
                  <Input id="password-signup" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="לפחות 6 תווים" dir="ltr" minLength={6} required />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>{loading ? "נרשם/ת..." : "הרשמה"}</Button>
              </form>
            </TabsContent>
          </Tabs>
          <div className="mt-4 text-center">
            <button onClick={handleMagicLink} disabled={loading} className="text-sm text-primary hover:underline">
              שלחו לי לינק קסם למייל
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
