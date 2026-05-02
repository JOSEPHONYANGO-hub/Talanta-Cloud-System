import { Link, useLocation } from "wouter";
import { useClerk, useUser } from "@clerk/react";
import { LayoutDashboard, Users, Building2, MapPin, LogOut, Menu, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Employees", href: "/employees", icon: Users },
  { name: "Departments", href: "/departments", icon: Building2 },
  { name: "Branches", href: "/branches", icon: MapPin },
];

export function Sidebar() {
  const [location] = useLocation();
  const { signOut } = useClerk();
  const { user } = useUser();

  const initials = user?.firstName && user?.lastName
    ? `${user.firstName[0]}${user.lastName[0]}`
    : user?.firstName?.[0] ?? "U";

  const displayName = user?.fullName || user?.primaryEmailAddress?.emailAddress || "User";

  const NavLinks = ({ onLinkClick }: { onLinkClick?: () => void }) => (
    <nav className="flex-1 px-3 py-4 space-y-0.5">
      {navigation.map((item) => {
        const isActive =
          location === item.href ||
          (item.href !== "/dashboard" && location.startsWith(item.href));
        return (
          <Link
            key={item.name}
            href={item.href}
            onClick={onLinkClick}
            className={cn(
              "group flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 relative",
              isActive
                ? "bg-white/15 text-white shadow-sm"
                : "text-indigo-200/70 hover:bg-white/8 hover:text-white"
            )}
            data-testid={`link-${item.name.toLowerCase()}`}
          >
            {isActive && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-indigo-300 rounded-full" />
            )}
            <item.icon
              className={cn(
                "mr-3 h-4.5 w-4.5 flex-shrink-0 transition-colors",
                isActive
                  ? "text-white"
                  : "text-indigo-300/60 group-hover:text-indigo-200"
              )}
            />
            <span className="flex-1">{item.name}</span>
            {isActive && (
              <ChevronRight className="h-3.5 w-3.5 text-indigo-300/60" />
            )}
          </Link>
        );
      })}
    </nav>
  );

  const UserFooter = () => (
    <div className="border-t border-white/10 p-3">
      <div className="flex items-center gap-3 px-2 py-2 rounded-lg mb-1">
        <Avatar className="h-8 w-8 shrink-0 ring-2 ring-white/20">
          <AvatarImage src={user?.imageUrl} />
          <AvatarFallback className="bg-indigo-400 text-white text-xs font-bold">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-white truncate">{displayName}</p>
          <p className="text-xs text-indigo-300/60 truncate">Administrator</p>
        </div>
      </div>
      <Button
        variant="ghost"
        className="w-full justify-start text-indigo-200/60 hover:bg-white/8 hover:text-white h-9 text-xs px-3 font-normal"
        onClick={() => signOut()}
        data-testid="button-sign-out"
      >
        <LogOut className="mr-2.5 h-3.5 w-3.5" />
        Sign Out
      </Button>
    </div>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 border-b bg-white shadow-sm">
        <div className="flex items-center gap-2">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" data-testid="button-mobile-menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0 bg-[#1e1b4b] border-none text-white">
              <div className="flex h-14 items-center gap-3 border-b border-white/10 px-5">
                <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center shadow-md">
                  <span className="text-white font-black text-xs">T</span>
                </div>
                <span className="text-base font-bold tracking-tight">Talanta EMS</span>
              </div>
              <div className="flex h-full flex-col">
                <NavLinks />
                <UserFooter />
              </div>
            </SheetContent>
          </Sheet>
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-md bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
              <span className="text-white font-black text-xs">T</span>
            </div>
            <span className="font-bold text-slate-800 text-sm">Talanta EMS</span>
          </div>
        </div>
        <Avatar className="h-7 w-7">
          <AvatarImage src={user?.imageUrl} />
          <AvatarFallback className="bg-indigo-500 text-white text-xs font-bold">{initials}</AvatarFallback>
        </Avatar>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden md:flex md:w-60 md:flex-col md:fixed md:inset-y-0 z-30">
        <div className="flex flex-col flex-grow bg-[#1e1b4b] text-white overflow-y-auto">

          {/* Brand */}
          <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center shadow-lg shrink-0">
              <span className="text-white font-black text-sm">T</span>
            </div>
            <div>
              <p className="text-sm font-bold tracking-tight leading-none">Talanta EMS</p>
              <p className="text-[10px] text-indigo-300/60 mt-0.5 font-medium uppercase tracking-wider">
                Cloud Solutions
              </p>
            </div>
          </div>

          {/* Section label */}
          <div className="px-5 pt-5 pb-1">
            <p className="text-[10px] font-semibold text-indigo-300/40 uppercase tracking-widest">
              Main Menu
            </p>
          </div>

          <NavLinks />

          <div className="flex-1" />
          <UserFooter />
        </div>
      </div>
    </>
  );
}
