import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/HomePage";
import InschrijvenPagina from "./pages/InschrijvenPagina";


export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/inschrijven" element={<InschrijvenPagina />} />

      </Routes>
    </Router>
  );
}
