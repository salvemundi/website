import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/HomePage";
import InschrijvenPagina from "./pages/InschrijvenPagina";
import ActiviteitenPagina from "./pages/ActiviteitenPagina";
import CommissiesPagina from "./pages/CommissiesPagina";
import CommissieDetailPagina from "./pages/CommissieDetailPagina";


export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/inschrijven" element={<InschrijvenPagina />} />
        <Route path="/activiteiten" element={<ActiviteitenPagina />} />
        <Route path="/commissies" element={<CommissiesPagina />} />
        <Route path="/commissies/:slug" element={<CommissieDetailPagina />} />

      </Routes>
    </Router>
  );
}
