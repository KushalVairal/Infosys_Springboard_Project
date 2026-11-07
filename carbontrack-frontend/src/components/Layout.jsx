import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
<<<<<<< Updated upstream
import ChatAssistant from './ChatAssistant';
=======
import ChatbotWidget from './ChatbotWidget';
import '../styles/chatbot.css';
>>>>>>> Stashed changes

export default function Layout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="app-shell">
      <Navbar
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
        isSidebarOpen={isSidebarOpen}
      />
      <div className="app-body">
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        <main className="main-content-area">
          <div className="content-container">
            <Outlet />
          </div>
        </main>
      </div>
<<<<<<< Updated upstream
      <ChatAssistant />
=======
      <ChatbotWidget />
>>>>>>> Stashed changes
    </div>
  );
}
