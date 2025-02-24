import React, { useEffect } from 'react';
import { Auth } from './components/Auth';
import { ChatInterface } from './components/ChatInterface';
import { useAuthStore } from './store/authStore';

function App() {
  const { user, loading, initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1A1B1E]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
      </div>
    );
  }

  return user ? <ChatInterface /> : <Auth />;
}

export default App;