import { useEffect } from "react";
import { useUser } from "@clerk/react";
import { useGetMyOrg } from "@/hooks/useOrg";
import { OrgContext } from "./orgContext";

function hexToHsl(hex: string): string {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!m) return "243 75% 59%";
  const r = parseInt(m[1], 16) / 255;
  const g = parseInt(m[2], 16) / 255;
  const b = parseInt(m[3], 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0, s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

function hexToHslDark(hex: string): string {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!m) return "244 55% 14%";
  const r = parseInt(m[1], 16) / 255;
  const g = parseInt(m[2], 16) / 255;
  const b = parseInt(m[3], 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const baseL = (max + min) / 2;
  let h = 0, s = 0;
  if (max !== min) {
    const d = max - min;
    s = baseL > 0.5 ? d / (2 - max - min) : d / (max + min);
    s = Math.min(1, s * 1.1);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  const darkL = Math.max(0.10, Math.min(0.18, baseL * 0.30));
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(darkL * 100)}%`;
}

export function OrgProvider({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoaded: isUserLoaded } = useUser();
  const { data: orgData, isLoading, refetch } = useGetMyOrg();

  useEffect(() => {
    const root = document.documentElement;
    if (orgData) {
      root.style.setProperty("--primary", hexToHsl(orgData.primaryColor));
      root.style.setProperty("--ring", hexToHsl(orgData.primaryColor));
      root.style.setProperty("--sidebar", hexToHslDark(orgData.primaryColor));
      root.style.setProperty("--chart-1", hexToHsl(orgData.primaryColor));
      root.style.setProperty("--chart-3", hexToHsl(orgData.accentColor));
    } else if (isUserLoaded && !isLoading) {
      ["--primary", "--ring", "--sidebar", "--chart-1", "--chart-3"].forEach((p) =>
        root.style.removeProperty(p),
      );
    }
  }, [orgData, isUserLoaded, isLoading]);

  const isOrgLoading = !!(isUserLoaded && isSignedIn && isLoading);
  const needsSetup = !!(isUserLoaded && isSignedIn && !isLoading && orgData === null);

  return (
    <OrgContext.Provider
      value={{ org: orgData ?? null, isOrgLoading, needsSetup, refetch }}
    >
      {children}
    </OrgContext.Provider>
  );
}
