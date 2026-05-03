import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Building2, ShieldCheck, Users, ArrowRight, Sparkles, BarChart3, Globe } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-[100dvh] flex flex-col bg-[#f4f5fb] text-slate-900">

      {/* ── Header ─────────────────────────────────────── */}
      <header className="px-6 py-4 flex items-center justify-between bg-white/80 backdrop-blur-sm border-b border-slate-100 sticky top-0 z-20">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-md">
            <span className="text-white font-black text-sm">T</span>
          </div>
          <span className="font-bold text-lg tracking-tight text-slate-800">Talanta</span>
          <span className="text-xs font-semibold bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full ml-1 hidden sm:inline-block">
            Cloud EMS
          </span>
        </div>
        <Link
          href="/sign-in"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold px-4 py-2 hover:bg-indigo-700 transition-colors shadow-sm"
          data-testid="link-sign-in"
        >
          Sign In
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </header>

      {/* ── Hero ───────────────────────────────────────── */}
      <main className="flex-1 flex flex-col">
        <section className="flex flex-col items-center justify-center text-center px-4 sm:px-6 lg:px-8 pt-20 pb-16 relative overflow-hidden">

          {/* Background glow */}
          <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/4 w-[700px] h-[400px] bg-indigo-400/10 rounded-full blur-3xl" />
          <div className="pointer-events-none absolute top-20 right-1/4 w-48 h-48 bg-violet-400/8 rounded-full blur-2xl" />

          <div className="relative max-w-3xl space-y-6">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.1]">
              Enterprise Grade
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-500">
                Employee Management
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed">
              The polished command center for company directors. Manage your entire
              workforce across all branches with purposeful data density and absolute control.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
              <Link
                href="/sign-in"
                className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-6 py-3 rounded-xl transition-colors shadow-lg shadow-indigo-200 w-full sm:w-auto"
                data-testid="link-get-started"
              >
                Access Dashboard
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <p className="text-xs text-slate-400 pt-2">
              Secured with enterprise-grade authentication · Role-based access
            </p>
          </div>
        </section>

        {/* ── Stats strip ────────────────────────────────── */}
        <section className="bg-white border-y border-slate-100 py-8 px-6">
          <div className="max-w-4xl mx-auto grid grid-cols-3 gap-8 text-center">
            {[
              { value: "Multi-branch", label: "Office coverage" },
              { value: "Real-time", label: "Workforce analytics" },
              { value: "AI-powered", label: "Employee insights" },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="text-lg sm:text-2xl font-bold text-indigo-600">{stat.value}</p>
                <p className="text-xs sm:text-sm text-slate-400 mt-0.5 font-medium">{stat.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Feature cards ──────────────────────────────── */}
        <section className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-800">
                Everything you need to manage your workforce
              </h2>
              <p className="text-slate-500 mt-3 text-sm sm:text-base max-w-xl mx-auto">
                Built specifically for leadership oversight with a focus on clarity and speed.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[
                {
                  icon: Users,
                  color: "bg-indigo-100 text-indigo-600",
                  title: "Complete Directory",
                  description:
                    "Comprehensive employee profiles with qualifications, photo support, and real-time status tracking.",
                },
                {
                  icon: Globe,
                  color: "bg-violet-100 text-violet-600",
                  title: "Multi-Branch",
                  description:
                    "Seamlessly manage departments and office locations across the entire organization from one place.",
                },
                {
                  icon: BarChart3,
                  color: "bg-emerald-100 text-emerald-600",
                  title: "Analytics Dashboard",
                  description:
                    "Track headcount, department distribution, and branch activity with clear executive-friendly charts.",
                },
                {
                  icon: Building2,
                  color: "bg-amber-100 text-amber-600",
                  title: "Department Control",
                  description:
                    "Create and organize departments with flexible management tools for growing teams.",
                },
                {
                  icon: ShieldCheck,
                  color: "bg-rose-100 text-rose-600",
                  title: "Secure Access",
                  description:
                    "Role-based access keeps your workforce data protected and organized by organization.",
                },
                {
                  icon: Sparkles,
                  color: "bg-sky-100 text-sky-600",
                  title: "Brand-ready",
                  description:
                    "Customize your organization with logo and color branding for a polished experience.",
                },
              ].map((feature) => (
                <div
                  key={feature.title}
                  className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className={`h-11 w-11 rounded-xl flex items-center justify-center ${feature.color} mb-4`}>
                    <feature.icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-base font-semibold text-slate-800">{feature.title}</h3>
                  <p className="text-sm text-slate-500 mt-2 leading-relaxed">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
