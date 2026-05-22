import { useState, useEffect } from 'react';
import api from '../api';
import { BarChart3, TrendingUp, DollarSign, ShoppingCart, CreditCard } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

export default function Reportes() {
  const [reportes, setReportes] = useState(null);
  const [diario, setDiario] = useState(null);

  useEffect(() => {
    api.get('/reportes/ventas').then((res) => setReportes(res.data));
    api.get('/reportes/diario').then((res) => setDiario(res.data));
  }, []);

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-800 mb-6">Reportes</h2>

      {diario && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-5">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-2 rounded-lg"><ShoppingCart size={20} className="text-blue-600" /></div>
              <div>
                <p className="text-xs text-slate-500">Ventas hoy</p>
                <p className="text-xl font-bold">{diario.cantidad_ventas}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-5">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 p-2 rounded-lg"><DollarSign size={20} className="text-green-600" /></div>
              <div>
                <p className="text-xs text-slate-500">Total facturado</p>
                <p className="text-xl font-bold">${diario.total}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-5">
            <div className="flex items-center gap-3">
              <div className="bg-purple-100 p-2 rounded-lg"><TrendingUp size={20} className="text-purple-600" /></div>
              <div>
                <p className="text-xs text-slate-500">Ticket promedio</p>
                <p className="text-xl font-bold">
                  ${diario.cantidad_ventas > 0 ? (parseFloat(diario.total) / diario.cantidad_ventas).toFixed(2) : '0'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {reportes && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="font-semibold mb-4">Ventas por Método de Pago</h3>
            <div className="flex items-center gap-8">
              <ResponsiveContainer width="50%" height={200}>
                <PieChart>
                  <Pie data={reportes.ventasPorMetodo?.map((m) => ({
                    name: m.MetodoPago?.nombre || 'Sin método',
                    value: parseFloat(m.total) || 0,
                  }))} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}>
                    {reportes.ventasPorMetodo?.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2">
                {reportes.ventasPorMetodo?.map((m, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span>{m.MetodoPago?.nombre || 'Sin método'}:</span>
                    <span className="font-medium">${parseFloat(m.total || 0).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="font-semibold mb-4">Top 10 Productos Más Vendidos</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={reportes.topProductos?.map((p) => ({
                name: p.Producto?.nombre?.substring(0, 20) || '—',
                cantidad: parseInt(p.total_vendido) || 0,
              }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="cantidad" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="font-semibold mb-4">Resumen General</h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-4 bg-slate-50 rounded-lg">
                <p className="text-sm text-slate-500">Total Ventas</p>
                <p className="text-2xl font-bold text-slate-800">{reportes.totalGeneral?.cantidad_ventas || 0}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-lg">
                <p className="text-sm text-slate-500">Total Facturado</p>
                <p className="text-2xl font-bold text-green-600">${parseFloat(reportes.totalGeneral?.total_vendido || 0).toFixed(2)}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-lg">
                <p className="text-sm text-slate-500">Ticket Promedio</p>
                <p className="text-2xl font-bold text-blue-600">${parseFloat(reportes.totalGeneral?.ticket_promedio || 0).toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
