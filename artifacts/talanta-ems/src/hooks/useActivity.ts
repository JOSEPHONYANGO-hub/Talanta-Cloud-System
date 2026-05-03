import { useAuth } from "@clerk/react";
import { useQuery } from "@tanstack/react-query";

export interface ActivityLogItem {
  id: number;
  orgId: number;
  actorUserId: string;
  action: string;
  entityType: string;
  entityId: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  actor: {
    userId: string;
    fullName: string | null;
    email: string | null;
    imageUrl: string | null;
  };
}

async function authFetch(url: string, getToken: () => Promise<string | null>) {
  const token = await getToken();
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "Request failed");
  return res.json();
}

export function useActivity(limit = 10) {
  const { getToken } = useAuth();
  return useQuery<ActivityLogItem[]>({
    queryKey: ["activity", limit],
    queryFn: () => authFetch(`/api/activity?limit=${limit}`, getToken),
    staleTime: 30_000,
  });
}
