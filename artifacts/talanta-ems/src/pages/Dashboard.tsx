import { Link } from "wouter";
import { useUser } from "@clerk/react";
import {
  useGetDashboardStats,
  useGetRecentEmployees,
  useGetEmployeesByDepartment,
  useGetEmployeesByBranch,
} from "@workspace/api-client-react";
import {
  Users, Building2, MapPin, UserPlus, ArrowRight,
  CheckCircle2, TrendingUp, Activity,
} from "lucide-react";
import { format } from "date-fns";
import {
  Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer,
  XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const CHART_PALETTE = [
  "#6366f1",
  "#8b5cf6",
  "#10b981",
  "#06b6d4",
  "#f59e0b",
];

const DEPT_BADGE = [
  "bg-indigo-100 text-indigo-700",
  "bg-violet-100 text-violet-700",
  "bg-emerald-100 text-emerald-700",
  "bg-cyan-100 text-cyan-700",
  "bg-amber-100 text-amber-700",
];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

const BarTooltipContent = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-100 rounded-xl shadow-lg px-4 py-2.5 text-sm">
      <p className="font-semibold text-slate-700">{label}</p>
      <p className="text-indigo-600 font-bold mt-0.5">{payload[0].value} employees</p>
    </div>
  );
};

const PieTooltipContent = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-100 rounded-xl shadow-lg px-4 py-2.5 text-sm">
      <p className="font-semibold text-slate-700">{payload[0].name}</p>
      <p className="font-bold mt-0.5" style={{ color: payload[0].payload.fill }}>
        {payload[0].value} employees
      </p>
    </div>
  );
};

export default function Dashboard() {
  const { user } = useUser();
  const { data: stats, isLoading: isLoadingStats } = useGetDashboardStats();
  const { data: recentEmployees, isLoading: isLoadingRecent } = useGetRecentEmployees();
  const { data: byDept, isLoading: isLoadingDept } = useGetEmployeesByDepartment();
  const { data: byBranch, isLoading: isLoadingBranch } = useGetEmployeesByBranch();

  const today = format(new Date(), "EEEE, MMMM d, yyyy");
  const greeting = getGreeting();
  const firstName = user?.firstName || "there";

  const statCards = [
    {
      title: "Total Employees",
      value: stats?.totalEmployees,
      icon: Users,
      iconBg: "bg-indigo-100",
      iconColor: "text-indigo-600",
      testId: "stat-total-employees",
    },
    {
      title: "Active",
      value: stats?.activeEmployees,
      icon: CheckCircle2,
      iconBg: "bg-emerald-100",
      iconColor: "text-emerald-600",
      testId: "stat-active-employees",
    },
    {
      title: "Departments",
      value: stats?.totalDepartments,
      icon: Building2,
      iconBg: "bg-violet-100",
      iconColor: "text-violet-600",
      testId: "stat-departments",
    },
    {
      title: "Branches",
      value: stats?.totalBranches,
      icon: MapPin,
      iconBg: "bg-cyan-100",
      iconColor: "text-cyan-600",
      testId: "stat-branches",
    },
    {
      title: "New This Month",
      value: stats?.newThisMonth,
      icon: TrendingUp,
      iconBg: "bg-amber-100",
      iconColor: "text-amber-600",
      testId: "stat-new-this-month",
    },
  ];

  return (
    <div className="space-y-6">

      {/* ── Hero greeting banner ─────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-500 to-violet-500 p-6 sm:p-8 text-white shadow-lg">
        <div className="pointer-events-none absolute -top-8 -right-8 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-1/3 h-28 w-28 rounded-full bg-violet-400/20 blur-2xl" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
          <div>
            <p className="text-indigo-200 text-xs font-semibold uppercase tracking-widest mb-1">
              {today}
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold leading-snug">
              {greeting}, {firstName} 👋
            </h1>
            <p className="text-indigo-200 text-sm mt-1.5">
              Here's your workforce overview for today.
            </p>
          </div>
          <Button
            className="bg-white text-indigo-700 hover:bg-indigo-50 shadow-md font-semibold shrink-0 w-full sm:w-auto"
            asChild
            data-testid="button-add-employee-dashboard"
          >
            <Link href="/employees/new">
              <UserPlus className="mr-2 h-4 w-4" />
              Add Employee
            </Link>
          </Button>
        </div>
      </div>

      {/* ── Stat cards ──────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {statCards.map((card) => (
          <Card
            key={card.title}
            className="border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-200"
          >
            <CardContent className="p-5">
              <div className={`inline-flex p-2.5 rounded-xl ${card.iconBg} mb-3`}>
                <card.icon className={`h-5 w-5 ${card.iconColor}`} />
              </div>
              {isLoadingStats ? (
                <Skeleton className="h-8 w-14 mb-1.5" />
              ) : (
                <p
                  className="text-3xl font-bold text-slate-900 leading-none mb-1.5 tabular-nums"
                  data-testid={card.testId}
                >
                  {card.value ?? "—"}
                </p>
              )}
              <p className="text-xs font-medium text-slate-400">{card.title}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Charts row ──────────────────────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-7">

        {/* Bar chart */}
        <Card className="lg:col-span-4 border-slate-100 shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold text-slate-800">
                  Workforce by Department
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  Employee headcount per team
                </CardDescription>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-50 rounded-lg px-2.5 py-1.5 border border-slate-100 select-none">
                <Activity className="h-3 w-3" />
                All time
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-2 pl-1">
            {isLoadingDept ? (
              <Skeleton className="h-[280px] w-full rounded-xl" />
            ) : byDept && byDept.length > 0 ? (
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={byDept}
                    margin={{ top: 10, right: 8, left: -14, bottom: 0 }}
                    barSize={28}
                  >
                    <defs>
                      <linearGradient id="barGradFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6366f1" stopOpacity={1} />
                        <stop offset="100%" stopColor="#a5b4fc" stopOpacity={0.75} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#f1f5f9"
                    />
                    <XAxis
                      dataKey="name"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: "#94a3b8" }}
                    />
                    <YAxis
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: "#94a3b8" }}
                      width={28}
                      allowDecimals={false}
                    />
                    <Tooltip
                      content={<BarTooltipContent />}
                      cursor={{ fill: "rgba(99,102,241,0.06)", radius: 6 } as any}
                    />
                    <Bar
                      dataKey="count"
                      fill="url(#barGradFill)"
                      radius={[6, 6, 2, 2]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[280px] flex items-center justify-center text-slate-400 text-sm">
                No data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Donut + custom legend */}
        <Card className="lg:col-span-3 border-slate-100 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-slate-800">
              Branch Distribution
            </CardTitle>
            <CardDescription className="text-xs mt-0.5">
              Employees per office location
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            {isLoadingBranch ? (
              <Skeleton className="h-[280px] w-full rounded-xl" />
            ) : byBranch && byBranch.length > 0 ? (
              <div className="space-y-4">
                <div className="h-[180px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={byBranch}
                        cx="50%"
                        cy="50%"
                        innerRadius={52}
                        outerRadius={78}
                        paddingAngle={3}
                        dataKey="count"
                        strokeWidth={0}
                      >
                        {byBranch.map((_, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={CHART_PALETTE[index % CHART_PALETTE.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip content={<PieTooltipContent />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2.5 px-1">
                  {byBranch.map((entry, index) => (
                    <div key={entry.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className="h-2.5 w-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: CHART_PALETTE[index % CHART_PALETTE.length] }}
                        />
                        <span className="text-sm text-slate-600 truncate">{entry.name}</span>
                      </div>
                      <span className="text-sm font-bold text-slate-800 ml-3 tabular-nums shrink-0">
                        {entry.count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-[280px] flex items-center justify-center text-slate-400 text-sm">
                No data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Recent hires ────────────────────────────────────── */}
      <Card className="border-slate-100 shadow-sm overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-slate-50">
          <div>
            <CardTitle className="text-sm font-semibold text-slate-800">Recent Hires</CardTitle>
            <CardDescription className="text-xs mt-0.5">
              Newest members of the organization
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="hidden sm:flex text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 -mr-2 text-xs font-semibold"
            data-testid="link-view-all-employees"
          >
            <Link href="/employees">
              View All <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {isLoadingRecent ? (
            <div className="divide-y divide-slate-50">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-6 py-4">
                  <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                  <div className="space-y-1.5 flex-1">
                    <Skeleton className="h-3.5 w-44" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-6 w-24 rounded-full hidden sm:block" />
                </div>
              ))}
            </div>
          ) : recentEmployees && recentEmployees.length > 0 ? (
            <div className="divide-y divide-slate-50">
              {recentEmployees.map((emp, index) => {
                const initials = emp.fullName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .substring(0, 2)
                  .toUpperCase();
                return (
                  <Link
                    key={emp.id}
                    href={`/employees/${emp.id}`}
                    className="flex items-center gap-4 px-6 py-3.5 hover:bg-slate-50/80 transition-colors group cursor-pointer"
                    data-testid={`link-recent-emp-${emp.id}`}
                  >
                    <Avatar className="h-9 w-9 shrink-0 ring-2 ring-white shadow-sm">
                      <AvatarImage
                        src={emp.photoUrl ? `/api/storage${emp.photoUrl}` : undefined}
                        className="object-cover"
                      />
                      <AvatarFallback className="bg-indigo-100 text-indigo-700 text-xs font-bold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors truncate leading-tight">
                        {emp.fullName}
                      </p>
                      <p className="text-xs text-slate-400 truncate mt-0.5">{emp.jobTitle}</p>
                    </div>

                    {emp.departmentName && (
                      <span
                        className={`hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium shrink-0 ${
                          DEPT_BADGE[index % DEPT_BADGE.length]
                        }`}
                      >
                        {emp.departmentName}
                      </span>
                    )}

                    <span className="text-xs text-slate-400 shrink-0 hidden md:block tabular-nums">
                      {format(new Date(emp.dateOfEmployment), "MMM d, yyyy")}
                    </span>

                    <ArrowRight className="h-3.5 w-3.5 text-slate-200 group-hover:text-indigo-400 transition-colors shrink-0 ml-1" />
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400 text-sm">
              No recent employees found.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
