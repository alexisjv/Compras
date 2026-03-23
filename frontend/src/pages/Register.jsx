import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { register } = useAuth();

  const [role, setRole] = useState(params.get('role') || 'consumer');
  const [form, setForm] = useState({
    name: '', email: '', password: '',
    cuit: '', businessName: '', address: '', lat: '', lng: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);

  const handle = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const detectLocation = () => {
    if (!navigator.geolocation) return alert('Geolocalización no disponible');
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setForm(f => ({ ...f, lat: coords.latitude.toFixed(6), lng: coords.longitude.toFixed(6) }));
        setGeoLoading(false);
      },
      () => {
        setGeoLoading(false);
        alert('No se pudo obtener la ubicación');
      },
    );
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await register({ ...form, role });
      navigate(user.role === 'commerce' ? '/commerce' : '/consumer');
    } catch (err) {
      setError(err.response?.data?.error || 'Error al registrarse');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container flex flex-col min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-br from-brand-800 to-brand-600 px-6 pt-14 pb-10">
        <button onClick={() => navigate('/')} className="text-white/70 text-sm mb-6 flex items-center gap-1">
          ← Volver
        </button>
        <h1 className="text-3xl font-extrabold text-white">Crear cuenta</h1>
        <p className="text-white/70 mt-1">Empezá a planificar gratis</p>
      </div>

      {/* Role toggle */}
      <div className="px-6 pt-6">
        <div className="flex bg-gray-100 rounded-2xl p-1">
          {[
            { key: 'consumer', label: '🎉 Consumidor' },
            { key: 'commerce', label: '🏪 Comercio' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setRole(key)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                role === key ? 'bg-white text-brand-700 shadow-sm' : 'text-gray-500'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={submit} className="flex-1 px-6 pt-5 pb-8 space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl px-4 py-3 text-sm">
            {error}
          </div>
        )}

        <div>
          <label className="text-sm font-medium text-gray-700 mb-1.5 block">
            {role === 'commerce' ? 'Nombre del responsable' : 'Tu nombre'}
          </label>
          <input name="name" type="text" placeholder="Juan García" value={form.name} onChange={handle} required className="input-field" />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 mb-1.5 block">Email</label>
          <input name="email" type="email" placeholder="tu@email.com" value={form.email} onChange={handle} required className="input-field" />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 mb-1.5 block">Contraseña</label>
          <input name="password" type="password" placeholder="Mínimo 6 caracteres" minLength={6} value={form.password} onChange={handle} required className="input-field" />
        </div>

        {role === 'commerce' && (
          <>
            <div className="pt-2 border-t border-gray-100">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Datos del comercio</p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Nombre del comercio</label>
              <input name="businessName" type="text" placeholder="Supermercado El Sol" value={form.businessName} onChange={handle} required={role === 'commerce'} className="input-field" />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">CUIT</label>
              <input
                name="cuit"
                type="text"
                placeholder="20-12345678-9"
                value={form.cuit}
                onChange={handle}
                required={role === 'commerce'}
                pattern="\d{2}-\d{7,8}-\d"
                className="input-field"
              />
              <p className="text-xs text-gray-400 mt-1">Formato: 20-12345678-9</p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Dirección</label>
              <input name="address" type="text" placeholder="Av. Corrientes 1234, CABA" value={form.address} onChange={handle} required={role === 'commerce'} className="input-field" />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Ubicación del comercio</label>
              <div className="flex gap-2">
                <input name="lat" type="number" step="any" placeholder="Latitud" value={form.lat} onChange={handle} required={role === 'commerce'} className="input-field flex-1" />
                <input name="lng" type="number" step="any" placeholder="Longitud" value={form.lng} onChange={handle} required={role === 'commerce'} className="input-field flex-1" />
              </div>
              <button
                type="button"
                onClick={detectLocation}
                disabled={geoLoading}
                className="mt-2 w-full py-2.5 text-sm font-medium text-brand-700 border border-brand-200 rounded-xl bg-brand-50 active:scale-95 transition-all"
              >
                {geoLoading ? '📍 Detectando...' : '📍 Usar mi ubicación actual'}
              </button>
            </div>
          </>
        )}

        <div className="pt-2">
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Creando cuenta...' : 'Crear cuenta'}
          </button>
        </div>

        <p className="text-center text-sm text-gray-500">
          ¿Ya tenés cuenta?{' '}
          <Link to="/login" className="text-brand-700 font-semibold">
            Iniciá sesión
          </Link>
        </p>
      </form>
    </div>
  );
}
