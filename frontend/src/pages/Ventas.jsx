import { useState, useEffect } from 'react';
import api from '../api';
import { ClipboardList, Eye } from 'lucide-react';

export default function Ventas() {
  const [ventas, setVentas] = useState([]);

  useEffect(() => {
    api.get('/ventas').then((res) => setVentas(res.data));
  }, []);

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-800 mb-6">Historial de Ventas</h2>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="text-left p-3 text-slate-500 font-medium">Ticket</th>
              <th className="text-left p-3 text-slate-500 font-medium">Fecha</th>
              <th className="text-left p-3 text-slate-500 font-medium">Vendedor</th>
              <th className="text-left p-3 text-slate-500 font-medium">Método</th>
              <th className="text-right p-3 text-slate-500 font-medium">Total</th>
              <th className="text-center p-3 text-slate-500 font-medium">Items</th>
            </tr>
          </thead>
          <tbody>
            {ventas.map((v) => (
              <tr key={v.id} className="border-b hover:bg-slate-50">
                <td className="p-3 font-mono text-blue-600">{v.numero_ticket}</td>
                <td className="p-3 text-slate-500 text-xs">
                  {new Date(v.created_at).toLocaleString()}
                </td>
                <td className="p-3">{v.Usuario?.nombre || '—'}</td>
                <td className="p-3">
                  <span className="px-2 py-0.5 bg-slate-100 rounded-full text-xs">
                    {v.MetodoPago?.nombre || '—'}
                  </span>
                </td>
                <td className="p-3 text-right font-medium">${parseFloat(v.total).toFixed(2)}</td>
                <td className="p-3 text-center">{v.DetalleVenta?.length || 0}</td>
              </tr>
            ))}
            {ventas.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-8 text-slate-400">
                  <ClipboardList size={24} className="mx-auto mb-2" />
                  No hay ventas registradas
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
