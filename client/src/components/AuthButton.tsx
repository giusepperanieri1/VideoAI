import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { 
  UserIcon, 
  LogOutIcon, 
  Settings, 
  User, 
  HelpCircle, 
  Bell, 
  Mail,
  Sparkles
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger,
  DropdownMenuGroup
} from "@/components/ui/dropdown-menu";

export default function AuthButton() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="h-9 w-9 rounded-full bg-muted/30 animate-pulse flex items-center justify-center">
        <span className="sr-only">Loading</span>
      </div>
    );
  }

  if (!user) {
    return (
      <Button 
        className="bg-gradient-primary hover:opacity-90 shadow-sm font-medium"
        size="sm" 
        onClick={() => window.location.href = "/api/login"}
      >
        <UserIcon className="w-4 h-4 mr-2" />
        <span>Accedi</span>
      </Button>
    );
  }

  const displayName = getUserDisplayName(user);
  const initials = getInitials(displayName || 'U');

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          className="relative h-9 w-9 rounded-full p-0 outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          aria-label="User menu"
        >
          <Avatar className="h-9 w-9 transition-all hover:ring-2 hover:ring-primary/30">
            {user.profileImageUrl ? (
              <AvatarImage 
                src={user.profileImageUrl} 
                alt={displayName || 'User'} 
                className="object-cover"
              />
            ) : (
              <AvatarFallback className="bg-primary/10 text-primary font-medium">
                {initials}
              </AvatarFallback>
            )}
          </Avatar>
          <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-success ring-2 ring-background"></span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 py-2 overflow-hidden">
        <DropdownMenuLabel className="pt-1 pb-2">
          <div className="flex flex-col space-y-1">
            <span className="font-semibold">{displayName}</span>
            {user.email && (
              <span className="text-xs text-muted-foreground truncate">
                {user.email}
              </span>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <DropdownMenuGroup>
          <DropdownMenuItem className="py-2 cursor-pointer flex items-center gap-2">
            <User className="h-4 w-4" />
            <span>Il mio profilo</span>
          </DropdownMenuItem>
          <DropdownMenuItem className="py-2 cursor-pointer flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span>Impostazioni</span>
          </DropdownMenuItem>
          <DropdownMenuItem className="py-2 cursor-pointer flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <span>Notifiche</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem className="py-2 cursor-pointer flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="font-medium">Aggiorna a Pro</span>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem className="py-2 cursor-pointer flex items-center gap-2">
          <HelpCircle className="h-4 w-4" />
          <span>Assistenza</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem className="py-2 cursor-pointer flex items-center gap-2">
          <Mail className="h-4 w-4" />
          <span>Feedback</span>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          className="py-2 cursor-pointer text-destructive focus:text-destructive flex items-center gap-2"
          onClick={() => window.location.href = "/api/logout"}
        >
          <LogOutIcon className="h-4 w-4" />
          <span>Logout</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
}

function getUserDisplayName(user: any): string {
  if (!user) return '';
  
  if (user.firstName && user.lastName) {
    return `${user.firstName} ${user.lastName}`;
  } else if (user.firstName) {
    return user.firstName;
  } else if (user.email) {
    return user.email.split('@')[0];
  } else {
    return user.id || 'User';
  }
}