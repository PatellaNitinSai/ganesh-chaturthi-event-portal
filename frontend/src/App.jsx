import React from 'react';
import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Sidebar from './components/Sidebar.jsx';
import Topbar from './components/Topbar.jsx';

import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Donations from './pages/Donations.jsx';
import Expenses from './pages/Expenses.jsx';
import Vendors from './pages/Vendors.jsx';
import Inventory from './pages/Inventory.jsx';
import Team from './pages/Team.jsx';
import Reports from './pages/Reports.jsx';
import Announcements from './pages/Announcements.jsx';
import Settings from './pages/Settings.jsx';

function Layout({ title, children }) {
  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-area">
        <Topbar title={title} />
        <div className="page-content">{children}</div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout title="Dashboard">
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/donations"
        element={
          <ProtectedRoute>
            <Layout title="Donations">
              <Donations />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/expenses"
        element={
          <ProtectedRoute>
            <Layout title="Expenses">
              <Expenses />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/vendors"
        element={
          <ProtectedRoute>
            <Layout title="Vendors & Suppliers">
              <Vendors />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/inventory"
        element={
          <ProtectedRoute>
            <Layout title="Inventory">
              <Inventory />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/team"
        element={
          <ProtectedRoute>
            <Layout title="Team Management">
              <Team />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/reports"
        element={
          <ProtectedRoute>
            <Layout title="Reports">
              <Reports />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/announcements"
        element={
          <ProtectedRoute>
            <Layout title="Announcements">
              <Announcements />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <Layout title="Settings">
              <Settings />
            </Layout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
