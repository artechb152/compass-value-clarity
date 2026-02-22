import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";

const Login = () => {
  const { user } = useAuth();
  const [fullName, setFullName] = useState("");
  const [personalNumber, setPersonalNumber] = useState("");
  const [courseName, setCourseName] = useState("");
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !personalNumber.trim() || !courseName.trim()) {
      toast.error("יש למלא את כל השדות");
      return;
    }
    setLoading(true);
    try {
      // Use personal number as pseudo-email for Supabase Auth
      const email = `${personalNumber.trim()}@ruach.local`;
      const password = personalNumber.trim();

      // Try sign in first
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

      if (signInError) {
        // If user doesn't exist, sign up
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName.trim(), personal_number: personalNumber.trim(), course_name: courseName.trim() } },
        });
        if (signUpError) throw signUpError;

        // Auto sign-in after signup
        const { error: autoSignIn } = await supabase.auth.signInWithPassword({ email, password });
        if (autoSignIn) throw autoSignIn;
      }

      // Upsert user_meta with profile info
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser) {
        await supabase.from("user_meta").upsert({
          user_id: currentUser.id,
          full_name: fullName.trim(),
          personal_number: personalNumber.trim(),
          course_name: courseName.trim(),
        });
      }
    } catch (err: any) {
      toast.error(err.message || "שגיאה בכניסה");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-primary/10 to-background" dir="rtl">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">רוח צה״ל</CardTitle>
          <CardDescription>התנגשות בין ערכים</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label htmlFor="fullName">שם מלא</Label>
              <Input id="fullName" type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="ישראל ישראלי" required />
            </div>
            <div>
              <Label htmlFor="personalNumber">מספר אישי</Label>
              <Input id="personalNumber" type="text" value={personalNumber} onChange={(e) => setPersonalNumber(e.target.value)} placeholder="1234567" dir="ltr" required />
            </div>
            <div>
              <Label htmlFor="courseName">שם קורס</Label>
              <Input id="courseName" type="text" value={courseName} onChange={(e) => setCourseName(e.target.value)} placeholder="קורס קצינים" required />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "נכנס/ת..." : "כניסה"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
