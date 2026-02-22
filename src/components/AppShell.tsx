import { useAuth } from "@/contexts/AuthContext";
import { Link, useLocation } from "react-router-dom";
import { Home, BookOpen, Shield, FlaskConical, NotebookPen, MessageCircleQuestion, Upload, Settings, LogOut, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";

const navItems = [
  { to: "/", icon: Home, label: "מסלול" },
  { to: "/values", icon: BookOpen, label: "ערכים" },
  { to: "/orders", icon: Shield, label: "פקודות" },
  { to: "/scenarios", icon: FlaskConical, label: "דילמות" },
  { to: "/journal", icon: NotebookPen, label: "יומן" },
  { to: "/weekly", icon: MessageCircleQuestion, label: "שבועי" },
  { to: "/submit", icon: Upload, label: "העלאה" },
];

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { signOut, isAdmin } = useAuth();
  const location = useLocation();
  const { theme, setTheme } = useTheme();

  return (
    <div className="min-h-screen flex flex-col" dir="rtl">
      {/* Header */}
      <header className="bg-primary text-primary-foreground px-4 py-3 flex items-center justify-between sticky top-0 z-40 shadow-md">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex flex-col leading-tight">
            <span className="text-lg font-bold">רוח צה״ל</span>
            <span className="text-[10px] opacity-80">התנגשות בין ערכים</span>
          </div>
        </Link>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="text-primary-foreground hover:bg-primary/80" aria-label="החלף מצב תצוגה">
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          {isAdmin && (
            <Button variant="ghost" size="sm" asChild className="text-primary-foreground hover:bg-primary/80">
              <Link to="/admin"><Settings className="h-4 w-4" /></Link>
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={signOut} className="text-primary-foreground hover:bg-primary/80" aria-label="התנתק/י">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 pb-20">
        {children}
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 inset-x-0 bg-card border-t z-40 safe-area-pb" aria-label="ניווט ראשי">
        <div className="flex justify-around py-2">
          {navItems.map((item) => {
            const active = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex flex-col items-center gap-0.5 px-2 py-1 text-xs transition-colors ${active ? "text-primary font-bold" : "text-muted-foreground"}`}
                aria-current={active ? "page" : undefined}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
};
