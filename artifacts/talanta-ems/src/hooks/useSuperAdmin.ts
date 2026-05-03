import { useAuth } from "@clerk/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface SuperAdminStats {
  totalOrganizations: number;
  totalMembers: number;
  totalEmployees: number;
  totalDepartments: number;
}

export interface OrgWithStats {
  id: number;
  name: string;
  slug: string;
  logoUrl: string | null;
  primaryColor: string;
  accentColor: string;
  industry: string | null;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  memberCount: number;
  employeeCount: number;
}

export interface OrgDetailAdmin extends OrgWithStats {
  members: {
    id: number;
    userId: string;
    role: string;
    joinedAt: string;
    email: string | null;
    fullName: string | null;
    imageUrl: string | null;
  }[];
  departmentCount: number;
  branchCount: number;
  recentEmployees: {
    id: number;
    fullName: string;
    jobTitle: string | null;
    status: string;
    createdAt: string;
  }[];
}

export interface CreateOrgAdminInput {
  name: string;
  slug?: string;
  industry?: string;
  primaryColor?: string;
  accentColor?: string;
  logoUrl?: string;
  ownerEmail: string;
}

async function authFetch(url: string, getToken: () => Promise<string | null>, options?: RequestInit) {
  const token = await getToken();
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json.error ?? "Request failed");
  }
  return res.json();
}

export function useCheckSuperAdmin() {
  const { getToken, isSignedIn } = useAuth();
  return useQuery<{ isSuperAdmin: boolean; userId: string }>({
    queryKey: ["super-admin", "check"],
    queryFn: () => authFetch("/api/super-admin/check", getToken),
    enabled: !!isSignedIn,
    staleTime: 5 * 60_000,
    retry: false,
  });
}

export function useSuperAdminStats() {
  const { getToken } = useAuth();
  return useQuery<SuperAdminStats>({
    queryKey: ["super-admin", "stats"],
    queryFn: () => authFetch("/api/super-admin/stats", getToken),
    staleTime: 30_000,
  });
}

export function useSuperAdminOrgs() {
  const { getToken } = useAuth();
  return useQuery<OrgWithStats[]>({
    queryKey: ["super-admin", "organizations"],
    queryFn: () => authFetch("/api/super-admin/organizations", getToken),
    staleTime: 30_000,
  });
}

export function useSuperAdminOrgDetail(id: number | null) {
  const { getToken } = useAuth();
  return useQuery<OrgDetailAdmin>({
    queryKey: ["super-admin", "organizations", id],
    queryFn: () => authFetch(`/api/super-admin/organizations/${id}`, getToken),
    enabled: id !== null,
    staleTime: 30_000,
  });
}

export function useDeleteOrgAdmin() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  return useMutation<{ success: boolean; deleted: { id: number; name: string } }, Error, number>({
    mutationFn: (orgId) =>
      authFetch(`/api/super-admin/organizations/${orgId}`, getToken, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["super-admin"] });
    },
  });
}

export function useCreateOrgAdmin() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  return useMutation<OrgWithStats & { ownerEmail: string | null; ownerName: string | null }, Error, CreateOrgAdminInput>({
    mutationFn: (data) =>
      authFetch("/api/super-admin/organizations", getToken, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["super-admin"] });
    },
  });
}
