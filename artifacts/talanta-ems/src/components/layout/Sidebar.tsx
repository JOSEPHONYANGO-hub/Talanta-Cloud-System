import { Link, useLocation } from "wouter";
import { useClerk, useUser } from "@clerk/react";
import {
  LayoutDashboard, Users, Building2, MapPin, LogOut,
  Menu, ChevronRight, Settings2, ShieldCheck, ShieldAlert, UserCog,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useOrg } from "@/hooks/useOrg";
import { useCheckSuperAdmin } from "@/hooks/useSuperAdmin";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Employees", href: "/employees", icon: Users },
  { name: "Departments", href: "/departments", icon: Building2 },
  { name: "Branches", href: "/branches", icon: MapPin },
];

function NavLink({
  href,
  icon: Icon,
  label,
  isActive,
  onClick,
  variant = "default",
  testId,
}: {
  href: string;
  icon: React.ElementType;
  label: string;
  isActive: boolean;
  onClick?: () => void;
  variant?: "default" | "danger";
  testId?: string;
}) {
  const activeStyle =
    variant === "danger"
      ? "bg-rose-500/20 text-rose-300 shadow-sm"
      : "bg-white/15 text-white shadow-sm";
  const inactiveStyle =
    variant === "danger"
      ? "text-indigo-200/50 hover:bg-rose-500/10 hover:text-rose-300"
      : "text-indigo-200/70 hover:bg-white/8 hover:text-white";
  const activeIconStyle = variant === "danger" ? "text-rose-300" : "text-white";
  const inactiveIconStyle =
    variant === "danger"
      ? "text-rose-400/50 group-hover:text-rose-400"
      : "text-indigo-300/60 group-hover:text-indigo-200";
  const activePip = variant === "danger" ? "bg-rose-400" : "bg-indigo-300";

  return (
    <Link
      href={href}
      onClick={onClick}
      data-testid={testId}
      className={cn(
        "group flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 relative",
        isActive ? activeStyle : inactiveStyle,
      )}
    >
      {isActive && (
        <span className={cn("absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full", activePip)} />
      )}
      <Icon className={cn("mr-3 h-4 w-4 flex-shrink-0 transition-colors", isActive ? activeIconStyle : inactiveIconStyle)} />
      <span className="flex-1">{label}</span>
      {isActive && variant !== "danger" && <ChevronRight className="h-3.5 w-3.5 text-indigo-300/60" />}
    </Link>
  );
}

export function Sidebar() {
  const [location] = useLocation();
  const { signOut } = useClerk();
  const { user } = useUser();
  const { org } = useOrg();
  const { data: adminCheck } = useCheckSuperAdmin();

  const userInitials = user?.firstName && user?.lastName
    ? `${user.firstName[0]}${user.lastName[0]}`
    : user?.firstName?.[0] ?? "U";
  const displayName = user?.fullName || user?.primaryEmailAddress?.emailAddress || "User";

  const orgLetter = org?.name?.[0]?.toUpperCase() ?? "T";
  const orgName = org?.name ?? "Talanta EMS";
  const orgIndustry = org?.industry ?? "Cloud Solutions";

  const NavLinks = ({ onLinkClick }: { onLinkClick?: () => void }) => (
    <nav className="flex-1 px-3 py-4 space-y-0.5">
      {navigation.map((item) => {
        const isActive =
          location === item.href ||
          (item.href !== "/dashboard" && location.startsWith(item.href));
        return (
          <NavLink
            key={item.name}
            href={item.href}
            icon={item.icon}
            label={item.name}
            isActive={isActive}
            onClick={onLinkClick}
            testId={`link-${item.name.toLowerCase()}`}
          />
        );
      })}

      {/* Admin section */}
      <div className="pt-3 mt-3 border-t border-white/10">
        <p className="px-3 pb-2 text-[9px] font-semibold text-indigo-300/30 uppercase tracking-widest">Admin</p>

        <NavLink
          href="/admin"
          icon={ShieldCheck}
          label="Org Admin Hub"
          isActive={location === "/admin"}
          onClick={onLinkClick}
          testId="link-admin"
        />

        <NavLink
          href="/members"
          icon={UserCog}
          label="Team Members"
          isActive={location === "/members"}
          onClick={onLinkClick}
          testId="link-members"
        />

        <NavLink
          href="/settings"
          icon={Settings2}
          label="Settings"
          isActive={location === "/settings"}
          onClick={onLinkClick}
          testId="link-settings"
        />

        {adminCheck?.isSuperAdmin && (
          <NavLink
            href="/super-admin"
            icon={ShieldAlert}
            label="Super Admin"
            isActive={location.startsWith("/super-admin")}
            onClick={onLinkClick}
            variant="danger"
            testId="link-super-admin"
          />
        )}
      </div>
    </nav>
  );

  const UserFooter = () => (
    <div className="border-t border-white/10 p-3">
      <div className="flex items-center gap-3 px-2 py-2 rounded-lg mb-1">
        <Avatar className="h-8 w-8 shrink-0 ring-2 ring-white/20">
          <AvatarImage src={user?.imageUrl} />
          <AvatarFallback className="bg-indigo-400 text-white text-xs font-bold">
            {userInitials}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-white truncate">{displayName}</p>
          <p className="text-xs text-indigo-300/60 truncate">
            {adminCheck?.isSuperAdmin ? "Super Administrator" : "Administrator"}
          </p>
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

  const BrandHeader = () => (
    <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
      {org?.logoUrl ? (
        <img
          src={org.logoUrl}
          alt={orgName}
          className="h-8 w-8 rounded-lg object-contain bg-white/10 p-0.5 shrink-0"
        />
      ) : (
        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-white/30 to-white/10 flex items-center justify-center shadow-lg shrink-0 border border-white/20">
          <span className="text-white font-black text-sm">{orgLetter}</span>
        </div>
      )}
      <div className="min-w-0">
        <p className="text-sm font-bold tracking-tight leading-none text-white truncate">{orgName}</p>
        <p className="text-[10px] text-indigo-300/60 mt-0.5 font-medium uppercase tracking-wider truncate">
          {orgIndustry}
        </p>
      </div>
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
            <SheetContent side="left" className="w-60 p-0 border-none text-white" style={{ backgroundColor: "hsl(var(--sidebar))" }}>
              <BrandHeader />
              <div className="flex h-full flex-col">
                <NavLinks />
                <UserFooter />
              </div>
            </SheetContent>
          </Sheet>
          <div className="flex items-center gap-2">
            {org?.logoUrl ? (
              <img src={org.logoUrl} alt={orgName} className="h-6 w-6 rounded object-contain" />
            ) : (
              <div className="h-6 w-6 rounded-md bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
                <span className="text-white font-black text-xs">{orgLetter}</span>
              </div>
            )}
            <span className="font-bold text-slate-800 text-sm">{orgName}</span>
          </div>
        </div>
        <Avatar className="h-7 w-7">
          <AvatarImage src={user?.imageUrl} />
          <AvatarFallback className="bg-indigo-500 text-white text-xs font-bold">{userInitials}</AvatarFallback>
        </Avatar>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden md:flex md:w-60 md:flex-col md:fixed md:inset-y-0 z-30">
        <div
          className="flex flex-col flex-grow text-white overflow-y-auto"
          style={{ backgroundColor: "hsl(var(--sidebar))" }}
        >
          <BrandHeader />
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
