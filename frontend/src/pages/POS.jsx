import { useState, useRef, useEffect } from 'react';
import api from '../api';
import { Search, Plus, Minus, Trash2, Printer, CreditCard, Banknote } from 'lucide-react';

export default function POS() {
  const [codigo, setCodigo] = useState('');
  const [cart, setCart] = useState([]);
  const [metodoPago, setMetodoPago] = useState('1');
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const agregarProducto = async () => {
    if (!codigo.trim()) return;
    setError('');
    try {
      const { data } = await api.get(`/productos/codigo/${codigo.trim()}`);
      const item = cart.find((i) => i.producto_id === data.id);
      if (item) {
        setCart(cart.map((i) =>
          i.producto_id === data.id ? { ...i, cantidad: i.cantidad + 1 } : i
        ));
      } else {
        setCart([...cart, {
          producto_id: data.id,
          nombre: data.nombre,
          codigo_barras: data.codigo_barras,
          precio_venta: parseFloat(data.precio_venta),
          cantidad: 1,
        }]);
      }
      setCodigo('');
    } catch (err) {
      setError('Producto no encontrado');
      setTimeout(() => setError(''), 2000);
    }
    inputRef.current?.focus();
  };

  const actualizarCantidad = (producto_id, delta) => {
    setCart(cart.map((item) => {
      if (item.producto_id !== producto_id) return item;
      const nueva = item.cantidad + delta;
      return nueva <= 0 ? null : { ...item, cantidad: nueva };
    }).filter(Boolean));
  };

  const eliminarItem = (producto_id) => {
    setCart(cart.filter((i) => i.producto_id !== producto_id));
  };

  const subtotal = cart.reduce((sum, item) => sum + item.precio_venta * item.cantidad, 0);
  const iva = subtotal * 0.21;
  const total = subtotal + iva;

  const completarVenta = async () => {
    if (cart.length === 0) return;
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/ventas', {
        items: cart.map((item) => ({
          producto_id: item.producto_id,
          cantidad: item.cantidad,
        })),
        metodo_pago_id: parseInt(metodoPago),
      });

      setMensaje(`Venta completada! Ticket: ${data.numero_ticket} - Total: $${parseFloat(data.total).toFixed(2)}`);
      setCart([]);
      setCodigo('');
      setTimeout(() => setMensaje(''), 4000);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al procesar venta');
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      agregarProducto();
    }
  };

  return (
    <div className="flex gap-6 h-[calc(100vh-7rem)]">
      <div className="flex-1 flex flex-col">
        <h2 className="text-2xl font-bold text-slate-800 mb-4">Punto de Venta</h2>

        {mensaje && (
          <div className="bg-green-50 text-green-700 p-4 rounded-lg mb-4 font-medium">{mensaje}</div>
        )}
        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-4">{error}</div>
        )}

        <div className="flex gap-2 mb-4">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              ref={inputRef}
              type="text"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Escanear código de barras..."
              className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg text-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
          <button
            onClick={agregarProducto}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            Agregar
          </button>
        </div>

        <div className="flex-1 bg-white rounded-xl shadow-sm overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 sticky top-0">
              <tr>
                <th className="text-left p-3 text-slate-500 font-medium">Producto</th>
                <th className="text-center p-3 text-slate-500 font-medium">Precio</th>
                <th className="text-center p-3 text-slate-500 font-medium">Cant.</th>
                <th className="text-right p-3 text-slate-500 font-medium">Subtotal</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {cart.map((item) => (
                <tr key={item.producto_id} className="border-b">
                  <td className="p-3">
                    <p className="font-medium">{item.nombre}</p>
                    <p className="text-xs text-slate-400">{item.codigo_barras}</p>
                  </td>
                  <td className="p-3 text-center">${item.precio_venta.toFixed(2)}</td>
                  <td className="p-3">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => actualizarCantidad(item.producto_id, -1)}
                        className="p-1 hover:bg-slate-100 rounded"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-8 text-center font-medium">{item.cantidad}</span>
                      <button
                        onClick={() => actualizarCantidad(item.producto_id, 1)}
                        className="p-1 hover:bg-slate-100 rounded"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </td>
                  <td className="p-3 text-right">
                    ${(item.precio_venta * item.cantidad).toFixed(2)}
                  </td>
                  <td className="p-3">
                    <button onClick={() => eliminarItem(item.producto_id)} className="text-red-400 hover:text-red-600">
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
              {cart.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-slate-400">
                    Escanea un código de barras para comenzar
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="w-80 bg-white rounded-xl shadow-sm p-6 flex flex-col">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Resumen</h3>

        <div className="space-y-2 mb-4 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-500">Subtotal</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">IVA (21%)</span>
            <span>${iva.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-bold text-lg border-t pt-2 mt-2">
            <span>Total</span>
            <span className="text-blue-600">${total.toFixed(2)}</span>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm text-slate-500 mb-1">Método de pago</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: '1', label: 'Efectivo', icon: Banknote },
              { id: '2', label: 'Tarjeta', icon: CreditCard },
              { id: '3', label: 'Transf.', icon: CreditCard },
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => setMetodoPago(m.id)}
                className={`flex flex-col items-center gap-1 p-2 rounded-lg text-xs transition-colors ${
                  metodoPago === m.id
                    ? 'bg-blue-100 text-blue-700 border border-blue-300'
                    : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                <m.icon size={18} />
                {m.label}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={completarVenta}
          disabled={cart.length === 0 || loading}
          className="w-full py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <Printer size={18} />
          {loading ? 'Procesando...' : `Cobrar $${total.toFixed(2)}`}
        </button>

        <p className="text-xs text-slate-400 text-center mt-3">
          {cart.length} producto(s) en carrito
        </p>
      </div>
    </div>
  );
}
