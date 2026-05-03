import { useState } from "react";
import { Link, useParams, useLocation } from "wouter";
import { useSuperAdminOrgDetail, useDeleteOrgAdmin } from "@/hooks/useSuperAdmin";
import { useActivity } from "@/hooks/useActivity";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ArrowLeft, Building2, Users, MapPin, Crown, UserCheck, User,
  Trash2, Calendar, Briefcase, ShieldCheck, Clock3,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

const roleConfig: Record<string, { label: string; icon: React.ElementType; cls: string }> = {
  owner: { label: "Owner", icon: Crown, cls: "bg-amber-50 text-amber-700 border-amber-200" },
  admin: { label: "Admin", icon: ShieldCheck, cls: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  member: { label: "Member", icon: User, cls: "bg-slate-50 text-slate-600 border-slate-200" },
};

export default function SuperAdminOrgDetail() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const orgId = parseInt(id ?? "", 10);
  const { data: org, isLoading } = useSuperAdminOrgDetail(isNaN(orgId) ? null : orgId);
  const { data: activity } = useActivity(10);
  const deleteMutation = useDeleteOrgAdmin();
  const [showDelete, setShowDelete] = useState(false);

  async function handleDelete() {
    if (!org) return;
    try {
      await deleteMutation.mutateAsync(org.id);
      toast.success(`"${org.name}" has been permanently deleted`);
      setLocation("/super-admin");
    } catch (err: any) {
      toast.error(err.message ?? "Failed to delete organization");
    }
  }

  if (isLoading) {
    return (
      <div className="p-8 space-y-6 max-w-4xl mx-auto">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!org) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-slate-400">
        <Building2 className="h-10 w-10 text-slate-200" />
        <p>Organization not found</p>
        <Button variant="outline" size="sm" onClick={() => setLocation("/super-admin")}>
          <ArrowLeft className="mr-2 h-3.5 w-3.5" /> Back to list
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link
            href="/super-admin"
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 mb-3 transition-colors"
          >
            <ArrowLeft className="h-3 w-3" /> All organizations
          </Link>
          <div className="flex items-center gap-3">
            <div
              className="h-12 w-12 rounded-xl flex items-center justify-center text-white text-lg font-black shrink-0 shadow-sm"
              style={{ backgroundColor: org.primaryColor }}
            >
              {org.logoUrl ? (
                <img src={org.logoUrl} alt={org.name} className="h-12 w-12 rounded-xl object-contain" />
              ) : (
                org.name[0].toUpperCase()
              )}
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">{org.name}</h1>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-sm text-slate-400">/{org.slug}</p>
                {org.industry && <Badge variant="secondary" className="text-xs">{org.industry}</Badge>}
              </div>
            </div>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="border-rose-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300 shrink-0"
          onClick={() => setShowDelete(true)}
        >
          <Trash2 className="mr-2 h-3.5 w-3.5" />
          Delete Org
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Employees", value: org.employeeCount, icon: Users, color: "bg-indigo-500" },
          { label: "Departments", value: org.departmentCount, icon: Building2, color: "bg-violet-500" },
          { label: "Branches", value: org.branchCount, icon: MapPin, color: "bg-emerald-500" },
          { label: "Team Members", value: org.members.length, icon: UserCheck, color: "bg-amber-500" },
        ].map((s) => (
          <Card key={s.label} className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={cn("h-9 w-9 rounded-lg flex items-center justify-center shrink-0", s.color)}>
                  <s.icon className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-xl font-bold text-slate-900">{s.value}</p>
                  <p className="text-xs text-slate-400 font-medium">{s.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3 pt-5 px-5">
            <CardTitle className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-slate-400" /> Organization Details
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5 space-y-3">
            {[
              { label: "Name", value: org.name },
              { label: "Slug", value: `/${org.slug}` },
              { label: "Industry", value: org.industry ?? "—" },
              { label: "Created", value: formatDate(org.createdAt) },
              { label: "Last updated", value: formatDate(org.updatedAt) },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between text-sm">
                <span className="text-slate-500">{item.label}</span>
                <span className="font-medium text-slate-800">{item.value}</span>
              </div>
            ))}
            <div className="flex items-center gap-2 pt-1">
              <span className="text-xs text-slate-400">Brand colors:</span>
              <div className="h-5 w-5 rounded-full border border-white shadow-sm" style={{ backgroundColor: org.primaryColor }} title="Primary" />
              <div className="h-5 w-5 rounded-full border border-white shadow-sm" style={{ backgroundColor: org.accentColor }} title="Accent" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3 pt-5 px-5">
            <CardTitle className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-slate-400" /> Team Members ({org.members.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            {org.members.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">No members</p>
            ) : (
              <div className="space-y-2">
                {org.members.map((m) => {
                  const cfg = roleConfig[m.role] ?? roleConfig.member;
                  const RoleIcon = cfg.icon;
                  return (
                    <div key={m.id} className="flex items-center justify-between py-1.5">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-full bg-slate-100 flex items-center justify-center">
                          <User className="h-3.5 w-3.5 text-slate-400" />
                        </div>
                        <div>
                          <p className="text-xs font-mono text-slate-500 leading-none">{m.userId.slice(0, 16)}…</p>
                          <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                            <Calendar className="h-2.5 w-2.5" />
                            Joined {formatDate(m.joinedAt)}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className={cn("text-[10px] font-semibold px-1.5 py-0 flex items-center gap-1", cfg.cls)}>
                        <RoleIcon className="h-2.5 w-2.5" />
                        {cfg.label}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3 pt-5 px-5">
          <CardTitle className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <Clock3 className="h-4 w-4 text-slate-400" /> Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          {activity?.length ? (
            <div className="space-y-3">
              {activity.map((item) => (
                <div key={item.id} className="space-y-1 border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-medium text-slate-800 capitalize">{item.action.replace(/_/g, " ")}</p>
                    <span className="text-[10px] text-slate-400">{new Date(item.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    {item.actor.fullName ?? item.actor.email ?? item.actor.userId} · {item.entityType}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400">No activity yet</p>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={showDelete} onOpenChange={setShowDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{org.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes the organization and all its data ({org.employeeCount} employee
              {org.employeeCount !== 1 ? "s" : ""}, {org.departmentCount} department
              {org.departmentCount !== 1 ? "s" : ""}, {org.branchCount} branch
              {org.branchCount !== 1 ? "es" : ""}). This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-rose-600 hover:bg-rose-700 text-white"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting…" : "Delete permanently"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
