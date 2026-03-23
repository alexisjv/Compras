import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { catalog } from '../../lib/catalog';
import { createOffer } from '../../lib/storage';

const defaultExpiry = () => {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d.toISOString().split('T')[0];
};

export default function CreateOffer() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [form, setForm] = useState({ productName: '', price: '', brand: '', description: '', expiresAt: defaultExpiry() });
  const [customProduct, setCustomProduct] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  const handle = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  const filteredProducts = Object.keys(catalog).filter(n => n.toLowerCase().includes(search.toLowerCase()));

  const selectProduct = (name) => { setForm(f => ({ ...f, productName: name })); setSearch(''); };

  const submit = (e) => {
    e.preventDefault();
    if (!form.productName) return setError('Seleccioná un producto');
    if (!form.price || isNaN(parseFloat(form.price))) return setError('Precio inválido');
    setError('');
    setLoading(true);
    try {
      createOffer({ ...form, userId: user.id, price: parseFloat(form.price) });
      navigate('/commerce');
    } catch (err) {
      setError(err.message || 'Error publicando la oferta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container flex flex-col min-h-screen">
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 px-6 pt-12 pb-6">
        <button onClick={() => navigate('/commerce')} className="text-white/60 text-sm mb-4">← Volver</button>
        <h1 className="text-2xl font-bold text-white">Nueva oferta</h1>
        <p className="text-white/50 text-sm mt-1">Publicá tu precio para que te encuentren</p>
      </div>

      <form onSubmit={submit} className="flex-1 px-6 pt-6 pb-8 space-y-5">
        {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl px-4 py-3 text-sm">{error}</div>}

        {/* Product */}
        <div>
          <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Producto *</label>
          {form.productName && !customProduct ? (
            <div className="flex items-center gap-2 bg-brand-50 border-2 border-brand-300 rounded-2xl px-4 py-3">
              <span className="flex-1 font-semibold text-brand-800">{form.productName}</span>
              <button type="button" onClick={() => setForm(f => ({ ...f, productName: '' }))} className="text-brand-500 text-sm">Cambiar</button>
            </div>
          ) : (
            <>
              <input type="text" placeholder="Buscar producto del catálogo..." value={search} onChange={e => setSearch(e.target.value)} className="input-field mb-2" />
              {search.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-lg max-h-48 overflow-y-auto">
                  {filteredProducts.length > 0 ? filteredProducts.slice(0, 8).map(name => (
                    <button key={name} type="button" onClick={() => selectProduct(name)} className="w-full text-left px-4 py-3 hover:bg-brand-50 text-sm border-b border-gray-50 last:border-0">
                      <span className="mr-2">{catalog[name]?.emoji}</span>{name}
                      <span className="text-gray-400 text-xs ml-1">— {catalog[name]?.category}</span>
                    </button>
                  )) : <div className="px-4 py-3 text-sm text-gray-400">Sin resultados</div>}
                </div>
              )}
              <button type="button" onClick={() => { setCustomProduct(true); setForm(f => ({ ...f, productName: search || '' })); }} className="text-xs text-brand-600 mt-1">
                + Escribir producto personalizado
              </button>
            </>
          )}
          {customProduct && (
            <input name="productName" type="text" placeholder="Nombre del producto" value={form.productName} onChange={handle} required className="input-field mt-2" />
          )}
        </div>

        {/* Price */}
        <div>
          <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Precio *</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
            <input name="price" type="number" step="0.01" min="0" placeholder="0.00" value={form.price} onChange={handle} required className="input-field pl-8" />
          </div>
          <p className="text-xs text-gray-400 mt-1">Precio por unidad (kg, lt, unidad, etc.)</p>
        </div>

        {/* Brand */}
        <div>
          <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Marca <span className="text-gray-400 font-normal">(opcional)</span></label>
          <input name="brand" type="text" placeholder="Ej: La Serenísima, Marolio..." value={form.brand} onChange={handle} className="input-field" />
        </div>

        {/* Description */}
        <div>
          <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Descripción <span className="text-gray-400 font-normal">(opcional)</span></label>
          <textarea name="description" placeholder="Ej: Precio por kilo, oferta de la semana..." value={form.description} onChange={handle} rows={2} className="input-field resize-none" />
        </div>

        {/* Expiry */}
        <div>
          <label className="text-sm font-semibold text-gray-700 mb-1.5 block">
            Válida hasta * <span className="text-xs text-gray-400 font-normal">(por la inflación 😅)</span>
          </label>
          <input name="expiresAt" type="date" value={form.expiresAt} onChange={handle} min={new Date().toISOString().split('T')[0]} required className="input-field" />
        </div>

        {/* Commerce info */}
        <div className="bg-gray-50 rounded-2xl p-4 text-sm">
          <p className="font-semibold text-gray-700 mb-1">Se publicará como:</p>
          <p className="text-gray-500">{user.businessName}</p>
          <p className="text-gray-400 text-xs">{user.address}</p>
        </div>

        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? 'Publicando...' : '📢 Publicar oferta'}
        </button>
      </form>
    </div>
  );
}
