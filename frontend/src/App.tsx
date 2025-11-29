import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import { Suspense, lazy, useEffect, useRef, useState, type ReactNode, type ComponentType } from "react";
import { AnimatePresence } from "framer-motion";
import posthog from "posthog-js";
import PageTransition from "./components/PageTransition";
import Layout from "./components/Layout";
import Loading from "./components/Loading";
import ScrollToTop from "./components/ScrollToTop";
import CookieBanner from "./components/CookieBanner";
import Clarity from "@microsoft/clarity";
import { TrackingPreferences } from "./types/tracking";
import { ROUTES } from "./routes";

const lazyRetry = (componentImport: () => Promise<{ default: ComponentType<any> }>) => {
  return lazy(async () => {
    try {
      return await componentImport();
    } catch (error: any) {
      const isChunkError = error?.message?.includes('Failed to fetch dynamically imported module') ||
                           error?.message?.includes('Importing a module script failed');
      
      if (isChunkError) {
        console.warn('New version detected (Chunk Load Error). Reloading...');
        const storageKey = `retry-chunk-${window.location.pathname}`;
        if (!sessionStorage.getItem(storageKey)) {
          sessionStorage.setItem(storageKey, 'true');
          window.location.reload();
          return { default: () => <Loading /> }; 
        }
      }
      throw error;
    }
  });
};

const Home = lazyRetry(() => import("./pages/HomePage"));
const InschrijvenPagina = lazyRetry(() => import("./pages/InschrijvenPagina"));
const IntroPagina = lazyRetry(() => import("./pages/IntroPagina"));
const ActiviteitenPagina = lazyRetry(() => import("./pages/ActiviteitenPagina"));
const CommissiesPagina = lazyRetry(() => import("./pages/CommissiesPagina"));
const CommissieDetailPagina = lazyRetry(() => import("./pages/CommissieDetailPagina"));
const LoginPagina = lazyRetry(() => import("./pages/LoginPagina"));
const SignupPagina = lazyRetry(() => import("./pages/SignupPagina"));
const AccountPagina = lazyRetry(() => import("./pages/AccountPagina"));
const TransactionsPagina = lazyRetry(() => import("./pages/TransactionsPagina"));
const WhatsAppGroupsPagina = lazyRetry(() => import("./pages/WhatsAppGroupsPagina"));
const StickersPagina = lazyRetry(() => import("./pages/StickersPagina"));
const ContactPagina = lazyRetry(() => import("./pages/ContactPagina"));
const SafeHavensPagina = lazyRetry(() => import("./pages/SafeHavensPagina"));
const KroegentochtPagina = lazyRetry(() => import("./pages/KroegentochtPagina"));
const AttendancePagina = lazyRetry(() => import("./pages/AttendancePagina"));
const ClubsPagina = lazyRetry(() => import("./pages/ClubsPagina"));

const CLARITY_PROJECT_ID = "ub6sxoccku";
const TRACKING_PREFERENCES_KEY = "clarity-consent";
const POSTHOG_API_KEY = import.meta.env.VITE_POSTHOG_KEY ?? "phc_mOX7smJqqHtzKGB1kTuVZFLqgRFIHW0cPEFehanAh6D";
const POSTHOG_API_HOST = import.meta.env.VITE_POSTHOG_HOST ?? "https://eu.i.posthog.com";

type ClarityConsentState = "granted" | "denied";

const sendClarityConsent = (ad: ClarityConsentState, analytics: ClarityConsentState) => {
  if (typeof window === "undefined") return;
  const clarityFn = (window as typeof window & { clarity?: (...args: unknown[]) => void }).clarity;
  if (!clarityFn) return;

  try {
    clarityFn("consentv2", { ad_Storage: ad, analytics_Storage: analytics });
  } catch (error) {
    console.warn("Kon Clarity consentv2 niet doorgeven", error);
  }
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 1 * 60 * 1000,
    },
  },
});

const LazyPage = ({ children }: { children: ReactNode }) => (
  <PageTransition>
    <Suspense fallback={<Loading />}>
      {children}
    </Suspense>
  </PageTransition>
);

const ClarityUserSync = ({ enabled }: { enabled: boolean }) => {
  const { user, isAuthenticated } = useAuth();
  const fullName = [user?.first_name, user?.last_name].filter(Boolean).join(" ").trim();
  const membershipStatus = user?.membership_status ?? (user?.is_member ? "active" : "none");
  const authProvider = user ? (user.entra_id ? "entra" : "email_password") : "none";

  useEffect(() => {
    if (!enabled) return;

    try {
        const clarityId = user ? user.id : "anonymous";
        Clarity.identify(
          clarityId,
          undefined,
          undefined,
          user ? fullName || undefined : "Guest"
        );

      const tags: Record<string, string> = {
        auth_state: isAuthenticated ? "authenticated" : "anonymous",
        user_email: user?.email ?? "anonymous",
        user_name: fullName || "anonymous",
        membership_status: membershipStatus,
        membership_expires_at: user?.membership_expiry ?? "not_set",
        member_id: user?.member_id ? String(user.member_id) : "none",
        membership_flag: user?.is_member ? "member" : "not_member",
        auth_provider: authProvider,
      };

      if (user?.fontys_email) {
        tags.fontys_email = user.fontys_email;
      }
      if (user?.entra_id) {
        tags.entra_id = user.entra_id;
      }
      if (user?.minecraft_username) {
        tags.minecraft_username = user.minecraft_username;
      }

      Object.entries(tags).forEach(([key, value]) => {
        Clarity.setTag(key, value);
      });
    } catch (error) {
      console.warn("Kon Microsoft Clarity niet bijwerken met gebruikersinformatie", error);
    }
  }, [authProvider, enabled, fullName, isAuthenticated, membershipStatus, user]);

  return null;
};

const PosthogUserSync = ({ enabled }: { enabled: boolean }) => {
  const { user, isAuthenticated } = useAuth();
  const fullName = [user?.first_name, user?.last_name].filter(Boolean).join(" ").trim();
  const membershipStatus = user?.membership_status ?? (user?.is_member ? "active" : "none");
  const authProvider = user ? (user.entra_id ? "entra" : "email_password") : "none";
  const lastIdentifiedUser = useRef<string | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const baseProps = {
      auth_state: isAuthenticated ? "authenticated" : "anonymous",
      membership_status: membershipStatus,
      membership_flag: user?.is_member ? "member" : "not_member",
      membership_expires_at: user?.membership_expiry ?? "not_set",
      auth_provider: authProvider,
    };

    if (user) {
      posthog.register(baseProps);
      posthog.identify(user.id, {
        email: user.email,
        name: fullName || undefined,
        first_name: user.first_name || undefined,
        last_name: user.last_name || undefined,
        member_id: user.member_id ?? undefined,
        fontys_email: user.fontys_email ?? undefined,
        entra_id: user.entra_id ?? undefined,
        minecraft_username: user.minecraft_username ?? undefined,
        ...baseProps,
      });
      lastIdentifiedUser.current = user.id;
    } else {
      if (lastIdentifiedUser.current) {
        posthog.reset();
        lastIdentifiedUser.current = null;
      }
      posthog.register(baseProps);
    }
  }, [authProvider, enabled, fullName, isAuthenticated, membershipStatus, user]);

  return null;
};

const PosthogRouteTracker = ({ enabled }: { enabled: boolean }) => {
  const location = useLocation();

  useEffect(() => {
    if (!enabled) return;
    
    const storageKey = `retry-chunk-${location.pathname}`;
    if (sessionStorage.getItem(storageKey)) {
        sessionStorage.removeItem(storageKey);
    }

    posthog.capture("$pageview", {
      $current_url: window.location.href,
      $pathname: location.pathname,
    });
  }, [enabled, location.pathname, location.search]);

  return null;
};

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path={ROUTES.HOME} element={<LazyPage><Home /></LazyPage>} />
        <Route path={ROUTES.INTRO} element={<LazyPage><IntroPagina /></LazyPage>} />
        <Route path={ROUTES.ACTIVITIES} element={<LazyPage><ActiviteitenPagina /></LazyPage>} />
        <Route path={ROUTES.COMMITTEES} element={<LazyPage><CommissiesPagina /></LazyPage>} />
        <Route path={`${ROUTES.COMMITTEES}/:slug`} element={<LazyPage><CommissieDetailPagina /></LazyPage>} />
        <Route path={ROUTES.CLUBS} element={<LazyPage><ClubsPagina /></LazyPage>} />
        <Route path={ROUTES.LOGIN} element={<LazyPage><LoginPagina /></LazyPage>} />
        <Route path={ROUTES.SIGNUP} element={<LazyPage><SignupPagina /></LazyPage>} />
        <Route
          path={ROUTES.ACCOUNT}
          element={
            <LazyPage>
              <ProtectedRoute>
                <AccountPagina />
              </ProtectedRoute>
            </LazyPage>
          }
        />
        <Route
          path={ROUTES.TRANSACTIONS}
          element={
            <LazyPage>
              <ProtectedRoute>
                <TransactionsPagina />
              </ProtectedRoute>
            </LazyPage>
          }
        />
        <Route
          path={ROUTES.WHATSAPP}
          element={
            <LazyPage>
              <ProtectedRoute>
                <WhatsAppGroupsPagina />
              </ProtectedRoute>
            </LazyPage>
          }
        />
        <Route path={ROUTES.MEMBERSHIP} element={<LazyPage><InschrijvenPagina /></LazyPage>} />
        <Route path={ROUTES.STICKERS} element={<LazyPage><StickersPagina /></LazyPage>} />
        <Route path={ROUTES.CONTACT} element={<LazyPage><ContactPagina /></LazyPage>} />
        <Route path={ROUTES.SAFE_HAVENS} element={<LazyPage><SafeHavensPagina /></LazyPage>} />
        <Route path={ROUTES.PUB_CRAWL} element={<LazyPage><KroegentochtPagina /></LazyPage>} />
        <Route
          path={`${ROUTES.ATTENDANCE}/:eventId`}
          element={
            <LazyPage>
              <ProtectedRoute>
                <AttendancePagina />
              </ProtectedRoute>
            </LazyPage>
          }
        />
      </Routes>
    </AnimatePresence>
  );
}

const readStoredPreferences = (): TrackingPreferences | null => {
  if (typeof window === "undefined") return null;
  const stored = window.localStorage.getItem(TRACKING_PREFERENCES_KEY);
  if (!stored) return null;
  if (stored === "accepted") return { clarity: true, posthog: true };
  if (stored === "rejected") return { clarity: false, posthog: false };

  try {
    const parsed = JSON.parse(stored);
    if (typeof parsed?.clarity === "boolean" || typeof parsed?.posthog === "boolean") {
      const clarity = typeof parsed.clarity === "boolean" ? parsed.clarity : false;
      const posthogConsent = typeof parsed.posthog === "boolean" ? parsed.posthog : clarity;
      return { clarity, posthog: posthogConsent };
    }
  } catch (error) {
    console.warn("Kon cookie voorkeuren niet lezen", error);
  }
  return null;
};

const persistPreferences = (prefs: TrackingPreferences) => {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(TRACKING_PREFERENCES_KEY, JSON.stringify(prefs));
  }
};

export default function App() {
  const [trackingPrefs, setTrackingPrefs] = useState<TrackingPreferences | null>(() => readStoredPreferences());
  const clarityInitialized = useRef(false);
  const [clarityReady, setClarityReady] = useState(false);
  const posthogInitialized = useRef(false);
  const [posthogReady, setPosthogReady] = useState(false);

  useEffect(() => {
    const clarityConsented = trackingPrefs?.clarity === true;

    if (!clarityConsented) {
      if (clarityInitialized.current) {
        sendClarityConsent("denied", "denied");
      }
      setClarityReady(false);
      return;
    }

    if (!clarityInitialized.current) {
      Clarity.init(CLARITY_PROJECT_ID);
      clarityInitialized.current = true;
    }

    sendClarityConsent("granted", "granted");
    setClarityReady(true);
  }, [trackingPrefs]);

  useEffect(() => {
    const posthogConsented = trackingPrefs?.posthog === true;

    if (!posthogConsented) {
      if (posthogInitialized.current) {
        posthog.opt_out_capturing();
        posthog.reset();
      }
      setPosthogReady(false);
      return;
    }

    if (!POSTHOG_API_KEY) {
      console.warn("PostHog API key ontbreekt, analytics is uitgeschakeld.");
      setPosthogReady(false);
      return;
    }

    if (!posthogInitialized.current) {
      posthog.init(POSTHOG_API_KEY, {
        api_host: POSTHOG_API_HOST,
        capture_pageview: false,
        person_profiles: "identified_only",
      });
      posthogInitialized.current = true;
    } else {
      posthog.opt_in_capturing();
    }

    setPosthogReady(true);
  }, [trackingPrefs]);

  const handleSavePreferences = (prefs: TrackingPreferences) => {
    persistPreferences(prefs);
    setTrackingPrefs(prefs);
  };

  const handleAcceptAll = () => handleSavePreferences({ clarity: true, posthog: true });
  const handleRejectAll = () => handleSavePreferences({ clarity: false, posthog: false });

  const shouldShowCookieBanner = trackingPrefs === null;
  const clarityAllowed = trackingPrefs?.clarity === true && clarityReady;
  const posthogAllowed = trackingPrefs?.posthog === true && posthogReady;

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <ScrollToTop />
          <Layout>
            <AnimatedRoutes />
          </Layout>
          {shouldShowCookieBanner && (
            <CookieBanner
              initialPreferences={trackingPrefs ?? { clarity: false, posthog: false }}
              onAcceptAll={handleAcceptAll}
              onRejectAll={handleRejectAll}
              onSave={handleSavePreferences}
            />
          )}
          <PosthogRouteTracker enabled={posthogAllowed} />
          <ClarityUserSync enabled={clarityAllowed} />
          <PosthogUserSync enabled={posthogAllowed} />
        </Router>
        <ReactQueryDevtools initialIsOpen={false} />
      </AuthProvider>
    </QueryClientProvider>
  );
}