import { Link, useLocation } from "wouter";
import { useClerk, useUser } from "@clerk/react";
import { LayoutDashboard, Users, Building2, MapPin, LogOut, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

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

  const NavLinks = () => (
    <nav className="flex-1 space-y-1 p-4">
      {navigation.map((item) => {
        const isActive = location === item.href || (item.href !== "/dashboard" && location.startsWith(item.href));
        return (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              "group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary/10 text-primary"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
            )}
            data-testid={`link-${item.name.toLowerCase()}`}
          >
            <item.icon
              className={cn(
                "mr-3 h-5 w-5 flex-shrink-0",
                isActive ? "text-primary" : "text-sidebar-foreground/50 group-hover:text-sidebar-foreground/70"
              )}
            />
            {item.name}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Mobile Sidebar */}
      <div className="md:hidden flex items-center p-4 border-b bg-background">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" data-testid="button-mobile-menu">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0 bg-sidebar border-none text-sidebar-foreground">
            <div className="flex h-16 items-center border-b border-sidebar-border px-6">
              <img src={`${import.meta.env.BASE_URL}logo.svg`} alt="Talanta Logo" className="h-8 w-auto mr-2" />
              <span className="text-lg font-bold">Talanta EMS</span>
            </div>
            <div className="flex h-full flex-col">
              <NavLinks />
              <div className="border-t border-sidebar-border p-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                    {user?.firstName?.[0] || 'U'}
                  </div>
                  <div className="text-sm font-medium truncate">
                    {user?.fullName || user?.primaryEmailAddress?.emailAddress}
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  className="w-full justify-start text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground" 
                  onClick={() => signOut()}
                  data-testid="button-sign-out"
                >
                  <LogOut className="mr-3 h-5 w-5" />
                  Sign Out
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
        <span className="ml-4 font-semibold">Talanta EMS</span>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
        <div className="flex flex-col flex-grow bg-sidebar text-sidebar-foreground border-r border-sidebar-border pt-5 pb-4 overflow-y-auto">
          <div className="flex items-center flex-shrink-0 px-6">
            <img src={`${import.meta.env.BASE_URL}logo.svg`} alt="Talanta Logo" className="h-8 w-auto mr-3" />
            <span className="text-xl font-bold tracking-tight">Talanta EMS</span>
          </div>
          <div className="mt-8 flex-1 flex flex-col">
            <NavLinks />
          </div>
          <div className="border-t border-sidebar-border p-4">
            <div className="flex items-center gap-3 mb-4 px-2">
              <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                {user?.firstName?.[0] || 'U'}
              </div>
              <div className="text-sm font-medium truncate">
                {user?.fullName || user?.primaryEmailAddress?.emailAddress}
              </div>
            </div>
            <Button 
              variant="ghost" 
              className="w-full justify-start text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground" 
              onClick={() => signOut()}
              data-testid="button-sign-out"
            >
              <LogOut className="mr-3 h-5 w-5" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}