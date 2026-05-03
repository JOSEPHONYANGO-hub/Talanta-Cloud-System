import { useState } from "react";
import { Link } from "wouter";
import {
  useSuperAdminStats, useSuperAdminOrgs, useDeleteOrgAdmin, useCreateOrgAdmin,
  type OrgWithStats, type CreateOrgAdminInput,
} from "@/hooks/useSuperAdmin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Building2, Users, Briefcase, LayoutDashboard,
  Search, Trash2, Eye, ShieldCheck, Plus, Copy, CheckCheck, Link2, Mail,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

function StatCard({ title, value, icon: Icon, color }: {
  title: string; value: number | string; icon: React.ElementType; color: string;
}) {
  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-center gap-4">
          <div className={cn("h-11 w-11 rounded-xl flex items-center justify-center shrink-0", color)}>
            <Icon className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900">{value}</p>
            <p className="text-xs text-slate-500 font-medium mt-0.5">{title}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 50);
}

export default function SuperAdmin() {
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<OrgWithStats | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [inviteResult, setInviteResult] = useState<{ orgName: string; inviteUrl: string; email: string; emailSent: boolean } | null>(null);
  const [copied, setCopied] = useState(false);

  const [form, setForm] = useState<CreateOrgAdminInput>({
    name: "",
    slug: "",
    industry: "",
    primaryColor: "#6366f1",
    accentColor: "#10b981",
    ownerEmail: "",
  });

  const { data: stats, isLoading: statsLoading } = useSuperAdminStats();
  const { data: orgs, isLoading: orgsLoading } = useSuperAdminOrgs();
  const deleteMutation = useDeleteOrgAdmin();
  const createMutation = useCreateOrgAdmin();

  const filtered = (orgs ?? []).filter(
    (o) =>
      o.name.toLowerCase().includes(search.toLowerCase()) ||
      o.slug.toLowerCase().includes(search.toLowerCase()) ||
      (o.industry ?? "").toLowerCase().includes(search.toLowerCase()),
  );

  function handleFormChange(field: keyof CreateOrgAdminInput, value: string) {
    setForm((prev) => {
      const updated = { ...prev, [field]: value };
      if (field === "name" && !prev.slug) {
        updated.slug = slugify(value);
      }
      return updated;
    });
  }

  async function handleCreate() {
    if (!form.name.trim() || !form.ownerEmail.trim()) return;
    try {
      const org = await createMutation.mutateAsync({
        name: form.name.trim(),
        slug: form.slug || slugify(form.name),
        industry: form.industry || undefined,
        primaryColor: form.primaryColor,
        accentColor: form.accentColor,
        ownerEmail: form.ownerEmail.trim(),
      });

      const inviteUrl = `${window.location.origin}/accept-invite?token=${org.inviteToken}`;
      setShowCreate(false);
      setForm({ name: "", slug: "", industry: "", primaryColor: "#6366f1", accentColor: "#10b981", ownerEmail: "" });
      setInviteResult({ orgName: org.name, inviteUrl, email: org.ownerEmail ?? form.ownerEmail, emailSent: org.emailSent });
    } catch (err: any) {
      toast.error(err.message ?? "Failed to create organization");
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      const result = await deleteMutation.mutateAsync(deleteTarget.id);
      toast.success(`"${result.deleted.name}" has been permanently deleted`);
      setDeleteTarget(null);
    } catch (err: any) {
      toast.error(err.message ?? "Failed to delete organization");
    }
  }

  function handleCopy() {
    if (!inviteResult) return;
    navigator.clipboard.writeText(inviteResult.inviteUrl).then(() => {
      setCopied(true);
      toast.success("Invite link copied to clipboard!");
      setTimeout(() => setCopied(false), 2500);
    });
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="h-5 w-5 text-rose-500" />
            <h1 className="text-2xl font-bold text-slate-900">Super Admin Panel</h1>
          </div>
          <p className="text-sm text-slate-500">Manage all organizations on Talanta-Cloud EMS</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Organization
          </Button>
          <Badge variant="outline" className="border-rose-200 text-rose-600 bg-rose-50 text-xs font-semibold px-3 py-1">
            System Admin
          </Badge>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Organizations" value={statsLoading ? "—" : (stats?.totalOrganizations ?? 0)} icon={Building2} color="bg-rose-500" />
        <StatCard title="Total Employees" value={statsLoading ? "—" : (stats?.totalEmployees ?? 0)} icon={Users} color="bg-indigo-500" />
        <StatCard title="Total Members" value={statsLoading ? "—" : (stats?.totalMembers ?? 0)} icon={Briefcase} color="bg-emerald-500" />
        <StatCard title="Total Departments" value={statsLoading ? "—" : (stats?.totalDepartments ?? 0)} icon={LayoutDashboard} color="bg-amber-500" />
      </div>

      {/* Organizations table */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3 px-6 pt-5">
          <div className="flex items-center justify-between gap-4">
            <CardTitle className="text-base font-semibold text-slate-900">
              All Organizations
              {orgs && <span className="ml-2 text-xs font-normal text-slate-400">({orgs.length})</span>}
            </CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <Input
                placeholder="Search organizations…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-8 text-sm"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          {orgsLoading ? (
            <div className="flex items-center justify-center h-32 text-sm text-slate-400">Loading organizations…</div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 gap-2">
              <Building2 className="h-8 w-8 text-slate-200" />
              <p className="text-sm text-slate-400">{search ? "No organizations match your search" : "No organizations yet"}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/60 hover:bg-slate-50/60">
                    <TableHead className="pl-6 text-xs font-semibold text-slate-500 uppercase tracking-wide">Organization</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Industry</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wide text-center">Members</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wide text-center">Employees</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Created</TableHead>
                    <TableHead className="pr-6 text-xs font-semibold text-slate-500 uppercase tracking-wide text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((org) => (
                    <TableRow key={org.id} className="hover:bg-slate-50/50">
                      <TableCell className="pl-6">
                        <div className="flex items-center gap-3">
                          <div
                            className="h-8 w-8 rounded-lg flex items-center justify-center text-white text-sm font-black shrink-0"
                            style={{ backgroundColor: org.primaryColor }}
                          >
                            {org.logoUrl ? (
                              <img src={org.logoUrl} alt={org.name} className="h-8 w-8 rounded-lg object-contain" />
                            ) : (
                              org.name[0].toUpperCase()
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{org.name}</p>
                            <p className="text-xs text-slate-400">/{org.slug}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {org.industry ? (
                          <Badge variant="secondary" className="text-xs font-medium">{org.industry}</Badge>
                        ) : (
                          <span className="text-xs text-slate-300">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="text-sm font-medium text-slate-700">{org.memberCount}</span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="text-sm font-medium text-slate-700">{org.employeeCount}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-slate-500">{formatDate(org.createdAt)}</span>
                      </TableCell>
                      <TableCell className="pr-6">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50" asChild>
                            <Link href={`/super-admin/organizations/${org.id}`}>
                              <Eye className="h-3.5 w-3.5" />
                            </Link>
                          </Button>
                          <Button
                            variant="ghost" size="sm"
                            className="h-7 w-7 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                            onClick={() => setDeleteTarget(org)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create organization dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-rose-500" />
              Create New Organization
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-2">
                <Label htmlFor="org-name">Organization Name <span className="text-rose-500">*</span></Label>
                <Input id="org-name" placeholder="Acme Corp" value={form.name} onChange={(e) => handleFormChange("name", e.target.value)} autoFocus />
              </div>
              <div className="space-y-2">
                <Label htmlFor="org-slug">Workspace URL</Label>
                <div className="flex items-center">
                  <span className="text-xs text-slate-400 mr-1">/</span>
                  <Input id="org-slug" placeholder="acme-corp" value={form.slug} onChange={(e) => handleFormChange("slug", e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="org-industry">Industry</Label>
                <Input id="org-industry" placeholder="Technology" value={form.industry} onChange={(e) => handleFormChange("industry", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="org-primary">Primary Color</Label>
                <div className="flex items-center gap-2">
                  <input type="color" id="org-primary" value={form.primaryColor} onChange={(e) => handleFormChange("primaryColor", e.target.value)} className="h-9 w-14 rounded border border-input cursor-pointer" />
                  <Input value={form.primaryColor} onChange={(e) => handleFormChange("primaryColor", e.target.value)} className="font-mono text-xs" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="org-accent">Accent Color</Label>
                <div className="flex items-center gap-2">
                  <input type="color" id="org-accent" value={form.accentColor} onChange={(e) => handleFormChange("accentColor", e.target.value)} className="h-9 w-14 rounded border border-input cursor-pointer" />
                  <Input value={form.accentColor} onChange={(e) => handleFormChange("accentColor", e.target.value)} className="font-mono text-xs" />
                </div>
              </div>
              <div className="col-span-2 space-y-2">
                <Label htmlFor="owner-email">Admin Email <span className="text-rose-500">*</span></Label>
                <Input id="owner-email" type="email" placeholder="admin@company.com" value={form.ownerEmail} onChange={(e) => handleFormChange("ownerEmail", e.target.value)} />
                <p className="text-xs text-slate-400 flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  An invite link will be generated. Share it with the org admin so they can sign in and claim their workspace.
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending || !form.name.trim() || !form.ownerEmail.trim()}>
              {createMutation.isPending ? "Creating…" : "Create & Generate Invite"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invite link dialog — shown after org creation */}
      <Dialog open={!!inviteResult} onOpenChange={(open) => { if (!open) setInviteResult(null); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Link2 className="h-5 w-5 text-indigo-500" />
              Organization Created — Share Invite Link
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {inviteResult?.emailSent ? (
              <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-4 text-sm text-emerald-800 flex items-start gap-3">
                <CheckCheck className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold mb-0.5">Email sent to {inviteResult.email}!</p>
                  <p className="text-emerald-700 text-xs">
                    They'll receive a link to join <strong>{inviteResult.orgName}</strong> as owner. You can also share the link below directly.
                  </p>
                </div>
              </div>
            ) : (
              <div className="rounded-xl bg-amber-50 border border-amber-100 p-4 text-sm text-amber-800 flex items-start gap-3">
                <Mail className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold mb-0.5">Email could not be sent automatically</p>
                  <p className="text-amber-700 text-xs">
                    Copy the invite link below and share it with <strong>{inviteResult?.email}</strong> manually.
                  </p>
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label>Invite Link (valid for 7 days)</Label>
              <div className="flex items-center gap-2">
                <Input
                  readOnly
                  value={inviteResult?.inviteUrl ?? ""}
                  className="font-mono text-xs bg-slate-50 select-all"
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                />
                <Button
                  size="icon"
                  variant="outline"
                  onClick={handleCopy}
                  className={cn("shrink-0 transition-colors", copied && "border-emerald-300 text-emerald-600 bg-emerald-50")}
                >
                  {copied ? <CheckCheck className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-slate-400">Click the link field to select all, or use the copy button.</p>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleCopy} className="w-full" variant={copied ? "outline" : "default"}>
              {copied ? <><CheckCheck className="mr-2 h-4 w-4" />Copied!</> : <><Copy className="mr-2 h-4 w-4" />Copy Invite Link</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{deleteTarget?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the organization, all its employees ({deleteTarget?.employeeCount}),
              departments, branches, and member records. This action cannot be undone.
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
