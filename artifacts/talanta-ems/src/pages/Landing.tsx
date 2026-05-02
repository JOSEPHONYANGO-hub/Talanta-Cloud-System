import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Building2, ShieldCheck, Users } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-[100dvh] flex flex-col bg-slate-50 text-slate-900">
      <header className="px-6 py-4 flex items-center justify-between bg-white border-b">
        <div className="flex items-center gap-2">
          <img src={`${import.meta.env.BASE_URL}logo.svg`} alt="Talanta" className="h-8" />
          <span className="font-bold text-xl text-primary tracking-tight">Talanta</span>
        </div>
        <Link href="/sign-in" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2" data-testid="link-sign-in">
          Sign In
        </Link>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-3xl space-y-8">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900">
            Enterprise Grade <br/>
            <span className="text-primary">Employee Management</span>
          </h1>
          
          <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto">
            The polished command center for company directors at Talanta-Cloud Solutions. 
            Manage your entire workforce across all branches with purposeful data density and absolute control.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
            <Link href="/sign-in" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-11 rounded-md px-8 w-full sm:w-auto" data-testid="link-get-started">
              Access Dashboard
            </Link>
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-8 max-w-4xl mx-auto mt-24 text-left">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <Users className="h-10 w-10 text-primary mb-4" />
            <h3 className="font-bold text-lg mb-2">Complete Directory</h3>
            <p className="text-slate-600 text-sm">Comprehensive profiles with AI-generated summaries and status tracking.</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <Building2 className="h-10 w-10 text-primary mb-4" />
            <h3 className="font-bold text-lg mb-2">Multi-Branch</h3>
            <p className="text-slate-600 text-sm">Seamlessly manage departments and locations across the entire organization.</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <ShieldCheck className="h-10 w-10 text-primary mb-4" />
            <h3 className="font-bold text-lg mb-2">Director Level</h3>
            <p className="text-slate-600 text-sm">Authoritative, dense data views built specifically for leadership oversight.</p>
          </div>
        </div>
      </main>
    </div>
  );
}