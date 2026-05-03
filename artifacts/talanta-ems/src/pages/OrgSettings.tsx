import { useState, useEffect } from "react";
import { useUpdateOrg, useOrg } from "@/hooks/useOrg";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Check, Building2, Palette, Save, Shield } from "lucide-react";

const PRIMARY_PRESETS = [
  { label: "Indigo", value: "#6366f1" },
  { label: "Blue", value: "#3b82f6" },
  { label: "Violet", value: "#7c3aed" },
  { label: "Rose", value: "#e11d48" },
  { label: "Teal", value: "#0d9488" },
  { label: "Orange", value: "#ea580c" },
  { label: "Green", value: "#16a34a" },
  { label: "Slate", value: "#334155" },
];

const ACCENT_PRESETS = [
  { label: "Emerald", value: "#10b981" },
  { label: "Cyan", value: "#0891b2" },
  { label: "Violet", value: "#7c3aed" },
  { label: "Amber", value: "#d97706" },
  { label: "Rose", value: "#f43f5e" },
  { label: "Indigo", value: "#6366f1" },
];

const INDUSTRIES = [
  "Technology", "Finance & Banking", "Healthcare", "Education",
  "Manufacturing", "Retail & Commerce", "Real Estate", "Media & Entertainment",
  "Logistics & Transport", "Non-profit", "Government", "Other",
];

function ColorSwatch({ color, selected, onClick }: { color: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "h-8 w-8 rounded-full border-2 flex items-center justify-center transition-all",
        selected ? "border-white ring-2 ring-offset-1 scale-110 shadow-md" : "border-transparent hover:scale-105"
      )}
      style={{ backgroundColor: color } as React.CSSProperties}
      title={color}
    >
      {selected && <Check className="h-3.5 w-3.5 text-white drop-shadow" strokeWidth={3} />}
    </button>
  );
}

export default function OrgSettings() {
  const { org, isOrgLoading } = useOrg();
  const { mutateAsync: updateOrg, isPending } = useUpdateOrg();

  const [name, setName] = useState("");
  const [industry, setIndustry] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [primaryColor, setPrimary] = useState("#6366f1");
  const [accentColor, setAccent] = useState("#10b981");

  useEffect(() => {
    if (org) {
      setName(org.name);
      setIndustry(org.industry ?? "");
      setLogoUrl(org.logoUrl ?? "");
      setPrimary(org.primaryColor);
      setAccent(org.accentColor);
    }
  }, [org]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { toast.error("Organization name is required"); return; }
    try {
      await updateOrg({
        name: name.trim(),
        industry: industry || undefined,
        logoUrl: logoUrl.trim() || undefined,
        primaryColor,
        accentColor,
      });
      toast.success("Settings saved successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to save settings");
    }
  }

  if (isOrgLoading) {
    return (
      <div className="space-y-6 max-w-2xl">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Organization Settings</h1>
        <p className="text-slate-500 text-sm mt-1">
          Manage your organization's profile and brand identity.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        {/* Profile */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-2">
            <Building2 className="h-4 w-4 text-slate-400" />
            Organization Profile
          </h2>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-slate-700">Organization Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your company name"
              className="h-10"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-slate-700">Industry</Label>
            <select
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              className="w-full h-10 rounded-lg border border-input bg-white px-3 text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="">Select your industry</option>
              {INDUSTRIES.map((i) => (
                <option key={i} value={i}>{i}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-slate-700">Logo URL</Label>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg border border-slate-200 shrink-0 flex items-center justify-center overflow-hidden bg-slate-50">
                {logoUrl ? (
                  <img src={logoUrl} alt="logo" className="h-full w-full object-contain" />
                ) : (
                  <span className="text-slate-300 text-lg font-bold">
                    {name?.[0]?.toUpperCase() || "?"}
                  </span>
                )}
              </div>
              <Input
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://your-company.com/logo.png"
                className="h-10 flex-1"
              />
            </div>
          </div>

          <div className="pt-1 px-3 py-2 rounded-lg bg-slate-50 border border-slate-100 flex items-center gap-2">
            <Shield className="h-4 w-4 text-slate-400 shrink-0" />
            <div>
              <p className="text-xs font-medium text-slate-600">Workspace URL</p>
              <p className="text-xs text-slate-400">talanta.app/<span className="font-mono font-medium">{org?.slug}</span></p>
            </div>
          </div>
        </div>

        {/* Branding */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-2">
            <Palette className="h-4 w-4 text-slate-400" />
            Brand Identity
          </h2>
          <p className="text-xs text-slate-400 -mt-2">
            Changes apply instantly across the entire interface.
          </p>

          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Primary Color</p>
              <div className="flex flex-wrap gap-2 items-center">
                {PRIMARY_PRESETS.map((c) => (
                  <ColorSwatch key={c.value} color={c.value} selected={primaryColor === c.value} onClick={() => setPrimary(c.value)} />
                ))}
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimary(e.target.value)}
                  className="h-8 w-8 rounded-full border-0 cursor-pointer bg-transparent"
                  title="Custom primary"
                />
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Accent Color</p>
              <div className="flex flex-wrap gap-2 items-center">
                {ACCENT_PRESETS.map((c) => (
                  <ColorSwatch key={c.value} color={c.value} selected={accentColor === c.value} onClick={() => setAccent(c.value)} />
                ))}
                <input
                  type="color"
                  value={accentColor}
                  onChange={(e) => setAccent(e.target.value)}
                  className="h-8 w-8 rounded-full border-0 cursor-pointer bg-transparent"
                  title="Custom accent"
                />
              </div>
            </div>
          </div>

          {/* Live preview */}
          <div className="pt-4 border-t border-slate-50">
            <p className="text-xs text-slate-400 mb-3">Live Preview</p>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div
                className="w-32 rounded-lg p-3 shrink-0"
                style={{ backgroundColor: primaryColor + "15", borderLeft: `3px solid ${primaryColor}` }}
              >
                <div className="h-2 w-14 rounded mb-2" style={{ backgroundColor: primaryColor + "70" }} />
                <div className="h-1.5 w-10 rounded mb-1.5" style={{ backgroundColor: primaryColor + "45" }} />
                <div className="h-1.5 w-8 rounded" style={{ backgroundColor: primaryColor + "30" }} />
              </div>
              <div className="flex-1 space-y-2">
                <div className="h-2 w-24 rounded" style={{ backgroundColor: primaryColor + "90" }} />
                <div className="h-2 w-16 rounded" style={{ backgroundColor: "rgb(148,163,184)" }} />
                <div className="flex gap-2 mt-1">
                  <div
                    className="h-7 px-3 rounded-md text-white text-xs flex items-center font-semibold"
                    style={{ backgroundColor: primaryColor }}
                  >
                    Primary
                  </div>
                  <div
                    className="h-7 px-3 rounded-md text-white text-xs flex items-center font-semibold"
                    style={{ backgroundColor: accentColor }}
                  >
                    Accent
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Button
          type="submit"
          className="w-full h-11 font-semibold"
          disabled={isPending || !name.trim()}
        >
          <Save className="mr-2 h-4 w-4" />
          {isPending ? "Saving…" : "Save Changes"}
        </Button>
      </form>
    </div>
  );
}
