import { useAuth } from "@clerk/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface OrgMember {
  id: number;
  orgId: number;
  userId: string;
  role: "owner" | "admin" | "member";
  joinedAt: string;
  email: string | null;
  fullName: string | null;
  imageUrl: string | null;
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

export function useOrgMembers() {
  const { getToken } = useAuth();
  return useQuery<OrgMember[]>({
    queryKey: ["members"],
    queryFn: () => authFetch("/api/members", getToken),
    staleTime: 30_000,
  });
}

export function useAddMember() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  return useMutation<OrgMember, Error, { email: string; role: "admin" | "member" }>({
    mutationFn: (data) =>
      authFetch("/api/members", getToken, { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["members"] }),
  });
}

export function useUpdateMemberRole() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  return useMutation<OrgMember, Error, { userId: string; role: "admin" | "member" }>({
    mutationFn: ({ userId, role }) =>
      authFetch(`/api/members/${userId}`, getToken, {
        method: "PATCH",
        body: JSON.stringify({ role }),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["members"] }),
  });
}

export function useRemoveMember() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  return useMutation<{ success: boolean }, Error, string>({
    mutationFn: (userId) =>
      authFetch(`/api/members/${userId}`, getToken, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["members"] }),
  });
}
