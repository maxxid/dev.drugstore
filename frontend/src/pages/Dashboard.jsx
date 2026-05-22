import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { TrendingUp, Package, ShoppingCart, AlertTriangle } from 'lucide-react';

export default function Dashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    Promise.all([
      api.get('/reportes/diario'),
      api.get('/reportes/stock-bajo'),
    ]).then(([diarioRes, stockRes]) => {
      setData({ diario: diarioRes.data, stockBajo: stockRes.data });
    }).catch(console.error);
  }, []);

  if (!data) return <div className="text-gray-500">Cargando...</div>;

  const cards = [
    { label: 'Ventas hoy', value: data.diario.cantidad_ventas, icon: ShoppingCart, color: 'bg-blue-500' },
    { label: 'Total hoy', value: `$${data.diario.total}`, icon: TrendingUp, color: 'bg-green-500' },
    { label: 'Productos stock bajo', value: data.stockBajo.length, icon: AlertTriangle, color: 'bg-red-500' },
    { label: 'Productos activos', value: '—', icon: Package, color: 'bg-purple-500' },
  ];

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-800 mb-6">Dashboard</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map((card) => (
          <div key={card.label} className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">{card.label}</p>
                <p className="text-2xl font-bold text-slate-800 mt-1">{card.value}</p>
              </div>
              <div className={`${card.color} p-3 rounded-lg`}>
                <card.icon size={20} className="text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {data.stockBajo.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <AlertTriangle size={20} className="text-red-500" />
            Productos con stock bajo
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="pb-2 text-slate-500 font-medium">Producto</th>
                  <th className="pb-2 text-slate-500 font-medium">Stock</th>
                  <th className="pb-2 text-slate-500 font-medium">Mínimo</th>
                  <th className="pb-2 text-slate-500 font-medium">Acción</th>
                </tr>
              </thead>
              <tbody>
                {data.stockBajo.map((p) => (
                  <tr key={p.id} className="border-b last:border-0">
                    <td className="py-2">{p.nombre}</td>
                    <td className="py-2 text-red-600 font-medium">{p.stock}</td>
                    <td className="py-2">{p.stock_minimo}</td>
                    <td className="py-2">
                      <Link to="/compras" className="text-blue-600 hover:underline text-xs">
                        Comprar
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
