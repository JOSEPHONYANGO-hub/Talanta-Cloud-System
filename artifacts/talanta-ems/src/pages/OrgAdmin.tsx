import { Link } from "wouter";
import { useOrg } from "@/hooks/useOrg";
import { useAuth } from "@clerk/react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users, Building2, MapPin, Settings2, Plus, ArrowRight,
  BarChart3, ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DashboardStats {
  totalEmployees: number;
  activeEmployees: number;
  totalDepartments: number;
  totalBranches: number;
}

function useDashboardStats() {
  const { getToken } = useAuth();
  return useQuery<DashboardStats>({
    queryKey: ["dashboard", "stats"],
    queryFn: async () => {
      const token = await getToken();
      const res = await fetch("/api/dashboard/stats", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load stats");
      return res.json();
    },
    staleTime: 30_000,
  });
}

interface ManageCard {
  title: string;
  description: string;
  href: string;
  addHref?: string;
  icon: React.ElementType;
  color: string;
  countKey?: keyof DashboardStats;
}

const cards: ManageCard[] = [
  {
    title: "Employees",
    description: "Add, edit, and manage all employee records, profiles, and job info.",
    href: "/employees",
    addHref: "/employees/new",
    icon: Users,
    color: "bg-indigo-500",
    countKey: "totalEmployees",
  },
  {
    title: "Departments",
    description: "Organize your company structure with departments and assign teams.",
    href: "/departments",
    icon: Building2,
    color: "bg-violet-500",
    countKey: "totalDepartments",
  },
  {
    title: "Branches",
    description: "Manage office locations and assign employees to branches.",
    href: "/branches",
    icon: MapPin,
    color: "bg-emerald-500",
    countKey: "totalBranches",
  },
  {
    title: "Org Settings",
    description: "Update your organization profile, logo, and brand colors.",
    href: "/settings",
    icon: Settings2,
    color: "bg-amber-500",
  },
];

export default function OrgAdmin() {
  const { org } = useOrg();
  const { data: stats } = useDashboardStats();

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <h1 className="text-2xl font-bold text-slate-900">Admin Hub</h1>
          </div>
          <p className="text-sm text-slate-500">
            Manage <span className="font-semibold text-slate-700">{org?.name ?? "your organization"}</span> — employees, structure, and settings.
          </p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard">
            <BarChart3 className="mr-2 h-3.5 w-3.5" />
            View Dashboard
          </Link>
        </Button>
      </div>

      {/* Stats banner */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Total Employees", value: stats.totalEmployees, color: "text-indigo-600" },
            { label: "Active", value: stats.activeEmployees, color: "text-emerald-600" },
            { label: "Departments", value: stats.totalDepartments, color: "text-violet-600" },
            { label: "Branches", value: stats.totalBranches, color: "text-amber-600" },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm">
              <p className={cn("text-2xl font-bold", s.color)}>{s.value}</p>
              <p className="text-xs text-slate-400 font-medium mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Management cards */}
      <div>
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">Management Areas</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {cards.map((card) => (
            <Card key={card.title} className="border border-slate-100 shadow-sm hover:shadow-md transition-shadow group">
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div className={cn("h-11 w-11 rounded-xl flex items-center justify-center shrink-0 shadow-sm", card.color)}>
                    <card.icon className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm font-semibold text-slate-900">{card.title}</h3>
                      {card.countKey && stats && (
                        <Badge variant="secondary" className="text-xs font-semibold">
                          {stats[card.countKey]}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">{card.description}</p>
                    <div className="flex items-center gap-2 mt-3">
                      <Button variant="outline" size="sm" className="h-7 text-xs" asChild>
                        <Link href={card.href}>
                          Manage <ArrowRight className="ml-1 h-3 w-3" />
                        </Link>
                      </Button>
                      {card.addHref && (
                        <Button size="sm" className="h-7 text-xs" asChild>
                          <Link href={card.addHref}>
                            <Plus className="mr-1 h-3 w-3" /> Add New
                          </Link>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Brand preview */}
      {org && (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-900">Brand Identity</h2>
            <Button variant="outline" size="sm" className="h-7 text-xs" asChild>
              <Link href="/settings">Edit</Link>
            </Button>
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div
                className="h-10 w-10 rounded-xl flex items-center justify-center text-white font-black text-sm shadow-sm"
                style={{ backgroundColor: org.primaryColor }}
              >
                {org.logoUrl ? (
                  <img src={org.logoUrl} alt={org.name} className="h-10 w-10 rounded-xl object-contain" />
                ) : (
                  org.name[0].toUpperCase()
                )}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">{org.name}</p>
                <p className="text-xs text-slate-400">/{org.slug}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: org.primaryColor }} title="Primary color" />
              <div className="h-6 w-6 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: org.accentColor }} title="Accent color" />
              <span className="text-xs text-slate-400">Brand colors</span>
            </div>
            {org.industry && (
              <Badge variant="secondary" className="text-xs">{org.industry}</Badge>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
