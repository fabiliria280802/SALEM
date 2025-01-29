import React, { useEffect, useState } from 'react';
import { Chart } from 'primereact/chart';
import { Calendar } from 'primereact/calendar';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import {
	Chart as ChartJS,
	BarElement,
	CategoryScale,
	LinearScale,
	Title,
	Tooltip,
	Legend,
} from 'chart.js';
import styles from '../styles/DashboardPage.module.css';
import aiMetricsService  from '../services/aiMetricsService';
import docsMetricsService from '../services/docsMetricsService';

ChartJS.register(
	BarElement,
	CategoryScale,
	LinearScale,
	Title,
	Tooltip,
	Legend,
);

const DashboardPage = () => {
    const [metricsData, setMetricsData] = useState([]);
    const [filteredMetrics, setFilteredMetrics] = useState([]);
    const [dateRange, setDateRange] = useState(null);
    const [documentType, setDocumentType] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const docsMetrics = await docsMetricsService.getDocsMetrics();
                setMetricsData(docsMetrics);
                setFilteredMetrics(docsMetrics);
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
        let filtered = metricsData;

        if (dateRange) {
            const [startDate, endDate] = dateRange;
            filtered = filtered.filter(metric => {
                const date = new Date(metric.date_recorded);
                return date >= startDate && date <= endDate;
            });
        }

        if (documentType) {
            filtered = filtered.filter(metric => metric.documentType === documentType);
        }

        setFilteredMetrics(filtered);
    }, [dateRange, documentType, metricsData]);

    const resetFilters = () => {
        setDateRange(null);
        setDocumentType(null);
        setFilteredMetrics(metricsData);
    };

    if (loading) {
        return <div className={styles.dashboard}>Cargando datos...</div>;
    }

    if (error) {
        return <div className={styles.dashboard}>{error}</div>;
    }

    const totalDocuments = filteredMetrics.length;
    const avgExecutionTime =
        totalDocuments > 0
            ? (
                  filteredMetrics.reduce((acc, m) => acc + m.execution_time, 0) /
                  totalDocuments
              ).toFixed(2)
            : 0;
    const avgAccuracy =
        totalDocuments > 0
            ? (
                  filteredMetrics.reduce((acc, m) => acc + m.ai_accuracy, 0) /
                  totalDocuments
              ).toFixed(2)
            : 0;
    const avgConfidence =
        totalDocuments > 0
            ? (
                  filteredMetrics.reduce((acc, m) => acc + m.ai_confidence_score, 0) /
                  totalDocuments
              ).toFixed(2)
            : 0;

    // **Gráficos**
    const executionTimeData = {
        labels: filteredMetrics.map(m => new Date(m.date_recorded).toLocaleDateString()),
        datasets: [
            {
                label: 'Tiempo de Ejecución (s)',
                data: filteredMetrics.map(m => m.execution_time),
                borderColor: '#FFCE56',
                backgroundColor: 'rgba(255, 206, 86, 0.5)',
                fill: true,
                tension: 0.4,
            },
        ],
    };

    const accuracyData = {
        labels: filteredMetrics.map(m => new Date(m.date_recorded).toLocaleDateString()),
        datasets: [
            {
                label: 'Precisión (%)',
                data: filteredMetrics.map(m => m.ai_accuracy),
                backgroundColor: '#42A5F5',
                borderColor: '#1E88E5',
            },
        ],
    };

    const confidenceScoreData = {
        labels: filteredMetrics.map(m => new Date(m.date_recorded).toLocaleDateString()),
        datasets: [
            {
                label: 'Puntaje de Confianza',
                data: filteredMetrics.map(m => m.ai_confidence_score),
                backgroundColor: '#81C784',
                borderColor: '#66BB6A',
            },
        ],
    };

    const documentTypeData = {
        labels: ['Contract', 'ServiceDeliveryRecord', 'Invoice'],
        datasets: [
            {
                label: 'Total por Tipo de Documento',
                data: [
                    filteredMetrics.filter(m => m.documentType === 'Contract').length,
                    filteredMetrics.filter(m => m.documentType === 'ServiceDeliveryRecord').length,
                    filteredMetrics.filter(m => m.documentType === 'Invoice').length,
                ],
                backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56'],
            },
        ],
    };

    return (
        <div className={styles.dashboard}>
            <h1 className={styles.pageTitle}>Dashboard de métricas de IA</h1>

            <div className={styles.filterContainer}>
                <h2>Filtros:</h2>
                <div className={styles.filterActions}>
                    <Calendar
                        value={dateRange}
                        onChange={e => setDateRange(e.value)}
                        selectionMode="range"
                        readOnlyInput
                        dateFormat="dd/mm/yy"
                        placeholder="Selecciona las fechas"
                        className={styles.calendar}
                        maxDate={new Date()}
                        showButtonBar
                    />
                    <Dropdown
                        value={documentType}
                        options={[
                            { label: 'Todos', value: null },
                            { label: 'Contract', value: 'Contract' },
                            { label: 'Service Delivery Record', value: 'ServiceDeliveryRecord' },
                            { label: 'Invoice', value: 'Invoice' },
                        ]}
                        onChange={e => setDocumentType(e.value)}
                        placeholder="Selecciona tipo de documento"
                        className={styles.dropdown}
                    />
                    <Button label="Restablecer" onClick={resetFilters} className={styles.resetButton} />
                </div>
            </div>

            <div className={styles.statsContainer}>
                <div className={styles.statCard}>
                    <h3>Total Documentos</h3>
                    <p>{totalDocuments}</p>
                </div>
                <div className={styles.statCard}>
                    <h3>Tiempo Promedio de Ejecución (s)</h3>
                    <p>{avgExecutionTime}</p>
                </div>
                <div className={styles.statCard}>
                    <h3>Precisión Promedio (%)</h3>
                    <p>{avgAccuracy}</p>
                </div>
                <div className={styles.statCard}>
                    <h3>Puntaje de Confianza (%)</h3>
                    <p>{avgConfidence}</p>
                </div>
            </div>
{/* TODO: validar el responsive y ver estilos de cards*/}
            <div className={styles.grid}>
                <div className={styles.card}><Chart type="line" data={executionTimeData} /></div>
                <div className={styles.card}><Chart type="bar" data={accuracyData} /></div>
                <div className={styles.card}><Chart type="bar" data={confidenceScoreData} /></div>
                <div className={styles.card}><Chart type="pie" data={documentTypeData} /></div>
            </div>
        </div>
    );
};

export default DashboardPage;