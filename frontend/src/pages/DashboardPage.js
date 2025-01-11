import React, { useEffect, useState } from 'react';
import { Chart } from 'primereact/chart';
import { Calendar } from 'primereact/calendar';
import { Button } from 'primereact/button';
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, Title, Tooltip, Legend } from 'chart.js';
import styles from '../styles/DashboardPage.module.css';
import { getAiMetrics } from '../services/aiMetricsService';

// Registrar los controladores de Chart.js
ChartJS.register(BarElement, CategoryScale, LinearScale, Title, Tooltip, Legend);

const DashboardPage = () => {
    const [metricsData, setMetricsData] = useState([]);
    const [filteredMetrics, setFilteredMetrics] = useState([]);
    const [dateRange, setDateRange] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const metrics = await getAiMetrics();
                setMetricsData(metrics);
                setFilteredMetrics(metrics);
            } catch (err) {
                setError('Error al cargar las métricas de IA.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

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

    const resetFilters = () => {
        setDateRange(null);
        setFilteredMetrics(metricsData);
    };

    if (loading) {
        return <div className={styles.dashboard}>Cargando datos...</div>;
    }

    if (error) {
        return <div className={styles.dashboard}>{error}</div>;
    }

    // Preparación de datos para las gráficas
    const accuracyData = {
        labels: filteredMetrics.map(m => m.batch_id || 'Sin Lote'),
        datasets: [
            {
                label: 'Precisión (%)',
                data: filteredMetrics.map(m => m.ai_accuracy),
                backgroundColor: '#42A5F5',
                borderColor: '#1E88E5',
                fill: false,
                tension: 0.4,
            },
        ],
    };

    const errorDistributionData = {
        labels: ['Falsos Positivos', 'Falsos Negativos'],
        datasets: [
            {
                label: 'Errores',
                data: [
                    filteredMetrics.reduce((acc, m) => acc + (m.false_positives || 0), 0),
                    filteredMetrics.reduce((acc, m) => acc + (m.false_negatives || 0), 0),
                ],
                backgroundColor: ['#FF6384', '#36A2EB'],
            },
        ],
    };

    const executionTimeData = {
        labels: filteredMetrics.map(m => new Date(m.date_recorded).toLocaleDateString()),
        datasets: [
            {
                label: 'Tiempo de Ejecución (ms)',
                data: filteredMetrics.map(m => m.execution_time),
                borderColor: '#FFCE56',
                fill: false,
                tension: 0.4,
            },
        ],
    };

    const confidenceScoreData = {
        labels: filteredMetrics.map(m => m.batch_id || 'Sin Lote'),
        datasets: [
            {
                label: 'Puntaje de Confianza',
                data: filteredMetrics.map(m => m.ai_confidence_score || 0),
                backgroundColor: '#81C784',
                borderColor: '#66BB6A',
                fill: true,
            },
        ],
    };

    const fieldErrorsData = {
        labels: Object.keys(
            filteredMetrics.reduce((fields, m) => {
                Object.keys(m.field_errors || {}).forEach(key => fields[key] = true);
                return fields;
            }, {})
        ),
        datasets: [
            {
                label: 'Errores por Campo',
                data: Object.keys(
                    filteredMetrics.reduce((fields, m) => {
                        Object.keys(m.field_errors || {}).forEach(key => fields[key] = true);
                        return fields;
                    }, {})
                ).map(key =>
                    filteredMetrics.reduce((acc, m) => acc + (m.field_errors[key] || 0), 0)
                ),
                backgroundColor: '#FFA726',
            },
        ],
    };

    return (
        <div className={styles.dashboard}>
            <h1 className={styles.pageTitle}>Dashboard de métricas de la IA</h1>
            <p className={styles.pageSubtitle}>
                Monitorea la precisión, tiempos de ejecución y errores del sistema.
            </p>
            <div className={styles.filterContainer}>
                <h2>Filtrar por fechas:</h2>
                <div className={styles.filterActions}>
                    <Calendar
                        value={dateRange}
                        onChange={(e) => setDateRange(e.value)}
                        selectionMode="range"
                        readOnlyInput
                        dateFormat="dd/mm/yy"
                        placeholder="Selecciona las fechas"
                        className={styles.calendar}
						maxDate={new Date()}
                    />
                    <Button
                        label="Restablecer"
                        onClick={resetFilters}
                        className={styles.resetButton}
                    />
                </div>
            </div>
            <div className={styles.grid}>
                <div className={styles.card}>
                    <h2>Precisión por Batch</h2>
                    <Chart type="bar" data={accuracyData} />
                </div>
                <div className={styles.card}>
                    <h2>Distribución de Errores</h2>
                    <Chart type="doughnut" data={errorDistributionData} />
                </div>
                <div className={styles.card}>
                    <h2>Tiempo de Ejecución</h2>
                    <Chart type="line" data={executionTimeData} />
                </div>
                <div className={styles.card}>
                    <h2>Puntaje de Confianza</h2>
                    <Chart type="line" data={confidenceScoreData} />
                </div>
                <div className={styles.card}>
                    <h2>Errores por Campo</h2>
                    <Chart type="bar" data={fieldErrorsData} options={{ indexAxis: 'y' }} />
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;