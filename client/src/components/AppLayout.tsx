import { useState, useEffect } from 'react';
import { useLocation, Link } from 'wouter';
import { Button } from '@/components/ui/button';
import Sidebar from '@/components/Sidebar';
import { 
  Menu, 
  X, 
  VideoIcon, 
  LogOut,
  PanelLeft
} from 'lucide-react';
import AuthButton from '@/components/AuthButton';
import { useAuth } from '@/hooks/useAuth';

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { isAuthenticated } = useAuth();
  
  // Check if we're on the editor page to apply special layout
  const isEditorPage = location.startsWith('/editor');
  
  // Handle scroll effects
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);
  
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Simplified Header */}
      <header className={`app-header border-b border-border/50 ${scrolled ? 'shadow-sm' : ''}`}>
        <div className="flex justify-between items-center px-4 py-3">
          {/* Logo */}
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden mr-2 hover:bg-primary/10"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            
            <Link href="/">
              <div className="flex items-center mr-6">
                <div className="bg-gradient-primary rounded-md p-2 mr-2 shadow-sm">
                  <VideoIcon className="h-5 w-5 text-white" />
                </div>
                <h1 className="text-xl font-bold">
                  VideoGen<span className="text-gradient-primary font-extrabold">AI</span>
                </h1>
              </div>
            </Link>
          </div>

          {/* Right Side Icons + User Menu */}
          <div className="flex items-center">
            {/* Toggle Sidebar Button (Desktop) */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-muted-foreground hover:bg-muted/20 hidden md:flex" 
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              title="Mostra/Nascondi Sidebar"
            >
              <PanelLeft className="h-5 w-5" />
            </Button>
            
            {/* Logout Button - Only show when authenticated */}
            {isAuthenticated && (
              <Link href="/api/logout">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-muted-foreground hover:bg-muted/20 ml-1"
                  title="Logout"
                >
                  <LogOut className="h-5 w-5" />
                </Button>
              </Link>
            )}
            
            {/* User Menu */}
            <div className="ml-2">
              <AuthButton />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex flex-1 overflow-hidden">
        {/* Sidebar - always show on desktop, conditionally on mobile */}
        <div className={`transition-all duration-300 ${
          mobileMenuOpen 
            ? 'translate-x-0' 
            : '-translate-x-full md:translate-x-0'
        } ${
          sidebarCollapsed ? 'md:w-16' : 'md:w-64'
        }`}>
          <Sidebar collapsed={sidebarCollapsed} />
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-auto custom-scrollbar">
          {children}
        </div>
      </main>
      
      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/20 backdrop-blur-sm z-40" 
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </div>
  );
}
