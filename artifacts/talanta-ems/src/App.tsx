import { useEffect, useRef } from "react";
import { ClerkProvider, SignIn, SignUp, Show, useClerk } from "@clerk/react";
import { publishableKeyFromHost } from "@clerk/react/internal";
import { shadcn } from "@clerk/themes";
import { Switch, Route, useLocation, Router as WouterRouter, Redirect } from "wouter";
import { QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";

import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import NotFound from "@/pages/not-found";
import Landing from "@/pages/Landing";
import Dashboard from "@/pages/Dashboard";
import Departments from "@/pages/Departments";
import Branches from "@/pages/Branches";
import Employees from "@/pages/Employees";
import EmployeeProfile from "@/pages/EmployeeProfile";
import EmployeeForm from "@/pages/EmployeeForm";
import OrgSetup from "@/pages/OrgSetup";
import OrgSettings from "@/pages/OrgSettings";

import Layout from "@/components/layout/Layout";
import { OrgProvider } from "@/context/OrgContext";
import { useOrg } from "@/hooks/useOrg";

const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

if (!clerkPubKey) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY in .env file");
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: "hsl(243, 75%, 59%)",
    colorForeground: "hsl(240, 30%, 10%)",
    colorMutedForeground: "hsl(228, 15%, 50%)",
    colorDanger: "hsl(0, 84.2%, 60.2%)",
    colorBackground: "hsl(0, 0%, 100%)",
    colorInput: "hsl(0, 0%, 100%)",
    colorInputForeground: "hsl(240, 30%, 10%)",
    colorNeutral: "hsl(228, 28%, 89%)",
    fontFamily: "Inter, sans-serif",
    borderRadius: "0.5rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "bg-white rounded-2xl w-[440px] max-w-full overflow-hidden shadow-lg",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "text-2xl font-bold tracking-tight",
    headerSubtitle: "text-muted-foreground",
    socialButtonsBlockButtonText: "text-foreground font-medium",
    formFieldLabel: "text-sm font-medium",
    footerActionLink: "text-primary font-semibold hover:underline",
    footerActionText: "text-muted-foreground",
    dividerText: "text-muted-foreground text-xs",
    identityPreviewEditButton: "text-primary hover:bg-muted",
    formFieldSuccessText: "text-green-600",
    alertText: "text-sm",
    logoBox: "mb-6 flex justify-center",
    logoImage: "h-12 w-auto",
    socialButtonsBlockButton: "border border-input bg-background hover:bg-muted",
    formButtonPrimary: "bg-primary text-primary-foreground hover:opacity-90",
    formFieldInput: "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
    footerAction: "mt-4 flex flex-col items-center gap-2",
    dividerLine: "bg-border",
    alert: "border border-destructive/50 bg-destructive/10 text-destructive",
    otpCodeFieldInput: "border-input bg-background text-foreground text-lg",
    formFieldRow: "space-y-4",
    main: "flex flex-col gap-4",
  },
};

function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f4f5fb]">
      <div className="flex flex-col items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 animate-pulse" />
        <p className="text-sm text-slate-400 animate-pulse">Loading your workspace…</p>
      </div>
    </div>
  );
}

function SignInPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-[#f4f5fb] px-4">
      <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} />
    </div>
  );
}

function SignUpPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-[#f4f5fb] px-4">
      <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} />
    </div>
  );
}

function HomeRedirect() {
  return (
    <>
      <Show when="signed-in">
        <Redirect to="/dashboard" />
      </Show>
      <Show when="signed-out">
        <Landing />
      </Show>
    </>
  );
}

function OrgSetupGuard() {
  const { org, isOrgLoading } = useOrg();
  if (isOrgLoading) return <LoadingScreen />;
  if (org) return <Redirect to="/dashboard" />;
  return <OrgSetup />;
}

function ProtectedRoute({ component: Component, ...rest }: any) {
  const { org, isOrgLoading, needsSetup } = useOrg();
  return (
    <Route {...rest}>
      <Show when="signed-in">
        {isOrgLoading ? (
          <LoadingScreen />
        ) : needsSetup ? (
          <Redirect to="/org-setup" />
        ) : (
          <Layout>
            <Component />
          </Layout>
        )}
      </Show>
      <Show when="signed-out">
        <Redirect to="/" />
      </Show>
    </Route>
  );
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const queryClient = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (
        prevUserIdRef.current !== undefined &&
        prevUserIdRef.current !== userId
      ) {
        queryClient.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, queryClient]);

  return null;
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      localization={{
        signIn: {
          start: {
            title: "Welcome back",
            subtitle: "Sign in to your workspace",
          },
        },
        signUp: {
          start: {
            title: "Create your account",
            subtitle: "Get started with Talanta EMS",
          },
        },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <OrgProvider>
          <TooltipProvider>
            <Switch>
              <Route path="/" component={HomeRedirect} />
              <Route path="/sign-in/*?" component={SignInPage} />
              <Route path="/sign-up/*?" component={SignUpPage} />

              {/* Org setup — signed in but no org yet */}
              <Route path="/org-setup">
                <Show when="signed-in">
                  <OrgSetupGuard />
                </Show>
                <Show when="signed-out">
                  <Redirect to="/" />
                </Show>
              </Route>

              {/* Protected app routes */}
              <ProtectedRoute path="/dashboard" component={Dashboard} />
              <ProtectedRoute path="/employees" component={Employees} />
              <ProtectedRoute path="/employees/new" component={EmployeeForm} />
              <ProtectedRoute path="/employees/:id" component={EmployeeProfile} />
              <ProtectedRoute path="/employees/:id/edit" component={EmployeeForm} />
              <ProtectedRoute path="/departments" component={Departments} />
              <ProtectedRoute path="/branches" component={Branches} />
              <ProtectedRoute path="/settings" component={OrgSettings} />

              <Route component={NotFound} />
            </Switch>
            <Toaster />
          </TooltipProvider>
        </OrgProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <ClerkProviderWithRoutes />
    </WouterRouter>
  );
}

export default App;
