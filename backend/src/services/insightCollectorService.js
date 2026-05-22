const { Venta, DetalleVenta, Producto, Categoria, Insight, sequelize } = require('../models');
const { Op, fn, col, literal } = require('sequelize');

class InsightCollectorService {
  async recolectarDatos(tipo) {
    const hoy = new Date();
    let fechaInicio, fechaFin;

    switch (tipo) {
      case 'diario':
        fechaInicio = new Date(hoy);
        fechaInicio.setHours(0, 0, 0, 0);
        fechaFin = new Date(fechaInicio);
        fechaFin.setDate(fechaFin.getDate() + 1);
        break;
      case 'semanal':
        fechaFin = new Date(hoy);
        fechaFin.setHours(0, 0, 0, 0);
        fechaInicio = new Date(fechaFin);
        fechaInicio.setDate(fechaInicio.getDate() - 7);
        break;
      case 'mensual':
        fechaFin = new Date(hoy);
        fechaFin.setHours(0, 0, 0, 0);
        fechaInicio = new Date(fechaFin);
        fechaInicio.setMonth(fechaInicio.getMonth() - 1);
        break;
      default:
        throw new Error('Tipo invalido');
    }

    const where = { fecha: { [Op.gte]: fechaInicio, [Op.lt]: fechaFin } };

    const totalVentas = await Venta.findOne({
      where: where.fecha ? { fecha: where } : {},
      attributes: [
        [fn('COUNT', col('id')), 'cantidad'],
        [fn('SUM', col('total')), 'total'],
      ],
      raw: true,
    });

    const topProductos = await DetalleVenta.findAll({
      attributes: [
        'producto_id',
        [fn('SUM', col('cantidad')), 'cantidad_vendida'],
        [fn('SUM', col('subtotal')), 'ingresos'],
      ],
      include: [{ model: Producto, attributes: ['nombre', 'precio_costo', 'precio_venta'] }],
      group: ['producto_id', 'Producto.id', 'Producto.nombre', 'Producto.precio_costo', 'Producto.precio_venta'],
      order: [[fn('SUM', col('cantidad')), 'DESC']],
      limit: 5,
      raw: true,
      nest: true,
    });

    const stockCritico = await Producto.findAll({
      where: { activo: true, stock: { [Op.lte]: literal('stock_minimo') } },
      attributes: ['nombre', 'stock', 'stock_minimo'],
      raw: true,
    });

    const productosMasMargen = await Producto.findAll({
      where: { activo: true },
      attributes: [
        'nombre',
        [literal('precio_venta - precio_costo'), 'margen'],
      ],
      order: [[literal('precio_venta - precio_costo'), 'DESC']],
      limit: 10,
      raw: true,
    });

    return {
      tipo,
      fecha_inicio: fechaInicio.toISOString().split('T')[0],
      fecha_fin: fechaFin.toISOString().split('T')[0],
      total_ventas: totalVentas,
      top_productos: topProductos,
      stock_critico: stockCritico,
      productos_mas_margen: productosMasMargen,
    };
  }

  async generarInsightLocal(tipo) {
    const datos = await this.recolectarDatos(tipo);

    const resumen = this.generarResumenLocal(datos);
    const recomendaciones = this.generarRecomendacionesLocal(datos);

    const insight = await Insight.create({
      tipo,
      fecha_inicio: datos.fecha_inicio,
      fecha_fin: datos.fecha_fin,
      datos_json: datos,
      resumen,
      recomendaciones,
    });

    return insight;
  }

  generarResumenLocal(datos) {
    const totalVentas = parseFloat(datos.total_ventas?.total || 0);
    const cantVentas = parseInt(datos.total_ventas?.cantidad || 0);
    const stockCritico = datos.stock_critico?.length || 0;
    const topProd = datos.top_productos?.[0];

    let resumen = `Analisis ${datos.tipo} (${datos.fecha_inicio} al ${datos.fecha_fin}):\n`;
    resumen += `- Se realizaron ${cantVentas} ventas con un total facturado de $${totalVentas.toFixed(2)}\n`;

    if (topProd) {
      resumen += `- El producto mas vendido fue "${topProd.Producto?.nombre}" con ${topProd.cantidad_vendida} unidades\n`;
    }

    if (stockCritico > 0) {
      resumen += `- Hay ${stockCritico} productos con stock bajo que necesitan reposicion\n`;
    } else {
      resumen += `- Todos los productos tienen stock suficiente\n`;
    }

    const ticketPromedio = cantVentas > 0 ? (totalVentas / cantVentas).toFixed(2) : '0';
    resumen += `- Ticket promedio: $${ticketPromedio}\n`;

    return resumen;
  }

  generarRecomendacionesLocal(datos) {
    const stockCritico = datos.stock_critico || [];
    let recs = '';

    if (stockCritico.length > 0) {
      recs += `URGENTE: Comprar los siguientes productos con stock bajo:\n`;
      stockCritico.forEach((p) => {
        recs += `  - ${p.nombre}: stock actual ${p.stock} (minimo: ${p.stock_minimo})\n`;
      });
    }

    if (datos.top_productos?.length > 0) {
      recs += `\nProductos con mayor margen para promocionar:\n`;
      datos.productos_mas_margen?.slice(0, 3).forEach((p) => {
        recs += `  - ${p.nombre}: margen $${parseFloat(p.margen).toFixed(2)}\n`;
      });
    }

    if (parseFloat(datos.total_ventas?.total || 0) === 0) {
      recs += `\nNo hubo ventas en este periodo. Considerar promociones o revisar precios.\n`;
    }

    return recs || 'No hay recomendaciones especificas para este periodo.';
  }

  async generarInsightConIA(tipo) {
    const datos = await this.recolectarDatos(tipo);
    const apiKey = process.env.CLAUDE_API_KEY;

    if (!apiKey) {
      return this.generarInsightLocal(tipo);
    }

    try {
      const prompt = this.construirPrompt(datos);
      const respuesta = await this.llamarClaudeAPI(apiKey, prompt);

      const insight = await Insight.create({
        tipo,
        fecha_inicio: datos.fecha_inicio,
        fecha_fin: datos.fecha_fin,
        datos_json: datos,
        resumen: respuesta.resumen || 'Analisis generado por IA',
        recomendaciones: respuesta.recomendaciones || 'Sin recomendaciones',
      });

      return insight;
    } catch (error) {
      console.error('Error al llamar a Claude API, usando analisis local:', error.message);
      return this.generarInsightLocal(tipo);
    }
  }

  construirPrompt(datos) {
    const productosFormateados = datos.top_productos?.map((p) =>
      `  - ${p.Producto?.nombre}: ${p.cantidad_vendida} vendidos, $${parseFloat(p.ingresos || 0).toFixed(2)} ingresos`
    ).join('\n') || 'Sin datos';

    const stockCritico = datos.stock_critico?.map((p) =>
      `  - ${p.nombre}: stock ${p.stock} (min ${p.stock_minimo})`
    ).join('\n') || 'Ninguno';

    const margenes = datos.productos_mas_margen?.slice(0, 5).map((p) =>
      `  - ${p.nombre}: margen $${parseFloat(p.margen).toFixed(2)}`
    ).join('\n') || 'Sin datos';

    return `Eres un analista de negocios para un kiosko. Analiza los siguientes datos del periodo ${datos.tipo} (${datos.fecha_inicio} al ${datos.fecha_fin}) y proporciona un resumen ejecutivo y recomendaciones accionables.

DATOS:
- Total ventas: ${parseFloat(datos.total_ventas?.total || 0).toFixed(2)}
- Cantidad de ventas: ${datos.total_ventas?.cantidad || 0}
- Ticket promedio: $${((parseFloat(datos.total_ventas?.total || 0)) / (datos.total_ventas?.cantidad || 1)).toFixed(2)}

TOP 5 PRODUCTOS MAS VENDIDOS:
${productosFormateados}

PRODUCTOS CON STOCK BAJO:
${stockCritico}

TOP PRODUCTOS POR MARGEN:
${margenes}

Responde en formato JSON con esta estructura exacta:
{
  "resumen": "resumen ejecutivo en español de 3-5 oraciones",
  "recomendaciones": "3-5 recomendaciones accionables en español, una por linea"
}`;
  }

  async llamarClaudeAPI(apiKey, prompt) {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 500,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.status}`);
    }

    const data = await response.json();
    const text = data.content[0].text;

    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      // fallthrough
    }

    return { resumen: text, recomendaciones: '' };
  }
}

module.exports = new InsightCollectorService();
