import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';

const fmt = (n) => `$${Number(n).toLocaleString('es-AR')}`;

export default function CommerceDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);

  const now = new Date();

  const fetchOffers = async () => {
    try {
      const { data } = await api.get(`/offers/commerce/${user.id}`);
      setOffers(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOffers(); }, []);

  const deleteOffer = async (id) => {
    if (!confirm('¿Eliminar esta oferta?')) return;
    setDeleting(id);
    try {
      await api.delete(`/offers/${id}`, { data: { userId: user.id } });
      setOffers(o => o.filter(x => x.id !== id));
    } catch {
      alert('Error al eliminar');
    } finally {
      setDeleting(null);
    }
  };

  const activeOffers = offers.filter(o => !o.expiresAt || new Date(o.expiresAt) > now);
  const expiredOffers = offers.filter(o => o.expiresAt && new Date(o.expiresAt) <= now);
  const canAdd = user.premium || activeOffers.length < 5;

  return (
    <div className="page-container flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 px-6 pt-12 pb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 bg-white/10 rounded-full px-3 py-1 mb-2">
              <span className="text-xs text-white/80">🏪 Comercio</span>
              {user.premium && <span className="text-xs text-yellow-400 font-semibold">⭐ Premium</span>}
            </div>
            <h1 className="text-xl font-bold text-white">{user.businessName}</h1>
            <p className="text-white/50 text-xs">{user.address}</p>
          </div>
          <button onClick={logout} className="text-white/40 text-xs border border-white/20 rounded-lg px-3 py-1.5">
            Salir
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mt-4">
          {[
            { label: 'Activas', value: activeOffers.length, color: 'text-green-400' },
            { label: 'Vencidas', value: expiredOffers.length, color: 'text-red-400' },
            { label: 'Plan', value: user.premium ? 'Premium' : `${activeOffers.length}/5`, color: 'text-yellow-400' },
          ].map((s, i) => (
            <div key={i} className="bg-white/10 rounded-xl p-3 text-center">
              <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
              <p className="text-white/50 text-xs">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Add offer button */}
      <div className="px-4 pt-4">
        {canAdd ? (
          <button
            onClick={() => navigate('/commerce/offer/new')}
            className="w-full py-3.5 bg-brand-700 text-white font-bold rounded-2xl shadow-md shadow-brand-200 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <span className="text-lg">+</span> Publicar nueva oferta
          </button>
        ) : (
          <div className="card bg-amber-50 border-amber-100">
            <p className="text-sm text-amber-800 font-semibold">Límite del plan gratuito alcanzado</p>
            <p className="text-xs text-amber-600 mt-1">Eliminá una oferta activa o actualizate a Premium para publicar más.</p>
          </div>
        )}
      </div>

      <div className="flex-1 px-4 pt-4 pb-8 space-y-3 overflow-y-auto">
        {loading ? (
          <div className="text-center py-16 text-gray-400">Cargando ofertas...</div>
        ) : offers.length === 0 ? (
          <div className="card text-center py-12">
            <div className="text-5xl mb-4">📦</div>
            <p className="font-semibold text-gray-700">Sin ofertas publicadas</p>
            <p className="text-sm text-gray-400 mt-1">Publicá tu primera oferta para aparecer en los resultados</p>
          </div>
        ) : (
          <>
            {activeOffers.length > 0 && (
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-1">
                Activas ({activeOffers.length})
              </p>
            )}
            {activeOffers.map(offer => (
              <OfferCard key={offer.id} offer={offer} onDelete={deleteOffer} deleting={deleting} />
            ))}
            {expiredOffers.length > 0 && (
              <>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-1 pt-2">
                  Vencidas ({expiredOffers.length})
                </p>
                {expiredOffers.map(offer => (
                  <OfferCard key={offer.id} offer={offer} onDelete={deleteOffer} deleting={deleting} expired />
                ))}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function OfferCard({ offer, onDelete, deleting, expired }) {
  const fmt = (n) => `$${Number(n).toLocaleString('es-AR')}`;
  const expiresStr = offer.expiresAt
    ? new Date(offer.expiresAt).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit' })
    : 'Sin vencimiento';

  return (
    <div className={`card ${expired ? 'opacity-60' : ''}`}>
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-xl flex-shrink-0">
          🏷️
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-bold text-gray-900 truncate">{offer.productName}</p>
              {offer.brand && <p className="text-xs text-gray-400">{offer.brand}</p>}
            </div>
            <p className="font-bold text-brand-700 text-lg flex-shrink-0">{fmt(offer.price)}</p>
          </div>
          {offer.description && (
            <p className="text-xs text-gray-500 mt-1 line-clamp-2">{offer.description}</p>
          )}
          <div className="flex items-center gap-2 mt-2">
            <span className={`text-xs px-2 py-0.5 rounded-full ${expired ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-700'}`}>
              {expired ? '✕ Vencida' : '● Activa'}
            </span>
            <span className="text-xs text-gray-400">Vence: {expiresStr}</span>
          </div>
        </div>
      </div>
      <button
        onClick={() => onDelete(offer.id)}
        disabled={deleting === offer.id}
        className="mt-3 w-full py-2 text-sm text-red-600 border border-red-100 rounded-xl active:scale-95 transition-all bg-red-50"
      >
        {deleting === offer.id ? 'Eliminando...' : 'Eliminar oferta'}
      </button>
    </div>
  );
}
