import { useAuth } from "@/contexts/AuthContext";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Home, BookOpen, Shield, FlaskConical, MessageCircleQuestion, Settings, LogOut, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { useTheme } from "next-themes";
import ruachWhiteLogo from "@/assets/ruach-tzahal-white.png";
import userLogo from "@/assets/user-logo.png";

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
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-2">
                <button onClick={() => navigate("/")} className="transition-transform hover:scale-105" aria-label="מסך הבית">
                  <img src={ruachWhiteLogo} alt="רוח צה״ל" className="h-10 w-auto" />
                </button>
                <img src={userLogo} alt="לוגו" className="h-8 w-auto" />
              </div>
            </TooltipTrigger>
          </Tooltip>
        </TooltipProvider>
        <div className="flex items-center gap-1">
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="text-primary-foreground hover:bg-transparent hover:text-primary-foreground transition-transform hover:scale-110" aria-label="החלף מצב תצוגה">
                  {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" align="end" sideOffset={4}><p>{theme === 'dark' ? 'מצב יום' : 'מצב לילה'}</p></TooltipContent>
            </Tooltip>
          </TooltipProvider>
          {isAdmin && (
            <Button variant="ghost" size="sm" asChild className="text-primary-foreground hover:bg-transparent hover:text-primary-foreground transition-transform hover:scale-110">
              <Link to="/admin"><Settings className="h-4 w-4" /></Link>
            </Button>
          )}
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={signOut} className="text-primary-foreground hover:bg-transparent hover:text-primary-foreground focus:ring-2 focus:ring-primary-foreground/50 focus:ring-offset-0 transition-transform hover:scale-110" aria-label="התנתק">
                  <LogOut className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" align="end" sideOffset={4}><p>התנתק</p></TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
};
