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
import docsMetricsService from '../services/docsMetricsService';
import documentService from '../services/documentService';
import LoadingScreen from '../components/Layout/LoadingScreen';
import useAuth from '../hooks/useAuth';

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
    const [errorDistribution, setErrorDistribution] = useState({});
    const { user } = useAuth();
    const [statusDistribution, setStatusDistribution] = useState({});

    const documentNamesMap = {
        Contract: 'Contratos',
        ServiceDeliveryRecord: 'Actas de Servicio',
        Invoice: 'Facturas'
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const docsMetrics = await docsMetricsService.getDocsMetrics();

                // **Extraer `created_by` y `provider_ruc` si no vienen en `docsMetrics`**
                const docsWithDetails = await Promise.all(
                    docsMetrics.map(async (metric) => {
                        const documentData = await documentService.getDocumentById(metric.documentType, metric.documentID);
                        return {
                            ...metric,
                            created_by: documentData?.created_by || null,
                            provider_ruc: documentData?.provider_ruc || null
                        };
                    })
                );

                let filteredDocs = docsWithDetails;

                // **Filtrar documentos si el usuario es Proveedor**
                if (user && user.role === 'Proveedor') {
                    filteredDocs = docsWithDetails.filter(
                        metric => metric.created_by === user.id || metric.provider_ruc === user.ruc
                    );
                }

                setMetricsData(filteredDocs);
                setFilteredMetrics(filteredDocs);

                // **Distribución de Errores y Estado de Documentos**
                const errorCounts = {};
                const statusCounts = {};

                for (const metric of filteredDocs) {
                    const documentData = await documentService.getDocumentById(metric.documentType, metric.documentID);
                    if (!documentData) continue;

                    const translatedName = documentNamesMap[metric.documentType] || metric.documentType;

                    if (!errorCounts[translatedName]) {
                        errorCounts[translatedName] = { missing: 0, validation: 0 };
                    }

                    if (!statusCounts[translatedName]) {
                        statusCounts[translatedName] = { accepted: 0, denied: 0 };
                    }

                    errorCounts[translatedName].missing += documentData.missing_fields?.length || 0;
                    errorCounts[translatedName].validation += documentData.validation_errors?.length || 0;

                    if (documentData.status === "Aceptado") {
                        statusCounts[translatedName].accepted += 1;
                    } else if (documentData.status === "Denegado") {
                        statusCounts[translatedName].denied += 1;
                    }
                }

                setErrorDistribution(errorCounts);
                setStatusDistribution(statusCounts);
            } catch (err) {
                setError('Error al cargar las métricas de IA.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user]);

    useEffect(() => {
        let filtered = metricsData;

        if (dateRange) {
            let [startDate, endDate] = dateRange;
            if (startDate && endDate) {
                // **Ajustar fechas a medianoche para asegurar comparación precisa**
                startDate = new Date(startDate);
                startDate.setUTCHours(0, 0, 0, 0);

                endDate = new Date(endDate);
                endDate.setUTCHours(23, 59, 59, 999);

                console.log("Filtrando documentos entre:", startDate, "y", endDate);

                filtered = filtered.filter(metric => {
                    const metricDate = new Date(metric.date_recorded);
                    metricDate.setUTCHours(0, 0, 0, 0);
                    return metricDate >= startDate && metricDate <= endDate;
                });
            }
        }

        if (documentType) {
            filtered = filtered.filter(metric => metric.documentType === documentType);
        }

        setFilteredMetrics(filtered);
    }, [dateRange, documentType, metricsData]);

    useEffect(() => {
        const calculateDistributions = async () => {
            const errorCounts = {};
            const statusCounts = {};

            for (const metric of filteredMetrics) {
                const documentData = await documentService.getDocumentById(metric.documentType, metric.documentID);
                if (!documentData) continue;

                const translatedName = documentNamesMap[metric.documentType] || metric.documentType;

                if (!errorCounts[translatedName]) {
                    errorCounts[translatedName] = { missing: 0, validation: 0 };
                }

                if (!statusCounts[translatedName]) {
                    statusCounts[translatedName] = { accepted: 0, denied: 0 };
                }

                errorCounts[translatedName].missing += documentData.missing_fields?.length || 0;
                errorCounts[translatedName].validation += documentData.validation_errors?.length || 0;

                if (documentData.status === "Aceptado") {
                    statusCounts[translatedName].accepted += 1;
                } else if (documentData.status === "Denegado") {
                    statusCounts[translatedName].denied += 1;
                }
            }

            setErrorDistribution(errorCounts);
            setStatusDistribution(statusCounts);
        };

        if (filteredMetrics.length > 0) {
            calculateDistributions();
        } else {
            setErrorDistribution({});
            setStatusDistribution({});
        }
    }, [filteredMetrics]);

    const resetFilters = () => {
        setDateRange(null);
        setDocumentType(null);
        setFilteredMetrics(metricsData);
    };

    if (loading) {
		return <LoadingScreen />;
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

    const errorDistributionData = {
        labels: Object.keys(errorDistribution),
        datasets: [
            {
                label: 'Campos Faltantes',
                data: Object.values(errorDistribution).map(d => d.missing),
                backgroundColor: '#FF6384',
            },
            {
                label: 'Errores de Validación',
                data: Object.values(errorDistribution).map(d => d.validation),
                backgroundColor: '#36A2EB',
            },
        ],
    };

    const statusDistributionData = {
        labels: Object.keys(statusDistribution),
        datasets: [
            {
                label: 'Aceptados',
                data: Object.values(statusDistribution).map(d => d.accepted),
                backgroundColor: '#4CAF50',
            },
            {
                label: 'Denegados',
                data: Object.values(statusDistribution).map(d => d.denied),
                backgroundColor: '#F44336',
            },
        ],
    };

    return (
        <div className={styles.dashboard}>
            <h1 className={styles.pageTitle}>Dashboard de métricas de documentos</h1>

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
                            { label: 'Contractos', value: 'Contract' },
                            { label: 'Acta de servicios', value: 'ServiceDeliveryRecord' },
                            { label: 'Facturas', value: 'Invoice' },
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
                    <p className={styles.valueCard}>{totalDocuments}</p>
                </div>
                <div className={styles.statCard}>
                    <h3>Tiempo Promedio de Ejecución (s)</h3>
                    <p className={styles.valueCard}>{avgExecutionTime}</p>
                </div>
                <div className={styles.statCard}>
                    <h3>Precisión Promedio (%)</h3>
                    <p className={styles.valueCard}>{avgAccuracy}</p>
                </div>
                <div className={styles.statCard}>
                    <h3>Puntaje de Confianza (%)</h3>
                    <p className={styles.valueCard}>{avgConfidence}</p>
                </div>
            </div>
            <div className={styles.grid}>
                <div className={styles.card}>
                    <h3>Tiempo de Ejecución</h3>
                    <Chart type="line" data={executionTimeData} />
                </div>
                <div className={styles.card}>
                    <h3>Documentos Aceptados vs. Denegados</h3>
                    <Chart type="bar" data={statusDistributionData} />
                </div>
                <div className={styles.card}>
                    <h3>Puntaje de Confianza</h3>
                    <Chart type="bar" data={confidenceScoreData} />
                </div>
                <div className={styles.card}>
                    <h3>Distribución de Errores en los Documentos</h3>
                    <Chart type="bar" data={errorDistributionData} />
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;