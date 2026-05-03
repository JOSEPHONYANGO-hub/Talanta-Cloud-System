import { Link, useLocation } from "wouter";
import { useClerk, useUser } from "@clerk/react";
import { LayoutDashboard, Building2, ArrowLeft, ShieldCheck, LogOut, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";

const nav = [
  { name: "Overview", href: "/super-admin", icon: LayoutDashboard },
  { name: "Organizations", href: "/super-admin", icon: Building2 },
];

function NavLinks({ onLinkClick }: { onLinkClick?: () => void }) {
  const [location] = useLocation();
  return (
    <nav className="flex-1 px-3 py-4 space-y-0.5">
      {nav.map((item) => {
        const isActive = location === item.href;
        return (
          <Link
            key={item.name}
            href={item.href}
            onClick={onLinkClick}
            className={cn(
              "group flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all relative",
              isActive
                ? "bg-white/15 text-white shadow-sm"
                : "text-slate-300/70 hover:bg-white/8 hover:text-white",
            )}
          >
            {isActive && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-rose-400 rounded-full" />
            )}
            <item.icon className={cn("mr-3 h-4 w-4", isActive ? "text-white" : "text-slate-400 group-hover:text-slate-200")} />
            {item.name}
          </Link>
        );
      })}
      <div className="pt-4 mt-3 border-t border-white/10">
        <Link
          href="/dashboard"
          onClick={onLinkClick}
          className="group flex items-center rounded-lg px-3 py-2.5 text-sm font-medium text-slate-300/60 hover:bg-white/8 hover:text-white transition-all"
        >
          <ArrowLeft className="mr-3 h-4 w-4 text-slate-400 group-hover:text-slate-200" />
          Back to App
        </Link>
      </div>
    </nav>
  );
}

function Header() {
  return (
    <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
      <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-rose-500 to-rose-700 flex items-center justify-center shadow-lg shrink-0">
        <ShieldCheck className="h-4 w-4 text-white" />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-bold tracking-tight leading-none text-white">Talanta-Cloud</p>
        <Badge variant="outline" className="mt-1 text-[9px] px-1.5 py-0 border-rose-400/40 text-rose-300 font-semibold uppercase tracking-wider">
          Super Admin
        </Badge>
      </div>
    </div>
  );
}

function UserFooter() {
  const { signOut } = useClerk();
  const { user } = useUser();
  const initials = user?.firstName && user?.lastName
    ? `${user.firstName[0]}${user.lastName[0]}`
    : user?.firstName?.[0] ?? "A";

  return (
    <div className="border-t border-white/10 p-3">
      <div className="flex items-center gap-3 px-2 py-2 rounded-lg mb-1">
        <Avatar className="h-8 w-8 shrink-0 ring-2 ring-white/20">
          <AvatarImage src={user?.imageUrl} />
          <AvatarFallback className="bg-rose-500 text-white text-xs font-bold">{initials}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-white truncate">{user?.fullName ?? "Admin"}</p>
          <p className="text-xs text-slate-400 truncate">Super Administrator</p>
        </div>
      </div>
      <Button
        variant="ghost"
        className="w-full justify-start text-slate-400 hover:bg-white/8 hover:text-white h-9 text-xs px-3 font-normal"
        onClick={() => signOut()}
      >
        <LogOut className="mr-2.5 h-3.5 w-3.5" />
        Sign Out
      </Button>
    </div>
  );
}

export function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Mobile top bar */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 border-b bg-slate-900 shadow-sm">
        <div className="flex items-center gap-2">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:bg-white/10">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-60 p-0 border-none bg-slate-900 text-white">
              <Header />
              <div className="flex h-full flex-col">
                <NavLinks />
                <UserFooter />
              </div>
            </SheetContent>
          </Sheet>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-rose-400" />
            <span className="font-bold text-white text-sm">Super Admin</span>
          </div>
        </div>
      </div>

      <div className="flex h-screen overflow-hidden bg-[#f4f5fb]">
        {/* Desktop sidebar */}
        <div className="hidden md:flex md:w-60 md:flex-col md:fixed md:inset-y-0 z-30 bg-slate-900">
          <Header />
          <div className="px-5 pt-5 pb-1">
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Admin Panel</p>
          </div>
          <NavLinks />
          <div className="flex-1" />
          <UserFooter />
        </div>

        {/* Content area */}
        <div className="flex flex-col flex-1 md:ml-60 overflow-y-auto">
          {children}
        </div>
      </div>
    </>
  );
}
