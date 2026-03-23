import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { catalog, eventPresets, categoryIcons } from '../../lib/catalog';
import { generateShoppingList } from '../../lib/storage';

const STEPS = ['Evento', 'Productos', 'Invitados', 'Ubicación'];
const ALL_CATEGORIES = Object.keys(categoryIcons);

export default function CreateEvent() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [step, setStep] = useState(0);
  const [event, setEvent] = useState({ type: null, selections: {}, guests: 10, userLat: null, userLng: null, radius: 3 });
  const [geoLoading, setGeoLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [activeCategory, setActiveCategory] = useState(null);

  const selectEventType = (typeKey) => {
    const preset = eventPresets[typeKey];
    setEvent(e => ({
      ...e,
      type: typeKey,
      selections: preset
        ? Object.fromEntries(Object.entries(preset.defaultSelections).map(([cat, prods]) => [cat, [...prods]]))
        : {},
    }));
  };

  const toggleProduct = (category, productName) => {
    setEvent(e => {
      const current = e.selections[category] || [];
      const updated = current.includes(productName) ? current.filter(p => p !== productName) : [...current, productName];
      return { ...e, selections: { ...e.selections, [category]: updated } };
    });
  };

  const detectLocation = () => {
    if (!navigator.geolocation) return alert('Geolocalización no disponible');
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => { setEvent(e => ({ ...e, userLat: coords.latitude, userLng: coords.longitude })); setGeoLoading(false); },
      () => { setGeoLoading(false); alert('No se pudo obtener la ubicación'); },
    );
  };

  const generate = () => {
    if (!event.userLat) return alert('Necesitás compartir tu ubicación');
    setGenerating(true);
    try {
      const result = generateShoppingList({
        selections: event.selections,
        guests: event.guests,
        userLat: event.userLat,
        userLng: event.userLng,
        radius: event.radius,
      });
      navigate('/consumer/shopping-list', { state: { result, event } });
    } catch (err) {
      alert(err.message || 'Error generando la lista');
    } finally {
      setGenerating(false);
    }
  };

  const canNext = () => {
    if (step === 0) return !!event.type;
    if (step === 1) return Object.values(event.selections).some(a => a.length > 0);
    if (step === 2) return event.guests >= 1;
    return true;
  };

  const currentCategory = activeCategory || ALL_CATEGORIES[0];

  return (
    <div className="page-container flex flex-col min-h-screen">
      {/* Top bar */}
      <div className="bg-gradient-to-br from-brand-800 to-brand-700 px-6 pt-12 pb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-white">Hola, {user.name.split(' ')[0]} 👋</h1>
            <p className="text-white/60 text-xs">Planificá tu evento</p>
          </div>
          <button onClick={logout} className="text-white/50 text-xs border border-white/20 rounded-lg px-3 py-1.5">Salir</button>
        </div>
        {/* Progress */}
        <div className="flex gap-1.5">
          {STEPS.map((_, i) => (
            <div key={i} className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${i <= step ? 'bg-white' : 'bg-white/25'}`} />
          ))}
        </div>
        <div className="flex justify-between mt-1">
          {STEPS.map((s, i) => (
            <span key={i} className={`text-xs ${i === step ? 'text-white font-semibold' : 'text-white/40'}`}>{s}</span>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col px-6 py-6 overflow-hidden">
        {/* STEP 0: Event type */}
        {step === 0 && (
          <div className="flex-1 overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-1">¿Qué tipo de evento?</h2>
            <p className="text-gray-500 text-sm mb-6">Elegí uno para empezar</p>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(eventPresets).map(([key, preset]) => (
                <button key={key} onClick={() => selectEventType(key)} className={`p-4 rounded-2xl border-2 text-left transition-all active:scale-95 ${event.type === key ? 'border-brand-600 bg-brand-50 shadow-md' : 'border-gray-100 bg-white'}`}>
                  <div className="text-4xl mb-2">{preset.emoji}</div>
                  <div className="font-semibold text-gray-900 text-sm">{preset.label}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{preset.description}</div>
                  {event.type === key && <div className="mt-2 text-xs text-brand-600 font-medium">✓ Seleccionado</div>}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 1: Products */}
        {step === 1 && (
          <div className="flex-1 flex flex-col min-h-0">
            <h2 className="text-xl font-bold text-gray-900 mb-1">¿Qué vas a ofrecer?</h2>
            <p className="text-gray-500 text-sm mb-4">Pre-seleccionamos para tu {eventPresets[event.type]?.label}. Personalizalos.</p>
            {/* Category tabs */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar mb-4 flex-shrink-0">
              {ALL_CATEGORIES.map(cat => {
                const selected = (event.selections[cat] || []).length;
                const isActive = currentCategory === cat;
                return (
                  <button key={cat} onClick={() => setActiveCategory(cat)} className={`flex-shrink-0 px-3 py-2 rounded-xl text-sm font-medium transition-all ${isActive ? 'bg-brand-700 text-white' : 'bg-gray-100 text-gray-600'}`}>
                    {categoryIcons[cat]} {cat}
                    {selected > 0 && <span className={`ml-1.5 text-xs ${isActive ? 'text-white/80' : 'text-brand-600'}`}>({selected})</span>}
                  </button>
                );
              })}
            </div>
            {/* Products */}
            <div className="flex-1 overflow-y-auto">
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(catalog).filter(([, p]) => p.category === currentCategory).map(([name, product]) => {
                  const selected = (event.selections[product.category] || []).includes(name);
                  return (
                    <button key={name} onClick={() => toggleProduct(product.category, name)} className={`p-3 rounded-2xl border-2 text-left transition-all active:scale-95 ${selected ? 'border-brand-500 bg-brand-50' : 'border-gray-100 bg-white'}`}>
                      <div className="text-2xl mb-1">{product.emoji}</div>
                      <div className="text-sm font-medium text-gray-900 leading-tight">{name}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{product.perEvent ? `${product.perEvent} ${product.unit}` : `${product.perPerson} ${product.unit}/pers.`}</div>
                      {selected && <div className="text-xs text-brand-600 font-medium mt-1">✓</div>}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Guests */}
        {step === 2 && (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <div className="text-6xl mb-6">👥</div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">¿Cuántos invitados?</h2>
            <p className="text-gray-500 text-sm mb-10">Calculamos las cantidades exactas</p>
            <div className="flex items-center gap-6">
              <button onClick={() => setEvent(e => ({ ...e, guests: Math.max(1, e.guests - 1) }))} className="w-14 h-14 rounded-full bg-gray-100 text-gray-700 text-2xl font-bold active:scale-90 transition-all flex items-center justify-center">−</button>
              <div>
                <div className="text-7xl font-extrabold text-brand-700">{event.guests}</div>
                <div className="text-gray-400 text-sm mt-1">personas</div>
              </div>
              <button onClick={() => setEvent(e => ({ ...e, guests: e.guests + 1 }))} className="w-14 h-14 rounded-full bg-brand-700 text-white text-2xl font-bold active:scale-90 transition-all flex items-center justify-center">+</button>
            </div>
            <div className="mt-10 w-full bg-brand-50 rounded-2xl p-4">
              <p className="text-sm font-semibold text-brand-700 mb-2">Resumen</p>
              <div className="flex justify-between text-sm"><span className="text-gray-600">Tipo</span><span className="font-medium">{eventPresets[event.type]?.emoji} {eventPresets[event.type]?.label}</span></div>
              <div className="flex justify-between text-sm mt-1"><span className="text-gray-600">Productos</span><span className="font-medium">{Object.values(event.selections).flat().length}</span></div>
            </div>
          </div>
        )}

        {/* STEP 3: Location */}
        {step === 3 && (
          <div className="flex-1 overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-1">Tu ubicación</h2>
            <p className="text-gray-500 text-sm mb-6">Buscamos ofertas en un radio alrededor tuyo</p>
            <div className={`w-full h-40 rounded-2xl mb-4 flex items-center justify-center ${event.userLat ? 'bg-green-50 border-2 border-green-200' : 'bg-gray-100'}`}>
              {event.userLat ? (
                <div className="text-center">
                  <div className="text-4xl mb-2">📍</div>
                  <p className="text-green-700 font-semibold text-sm">Ubicación detectada</p>
                  <p className="text-green-600 text-xs mt-1">{event.userLat.toFixed(4)}, {event.userLng.toFixed(4)}</p>
                </div>
              ) : (
                <div className="text-center text-gray-400"><div className="text-4xl mb-2">🗺️</div><p className="text-sm">Sin ubicación aún</p></div>
              )}
            </div>
            <button onClick={detectLocation} disabled={geoLoading} className="btn-primary mb-6">
              {geoLoading ? '📍 Detectando...' : event.userLat ? '📍 Actualizar ubicación' : '📍 Usar mi ubicación actual'}
            </button>
            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="text-sm font-semibold text-gray-700">Radio de búsqueda</label>
                <span className="text-brand-700 font-bold text-lg">{event.radius} km</span>
              </div>
              <input type="range" min={0.5} max={15} step={0.5} value={event.radius} onChange={(e) => setEvent(ev => ({ ...ev, radius: parseFloat(e.target.value) }))} className="w-full accent-brand-600" />
              <div className="flex justify-between text-xs text-gray-400 mt-1"><span>500 m</span><span>15 km</span></div>
            </div>
            <div className="mt-6 bg-brand-50 rounded-2xl p-4 text-sm">
              <p className="font-semibold text-brand-800 mb-1">¿Cómo funciona?</p>
              <p className="text-brand-700/70 text-xs leading-relaxed">Buscamos comercios dentro de {event.radius} km con ofertas para tus productos y generamos dos listas optimizadas.</p>
            </div>
          </div>
        )}
      </div>

      {/* Bottom nav */}
      <div className="px-6 pb-8 pt-4 bg-white border-t border-gray-100 flex-shrink-0">
        <div className="flex gap-3">
          {step > 0 && (
            <button onClick={() => setStep(s => s - 1)} className="btn-secondary flex-none px-6 w-auto">← Atrás</button>
          )}
          {step < STEPS.length - 1 ? (
            <button onClick={() => { setStep(s => s + 1); setActiveCategory(null); }} disabled={!canNext()} className="btn-primary flex-1">Siguiente →</button>
          ) : (
            <button onClick={generate} disabled={generating || !event.userLat} className="btn-primary flex-1">
              {generating ? '⏳ Generando...' : '🔍 Ver ofertas y lista'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
