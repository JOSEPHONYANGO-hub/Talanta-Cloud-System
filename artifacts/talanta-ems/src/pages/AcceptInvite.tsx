import { useEffect, useState } from "react";
import { useLocation, useSearch } from "wouter";
import { useAuth, SignIn } from "@clerk/react";
import { Building2, CheckCircle2, AlertCircle, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

interface InviteInfo {
  email: string;
  role: string;
  orgId: number;
  orgName: string;
  orgSlug: string;
  orgPrimaryColor: string;
  orgLogoUrl: string | null;
  expiresAt: string;
}

export default function AcceptInvite() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const token = params.get("token");
  const [, setLocation] = useLocation();
  const { isSignedIn, isLoaded, getToken } = useAuth();
  const { toast } = useToast();

  const [invite, setInvite] = useState<InviteInfo | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isFetching, setIsFetching] = useState(true);
  const [isAccepting, setIsAccepting] = useState(false);
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    if (!token) {
      setFetchError("No invitation token provided.");
      setIsFetching(false);
      return;
    }
    fetch(`/api/invitations/${token}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Invalid invitation");
        setInvite(data);
      })
      .catch((err) => setFetchError(err.message))
      .finally(() => setIsFetching(false));
  }, [token]);

  async function handleAccept() {
    if (!token) return;
    setIsAccepting(true);
    try {
      const authToken = await getToken();
      const res = await fetch(`/api/invitations/${token}/accept`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to accept invitation");
      setAccepted(true);
      toast({ title: `Welcome to ${invite?.orgName}!` });
      setTimeout(() => setLocation("/dashboard"), 1800);
    } catch (err: any) {
      toast({ title: "Failed to accept invitation", description: err.message, variant: "destructive" });
    } finally {
      setIsAccepting(false);
    }
  }

  if (isFetching) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f4f5fb]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
          <p className="text-sm text-slate-400">Loading invitation…</p>
        </div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f4f5fb] p-4">
        <Card className="w-full max-w-md shadow-lg border-0">
          <CardContent className="pt-8 pb-8 flex flex-col items-center gap-4 text-center">
            <div className="h-14 w-14 rounded-full bg-red-50 flex items-center justify-center">
              <AlertCircle className="h-7 w-7 text-red-500" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 mb-1">Invitation Invalid</h2>
              <p className="text-sm text-slate-500">{fetchError}</p>
            </div>
            <Button variant="outline" onClick={() => setLocation("/")}>Go to Home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (accepted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f4f5fb] p-4">
        <Card className="w-full max-w-md shadow-lg border-0">
          <CardContent className="pt-8 pb-8 flex flex-col items-center gap-4 text-center">
            <div className="h-14 w-14 rounded-full bg-emerald-50 flex items-center justify-center">
              <CheckCircle2 className="h-7 w-7 text-emerald-500" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 mb-1">Welcome aboard!</h2>
              <p className="text-sm text-slate-500">You've joined <span className="font-semibold">{invite?.orgName}</span>. Redirecting to your dashboard…</p>
            </div>
            <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f4f5fb]">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f4f5fb] p-4">
      <div className="w-full max-w-md space-y-4">
        <Card className="shadow-lg border-0">
          <CardContent className="pt-8 pb-8 flex flex-col items-center gap-5 text-center">
            <div
              className="h-16 w-16 rounded-2xl flex items-center justify-center text-white text-2xl font-black shadow-md"
              style={{ backgroundColor: invite?.orgPrimaryColor ?? "#6366f1" }}
            >
              {invite?.orgLogoUrl ? (
                <img src={invite.orgLogoUrl} alt={invite.orgName} className="h-16 w-16 rounded-2xl object-contain" />
              ) : (
                <Building2 className="h-8 w-8 text-white" />
              )}
            </div>
            <div>
              <p className="text-xs font-semibold text-indigo-500 uppercase tracking-widest mb-1">You're invited</p>
              <h2 className="text-2xl font-bold text-slate-900">{invite?.orgName}</h2>
              <p className="text-sm text-slate-500 mt-1">
                You've been invited as <span className="font-semibold capitalize">{invite?.role}</span> to join this organization on Talanta-Cloud EMS.
              </p>
            </div>

            {isSignedIn ? (
              <Button
                className="w-full"
                size="lg"
                onClick={handleAccept}
                disabled={isAccepting}
              >
                {isAccepting ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Joining…</>
                ) : (
                  <>Accept Invitation <ArrowRight className="ml-2 h-4 w-4" /></>
                )}
              </Button>
            ) : (
              <div className="w-full space-y-3">
                <p className="text-sm text-slate-500">Sign in or create an account to accept this invitation.</p>
                <SignIn
                  routing="hash"
                  signUpUrl={`/sign-up`}
                  forceRedirectUrl={`/accept-invite?token=${token}`}
                  appearance={{
                    elements: {
                      rootBox: "w-full",
                      cardBox: "w-full shadow-none border border-slate-200 rounded-xl",
                      card: "!shadow-none",
                      footer: "!shadow-none",
                    },
                  }}
                />
              </div>
            )}
          </CardContent>
        </Card>
        <p className="text-center text-xs text-slate-400">
          Invitation sent to <span className="font-medium">{invite?.email}</span> ·{" "}
          Expires {new Date(invite?.expiresAt ?? "").toLocaleDateString()}
        </p>
      </div>
    </div>
  );
}
