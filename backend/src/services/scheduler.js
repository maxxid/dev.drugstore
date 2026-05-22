const schedule = require('node-schedule');
const insightCollectorService = require('./insightCollectorService');

function iniciarScheduledJobs() {
  schedule.scheduleJob('0 21 * * *', async () => {
    console.log('[Scheduler] Generando insight diario...');
    try {
      await insightCollectorService.generarInsightConIA('diario');
      console.log('[Scheduler] Insight diario generado');
    } catch (error) {
      console.error('[Scheduler] Error insight diario:', error.message);
    }
  });

  schedule.scheduleJob('0 8 * * 1', async () => {
    console.log('[Scheduler] Generando insight semanal...');
    try {
      await insightCollectorService.generarInsightConIA('semanal');
      console.log('[Scheduler] Insight semanal generado');
    } catch (error) {
      console.error('[Scheduler] Error insight semanal:', error.message);
    }
  });

  schedule.scheduleJob('0 7 1 * *', async () => {
    console.log('[Scheduler] Generando insight mensual...');
    try {
      await insightCollectorService.generarInsightConIA('mensual');
      console.log('[Scheduler] Insight mensual generado');
    } catch (error) {
      console.error('[Scheduler] Error insight mensual:', error.message);
    }
  });

  console.log('[Scheduler] Jobs programados: diario 21:00, semanal lunes 8:00, mensual dia 1 7:00');
}

module.exports = { iniciarScheduledJobs };
