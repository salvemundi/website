import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import Home from "./pages/HomePage";
import InschrijvenPagina from "./pages/InschrijvenPagina";
import IntroPagina from "./pages/IntroPagina";
import ActiviteitenPagina from "./pages/ActiviteitenPagina";
import CommissiesPagina from "./pages/CommissiesPagina";
import CommissieDetailPagina from "./pages/CommissieDetailPagina";

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
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/inschrijven" element={<InschrijvenPagina />} />
          <Route path="/intro" element={<IntroPagina />} />
          <Route path="/activiteiten" element={<ActiviteitenPagina />} />
          <Route path="/commissies" element={<CommissiesPagina />} />
          <Route path="/commissies/:slug" element={<CommissieDetailPagina />} />
        </Routes>
      </Router>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
