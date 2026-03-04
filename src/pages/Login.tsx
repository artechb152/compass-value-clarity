import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";

const Login = () => {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const [fullName, setFullName] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [courseName, setCourseName] = useState("");
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !idNumber.trim() || !courseName.trim()) {
      toast.error("יש למלא את כל השדות");
      return;
    }
    if (!/^\d{9}$/.test(idNumber.trim())) {
      toast.error("מספר תעודת זהות חייב להכיל 9 ספרות");
      return;
    }
    setLoading(true);
    try {
      const email = `${idNumber.trim()}@ruach.local`;
      const password = idNumber.trim();

      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

      if (signInError) {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName.trim(), personal_number: idNumber.trim(), course_name: courseName.trim() } },
        });
        if (signUpError) throw signUpError;

        const { error: autoSignIn } = await supabase.auth.signInWithPassword({ email, password });
        if (autoSignIn) throw autoSignIn;
      }

      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser) {
        await supabase.from("user_meta").upsert({
          user_id: currentUser.id,
          full_name: fullName.trim(),
          personal_number: idNumber.trim(),
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
    <div className="min-h-screen flex items-center justify-center p-4 relative" dir="rtl">
      <Button variant="ghost" size="icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="absolute top-4 left-4 text-muted-foreground hover:bg-primary hover:text-primary-foreground" aria-label="החלף מצב תצוגה">
        {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
      </Button>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">רוח צה״ל</CardTitle>
          <CardDescription>התנגשות בין ערכים</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label htmlFor="fullName">שם מלא</Label>
              <Input id="fullName" type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="ישראל ישראלי" className="placeholder:text-muted-foreground/40" required />
            </div>
            <div>
              <Label htmlFor="idNumber">מספר תעודת זהות</Label>
              <Input id="idNumber" type="text" inputMode="numeric" maxLength={9} value={idNumber} onChange={(e) => setIdNumber(e.target.value.replace(/\D/g, '').slice(0, 9))} placeholder="123456789" dir="ltr" className="placeholder:text-muted-foreground/40" required />
            </div>
            <div>
              <Label htmlFor="courseName">שם קורס</Label>
              <Input id="courseName" type="text" value={courseName} onChange={(e) => setCourseName(e.target.value)} placeholder="קורס קצינים" className="placeholder:text-muted-foreground/40" required />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "נכנס..." : "כניסה"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;