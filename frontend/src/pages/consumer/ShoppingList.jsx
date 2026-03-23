import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { saveList } from '../../lib/storage';

const fmt = (n) => `$${Number(n).toLocaleString('es-AR', { minimumFractionDigits: 0 })}`;
const fmtQty = (qty, unit) => {
  if (unit === 'gr' && qty >= 1000) return `${(qty / 1000).toFixed(1)} kg`;
  if (unit === 'litros') return `${qty} lt`;
  if (unit === 'kg') return `${qty} kg`;
  if (unit === 'unidades') return `${qty} un.`;
  return `${qty} ${unit}`;
};

export default function ShoppingList() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('full');
  const [saved, setSaved] = useState(false);

  if (!state?.result) { navigate('/consumer'); return null; }

  const { shoppingList, listA, listB, uncoveredProducts, totalA, totalB } = state.result;
  const { event } = state;

  const doSave = (which) => {
    try {
      saveList({ userId: user.id, title: `${event.type} — ${event.guests} personas`, list: which === 'A' ? listA : listB });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch { alert('Error guardando'); }
  };

  const shareWhatsApp = (which) => {
    const lines = which === 'A'
      ? listA.map(i => `• ${i.emoji || ''} ${i.name}: ${fmtQty(i.quantity, i.unit)}${i.offer ? ` — ${fmt(i.offer.price)}/${i.unit} en ${i.offer.commerceName}` : ' (sin oferta)'}`)
      : listB.flatMap(s => s.offers.map(o => {
          const item = shoppingList.find(p => p.name === o.productName);
          return `• ${item?.emoji || ''} ${o.productName}: ${fmt(o.price)} en ${s.commerceName}`;
        }));
    const text = `🎉 *Mi lista de compras — Eventify*\n\n${lines.join('\n')}\n\n_Generado con Eventify_`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`);
  };

  return (
    <div className="page-container flex flex-col min-h-screen bg-gray-50">
      <div className="bg-gradient-to-br from-brand-800 to-brand-700 px-6 pt-12 pb-6">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate('/consumer')} className="text-white/70 text-sm">← Nuevo evento</button>
        </div>
        <h1 className="text-2xl font-bold text-white">Tu lista de compras</h1>
        <p className="text-white/60 text-sm mt-1">{shoppingList.length} productos · {event.guests} invitados</p>
        <div className="flex gap-2 mt-5 overflow-x-auto no-scrollbar">
          {[{ key: 'full', label: '📋 Lista completa' }, { key: 'A', label: '💰 Lista A' }, { key: 'B', label: '🗺️ Lista B' }].map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)} className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${activeTab === t.key ? 'bg-white text-brand-700' : 'bg-white/15 text-white/80'}`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-10">
        {/* FULL LIST */}
        {activeTab === 'full' && (
          <div className="space-y-2">
            <div className="card mb-4"><p className="text-sm text-gray-500">Lista completa con cantidades calculadas para {event.guests} personas.</p></div>
            {shoppingList.map((item, i) => (
              <div key={i} className="card flex items-center gap-3">
                <span className="text-2xl">{item.emoji}</span>
                <div className="flex-1"><p className="font-semibold text-gray-900 text-sm">{item.name}</p><p className="text-xs text-gray-400">{item.category}</p></div>
                <p className="font-bold text-gray-900">{fmtQty(item.quantity, item.unit)}</p>
              </div>
            ))}
          </div>
        )}

        {/* LIST A */}
        {activeTab === 'A' && (
          <div className="space-y-2">
            <div className="card bg-amber-50 border-amber-100 mb-2">
              <div className="flex justify-between items-start">
                <div><p className="font-bold text-amber-800">💰 Mejores precios</p><p className="text-xs text-amber-700 mt-0.5">La oferta más barata por producto dentro de {event.radius} km</p></div>
                <div className="text-right"><p className="text-xs text-amber-600">Estimado</p><p className="font-bold text-amber-800 text-lg">{fmt(totalA)}</p></div>
              </div>
              <div className="mt-3 flex gap-2">
                <button onClick={() => shareWhatsApp('A')} className="flex-1 py-2 bg-green-500 text-white rounded-xl text-sm font-semibold active:scale-95">WhatsApp 📤</button>
                <button onClick={() => doSave('A')} className="flex-1 py-2 bg-amber-600 text-white rounded-xl text-sm font-semibold active:scale-95">{saved ? '✓ Guardado' : 'Guardar 💾'}</button>
              </div>
            </div>
            {listA.map((item, i) => (
              <div key={i} className="card">
                <div className="flex items-start gap-3">
                  <span className="text-xl">{item.emoji}</span>
                  <div className="flex-1">
                    <div className="flex justify-between"><p className="font-semibold text-gray-900 text-sm">{item.name}</p><p className="text-xs text-gray-500">{fmtQty(item.quantity, item.unit)}</p></div>
                    {item.offer ? (
                      <div className="mt-2 bg-green-50 rounded-xl p-2.5">
                        <div className="flex justify-between items-center">
                          <div><p className="text-xs font-semibold text-green-800">{item.offer.commerceName}</p>{item.offer.brand && <p className="text-xs text-green-600">{item.offer.brand}</p>}<p className="text-xs text-green-600 mt-0.5">{item.offer.distance.toFixed(1)} km · {item.offer.address}</p></div>
                          <div className="text-right"><p className="font-bold text-green-700">{fmt(item.offer.price)}</p><p className="text-xs text-green-600">/{item.unit}</p></div>
                        </div>
                        {item.offer.description && <p className="text-xs text-green-700/70 mt-1">{item.offer.description}</p>}
                      </div>
                    ) : (
                      <div className="mt-2 bg-gray-50 rounded-xl p-2.5"><p className="text-xs text-gray-400">Sin ofertas en el radio seleccionado</p></div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {listA.filter(i => !i.offer).length > 0 && (
              <div className="card border-orange-100 bg-orange-50"><p className="text-sm text-orange-700">⚠️ {listA.filter(i => !i.offer).length} productos sin oferta. Ampliá el radio o buscalos vos.</p></div>
            )}
          </div>
        )}

        {/* LIST B */}
        {activeTab === 'B' && (
          <div className="space-y-3">
            <div className="card bg-blue-50 border-blue-100 mb-2">
              <div className="flex justify-between items-start">
                <div><p className="font-bold text-blue-800">🗺️ Menor recorrido</p><p className="text-xs text-blue-700 mt-0.5">Mínima cantidad de comercios · {listB.length} paradas</p></div>
                <div className="text-right"><p className="text-xs text-blue-600">Estimado</p><p className="font-bold text-blue-800 text-lg">{fmt(totalB)}</p></div>
              </div>
              <div className="mt-3 flex gap-2">
                <button onClick={() => navigate('/consumer/map', { state: { listB, event } })} className="flex-1 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold active:scale-95">Ver ruta 🗺️</button>
                <button onClick={() => shareWhatsApp('B')} className="flex-1 py-2 bg-green-500 text-white rounded-xl text-sm font-semibold active:scale-95">WhatsApp 📤</button>
              </div>
            </div>
            {listB.map((stop, i) => (
              <div key={i} className="card">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">{i + 1}</div>
                  <div className="flex-1"><p className="font-bold text-gray-900 text-sm">{stop.commerceName}</p><p className="text-xs text-gray-400">{stop.address} · {stop.distance.toFixed(1)} km</p></div>
                  <div className="text-right"><p className="font-bold text-blue-700 text-sm">{fmt(stop.stopTotal)}</p><p className="text-xs text-gray-400">{stop.offers.length} productos</p></div>
                </div>
                <div className="space-y-1.5 pl-9">
                  {stop.offers.map((offer, j) => {
                    const item = shoppingList.find(p => p.name === offer.productName);
                    return (
                      <div key={j} className="flex justify-between items-center bg-gray-50 rounded-xl px-3 py-2">
                        <span className="text-sm text-gray-700">{item?.emoji} {offer.productName}</span>
                        <span className="text-sm font-semibold text-gray-900">{fmt(offer.price)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
            {uncoveredProducts.length > 0 && (
              <div className="card border-orange-100 bg-orange-50">
                <p className="font-semibold text-orange-800 text-sm mb-2">⚠️ Sin oferta ({uncoveredProducts.length})</p>
                {uncoveredProducts.map((p, i) => <p key={i} className="text-xs text-orange-700">{p.emoji} {p.name} — {fmtQty(p.quantity, p.unit)}</p>)}
              </div>
            )}
            {listB.length === 0 && (
              <div className="card text-center py-10">
                <div className="text-4xl mb-3">🔍</div>
                <p className="text-gray-500 text-sm">No encontramos ofertas en el radio seleccionado.</p>
                <button onClick={() => navigate('/consumer')} className="mt-4 btn-primary">Ampliar radio</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
