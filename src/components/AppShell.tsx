import { useAuth } from "@/contexts/AuthContext";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Home, BookOpen, Shield, FlaskConical, MessageCircleQuestion, Settings, LogOut, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import ruachWhiteLogo from "@/assets/ruach-tzahal-white.png";

const navItems = [
  { to: "/", icon: Home, label: "מסלול" },
  { to: "/values", icon: BookOpen, label: "ערכים" },
  { to: "/orders", icon: Shield, label: "פקודות" },
  { to: "/scenarios", icon: FlaskConical, label: "דילמות" },
  { to: "/weekly", icon: MessageCircleQuestion, label: "שבועי" },
];

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { signOut, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();

  return (
    <div className="min-h-screen flex flex-col" dir="rtl">
      {/* Header */}
      <header className="bg-primary text-primary-foreground px-4 py-2 flex items-center justify-between sticky top-0 z-40 shadow-md">
        <button onClick={() => navigate("/")} className="flex items-center gap-2 hover:opacity-80 transition-opacity" aria-label="חזרה למסך הבית">
          <img src={ruachWhiteLogo} alt="רוח צה״ל" className="h-8 w-auto" />
        </button>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="text-primary-foreground hover:bg-primary/80 transition-transform hover:scale-110" aria-label="החלף מצב תצוגה">
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          {isAdmin && (
            <Button variant="ghost" size="sm" asChild className="text-primary-foreground hover:bg-primary/80 transition-transform hover:scale-110">
              <Link to="/admin"><Settings className="h-4 w-4" /></Link>
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={signOut} className="text-primary-foreground hover:bg-primary/80 focus:ring-2 focus:ring-primary-foreground/50 focus:ring-offset-0 transition-transform hover:scale-110" aria-label="התנתק/י">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Main - no bottom padding since we removed bottom nav */}
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
};
