import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import CreateEvent from './pages/consumer/CreateEvent';
import ShoppingList from './pages/consumer/ShoppingList';
import MapView from './pages/consumer/MapView';
import CommerceDashboard from './pages/commerce/Dashboard';
import CreateOffer from './pages/commerce/CreateOffer';

function RequireAuth({ children, role }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to={user.role === 'commerce' ? '/commerce' : '/consumer'} /> : <Landing />} />
      <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to="/" /> : <Register />} />

      {/* Consumer */}
      <Route path="/consumer" element={<RequireAuth role="consumer"><CreateEvent /></RequireAuth>} />
      <Route path="/consumer/shopping-list" element={<RequireAuth role="consumer"><ShoppingList /></RequireAuth>} />
      <Route path="/consumer/map" element={<RequireAuth role="consumer"><MapView /></RequireAuth>} />

      {/* Commerce */}
      <Route path="/commerce" element={<RequireAuth role="commerce"><CommerceDashboard /></RequireAuth>} />
      <Route path="/commerce/offer/new" element={<RequireAuth role="commerce"><CreateOffer /></RequireAuth>} />

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}
