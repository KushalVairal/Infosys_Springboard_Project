import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import DashboardPage from './pages/DashboardPage';
import ActivitiesPage from './pages/ActivitiesPage';
import AnalyticsPage from './pages/AnalyticsPage';
import ProfilePage from './pages/ProfilePage';
import GoalsPage from './pages/GoalsPage';
import RecommendationsPage from './pages/RecommendationsPage';
import BenchmarkingPage from './pages/BenchmarkingPage';
import AchievementsPage from './pages/AchievementsPage';
import NotFoundPage from './pages/NotFoundPage';
import LeaderboardPage from './pages/LeaderboardPage';
import OrganisationDashboardPage from './pages/OrganisationDashboardPage';
import NotificationsPage from './pages/NotificationsPage';
import ManageMembersPage from './pages/ManageMembersPage';
import OrganisationDiscoveryPage from './pages/OrganisationDiscoveryPage';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <ErrorBoundary>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />

              {/* Protected routes */}
              <Route
                element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }
              >
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/activities" element={<ActivitiesPage />} />
                <Route path="/log" element={<Navigate to="/activities" replace />} />
                <Route path="/analytics" element={<AnalyticsPage />} />
                <Route path="/goals" element={<GoalsPage />} />
                <Route path="/recommendations" element={<RecommendationsPage />} />
                <Route path="/benchmarks" element={<BenchmarkingPage />} />
                <Route path="/achievements" element={<AchievementsPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/leaderboard" element={<LeaderboardPage />} />
                <Route path="/community" element={<Navigate to="/leaderboard" replace />} />
                <Route path="/notifications" element={<NotificationsPage />} />
                <Route path="/organisation" element={<OrganisationDashboardPage />} />
                <Route path="/organisation/members" element={<ManageMembersPage />} />
                <Route path="/organisation/discover" element={<OrganisationDiscoveryPage />} />
                <Route path="/organisations" element={<Navigate to="/organisation/discover" replace />} />
                <Route path="/organization" element={<Navigate to="/organisation" replace />} />
              </Route>

              {/* Fallback */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </ErrorBoundary>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

