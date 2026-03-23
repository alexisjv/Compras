import { useNavigate } from 'react-router-dom';

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="page-container flex flex-col min-h-screen">
      {/* Hero */}
      <div className="relative bg-gradient-to-br from-brand-800 via-brand-700 to-purple-500 px-6 pt-16 pb-20 overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-32 translate-x-32" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24" />
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 mb-6">
            <span className="text-sm text-white/90 font-medium">🇦🇷 Hecho para Argentina</span>
          </div>
          <h1 className="text-5xl font-extrabold text-white mb-3 leading-tight">
            Eventify
          </h1>
          <p className="text-xl text-white/80 font-medium mb-2">
            Planificá tu evento sin estrés
          </p>
          <p className="text-white/60 text-sm leading-relaxed">
            Lista de compras inteligente con las mejores ofertas cerca tuyo.
            Sin vueltas, sin sorpresas.
          </p>
        </div>
      </div>

      {/* Main CTAs */}
      <div className="px-6 -mt-6 relative z-20 space-y-3">
        <button
          onClick={() => navigate('/register?role=consumer')}
          className="w-full py-4 bg-white text-brand-700 font-bold rounded-2xl shadow-lg shadow-brand-200 text-lg active:scale-95 transition-all"
        >
          🎉 Planificar mi evento
        </button>
        <button
          onClick={() => navigate('/register?role=commerce')}
          className="w-full py-4 bg-brand-700 text-white font-bold rounded-2xl border-2 border-brand-600 text-base active:scale-95 transition-all"
        >
          🏪 Soy comerciante
        </button>
      </div>

      {/* Already have account */}
      <div className="text-center mt-4 px-6">
        <span className="text-gray-500 text-sm">¿Ya tenés cuenta? </span>
        <button
          onClick={() => navigate('/login')}
          className="text-brand-700 font-semibold text-sm"
        >
          Iniciá sesión
        </button>
      </div>

      {/* How it works */}
      <div className="px-6 mt-10">
        <h2 className="text-xl font-bold text-gray-900 mb-5">¿Cómo funciona?</h2>
        <div className="space-y-4">
          {[
            { icon: '🎯', title: 'Elegí tu evento', desc: 'Asado, cumpleaños, reunión y más' },
            { icon: '📋', title: 'Lista automática', desc: 'Cantidades calculadas según tus invitados' },
            { icon: '💰', title: 'Mejores precios', desc: 'Comparamos ofertas de comercios cercanos' },
            { icon: '🗺️', title: 'Tu ruta óptima', desc: 'El camino más corto entre los comercios' },
          ].map((step, i) => (
            <div key={i} className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-brand-50 flex items-center justify-center text-2xl flex-shrink-0">
                {step.icon}
              </div>
              <div className="pt-0.5">
                <p className="font-semibold text-gray-900">{step.title}</p>
                <p className="text-sm text-gray-500">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* For businesses */}
      <div className="mx-6 mt-10 mb-8 bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-6 text-white">
        <div className="text-3xl mb-3">🏪</div>
        <h3 className="text-lg font-bold mb-2">¿Tenés un comercio?</h3>
        <p className="text-white/70 text-sm leading-relaxed mb-4">
          Publicá tus ofertas y llegá a miles de personas organizando eventos cerca tuyo.
          Competí por el mejor precio de la zona.
        </p>
        <div className="space-y-2">
          {['Publicá hasta 5 ofertas gratis', 'Visibilidad en resultados de búsqueda', 'Más ventas sin publicidad cara'].map((f, i) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              <span className="text-green-400">✓</span>
              <span className="text-white/80">{f}</span>
            </div>
          ))}
        </div>
        <button
          onClick={() => navigate('/register?role=commerce')}
          className="mt-5 w-full py-3 bg-white text-gray-900 font-bold rounded-xl active:scale-95 transition-all text-sm"
        >
          Registrar mi comercio →
        </button>
      </div>
    </div>
  );
}
