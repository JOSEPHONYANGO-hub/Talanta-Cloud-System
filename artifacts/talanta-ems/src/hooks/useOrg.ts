import { useContext } from "react";
import { useAuth } from "@clerk/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { OrgContext, type Organization } from "@/context/orgContext";

export type { Organization };

export interface CreateOrgInput {
  name: string;
  slug?: string;
  logoUrl?: string;
  primaryColor?: string;
  accentColor?: string;
  industry?: string;
}

export function useOrg() {
  return useContext(OrgContext);
}

export function useGetMyOrg() {
  const { getToken, isSignedIn } = useAuth();
  return useQuery<Organization | null>({
    queryKey: ["organization", "me"],
    queryFn: async () => {
      const token = await getToken();
      const res = await fetch("/api/organizations/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to load organization");
      return res.json();
    },
    enabled: !!isSignedIn,
    staleTime: 60_000,
    retry: false,
  });
}

export function useCreateOrg() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  return useMutation<Organization, Error, CreateOrgInput>({
    mutationFn: async (data) => {
      const token = await getToken();
      const res = await fetch("/api/organizations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to create organization");
      return json;
    },
    onSuccess: (newOrg) => {
      queryClient.setQueryData(["organization", "me"], newOrg);
      queryClient.invalidateQueries({ queryKey: ["organization"] });
    },
  });
}

export function useUpdateOrg() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  return useMutation<Organization, Error, Partial<CreateOrgInput>>({
    mutationFn: async (data) => {
      const token = await getToken();
      const res = await fetch("/api/organizations/me", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to update organization");
      return json;
    },
    onSuccess: (updatedOrg) => {
      queryClient.setQueryData(["organization", "me"], updatedOrg);
      queryClient.invalidateQueries({ queryKey: ["organization"] });
    },
  });
}
