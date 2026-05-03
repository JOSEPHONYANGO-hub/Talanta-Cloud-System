import { useState } from "react";
import { useUser } from "@clerk/react";
import {
  useOrgMembers, useAddMember, useUpdateMemberRole, useRemoveMember,
  type OrgMember,
} from "@/hooks/useMembers";
import { useActivity } from "@/hooks/useActivity";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Crown, ShieldCheck, User, UserPlus, Trash2, UserCog, Users, Clock3 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const ROLE_CONFIG = {
  owner: {
    label: "Owner",
    icon: Crown,
    cls: "border-amber-200 bg-amber-50 text-amber-700",
    desc: "Full control over the organization",
  },
  admin: {
    label: "Admin",
    icon: ShieldCheck,
    cls: "border-indigo-200 bg-indigo-50 text-indigo-700",
    desc: "Can manage employees, departments, and members",
  },
  member: {
    label: "Member",
    icon: User,
    cls: "border-slate-200 bg-slate-50 text-slate-600",
    desc: "Can view all data (read-only)",
  },
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatTime(d: string) {
  return new Date(d).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function MemberSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4 border-b border-slate-100 last:border-0">
      <Skeleton className="h-10 w-10 rounded-full" />
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-3 w-56" />
      </div>
      <Skeleton className="h-6 w-16 rounded-full" />
    </div>
  );
}

export default function Members() {
  const { user } = useUser();
  const { data: members, isLoading } = useOrgMembers();
  const { data: activity } = useActivity(8);
  const addMutation = useAddMember();
  const updateRoleMutation = useUpdateMemberRole();
  const removeMutation = useRemoveMember();

  const [showAdd, setShowAdd] = useState(false);
  const [addEmail, setAddEmail] = useState("");
  const [addRole, setAddRole] = useState<"admin" | "member">("member");
  const [removeTarget, setRemoveTarget] = useState<OrgMember | null>(null);

  const currentUserId = user?.id ?? "";
  const currentMember = members?.find((m) => m.userId === currentUserId);
  const currentRole = currentMember?.role ?? "member";
  const canManage = currentRole === "owner" || currentRole === "admin";
  const isOwner = currentRole === "owner";

  async function handleAdd() {
    if (!addEmail.trim()) return;
    try {
      const m = await addMutation.mutateAsync({ email: addEmail.trim(), role: addRole });
      toast.success(`${m.fullName ?? m.email ?? "Member"} added as ${addRole}`);
      setShowAdd(false);
      setAddEmail("");
      setAddRole("member");
    } catch (err: any) {
      toast.error(err.message ?? "Failed to add member");
    }
  }

  async function handleRoleChange(userId: string, role: "admin" | "member") {
    try {
      await updateRoleMutation.mutateAsync({ userId, role });
      toast.success("Role updated");
    } catch (err: any) {
      toast.error(err.message ?? "Failed to update role");
    }
  }

  async function handleRemove() {
    if (!removeTarget) return;
    try {
      await removeMutation.mutateAsync(removeTarget.userId);
      toast.success(`${removeTarget.fullName ?? removeTarget.email ?? "Member"} removed`);
      setRemoveTarget(null);
    } catch (err: any) {
      toast.error(err.message ?? "Failed to remove member");
    }
  }

  function canChangeRole(m: OrgMember) {
    if (m.userId === currentUserId) return false;
    if (m.role === "owner") return false;
    return isOwner;
  }

  function canRemove(m: OrgMember) {
    if (m.userId === currentUserId) return false;
    if (m.role === "owner") return false;
    if (m.role === "admin") return isOwner;
    return canManage;
  }

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            Team Members
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage who has access to your organization and their permissions.
          </p>
        </div>
        {canManage && (
          <Button onClick={() => setShowAdd(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Add Member
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {(Object.entries(ROLE_CONFIG) as [string, typeof ROLE_CONFIG.owner][]).map(([key, cfg]) => (
              <div key={key} className="bg-white rounded-xl border border-slate-100 shadow-sm p-3.5 flex items-start gap-3">
                <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center shrink-0 border", cfg.cls)}>
                  <cfg.icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">{cfg.label}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{cfg.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3 pt-5 px-6">
              <CardTitle className="text-sm font-semibold text-slate-900">
                Members
                {members && <span className="ml-2 text-xs font-normal text-slate-400">({members.length})</span>}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <>
                  <MemberSkeleton />
                  <MemberSkeleton />
                  <MemberSkeleton />
                </>
              ) : !members?.length ? (
                <div className="flex flex-col items-center justify-center h-32 gap-2 text-slate-400">
                  <Users className="h-8 w-8 text-slate-200" />
                  <p className="text-sm">No members yet</p>
                </div>
              ) : (
                <ul>
                  {members.map((m) => {
                    const cfg = ROLE_CONFIG[m.role] ?? ROLE_CONFIG.member;
                    const RoleIcon = cfg.icon;
                    const isYou = m.userId === currentUserId;
                    const initials = m.fullName
                      ? m.fullName.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
                      : (m.email?.[0] ?? "?").toUpperCase();

                    return (
                      <li
                        key={m.id}
                        className={cn(
                          "flex items-center gap-4 px-6 py-4 border-b border-slate-50 last:border-0",
                          isYou && "bg-indigo-50/30",
                        )}
                      >
                        <Avatar className="h-10 w-10 shrink-0">
                          <AvatarImage src={m.imageUrl ?? undefined} />
                          <AvatarFallback className="bg-gradient-to-br from-indigo-400 to-violet-500 text-white text-sm font-bold">
                            {initials}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-semibold text-slate-900 truncate">
                              {m.fullName ?? m.email ?? m.userId.slice(0, 16) + "…"}
                            </p>
                            {isYou && (
                              <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-indigo-200 text-indigo-500 font-semibold">
                                You
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5 truncate">
                            {m.email ?? <span className="font-mono">{m.userId}</span>}
                            <span className="mx-1.5 text-slate-200">·</span>
                            Joined {formatDate(m.joinedAt)}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {canChangeRole(m) ? (
                            <Select
                              value={m.role === "owner" ? "owner" : m.role}
                              onValueChange={(val) => handleRoleChange(m.userId, val as "admin" | "member")}
                              disabled={updateRoleMutation.isPending}
                            >
                              <SelectTrigger className={cn("h-7 w-28 text-xs font-semibold border", cfg.cls)}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="admin" className="text-xs">Admin</SelectItem>
                                <SelectItem value="member" className="text-xs">Member</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <Badge
                              variant="outline"
                              className={cn("text-xs font-semibold px-2.5 py-1 flex items-center gap-1.5", cfg.cls)}
                            >
                              <RoleIcon className="h-3 w-3" />
                              {cfg.label}
                            </Badge>
                          )}

                          {canRemove(m) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-slate-400 hover:text-rose-500 hover:bg-rose-50"
                              onClick={() => setRemoveTarget(m)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="border-0 shadow-sm h-fit">
          <CardHeader className="pb-3 pt-5 px-6">
            <CardTitle className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <Clock3 className="h-4 w-4 text-slate-400" /> Recent activity
            </CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-5">
            {activity?.length ? (
              <div className="space-y-3">
                {activity.map((item) => (
                  <div key={item.id} className="space-y-1 border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-medium text-slate-800 capitalize">{item.action.replace(/_/g, " ")}</p>
                      <span className="text-[10px] text-slate-400">{formatTime(item.createdAt)}</span>
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
      </div>

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" />
              Add Team Member
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="add-email">Email address</Label>
              <Input
                id="add-email"
                type="email"
                placeholder="colleague@example.com"
                value={addEmail}
                onChange={(e) => setAddEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                autoFocus
              />
              <p className="text-xs text-slate-400">
                The person must already have a Talanta account. They'll sign in at{" "}
                <span className="font-mono text-slate-500">/sign-up</span>.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-role">Role</Label>
              <Select value={addRole} onValueChange={(v) => setAddRole(v as "admin" | "member")}> 
                <SelectTrigger id="add-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="member">Member</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={handleAdd} disabled={addMutation.isPending || !addEmail.trim()}>
              {addMutation.isPending ? "Adding…" : "Add Member"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!removeTarget} onOpenChange={(o) => !o && setRemoveTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Remove {removeTarget?.fullName ?? removeTarget?.email ?? "this member"}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              They will lose access to this organization immediately. You can add them back later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-rose-600 hover:bg-rose-700 text-white" onClick={handleRemove} disabled={removeMutation.isPending}>
              {removeMutation.isPending ? "Removing…" : "Remove member"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
