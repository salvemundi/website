import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Home from "./pages/HomePage";
import InschrijvenPagina from "./pages/InschrijvenPagina";
import IntroPagina from "./pages/IntroPagina";
import ActiviteitenPagina from "./pages/ActiviteitenPagina";
import CommissiesPagina from "./pages/CommissiesPagina";
import CommissieDetailPagina from "./pages/CommissieDetailPagina";
import LoginPagina from "./pages/LoginPagina";
import SignupPagina from "./pages/SignupPagina";
import AccountPagina from "./pages/AccountPagina";
import TransactionsPagina from "./pages/TransactionsPagina";
import WhatsAppGroupsPagina from "./pages/WhatsAppGroupsPagina";
import StickersPagina from "./pages/StickersPagina";

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

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/intro" element={<IntroPagina />} />
            <Route path="/activiteiten" element={<ActiviteitenPagina />} />
            <Route path="/commissies" element={<CommissiesPagina />} />
            <Route path="/commissies/:slug" element={<CommissieDetailPagina />} />
            <Route path="/login" element={<LoginPagina />} />
            <Route path="/signup" element={<SignupPagina />} />
            <Route 
              path="/account" 
              element={
                <ProtectedRoute>
                  <AccountPagina />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/account/transactions" 
              element={
                <ProtectedRoute>
                  <TransactionsPagina />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/account/whatsapp-groups" 
              element={
                <ProtectedRoute>
                  <WhatsAppGroupsPagina />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/inschrijven" 
              element={
                <ProtectedRoute>
                  <InschrijvenPagina />
                </ProtectedRoute>
              } 
            />
            <Route path="/stickers" element={<StickersPagina />} />
          </Routes>
        </Router>
        <ReactQueryDevtools initialIsOpen={false} />
      </AuthProvider>
    </QueryClientProvider>
  );
}
