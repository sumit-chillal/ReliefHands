import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { GoogleOAuthProvider } from "@react-oauth/google";
import LandingPage from "./pages/LandingPage";
import AdminDashboard from "./pages/AdminDashboard";
import NGODashboard from "./pages/NGODashboard";
import VolunteerDashboard from "./pages/VolunteerDashboard";
import MapsPage from "./pages/MapsPage";
import NGOListPage, { NGODetailPage } from "./pages/NGOListPage";
import { AuthProvider, GOOGLE_CLIENT_ID } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import "./App.css";

function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/maps" element={<MapsPage />} />
            <Route path="/ngo-list" element={<NGOListPage />} />
            <Route path="/ngo-details/:ngoId" element={<NGODetailPage />} />
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/ngo"
              element={
                <ProtectedRoute allowedRoles={["ngo"]}>
                  <NGODashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/volunteer"
              element={
                <ProtectedRoute allowedRoles={["volunteer"]}>
                  <VolunteerDashboard />
                </ProtectedRoute>
              }
            />
          </Routes>
          <Toaster position="top-right" richColors />
        </BrowserRouter>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
