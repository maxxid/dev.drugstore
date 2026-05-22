import { useState, useEffect } from 'react';
import api from '../api';
import { Search, Plus, Edit2, Trash2, Package, X } from 'lucide-react';

export default function Productos() {
  const [productos, setProductos] = useState([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    codigo_barras: '', nombre: '', descripcion: '', categoria_id: '',
    precio_costo: '0', precio_venta: '0', stock: '0', stock_minimo: '5',
  });

  const load = () => {
    api.get('/productos', { params: { search } }).then((res) => setProductos(res.data));
  };

  useEffect(() => { load(); }, [search]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (editing) {
        await api.put(`/productos/${editing}`, form);
      } else {
        await api.post('/productos', form);
      }
      setShowForm(false);
      setEditing(null);
      resetForm();
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar');
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
    if (confirm('Desactivar este producto?')) {
      await api.delete(`/productos/${id}`);
      load();
    }
  };

  const resetForm = () => {
    setForm({
      codigo_barras: '', nombre: '', descripcion: '', categoria_id: '',
      precio_costo: '0', precio_venta: '0', stock: '0', stock_minimo: '5',
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Productos</h2>
        <button
          onClick={() => { resetForm(); setEditing(null); setShowForm(!showForm); }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus size={18} /> Nuevo Producto
        </button>
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
              <label className="block text-sm text-slate-500 mb-1">Código de Barras *</label>
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
              <label className="block text-sm text-slate-500 mb-1">Stock Mínimo</label>
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
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                {editing ? 'Actualizar' : 'Crear'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre o código..."
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="text-left p-3 text-slate-500 font-medium">Código</th>
              <th className="text-left p-3 text-slate-500 font-medium">Nombre</th>
              <th className="text-right p-3 text-slate-500 font-medium">P. Costo</th>
              <th className="text-right p-3 text-slate-500 font-medium">P. Venta</th>
              <th className="text-center p-3 text-slate-500 font-medium">Stock</th>
              <th className="text-center p-3 text-slate-500 font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {productos.map((p) => (
              <tr key={p.id} className="border-b hover:bg-slate-50">
                <td className="p-3 text-slate-400 text-xs">{p.codigo_barras}</td>
                <td className="p-3 font-medium">{p.nombre}</td>
                <td className="p-3 text-right">${parseFloat(p.precio_costo).toFixed(2)}</td>
                <td className="p-3 text-right">${parseFloat(p.precio_venta).toFixed(2)}</td>
                <td className="p-3 text-center">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    p.stock <= p.stock_minimo ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                  }`}>
                    {p.stock}
                  </span>
                </td>
                <td className="p-3">
                  <div className="flex justify-center gap-1">
                    <button onClick={() => handleEdit(p)} className="p-1 text-blue-500 hover:bg-blue-50 rounded">
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => handleDelete(p.id)} className="p-1 text-red-500 hover:bg-red-50 rounded">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {productos.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-8 text-slate-400">
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
