import { useState, useEffect } from 'react';
import api from '../api';
import { Plus, X, Users, Edit2, Trash2 } from 'lucide-react';

export default function Proveedores() {
  const [proveedores, setProveedores] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ nombre: '', contacto: '', telefono: '', email: '', direccion: '' });

  useEffect(() => { load(); }, []);

  const load = () => api.get('/proveedores').then((res) => setProveedores(res.data));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (editing) {
        await api.put(`/proveedores/${editing}`, form);
      } else {
        await api.post('/proveedores', form);
      }
      setShowForm(false); setEditing(null);
      resetForm(); load();
    } catch (err) {
      setError(err.response?.data?.error || 'Error');
    }
  };

  const handleEdit = (p) => {
    setEditing(p.id);
    setForm({ nombre: p.nombre, contacto: p.contacto || '', telefono: p.telefono || '', email: p.email || '', direccion: p.direccion || '' });
    setShowForm(true);
  };

  const resetForm = () => setForm({ nombre: '', contacto: '', telefono: '', email: '', direccion: '' });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Proveedores</h2>
        <button onClick={() => { resetForm(); setEditing(null); setShowForm(!showForm); }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Plus size={18} /> Nuevo Proveedor
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex justify-between mb-4">
            <h3 className="font-semibold">{editing ? 'Editar' : 'Nuevo'} Proveedor</h3>
            <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
          </div>
          {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">{error}</div>}
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-500 mb-1">Nombre *</label>
              <input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500" required />
            </div>
            <div>
              <label className="block text-sm text-slate-500 mb-1">Contacto</label>
              <input value={form.contacto} onChange={(e) => setForm({ ...form, contacto: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm text-slate-500 mb-1">Teléfono</label>
              <input value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm text-slate-500 mb-1">Email</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm text-slate-500 mb-1">Dirección</label>
              <textarea value={form.direccion} onChange={(e) => setForm({ ...form, direccion: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500" rows="2" />
            </div>
            <div className="md:col-span-2 flex gap-2 justify-end">
              <button type="button" onClick={() => setShowForm(false)}
                className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50">Cancelar</button>
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                {editing ? 'Actualizar' : 'Crear'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {proveedores.map((p) => (
          <div key={p.id} className="bg-white rounded-xl shadow-sm p-5">
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-semibold text-slate-800">{p.nombre}</h4>
              <div className="flex gap-1">
                <button onClick={() => handleEdit(p)} className="p-1 text-blue-500 hover:bg-blue-50 rounded"><Edit2 size={14} /></button>
              </div>
            </div>
            {p.contacto && <p className="text-sm text-slate-500">Contacto: {p.contacto}</p>}
            {p.telefono && <p className="text-sm text-slate-500">Tel: {p.telefono}</p>}
            {p.email && <p className="text-sm text-blue-500">{p.email}</p>}
          </div>
        ))}
        {proveedores.length === 0 && (
          <div className="col-span-full text-center py-12 text-slate-400">
            <Users size={32} className="mx-auto mb-2" />No hay proveedores registrados
          </div>
        )}
      </div>
    </div>
  );
}
