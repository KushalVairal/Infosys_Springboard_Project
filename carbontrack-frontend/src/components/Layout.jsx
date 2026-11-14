import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import ChatbotWidget from './ChatbotWidget';
import Footer from './Footer';
import '../styles/chatbot.css';

export default function Layout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem('carbontrack_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const handleToggleCollapse = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('carbontrack_sidebar_collapsed', String(next));
      } catch {}
      return next;
    });
  };

  return (
    <div className={`app-shell ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <Navbar
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
        isSidebarOpen={isSidebarOpen}
      />

      <div className="app-body">
        <Sidebar
          isOpen={isSidebarOpen}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={handleToggleCollapse}
          onClose={() => setIsSidebarOpen(false)}
        />

        <main className="main-content-area">
          <div className="content-container">
            <Outlet />
          </div>
        </main>
      </div>

      <Footer />
      <ChatbotWidget />
    </div>
  );
}
