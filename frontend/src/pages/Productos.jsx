import { useState, useEffect, useRef } from 'react';
import api from '../api';
import Toast from '../components/Toast';
import Modal from '../components/Modal';
import { Search, Plus, Edit2, Trash2, Package, X, Download, Upload, Loader2, Users, ChevronDown, Filter, Percent } from 'lucide-react';

export default function Productos() {
  const [productos, setProductos] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [toast, setToast] = useState(null);
  const [proveedorFilter, setProveedorFilter] = useState('');
  const [sortBy, setSortBy] = useState('');
  const [historialProducto, setHistorialProducto] = useState(null);
  const [historial, setHistorial] = useState([]);
  const [loadingHistorial, setLoadingHistorial] = useState(false);
  const [ofertaProducto, setOfertaProducto] = useState(null);
  const [ofertaForm, setOfertaForm] = useState({ tipo: 'porcentaje', valor: '', fecha_inicio: '', fecha_fin: '', descripcion: '' });
  const [savingOferta, setSavingOferta] = useState(false);
  const fileInputRef = useRef(null);
  const [form, setForm] = useState({
    codigo_barras: '', nombre: '', descripcion: '', categoria_id: '',
    precio_costo: '0', precio_venta: '0', stock: '0', stock_minimo: '5',
  });

  const load = () => {
    const params = { search };
    if (proveedorFilter) params.proveedor_id = proveedorFilter;
    if (sortBy) params.sort = sortBy;
    api.get('/productos', { params }).then((res) => setProductos(res.data));
  };

  useEffect(() => {
    api.get('/proveedores').then((res) => setProveedores(res.data));
  }, []);

  useEffect(() => { load(); }, [search, proveedorFilter, sortBy]);

  const cleanForm = (data) => {
    const cleaned = { ...data };
    if (cleaned.categoria_id === '' || cleaned.categoria_id === undefined) cleaned.categoria_id = null;
    if (cleaned.descripcion === '') cleaned.descripcion = null;
    if (cleaned.precio_costo === '' || cleaned.precio_costo === undefined) cleaned.precio_costo = '0';
    if (cleaned.precio_venta === '' || cleaned.precio_venta === undefined) cleaned.precio_venta = '0';
    if (cleaned.stock === '' || cleaned.stock === undefined) cleaned.stock = '0';
    if (cleaned.stock_minimo === '' || cleaned.stock_minimo === undefined) cleaned.stock_minimo = '5';
    return cleaned;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = cleanForm(form);
      if (editing) {
        await api.put(`/productos/${editing}`, payload);
        setToast({ type: 'success', message: 'Producto actualizado' });
      } else {
        await api.post('/productos', payload);
        setToast({ type: 'success', message: 'Producto creado' });
      }
      setShowForm(false);
      setEditing(null);
      resetForm();
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (producto) => {
    setEditing(producto.id);
    setForm({
      codigo_barras: producto.codigo_barras,
      nombre: producto.nombre,
      descripcion: producto.descripcion || '',
      categoria_id: producto.categoria_id || '',
      precio_costo: producto.precio_costo,
      precio_venta: producto.precio_venta,
      stock: producto.stock,
      stock_minimo: producto.stock_minimo,
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Desactivar este producto?')) return;
    setDeleting(id);
    try {
      await api.delete(`/productos/${id}`);
      setToast({ type: 'success', message: 'Producto desactivado' });
      load();
    } catch (err) {
      setToast({ type: 'error', message: err.response?.data?.error || 'Error al eliminar' });
    } finally {
      setDeleting(null);
    }
  };

  const resetForm = () => {
    setForm({
      codigo_barras: '', nombre: '', descripcion: '', categoria_id: '',
      precio_costo: '0', precio_venta: '0', stock: '0', stock_minimo: '5',
    });
  };

  const exportarCSV = async () => {
    setExporting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('https://kiosko-manager-jet.vercel.app/api/productos/exportar', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Error al exportar');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `productos_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      setToast({ type: 'success', message: 'CSV exportado correctamente' });
    } catch (err) {
      setToast({ type: 'error', message: 'Error al exportar CSV' });
    } finally {
      setExporting(false);
    }
  };

  const importarCSV = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch('https://kiosko-manager-jet.vercel.app/api/productos/importar', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Error al importar');
      setToast({ type: 'success', message: data.message || 'CSV importado' });
      load();
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Error al importar CSV' });
    } finally {
      setImporting(false);
    }
    e.target.value = '';
  };

  const verHistorial = async (producto) => {
    setHistorialProducto(producto);
    setHistorial([]);
    setLoadingHistorial(true);
    try {
      const { data } = await api.get(`/productos/${producto.id}/historial-precios`);
      setHistorial(data);
    } catch (err) {
      setToast({ type: 'error', message: 'Error al cargar historial' });
    } finally {
      setLoadingHistorial(false);
    }
  };

  const abrirOferta = (producto) => {
    setOfertaProducto(producto);
    const activa = producto.Oferta?.[0];
    setOfertaForm(activa ? {
      tipo: activa.tipo, valor: activa.valor,
      fecha_inicio: activa.fecha_inicio, fecha_fin: activa.fecha_fin,
      descripcion: activa.descripcion || '',
    } : { tipo: 'porcentaje', valor: '', fecha_inicio: '', fecha_fin: '', descripcion: '' });
  };

  const guardarOferta = async () => {
    if (!ofertaProducto) return;
    setSavingOferta(true);
    try {
      const activa = ofertaProducto.Oferta?.[0];
      if (activa) {
        await api.put(`/ofertas/${activa.id}`, ofertaForm);
        setToast({ type: 'success', message: 'Oferta actualizada' });
      } else {
        await api.post('/ofertas', { ...ofertaForm, producto_id: ofertaProducto.id });
        setToast({ type: 'success', message: 'Oferta creada' });
      }
      load();
      setOfertaProducto(null);
    } catch (err) {
      setToast({ type: 'error', message: err.response?.data?.error || 'Error al guardar oferta' });
    } finally {
      setSavingOferta(false);
    }
  };

  const desactivarOferta = async () => {
    if (!ofertaProducto?.Oferta?.[0]) return;
    setSavingOferta(true);
    try {
      await api.delete(`/ofertas/${ofertaProducto.Oferta[0].id}`);
      setToast({ type: 'success', message: 'Oferta desactivada' });
      load();
      setOfertaProducto(null);
    } catch (err) {
      setToast({ type: 'error', message: 'Error al desactivar oferta' });
    } finally {
      setSavingOferta(false);
    }
  };

  return (
    <div>
      <Toast type={toast?.type} message={toast?.message} onClose={() => setToast(null)} />

      <Modal
        open={!!historialProducto}
        onClose={() => setHistorialProducto(null)}
        title={`Historial de precios: ${historialProducto?.nombre || ''}`}
      >
        {loadingHistorial ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={24} className="animate-spin text-slate-400" />
          </div>
        ) : historial.length === 0 ? (
          <p className="text-slate-400 text-center py-4">Sin historial de compras</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-slate-500">
                <th className="pb-2 font-medium">Proveedor</th>
                <th className="pb-2 font-medium text-right">Precio</th>
                <th className="pb-2 font-medium text-center">Cant.</th>
                <th className="pb-2 font-medium text-right">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {historial.map((h, i) => (
                <tr key={i} className="border-b last:border-0">
                  <td className="py-2">{h.proveedor}</td>
                  <td className="py-2 text-right font-medium">${h.precio.toFixed(2)}</td>
                  <td className="py-2 text-center">{h.cantidad}</td>
                  <td className="py-2 text-right text-slate-400 text-xs">{new Date(h.fecha).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Modal>

      <Modal
        open={!!ofertaProducto}
        onClose={() => setOfertaProducto(null)}
        title={`Oferta: ${ofertaProducto?.nombre || ''}`}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-slate-500 mb-1">Tipo</label>
            <select value={ofertaForm.tipo} onChange={(e) => setOfertaForm({ ...ofertaForm, tipo: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500">
              <option value="porcentaje">Porcentaje (%)</option>
              <option value="fijo">Monto fijo ($)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-500 mb-1">
              {ofertaForm.tipo === 'porcentaje' ? 'Porcentaje (%)' : 'Descuento ($)'}
            </label>
            <input type="number" step="0.01" min="0" value={ofertaForm.valor}
              onChange={(e) => setOfertaForm({ ...ofertaForm, valor: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={ofertaForm.tipo === 'porcentaje' ? 'Ej: 20' : 'Ej: 500'} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-slate-500 mb-1">Fecha inicio</label>
              <input type="date" value={ofertaForm.fecha_inicio}
                onChange={(e) => setOfertaForm({ ...ofertaForm, fecha_inicio: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm text-slate-500 mb-1">Fecha fin</label>
              <input type="date" value={ofertaForm.fecha_fin}
                onChange={(e) => setOfertaForm({ ...ofertaForm, fecha_fin: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm text-slate-500 mb-1">Descripcion</label>
            <input value={ofertaForm.descripcion} onChange={(e) => setOfertaForm({ ...ofertaForm, descripcion: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ej: 2x1, verano, etc." />
          </div>
          <div className="flex gap-2 justify-end pt-2 border-t">
            {ofertaProducto?.Oferta?.[0] && (
              <button onClick={desactivarOferta} disabled={savingOferta}
                className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50 text-sm">
                Desactivar
              </button>
            )}
            <button onClick={guardarOferta} disabled={savingOferta || !ofertaForm.valor || !ofertaForm.fecha_inicio || !ofertaForm.fecha_fin}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm">
              {savingOferta && <Loader2 size={14} className="animate-spin" />}
              {savingOferta ? 'Guardando...' : ofertaProducto?.Oferta?.[0] ? 'Actualizar' : 'Crear Oferta'}
            </button>
          </div>
        </div>
      </Modal>

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Productos</h2>
        <div className="flex gap-2">
          <button
            onClick={exportarCSV}
            disabled={exporting}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-60 text-sm"
          >
            {exporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            {exporting ? 'Exportando...' : 'Exportar CSV'}
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
            className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-60 text-sm"
          >
            {importing ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
            {importing ? 'Importando...' : 'Importar CSV'}
          </button>
          <input type="file" ref={fileInputRef} accept=".csv" onChange={importarCSV} className="hidden" />
          <button
            onClick={() => { resetForm(); setEditing(null); setShowForm(!showForm); }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus size={18} /> Nuevo Producto
          </button>
        </div>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">{editing ? 'Editar' : 'Nuevo'} Producto</h3>
            <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600">
              <X size={18} />
            </button>
          </div>
          {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">{error}</div>}
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-slate-500 mb-1">Codigo de Barras *</label>
              <input
                value={form.codigo_barras}
                onChange={(e) => setForm({ ...form, codigo_barras: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-slate-500 mb-1">Nombre *</label>
              <input
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-slate-500 mb-1">Precio Costo *</label>
              <input
                type="number" step="0.01" min="0"
                value={form.precio_costo}
                onChange={(e) => setForm({ ...form, precio_costo: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-slate-500 mb-1">Precio Venta *</label>
              <input
                type="number" step="0.01" min="0"
                value={form.precio_venta}
                onChange={(e) => setForm({ ...form, precio_venta: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-slate-500 mb-1">Stock</label>
              <input
                type="number" min="0"
                value={form.stock}
                onChange={(e) => setForm({ ...form, stock: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-500 mb-1">Stock Minimo</label>
              <input
                type="number" min="0"
                value={form.stock_minimo}
                onChange={(e) => setForm({ ...form, stock_minimo: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="md:col-span-3 flex gap-2 justify-end">
              <button type="button" onClick={() => setShowForm(false)}
                className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50">
                Cancelar
              </button>
              <button type="submit" disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60">
                {loading && <Loader2 size={16} className="animate-spin" />}
                {loading ? 'Guardando...' : editing ? 'Actualizar' : 'Crear'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm p-4 mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre o codigo..."
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="relative">
          <select
            value={proveedorFilter}
            onChange={(e) => setProveedorFilter(e.target.value)}
            className="appearance-none pl-3 pr-8 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm text-slate-600 bg-white"
          >
            <option value="">Todos los proveedores</option>
            {proveedores.map((p) => (
              <option key={p.id} value={p.id}>{p.nombre}</option>
            ))}
          </select>
          <Filter size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>
        <div className="relative">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="appearance-none pl-3 pr-8 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm text-slate-600 bg-white"
          >
            <option value="">Orden: Nombre</option>
            <option value="stock_asc">Stock ↑</option>
            <option value="stock_desc">Stock ↓</option>
            <option value="weekly_movement">Movimiento semanal</option>
          </select>
          <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="text-left p-3 text-slate-500 font-medium">Codigo</th>
              <th className="text-left p-3 text-slate-500 font-medium">Nombre</th>
              <th className="text-right p-3 text-slate-500 font-medium">P. Costo</th>
              <th className="text-right p-3 text-slate-500 font-medium">P. Venta</th>
              <th className="text-center p-3 text-slate-500 font-medium">Stock</th>
              <th className="text-center p-3 text-slate-500 font-medium">Proveedores</th>
              <th className="text-center p-3 text-slate-500 font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {productos.map((p) => (
              <tr key={p.id} className="border-b hover:bg-slate-50">
                <td className="p-3 text-slate-400 text-xs">{p.codigo_barras}</td>
                <td className="p-3">
                  <span className="font-medium">{p.nombre}</span>
                  {p.Oferta?.[0] && (
                    <span className="ml-2 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                      <Percent size={10} />
                      {p.Oferta[0].tipo === 'porcentaje' ? `${p.Oferta[0].valor}%` : `$${p.Oferta[0].valor}`}
                    </span>
                  )}
                </td>
                <td className="p-3 text-right">${parseFloat(p.precio_costo).toFixed(2)}</td>
                <td className="p-3 text-right">${parseFloat(p.precio_venta).toFixed(2)}</td>
                <td className="p-3 text-center">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    p.stock <= p.stock_minimo ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                  }`}>
                    {p.stock}
                  </span>
                </td>
                <td className="p-3 text-center">
                  {p.ProductoProveedors?.length > 0 ? (
                    <button
                      onClick={() => verHistorial(p)}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors"
                    >
                      <Users size={11} />
                      {p.ProductoProveedors.length}
                    </button>
                  ) : (
                    <span className="text-xs text-slate-300">—</span>
                  )}
                </td>
                <td className="p-3">
                  <div className="flex justify-center gap-1">
                    <button onClick={() => handleEdit(p)} className="p-1 text-blue-500 hover:bg-blue-50 rounded">
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => abrirOferta(p)} className={`p-1 rounded ${p.Oferta?.[0] ? 'text-amber-500 hover:bg-amber-50' : 'text-slate-300 hover:bg-slate-100'}`}>
                      <Percent size={14} />
                    </button>
                    <button onClick={() => handleDelete(p.id)} disabled={deleting === p.id}
                      className="p-1 text-red-500 hover:bg-red-50 rounded disabled:opacity-40">
                      {deleting === p.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {productos.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-8 text-slate-400">
                  <Package size={24} className="mx-auto mb-2" />
                  No hay productos registrados
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
