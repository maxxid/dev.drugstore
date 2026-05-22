import { useState, useEffect } from 'react';
import api from '../api';
import { Brain, RefreshCw, Calendar, TrendingUp, AlertTriangle } from 'lucide-react';

export default function Insights() {
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState('');

  useEffect(() => {
    loadInsights();
  }, []);

  const loadInsights = async () => {
    try {
      const { data } = await api.get('/insights');
      setInsights(data);
    } catch (err) {
      console.error(err);
    }
  };

  const generarInsight = async (tipo) => {
    setLoading(true);
    setMensaje('');
    try {
      await api.post('/insights/generar', { tipo });
      setMensaje(`Insight ${tipo} generado exitosamente`);
      loadInsights();
    } catch (err) {
      setMensaje(`Error: ${err.response?.data?.error || 'Error desconocido'}`);
    } finally {
      setLoading(false);
      setTimeout(() => setMensaje(''), 4000);
    }
  };

  const getTipoLabel = (tipo) => {
    const map = { diario: 'Diario', semanal: 'Semanal', mensual: 'Mensual' };
    return map[tipo] || tipo;
  };

  const getTipoColor = (tipo) => {
    const map = { diario: 'bg-blue-100 text-blue-700', semanal: 'bg-green-100 text-green-700', mensual: 'bg-purple-100 text-purple-700' };
    return map[tipo] || 'bg-slate-100 text-slate-700';
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-800">IA Insights</h2>
        <div className="flex gap-2">
          {['diario', 'semanal', 'mensual'].map((tipo) => (
            <button
              key={tipo}
              onClick={() => generarInsight(tipo)}
              disabled={loading}
              className="flex items-center gap-1 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 text-sm"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              {getTipoLabel(tipo)}
            </button>
          ))}
        </div>
      </div>

      {mensaje && (
        <div className={`p-4 rounded-lg mb-4 text-sm ${mensaje.includes('Error') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'}`}>
          {mensaje}
        </div>
      )}

      <div className="space-y-4">
        {insights.map((insight) => (
          <div key={insight.id} className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="bg-indigo-100 p-2 rounded-lg">
                  <Brain size={20} className="text-indigo-600" />
                </div>
                <div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getTipoColor(insight.tipo)}`}>
                    {getTipoLabel(insight.tipo)}
                  </span>
                  <span className="text-xs text-slate-400 ml-2">
                    {insight.fecha_inicio} al {insight.fecha_fin}
                  </span>
                </div>
              </div>
              <span className="text-xs text-slate-400">
                {new Date(insight.created_at).toLocaleString()}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-slate-500 mb-2 flex items-center gap-1">
                  <TrendingUp size={14} /> Resumen
                </h4>
                <p className="text-sm text-slate-700 whitespace-pre-wrap bg-slate-50 rounded-lg p-3">
                  {insight.resumen || 'Sin resumen'}
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-slate-500 mb-2 flex items-center gap-1">
                  <AlertTriangle size={14} /> Recomendaciones
                </h4>
                <p className="text-sm text-slate-700 whitespace-pre-wrap bg-amber-50 rounded-lg p-3">
                  {insight.recomendaciones || 'Sin recomendaciones'}
                </p>
              </div>
            </div>
          </div>
        ))}

        {insights.length === 0 && (
          <div className="text-center py-16 text-slate-400">
            <Brain size={40} className="mx-auto mb-3" />
            <p className="text-lg font-medium">No hay insights generados</p>
            <p className="text-sm mt-1">Haz clic en "Diario", "Semanal" o "Mensual" para generar uno</p>
          </div>
        )}
      </div>
    </div>
  );
}
