import { useMemo } from "react";
import { Link } from "wouter";
import { 
  useGetDashboardStats, 
  useGetRecentEmployees, 
  useGetEmployeesByDepartment, 
  useGetEmployeesByBranch 
} from "@workspace/api-client-react";
import { 
  Users, Building2, MapPin, UserPlus, ArrowRight, User
} from "lucide-react";
import { format } from "date-fns";
import { 
  Bar, BarChart, Pie, PieChart, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

const COLORS = ['hsl(222, 47%, 11%)', 'hsl(215, 16%, 47%)', 'hsl(200, 98%, 39%)', 'hsl(175, 65%, 41%)', 'hsl(221, 83%, 53%)'];

export default function Dashboard() {
  const { data: stats, isLoading: isLoadingStats } = useGetDashboardStats();
  const { data: recentEmployees, isLoading: isLoadingRecent } = useGetRecentEmployees();
  const { data: byDept, isLoading: isLoadingDept } = useGetEmployeesByDepartment();
  const { data: byBranch, isLoading: isLoadingBranch } = useGetEmployeesByBranch();

  const StatCard = ({ title, value, icon: Icon, isLoading }: any) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-7 w-20" />
        ) : (
          <div className="text-2xl font-bold" data-testid={`stat-${title.replace(/\s+/g, '-').toLowerCase()}`}>
            {value}
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Overview of your organization's workforce.</p>
        </div>
        <Button asChild data-testid="button-add-employee-dashboard">
          <Link href="/employees/new">
            <UserPlus className="mr-2 h-4 w-4" />
            Add Employee
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <StatCard title="Total Employees" value={stats?.totalEmployees} icon={Users} isLoading={isLoadingStats} />
        <StatCard title="Active Employees" value={stats?.activeEmployees} icon={User} isLoading={isLoadingStats} />
        <StatCard title="Departments" value={stats?.totalDepartments} icon={Building2} isLoading={isLoadingStats} />
        <StatCard title="Branches" value={stats?.totalBranches} icon={MapPin} isLoading={isLoadingStats} />
        <StatCard title="New This Month" value={stats?.newThisMonth} icon={UserPlus} isLoading={isLoadingStats} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Employees by Department</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            {isLoadingDept ? (
              <Skeleton className="h-[300px] w-full" />
            ) : byDept && byDept.length > 0 ? (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={byDept} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                    <Tooltip cursor={{fill: 'rgba(0,0,0,0.05)'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}} />
                    <Bar dataKey="count" fill="hsl(222, 47%, 11%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">No data available</div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Employees by Branch</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingBranch ? (
              <Skeleton className="h-[300px] w-full" />
            ) : byBranch && byBranch.length > 0 ? (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={byBranch}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="count"
                    >
                      {byBranch.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">No data available</div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Hires</CardTitle>
            <CardDescription>The newest members of your organization.</CardDescription>
          </div>
          <Button variant="ghost" size="sm" asChild className="hidden sm:flex" data-testid="link-view-all-employees">
            <Link href="/employees">
              View All <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {isLoadingRecent ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-[200px]" />
                    <Skeleton className="h-3 w-[150px]" />
                  </div>
                </div>
              ))}
            </div>
          ) : recentEmployees && recentEmployees.length > 0 ? (
            <div className="space-y-6">
              {recentEmployees.map((emp) => (
                <div key={emp.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-10 w-10 border">
                      <AvatarImage src={emp.photoUrl ? `/api/storage${emp.photoUrl}` : undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {emp.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <Link href={`/employees/${emp.id}`} className="font-medium hover:underline text-foreground" data-testid={`link-recent-emp-${emp.id}`}>
                        {emp.fullName}
                      </Link>
                      <div className="text-sm text-muted-foreground">
                        {emp.jobTitle} • {emp.departmentName}
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground hidden sm:block">
                    Joined {format(new Date(emp.dateOfEmployment), 'MMM d, yyyy')}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              No recent employees found.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}