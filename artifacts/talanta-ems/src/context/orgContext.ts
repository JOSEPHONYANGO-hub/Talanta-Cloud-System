import { createContext } from "react";

export interface Organization {
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
}

export interface OrgContextValue {
  org: Organization | null;
  isOrgLoading: boolean;
  needsSetup: boolean;
  refetch: () => void;
}

export const OrgContext = createContext<OrgContextValue>({
  org: null,
  isOrgLoading: false,
  needsSetup: false,
  refetch: () => {},
});
