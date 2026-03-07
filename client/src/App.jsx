import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';
import Home from './pages/Home';
import SearchResults from './pages/SearchResults';
import ProductDetail from './pages/ProductDetail';
import TryOnPage from './pages/TryOnPage';
import AdminDashboard from './pages/AdminDashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import Navbar from './components/Navbar';
import ChatAssistant from './components/Chat/ChatAssistant';

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <ErrorBoundary>
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="pt-16">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<SearchResults />} />
          <Route path="/product/:platform/:id" element={<ProductDetail />} />
          <Route path="/try-on" element={<TryOnPage />} />
          <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
          <Route path="/register" element={user ? <Navigate to="/" /> : <Register />} />
          <Route path="/admin" element={user ? <AdminDashboard /> : <Navigate to="/login" />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
      {/* Floating Chat Assistant - always visible */}
      <ChatAssistant />
      {/* Affiliate Disclosure */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-800 text-gray-400 text-xs text-center py-1 z-40">
        This site earns from qualifying purchases through affiliate links. Rankings are never influenced by commissions.
      </div>
    </div>
    </ErrorBoundary>
  );
}

export default App;
