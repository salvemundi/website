import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import { Suspense, lazy, useEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence } from "framer-motion";
import posthog from "posthog-js";
import PageTransition from "./components/PageTransition";
import Layout from "./components/Layout";
import Loading from "./components/Loading";
import ScrollToTop from "./components/ScrollToTop";
import CookieBanner from "./components/CookieBanner";
import Clarity from "@microsoft/clarity";
import { TrackingPreferences } from "./types/tracking";


// Lazy load pages
const Home = lazy(() => import("./pages/HomePage"));
const InschrijvenPagina = lazy(() => import("./pages/InschrijvenPagina"));
const IntroPagina = lazy(() => import("./pages/IntroPagina"));
const ActiviteitenPagina = lazy(() => import("./pages/ActiviteitenPagina"));
const CommissiesPagina = lazy(() => import("./pages/CommissiesPagina"));
const CommissieDetailPagina = lazy(() => import("./pages/CommissieDetailPagina"));
const LoginPagina = lazy(() => import("./pages/LoginPagina"));
const SignupPagina = lazy(() => import("./pages/SignupPagina"));
const AccountPagina = lazy(() => import("./pages/AccountPagina"));
const TransactionsPagina = lazy(() => import("./pages/TransactionsPagina"));
const WhatsAppGroupsPagina = lazy(() => import("./pages/WhatsAppGroupsPagina"));
const StickersPagina = lazy(() => import("./pages/StickersPagina"));
const ContactPagina = lazy(() => import("./pages/ContactPagina"));
const SafeHavensPagina = lazy(() => import("./pages/SafeHavensPagina"));
const KroegentochtPagina = lazy(() => import("./pages/KroegentochtPagina"));
const AttendancePagina = lazy(() => import("./pages/AttendancePagina"));
const ClubsPagina = lazy(() => import("./pages/ClubsPagina"));
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

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 1 * 60 * 1000, // 1 minute
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
        console.log("Clarity.identify called with:", clarityId);
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
          console.log("Clarity.setTag", key, value);
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
        <Route path="/" element={<LazyPage><Home /></LazyPage>} />
        <Route path="/intro" element={<LazyPage><IntroPagina /></LazyPage>} />
        <Route path="/activiteiten" element={<LazyPage><ActiviteitenPagina /></LazyPage>} />
        <Route path="/commissies" element={<LazyPage><CommissiesPagina /></LazyPage>} />
        <Route path="/commissies/:slug" element={<LazyPage><CommissieDetailPagina /></LazyPage>} />
        <Route path="/clubs" element={<LazyPage><ClubsPagina /></LazyPage>} />
        <Route path="/login" element={<LazyPage><LoginPagina /></LazyPage>} />
        <Route path="/signup" element={<LazyPage><SignupPagina /></LazyPage>} />
        <Route
          path="/account"
          element={
            <LazyPage>
              <ProtectedRoute>
                <AccountPagina />
              </ProtectedRoute>
            </LazyPage>
          }
        />
        <Route
          path="/account/transactions"
          element={
            <LazyPage>
              <ProtectedRoute>
                <TransactionsPagina />
              </ProtectedRoute>
            </LazyPage>
          }
        />
        <Route
          path="/account/whatsapp-groups"
          element={
            <LazyPage>
              <ProtectedRoute>
                <WhatsAppGroupsPagina />
              </ProtectedRoute>
            </LazyPage>
          }
        />
        <Route path="/inschrijven" element={<LazyPage><InschrijvenPagina /></LazyPage>} />
        <Route path="/stickers" element={<LazyPage><StickersPagina /></LazyPage>} />
        <Route path="/contact" element={<LazyPage><ContactPagina /></LazyPage>} />
        <Route path="/safe-havens" element={<LazyPage><SafeHavensPagina /></LazyPage>} />
        <Route path="/kroegentocht" element={<LazyPage><KroegentochtPagina /></LazyPage>} />
        <Route
          path="/attendance/:eventId"
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
