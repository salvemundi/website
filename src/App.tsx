import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import { Suspense, lazy, useEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence } from "framer-motion";
import PageTransition from "./components/PageTransition";
import Layout from "./components/Layout";
import Loading from "./components/Loading";
import ScrollToTop from "./components/ScrollToTop";
import CookieBanner from "./components/CookieBanner";
import Clarity from "@microsoft/clarity";


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
const CLARITY_CONSENT_KEY = "clarity-consent";
type TrackingPreferences = {
  clarity: boolean;
};

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 1 * 60 * 1000, // 5 minutes
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
  const stored = window.localStorage.getItem(CLARITY_CONSENT_KEY);
  if (!stored) return null;
  if (stored === "accepted") return { clarity: true };
  if (stored === "rejected") return { clarity: false };

  try {
    const parsed = JSON.parse(stored);
    if (typeof parsed?.clarity === "boolean") {
      return { clarity: parsed.clarity };
    }
  } catch (error) {
    console.warn("Kon cookie voorkeuren niet lezen", error);
  }
  return null;
};

const persistPreferences = (prefs: TrackingPreferences) => {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(CLARITY_CONSENT_KEY, JSON.stringify(prefs));
  }
};

export default function App() {
  const [trackingPrefs, setTrackingPrefs] = useState<TrackingPreferences | null>(() => readStoredPreferences());
  const clarityInitialized = useRef(false);

  useEffect(() => {
    if (trackingPrefs?.clarity && !clarityInitialized.current) {
      Clarity.init(CLARITY_PROJECT_ID);
      clarityInitialized.current = true;
    }
  }, [trackingPrefs]);

  const handleSavePreferences = (prefs: TrackingPreferences) => {
    persistPreferences(prefs);
    setTrackingPrefs(prefs);
  };

  const handleAcceptAll = () => handleSavePreferences({ clarity: true });
  const handleRejectAll = () => handleSavePreferences({ clarity: false });

  const shouldShowCookieBanner = trackingPrefs === null;

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
              initialPreferences={trackingPrefs ?? { clarity: false }}
              onAcceptAll={handleAcceptAll}
              onRejectAll={handleRejectAll}
              onSave={handleSavePreferences}
            />
          )}
        </Router>
        <ReactQueryDevtools initialIsOpen={false} />
      </AuthProvider>
    </QueryClientProvider>
  );
}
