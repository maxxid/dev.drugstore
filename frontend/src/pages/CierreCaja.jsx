import { useState } from 'react';
import api from '../api';
import Toast from '../components/Toast';
import { Calculator, Loader2 } from 'lucide-react';

export default function CierreCaja() {
  const [totalReal, setTotalReal] = useState('');
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const handleCierre = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/cierres', { total_real: parseFloat(totalReal) || 0 });
      setResultado(data);
      setToast({ type: 'success', message: 'Cierre de caja realizado correctamente' });
    } catch (err) {
      setError(err.response?.data?.error || 'Error al cerrar caja');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Toast type={toast?.type} message={toast?.message} onClose={() => setToast(null)} />

      <h2 className="text-2xl font-bold text-slate-800 mb-6">Cierre de Caja</h2>

      <div className="max-w-md">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-blue-100 p-2 rounded-lg">
              <Calculator size={20} className="text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold">Cierre del dia</h3>
              <p className="text-xs text-slate-500">{new Date().toLocaleDateString()}</p>
            </div>
          </div>

          {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">{error}</div>}

          {resultado ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="bg-slate-50 p-3 rounded"><p className="text-slate-500">Efectivo</p><p className="font-bold">${parseFloat(resultado.total_efectivo).toFixed(2)}</p></div>
                <div className="bg-slate-50 p-3 rounded"><p className="text-slate-500">Tarjeta</p><p className="font-bold">${parseFloat(resultado.total_tarjeta).toFixed(2)}</p></div>
                <div className="bg-slate-50 p-3 rounded"><p className="text-slate-500">Transferencia</p><p className="font-bold">${parseFloat(resultado.total_transferencia).toFixed(2)}</p></div>
                <div className="bg-slate-50 p-3 rounded"><p className="text-slate-500">Total Esperado</p><p className="font-bold">${parseFloat(resultado.total_esperado).toFixed(2)}</p></div>
              </div>
              <div className="border-t pt-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Diferencia</span>
                  <span className={`font-bold ${Math.abs(parseFloat(resultado.diferencia)) > 1 ? 'text-red-600' : 'text-green-600'}`}>
                    ${parseFloat(resultado.diferencia).toFixed(2)}
                  </span>
                </div>
              </div>
              <button onClick={() => setResultado(null)} className="w-full py-2 border border-slate-300 rounded-lg hover:bg-slate-50 text-sm mt-2">
                Nuevo cierre
              </button>
            </div>
          ) : (
            <form onSubmit={handleCierre}>
              <label className="block text-sm text-slate-500 mb-1">Total real en caja ($)</label>
              <input type="number" step="0.01" min="0" value={totalReal}
                onChange={(e) => setTotalReal(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg mb-4 outline-none focus:ring-2 focus:ring-blue-500"
                required autoFocus />
              <button type="submit" disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50">
                {loading && <Loader2 size={18} className="animate-spin" />}
                {loading ? 'Procesando...' : 'Realizar Cierre'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
