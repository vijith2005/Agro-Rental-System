import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";

import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import Profile from "./pages/Profile";

import FarmerDashboard from "./pages/farmers/FarmerDashboard";
import EquipmentBrowse from "./pages/farmers/EquipmentBrowse";
import EquipmentDetail from "./pages/farmers/EquipmentDetail";
import BookingHistory from "./pages/farmers/BookingHistory";
import Payments from "./pages/farmers/Payments";
import Messages from "./pages/farmers/Messages";
import OwnerDashboard from "./pages/owners/OwnerDashboard";
import OwnerListings from "./pages/owners/OwnerListings";
import OwnerRequests from "./pages/owners/OwnerRequests";
import OwnerEarnings from "./pages/owners/OwnerEarnings";
import OwnerMessages from "./pages/owners/OwnerMessages";
import DeliveryDashboard from "./pages/delivery/DeliveryDashboard";
import DeliveryDeliveries from "./pages/delivery/DeliveryDeliveries";
import DeliveryReturns from "./pages/delivery/DeliveryReturns";
import DeliveryHistory from "./pages/delivery/DeliveryHistory";
import Admin from "./pages/admin/Admin";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminEquipment from "./pages/admin/AdminEquipment";

import ProtectedRoute from "./components/ProtectedRoute";
import MainLayout from "./components/MainLayout";
import { seedData } from "./utils/storage";

function App() {
  useEffect(() => {
    seedData();
  }, []);

  return (
    <Router>
      <Toaster
        position="top-right"
        gutter={12}
        toastOptions={{
          duration: 3500,
          style: {
            borderRadius: "12px",
            padding: "12px 16px",
            background: "#111827",
            color: "#fff",
          },
          success: {
            style: {
              background: "#166534",
            },
          },
          error: {
            style: {
              background: "#991b1b",
            },
          },
        }}
      />
      <Routes>

        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/profile" element={<Navigate to="/farmer/profile" replace />} />
        <Route path="/equipment" element={<Navigate to="/farmer/equipment" replace />} />
        <Route path="/bookings" element={<Navigate to="/farmer/bookings" replace />} />
        <Route path="/payments" element={<Navigate to="/farmer/payments" replace />} />
        <Route path="/messages" element={<Navigate to="/farmer/messages" replace />} />

        <Route
          path="/farmer"
          element={
            <ProtectedRoute role="farmer">
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<FarmerDashboard />} />
          <Route path="equipment" element={<EquipmentBrowse />} />
          <Route path="equipment/:id" element={<EquipmentDetail />} />
          <Route path="bookings" element={<BookingHistory />} />
          <Route path="payments" element={<Payments />} />
          <Route path="messages" element={<Messages />} />
          <Route path="profile" element={<Profile />} />
        </Route>

        <Route path="/equipment/:id" element={<Navigate to="/farmer/equipment/:id" replace />} />

        <Route
          path="/owner"
          element={
            <ProtectedRoute role="owner">
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<OwnerDashboard />} />
          <Route path="listings" element={<OwnerListings />} />
          <Route path="requests" element={<OwnerRequests />} />
          <Route path="earnings" element={<OwnerEarnings />} />
          <Route path="messages" element={<OwnerMessages />} />
          <Route path="profile" element={<Profile />} />
        </Route>

      
        <Route
          path="/delivery"
          element={
            <ProtectedRoute role="delivery">
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DeliveryDashboard />} />
          <Route path="pickups" element={<Navigate to="/delivery" replace />} />
          <Route path="deliveries" element={<DeliveryDeliveries />} />
          <Route path="returns" element={<DeliveryReturns />} />
          <Route path="history" element={<DeliveryHistory />} />
        </Route>

        <Route
          path="/admin"
          element={
            <ProtectedRoute role="admin">
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Admin />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="equipment" element={<AdminEquipment />} />
          <Route path="disputes" element={<Navigate to="/admin" replace />} />
        </Route>

        <Route path="*" element={<Navigate to="/farmer" replace />} />

      </Routes>
    </Router>
  );
}

export default App;
