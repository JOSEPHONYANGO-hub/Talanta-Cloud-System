import { useState } from "react";
import { useLocation } from "wouter";
import { useCreateOrg } from "@/hooks/useOrg";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Check, Building2, Palette, ArrowRight } from "lucide-react";

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

function slugify(v: string) {
  return v.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 50);
}

function ColorSwatch({
  color,
  selected,
  onClick,
}: {
  color: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "h-8 w-8 rounded-full border-2 flex items-center justify-center transition-all",
        selected ? "border-white ring-2 ring-offset-1 scale-110 shadow-md" : "border-transparent hover:scale-105"
      )}
      style={{ backgroundColor: color, ringColor: color } as React.CSSProperties}
      title={color}
    >
      {selected && <Check className="h-3.5 w-3.5 text-white drop-shadow" strokeWidth={3} />}
    </button>
  );
}

export default function OrgSetup() {
  const [, setLocation] = useLocation();
  const { mutateAsync: createOrg, isPending } = useCreateOrg();

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [industry, setIndustry] = useState("");
  const [primaryColor, setPrimary] = useState("#6366f1");
  const [accentColor, setAccent] = useState("#10b981");
  const [logoUrl, setLogoUrl] = useState("");

  function handleName(v: string) {
    setName(v);
    if (!slugEdited) setSlug(slugify(v));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { toast.error("Please enter your organization name"); return; }
    if (!slug.trim()) { toast.error("Please enter a workspace URL"); return; }
    try {
      await createOrg({
        name: name.trim(),
        slug: slug.trim(),
        industry: industry || undefined,
        primaryColor,
        accentColor,
        logoUrl: logoUrl.trim() || undefined,
      });
      toast.success("Organization created! Welcome to your workspace.");
      setLocation("/dashboard");
    } catch (err: any) {
      toast.error(err.message || "Failed to create organization");
    }
  }

  const miniSidebarBg = primaryColor;

  return (
    <div className="min-h-screen bg-[#f4f5fb] flex flex-col">
      {/* Top bar */}
      <header className="bg-white border-b px-6 py-4 flex items-center gap-3">
        <div
          className="h-8 w-8 rounded-lg flex items-center justify-center shadow-md shrink-0"
          style={{ background: `linear-gradient(135deg, ${primaryColor}cc, ${primaryColor})` }}
        >
          <span className="text-white font-black text-sm">
            {name?.[0]?.toUpperCase() || "T"}
          </span>
        </div>
        <span className="font-bold text-slate-800">Talanta EMS</span>
      </header>

      <div className="flex-1 flex items-start justify-center py-10 px-4">
        <div className="w-full max-w-2xl">
          {/* Hero text */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-100 text-indigo-600 text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
              <Building2 className="h-3.5 w-3.5" />
              Step 1 of 1 — Create your workspace
            </div>
            <h1 className="text-3xl font-bold text-slate-900">Set up your organization</h1>
            <p className="text-slate-500 mt-2 text-sm">
              This only takes a minute. You can change everything later.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Profile section */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
              <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                <Building2 className="h-4 w-4 text-slate-400" />
                Organization Profile
              </h2>

              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-sm font-medium text-slate-700">
                  Company Name <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="e.g. Acme Corp, Sunrise Health"
                  value={name}
                  onChange={(e) => handleName(e.target.value)}
                  className="h-10"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="slug" className="text-sm font-medium text-slate-700">
                  Workspace URL <span className="text-rose-500">*</span>
                </Label>
                <div className="flex items-center rounded-lg border border-input bg-white overflow-hidden focus-within:ring-1 focus-within:ring-ring">
                  <span className="px-3 text-sm text-slate-400 bg-slate-50 border-r h-10 flex items-center select-none shrink-0">
                    talanta.app/
                  </span>
                  <input
                    id="slug"
                    value={slug}
                    onChange={(e) => { setSlug(slugify(e.target.value)); setSlugEdited(true); }}
                    placeholder="your-company"
                    className="flex-1 px-3 py-2 text-sm bg-transparent outline-none h-10"
                    required
                  />
                </div>
                <p className="text-xs text-slate-400">Lowercase letters, numbers, and hyphens only</p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="industry" className="text-sm font-medium text-slate-700">
                  Industry <span className="text-slate-400 font-normal">(optional)</span>
                </Label>
                <select
                  id="industry"
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
                <Label htmlFor="logoUrl" className="text-sm font-medium text-slate-700">
                  Logo URL <span className="text-slate-400 font-normal">(optional)</span>
                </Label>
                <div className="flex items-center gap-3">
                  <div
                    className="h-10 w-10 rounded-lg border border-slate-200 shrink-0 flex items-center justify-center overflow-hidden bg-slate-50"
                  >
                    {logoUrl ? (
                      <img src={logoUrl} alt="logo" className="h-full w-full object-contain" onError={() => {}} />
                    ) : (
                      <span className="text-slate-300 text-xl font-bold">
                        {name?.[0]?.toUpperCase() || "?"}
                      </span>
                    )}
                  </div>
                  <Input
                    id="logoUrl"
                    placeholder="https://your-company.com/logo.png"
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    className="h-10 flex-1"
                  />
                </div>
              </div>
            </div>

            {/* Branding section */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
              <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                <Palette className="h-4 w-4 text-slate-400" />
                Brand Colors
              </h2>

              <div className="flex gap-6 flex-col sm:flex-row">
                <div className="flex-1 space-y-3">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Primary Color</p>
                  <div className="flex flex-wrap gap-2">
                    {PRIMARY_PRESETS.map((c) => (
                      <ColorSwatch
                        key={c.value}
                        color={c.value}
                        selected={primaryColor === c.value}
                        onClick={() => setPrimary(c.value)}
                      />
                    ))}
                    <div className="flex items-center gap-1.5 ml-1">
                      <input
                        type="color"
                        value={primaryColor}
                        onChange={(e) => setPrimary(e.target.value)}
                        className="h-8 w-8 rounded-full border-0 cursor-pointer bg-transparent"
                        title="Custom color"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex-1 space-y-3">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Accent Color</p>
                  <div className="flex flex-wrap gap-2">
                    {ACCENT_PRESETS.map((c) => (
                      <ColorSwatch
                        key={c.value}
                        color={c.value}
                        selected={accentColor === c.value}
                        onClick={() => setAccent(c.value)}
                      />
                    ))}
                    <div className="flex items-center gap-1.5 ml-1">
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
              </div>

              {/* Mini preview */}
              <div className="mt-4 pt-4 border-t border-slate-50">
                <p className="text-xs text-slate-400 mb-3">Preview</p>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div
                    className="w-28 rounded-lg p-2.5 shrink-0"
                    style={{ backgroundColor: miniSidebarBg + "20", borderLeft: `3px solid ${miniSidebarBg}` }}
                  >
                    <div className="h-2 w-12 rounded mb-1.5" style={{ backgroundColor: miniSidebarBg + "60" }} />
                    <div className="h-1.5 w-10 rounded mb-1" style={{ backgroundColor: miniSidebarBg + "40" }} />
                    <div className="h-1.5 w-8 rounded" style={{ backgroundColor: miniSidebarBg + "30" }} />
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="h-2 w-20 rounded" style={{ backgroundColor: primaryColor + "80" }} />
                    <div className="flex gap-2">
                      <div className="h-6 w-14 rounded-md text-white text-xs flex items-center justify-center font-medium" style={{ backgroundColor: primaryColor }}>
                        Button
                      </div>
                      <div className="h-6 w-14 rounded-md text-white text-xs flex items-center justify-center font-medium" style={{ backgroundColor: accentColor }}>
                        Accent
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-11 text-sm font-semibold"
              style={{ backgroundColor: primaryColor }}
              disabled={isPending || !name.trim() || !slug.trim()}
            >
              {isPending ? "Creating your workspace…" : (
                <>
                  Create Organization
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
