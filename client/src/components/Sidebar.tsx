import { Link, useLocation } from "wouter";
import {
  FolderOpenIcon,
  UserIcon,
  PlusIcon,
  ShareIcon,
  Settings,
  ActivityIcon
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

interface SidebarProps {
  collapsed?: boolean;
}

export default function Sidebar({ collapsed = false }: SidebarProps) {
  const [location] = useLocation();
  const { isAuthenticated } = useAuth();
  
  const isActive = (path: string) => {
    return location === path || location.startsWith(path + "/");
  };
  
  return (
    <div className={cn(
      "hidden md:flex flex-col h-full bg-card border-r border-border/50 overflow-y-auto custom-scrollbar",
      collapsed ? "w-16" : "w-64"
    )}>
      <div className="p-4 pt-6 flex-1 flex flex-col">        
        {/* Login button for non-authenticated users */}
        {!isAuthenticated && (
          <div className={cn(
            "mb-6",
            collapsed ? "px-0 text-center" : "px-3"
          )}>
            <Link href="/api/login">
              <Button className={cn(
                "bg-gradient-primary hover:opacity-90 shadow-sm font-medium",
                collapsed ? "w-10 h-10 rounded-full p-0" : "w-full"
              )}>
                {collapsed ? (
                  <UserIcon className="h-5 w-5" />
                ) : (
                  <>
                    <UserIcon className="h-4 w-4 mr-2" />
                    Accedi
                  </>
                )}
              </Button>
            </Link>
          </div>
        )}
        
        <div className="flex flex-col space-y-8 flex-1">
          {/* Main navigation items */}
          <div>
            <ul>
              <SidebarItem 
                icon={<PlusIcon className="h-5 w-5" />} 
                label="Nuovo Progetto" 
                href="/create" 
                active={isActive("/create")}
                showLabel={!collapsed}
              />
              <SidebarItem 
                icon={<FolderOpenIcon className="h-5 w-5" />} 
                label="Progetti" 
                href="/projects" 
                active={isActive("/projects")}
                showLabel={!collapsed}
              />
              <SidebarItem 
                icon={<ShareIcon className="h-5 w-5" />} 
                label="Social Media" 
                href="/social-accounts" 
                active={isActive("/social-accounts")}
                showLabel={!collapsed}
                badge="Nuovo"
              />
              <SidebarItem 
                icon={<ActivityIcon className="h-5 w-5" />} 
                label="Attività" 
                href="/activity" 
                active={isActive("/activity")}
                showLabel={!collapsed}
              />
            </ul>
          </div>
          
          <div className="flex-1"></div>
          
          {/* Settings section at the bottom */}
          <div className="mt-auto pt-4 border-t border-border/30">
            <ul>
              <SidebarItem 
                icon={<Settings className="h-5 w-5" />} 
                label="Impostazioni" 
                href="/settings" 
                active={isActive("/settings")}
                showLabel={!collapsed}
              />
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  href: string;
  active?: boolean;
  badge?: string;
  showLabel?: boolean;
}

function SidebarItem({ icon, label, href, active = false, badge, showLabel = true }: SidebarItemProps) {
  return (
    <li className="mb-4">
      <Link href={href}>
        <div className={cn(
          "group flex items-center px-3 py-2.5 rounded-lg transition-all duration-200 cursor-pointer relative",
          active
            ? "bg-gradient-primary text-primary-foreground font-medium shadow-sm"
            : "text-muted-foreground hover:text-foreground hover:bg-muted"
        )}>
          <div className={cn(
            "flex-shrink-0 transition-all", 
            active ? "scale-110" : "group-hover:scale-110",
            !showLabel && "mx-auto"
          )}>
            {icon}
          </div>
          
          {showLabel && (
            <span className={cn(
              "ml-3 text-sm transition-transform",
              active ? "translate-x-1" : "group-hover:translate-x-1"
            )}>
              {label}
            </span>
          )}
          
          {badge && showLabel && (
            <div className={cn(
              "ml-auto text-xs font-medium rounded-full px-1.5 py-0.5 min-w-[18px] text-center",
              active 
                ? "bg-white/20 text-primary-foreground"
                : badge === "Nuovo" 
                  ? "bg-primary/10 text-primary" 
                  : "bg-muted-foreground/20 text-muted-foreground"
            )}>
              {badge}
            </div>
          )}
          
          {badge && !showLabel && (
            <div className={cn(
              "absolute -top-1 -right-1 text-xs font-medium rounded-full w-4 h-4 flex items-center justify-center",
              badge === "Nuovo" 
                ? "bg-primary text-primary-foreground" 
                : "bg-muted-foreground/70 text-background"
            )}>
              {badge === "Nuovo" ? "N" : badge}
            </div>
          )}
          
          {active && (
            <div className="absolute -left-0.5 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-primary-foreground/70 rounded-full" />
          )}
        </div>
      </Link>
    </li>
  );
}