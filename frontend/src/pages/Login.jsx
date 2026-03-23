import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handle = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      navigate(user.role === 'commerce' ? '/commerce' : '/consumer');
    } catch (err) {
      setError(err.response?.data?.error || 'Error al iniciar sesión');
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
        <h1 className="text-3xl font-extrabold text-white">Bienvenido</h1>
        <p className="text-white/70 mt-1">Iniciá sesión para continuar</p>
      </div>

      <form onSubmit={submit} className="flex-1 px-6 pt-8 pb-8 space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl px-4 py-3 text-sm">
            {error}
          </div>
        )}

        <div>
          <label className="text-sm font-medium text-gray-700 mb-1.5 block">Email</label>
          <input
            name="email"
            type="email"
            placeholder="tu@email.com"
            value={form.email}
            onChange={handle}
            required
            className="input-field"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 mb-1.5 block">Contraseña</label>
          <input
            name="password"
            type="password"
            placeholder="••••••••"
            value={form.password}
            onChange={handle}
            required
            className="input-field"
          />
        </div>

        <div className="pt-2">
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </div>

        <p className="text-center text-sm text-gray-500 pt-2">
          ¿No tenés cuenta?{' '}
          <Link to="/register" className="text-brand-700 font-semibold">
            Registrate
          </Link>
        </p>
      </form>
    </div>
  );
}
