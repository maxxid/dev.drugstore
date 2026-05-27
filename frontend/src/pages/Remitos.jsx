import { useState, useEffect } from 'react';
import api from '../api';
import Toast from '../components/Toast';
import { Plus, X, FileText, Loader2, Search, Truck } from 'lucide-react';

export default function Remitos() {
  const [remitos, setRemitos] = useState([]);
  const [productos, setProductos] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [tipo, setTipo] = useState('entrada');
  const [proveedorId, setProveedorId] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [searchingProduct, setSearchingProduct] = useState(false);

  useEffect(() => {
    loadRemitos();
    api.get('/productos', { params: { search: '' } }).then((res) => setProductos(res.data));
    api.get('/proveedores').then((res) => setProveedores(res.data));
  }, []);

  const loadRemitos = () => {
    api.get('/remitos').then((res) => setRemitos(res.data));
  };

  const buscarProducto = async (q) => {
    setSearch(q);
    if (q.length < 2) { setResults([]); return; }
    setSearchingProduct(true);
    try {
      const { data } = await api.get('/productos', { params: { search: q } });
      setResults(data.slice(0, 5));
    } finally { setSearchingProduct(false); }
  };

  const agregarItem = (producto) => {
    if (items.find((i) => i.producto_id === producto.id)) return;
    setItems([...items, { producto_id: producto.id, nombre: producto.nombre, cantidad: 1 }]);
    setSearch('');
    setResults([]);
  };

  const actualizarItem = (idx, cantidad) => {
    setItems(items.map((item, i) => i === idx ? { ...item, cantidad: parseInt(cantidad) || 1 } : item));
  };

  const eliminarItem = (idx) => setItems(items.filter((_, i) => i !== idx));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (items.length === 0) return;
    setLoading(true);
    setError('');
    try {
      const payload = {
        tipo,
        proveedor_id: proveedorId ? parseInt(proveedorId) : null,
        items: items.map((i) => ({ producto_id: i.producto_id, cantidad: i.cantidad })),
        observaciones,
      };
      await api.post('/remitos', payload);
      setToast({ type: 'success', message: `Remito de ${tipo} registrado` });
      setShowForm(false);
      setItems([]);
      setProveedorId('');
      setObservaciones('');
      setTipo('entrada');
      loadRemitos();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al registrar remito');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Toast type={toast?.type} message={toast?.message} onClose={() => setToast(null)} />

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Remitos</h2>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Plus size={18} /> Nuevo Remito
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Nuevo Remito</h3>
            <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
          </div>
          {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">{error}</div>}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm text-slate-500 mb-1">Tipo</label>
              <select value={tipo} onChange={(e) => setTipo(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500">
                <option value="entrada">Entrada</option>
                <option value="salida">Salida</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-500 mb-1">Proveedor</label>
              <select value={proveedorId} onChange={(e) => setProveedorId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Sin proveedor</option>
                {proveedores.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-500 mb-1">Observaciones</label>
              <input value={observaciones} onChange={(e) => setObservaciones(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Opcional" />
            </div>
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
                      <span className="text-slate-400 ml-2 text-xs">{p.codigo_barras}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <table className="w-full text-sm mb-4">
            <thead>
              <tr className="border-b text-left text-slate-500">
                <th className="pb-2 font-medium">Producto</th>
                <th className="pb-2 font-medium text-center w-24">Cantidad</th>
                <th className="pb-2 w-8"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={idx} className="border-b">
                  <td className="py-2">{item.nombre}</td>
                  <td className="py-2 text-center">
                    <input type="number" min="1" value={item.cantidad}
                      onChange={(e) => actualizarItem(idx, e.target.value)}
                      className="w-16 text-center border border-slate-300 rounded px-1 py-0.5" />
                  </td>
                  <td className="py-2">
                    <button onClick={() => eliminarItem(idx)} className="text-red-400 hover:text-red-600"><X size={14} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex justify-end">
            <button onClick={handleSubmit} disabled={loading || items.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? 'Registrando...' : 'Registrar Remito'}
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="text-left p-3 text-slate-500 font-medium">Numero</th>
              <th className="text-left p-3 text-slate-500 font-medium">Tipo</th>
              <th className="text-left p-3 text-slate-500 font-medium">Proveedor</th>
              <th className="text-left p-3 text-slate-500 font-medium">Usuario</th>
              <th className="text-center p-3 text-slate-500 font-medium">Items</th>
              <th className="text-left p-3 text-slate-500 font-medium">Observaciones</th>
              <th className="text-left p-3 text-slate-500 font-medium">Fecha</th>
            </tr>
          </thead>
          <tbody>
            {remitos.map((r) => (
              <tr key={r.id} className="border-b hover:bg-slate-50">
                <td className="p-3 font-mono text-xs text-blue-600">{r.numero}</td>
                <td className="p-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${r.tipo === 'entrada' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {r.tipo}
                  </span>
                </td>
                <td className="p-3">{r.Proveedor?.nombre || '—'}</td>
                <td className="p-3">{r.Usuario?.nombre || '—'}</td>
                <td className="p-3 text-center">{r.DetalleRemitos?.length || 0}</td>
                <td className="p-3 text-xs text-slate-400">{r.observaciones || '—'}</td>
                <td className="p-3 text-xs text-slate-400">{new Date(r.created_at).toLocaleString()}</td>
              </tr>
            ))}
            {remitos.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-8 text-slate-400">
                  <FileText size={24} className="mx-auto mb-2" />No hay remitos registrados
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
