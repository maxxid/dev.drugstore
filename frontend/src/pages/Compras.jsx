import { useState, useEffect } from 'react';
import api from '../api';
import Toast from '../components/Toast';
import { Search, Plus, X, Truck, Loader2 } from 'lucide-react';

export default function Compras() {
  const [compras, setCompras] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [productos, setProductos] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [proveedorId, setProveedorId] = useState('');
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);

  useEffect(() => {
    api.get('/compras').then((res) => setCompras(res.data));
    api.get('/proveedores').then((res) => setProveedores(res.data));
  }, []);

  const buscarProducto = async (q) => {
    setSearch(q);
    if (q.length < 2) { setResults([]); return; }
    const { data } = await api.get('/productos', { params: { search: q } });
    setResults(data.slice(0, 5));
  };

  const agregarItem = (producto) => {
    if (items.find((i) => i.producto_id === producto.id)) return;
    setItems([...items, {
      producto_id: producto.id,
      nombre: producto.nombre,
      cantidad: 1,
      precio_costo: parseFloat(producto.precio_costo),
    }]);
    setSearch('');
    setResults([]);
  };

  const actualizarItem = (idx, field, value) => {
    setItems(items.map((item, i) => i === idx ? { ...item, [field]: field === 'cantidad' ? parseInt(value) || 1 : parseFloat(value) || 0 } : item));
  };

  const eliminarItem = (idx) => setItems(items.filter((_, i) => i !== idx));

  const total = items.reduce((sum, item) => sum + item.precio_costo * item.cantidad, 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!proveedorId || items.length === 0) return;
    setLoading(true);
    setError('');
    try {
      const payload = { proveedor_id: parseInt(proveedorId), items: items.map((i) => ({
        producto_id: i.producto_id, cantidad: i.cantidad, precio_costo: i.precio_costo,
      }))};
      await api.post('/compras', payload);
      setToast({ type: 'success', message: 'Compra registrada correctamente' });
      setShowForm(false);
      setItems([]);
      setProveedorId('');
      const { data } = await api.get('/compras');
      setCompras(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al registrar compra');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Toast type={toast?.type} message={toast?.message} onClose={() => setToast(null)} />

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Compras</h2>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Plus size={18} /> Nueva Compra
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Nueva Compra</h3>
            <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
          </div>
          {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">{error}</div>}

          <div className="mb-4">
            <label className="block text-sm text-slate-500 mb-1">Proveedor</label>
            <select value={proveedorId} onChange={(e) => setProveedorId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Seleccionar...</option>
              {proveedores.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm text-slate-500 mb-1">Buscar Producto</label>
            <div className="relative">
              <input type="text" value={search} onChange={(e) => buscarProducto(e.target.value)}
                placeholder="Buscar por nombre..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
              {results.length > 0 && (
                <div className="absolute z-10 w-full bg-white border border-slate-200 rounded-lg mt-1 shadow-lg max-h-48 overflow-auto">
                  {results.map((p) => (
                    <button key={p.id} type="button" onClick={() => agregarItem(p)}
                      className="w-full text-left px-3 py-2 hover:bg-blue-50 text-sm border-b last:border-0">
                      <span className="font-medium">{p.nombre}</span>
                      <span className="text-slate-400 ml-2">${parseFloat(p.precio_costo).toFixed(2)}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="overflow-x-auto mb-4">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left p-2">Producto</th>
                  <th className="text-center p-2">Cant.</th>
                  <th className="text-right p-2">P. Costo</th>
                  <th className="text-right p-2">Subtotal</th>
                  <th className="p-2"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={idx} className="border-b">
                    <td className="p-2">{item.nombre}</td>
                    <td className="p-2 text-center">
                      <input type="number" min="1" value={item.cantidad}
                        onChange={(e) => actualizarItem(idx, 'cantidad', e.target.value)}
                        className="w-16 text-center border border-slate-300 rounded px-1 py-0.5" />
                    </td>
                    <td className="p-2 text-right">${item.precio_costo.toFixed(2)}</td>
                    <td className="p-2 text-right">${(item.precio_costo * item.cantidad).toFixed(2)}</td>
                    <td className="p-2">
                      <button onClick={() => eliminarItem(idx)} className="text-red-400 hover:text-red-600"><X size={14} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-between items-center">
            <span className="font-bold">Total: ${total.toFixed(2)}</span>
            <button onClick={handleSubmit} disabled={loading || items.length === 0 || !proveedorId}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? 'Registrando...' : 'Registrar Compra'}
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="text-left p-3 text-slate-500 font-medium">ID</th>
              <th className="text-left p-3 text-slate-500 font-medium">Proveedor</th>
              <th className="text-left p-3 text-slate-500 font-medium">Usuario</th>
              <th className="text-right p-3 text-slate-500 font-medium">Total</th>
              <th className="text-left p-3 text-slate-500 font-medium">Estado</th>
              <th className="text-left p-3 text-slate-500 font-medium">Fecha</th>
            </tr>
          </thead>
          <tbody>
            {compras.map((c) => (
              <tr key={c.id} className="border-b hover:bg-slate-50">
                <td className="p-3">#{c.id}</td>
                <td className="p-3">{c.Proveedor?.nombre || '—'}</td>
                <td className="p-3">{c.Usuario?.nombre || '—'}</td>
                <td className="p-3 text-right font-medium">${parseFloat(c.total).toFixed(2)}</td>
                <td className="p-3">
                  <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs">{c.estado}</span>
                </td>
                <td className="p-3 text-slate-500 text-xs">{new Date(c.created_at).toLocaleString()}</td>
              </tr>
            ))}
            {compras.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-8 text-slate-400">
                  <Truck size={24} className="mx-auto mb-2" />No hay compras registradas
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
