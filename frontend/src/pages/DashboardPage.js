import React, { useEffect, useState } from 'react';
import { Chart } from 'primereact/chart';
import { Calendar } from 'primereact/calendar';
import { getAiMetrics } from '../services/aiMetricsService';
import styles from '../styles/DashboardPage.module.css';

const DashboardPage = () => {
  const [metricsData, setMetricsData] = useState([]);
  const [filteredMetrics, setFilteredMetrics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState(null);

  // Cargar métricas al montar el componente
  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setLoading(true);
        const metrics = await getAiMetrics();
        setMetricsData(metrics);
        setFilteredMetrics(metrics); // Inicialmente sin filtro
      } catch (err) {
        setError('Error al cargar los datos del Dashboard.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchMetrics();
  }, []);

  // Filtrar datos por rango de fechas
  useEffect(() => {
    if (dateRange) {
      const [startDate, endDate] = dateRange;
      const filtered = metricsData.filter(metric => {
        const date = new Date(metric.date_recorded);
        return date >= startDate && date <= endDate;
      });
      setFilteredMetrics(filtered);
    } else {
      setFilteredMetrics(metricsData);
    }
  }, [dateRange, metricsData]);

  if (loading) return <div className={styles.loading}>Cargando datos...</div>;
  if (error) return <div className={styles.error}>{error}</div>;

  // Configuración de gráficos
  const totalDocsData = {
    labels: filteredMetrics.map(m => new Date(m.date_recorded).toLocaleDateString()),
    datasets: [
      {
        label: 'Documentos Procesados',
        data: filteredMetrics.map(m => m.true_positives + m.false_positives),
        backgroundColor: '#42A5F5',
      },
    ],
  };

  const accuracyData = {
    labels: filteredMetrics.map(m => new Date(m.date_recorded).toLocaleDateString()),
    datasets: [
      {
        label: 'Precisión (%)',
        data: filteredMetrics.map(m => m.ai_accuracy),
        borderColor: '#FF6384',
        tension: 0.4,
      },
    ],
  };

  return (
    <div className={styles.dashboard}>
      <div className={styles.filterContainer}>
        <h2>Filtrar por Fechas</h2>
        <Calendar
          value={dateRange}
          onChange={(e) => setDateRange(e.value)}
          selectionMode="range"
          readOnlyInput
          dateFormat="dd/mm/yy"
          placeholder="Selecciona un rango de fechas"
        />
      </div>

      <div className={styles.grid}>
        <div className={styles.card}>
          <h3>Total de Documentos Evaluados</h3>
          <Chart type="bar" data={totalDocsData} />
        </div>
        <div className={styles.card}>
          <h3>Porcentaje de Precisión</h3>
          <Chart type="line" data={accuracyData} />
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;


