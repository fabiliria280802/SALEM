import React from 'react';
import { Chart } from 'primereact/chart';
<<<<<<< Updated upstream
import styles from '../styles/DashboardPage.module.css';

const DashboardPage = () => {
	const totalDocsData = {
		labels: ['11/10/24', '25/10/24', '08/11/24'],
		datasets: [
			{
				label: 'Documentos Procesados',
				data: [170, 210, 236],
				backgroundColor: '#42A5F5',
				borderColor: '#1E88E5',
				fill: true,
			},
		],
	};

	const errorDistributionData = {
		labels: ['Factura', 'HES', 'MIGO'],
		datasets: [
			{
				label: 'Falsos Positivos',
				data: [40, 0, 0],
				backgroundColor: '#FF6384',
			},
			{
				label: 'Falsos Negativos',
				data: [25, 0, 0],
				backgroundColor: '#36A2EB',
			},
		],
	};
=======
import { Calendar } from 'primereact/calendar';
import { Button } from 'primereact/button';
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import styles from '../styles/DashboardPage.module.css';
import {
    getContractsStats,
    getInvoicesStats,
    getServiceRecordsStats,
    getAiStats,
} from '../services/dashboardServices';

// Registrar los controladores de Chart.js
ChartJS.register(BarElement, CategoryScale, LinearScale, Title, Tooltip, Legend, ArcElement);

const DashboardPage = () => {
    const [dateRange, setDateRange] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [contractsStats, setContractsStats] = useState(null);
    const [invoicesStats, setInvoicesStats] = useState(null);
    const [serviceRecordsStats, setServiceRecordsStats] = useState(null);
    const [aiStats, setAiStats] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [contracts, invoices, serviceRecords, ai] = await Promise.all([
                    getContractsStats(),
                    getInvoicesStats(),
                    getServiceRecordsStats(),
                    getAiStats(),
                ]);
                setContractsStats(contracts);
                setInvoicesStats(invoices);
                setServiceRecordsStats(serviceRecords);
                setAiStats(ai);
            } catch (err) {
                setError('Error al cargar los datos del dashboard.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
>>>>>>> Stashed changes

	// Datos base
	const dates = ['11/10/24', '25/10/24', '08/11/24'];
	const accuracyValues = [59, 73, 75];

<<<<<<< Updated upstream
	// Calcular Tasa de Reproceso en base a Accuracy
	const reprocessRates = accuracyValues.map(accuracy =>
		Math.max((100 - accuracy) * 0.4, 5),
	); // Mínimo del 5%

	const accuracyData = {
		labels: dates,
		datasets: [
			{
				label: 'Precisión (%)',
				data: accuracyValues,
				fill: false,
				borderColor: '#FF6384',
				tension: 0.4,
				pointBackgroundColor: '#81C784',
			},
		],
	};
=======
    const resetFilters = () => {
        setDateRange(null);
    };
>>>>>>> Stashed changes

	const reprocessRateData = {
		labels: dates,
		datasets: [
			{
				label: 'Tasa de Reproceso (%)',
				data: reprocessRates,
				backgroundColor: '#FFA726',
				borderColor: '#FB8C00',
				fill: true,
			},
		],
	};

	const errorTypesData = {
		labels: ['Form. Inválido', 'D. Ausentes', 'Ext. Incorrecta'],
		datasets: [
			{
				label: 'Errores por Campo',
				data: [30, 45, 25],
				backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56'],
			},
		],
	};

<<<<<<< Updated upstream
	const options = {
		responsive: true,
		plugins: {
			legend: {
				position: 'top',
			},
		},
	};

	const confusionMatrixData = {
		labels: ['Predicción Negativa', 'Predicción Positiva'],
		datasets: [
			{
				label: 'Real Negativo',
				data: [110, 40], // VN, FP
				backgroundColor: '#36A2EB',
			},
			{
				label: 'Real Positivo',
				data: [25, 150], // FN, VP
				backgroundColor: '#FF6384',
			},
		],
	};

	const confusionMatrixOptions = {
		indexAxis: 'y', // Mostrar horizontalmente
		responsive: true,
		plugins: {
			legend: {
				position: 'top',
			},
			tooltip: {
				callbacks: {
					label: function (context) {
						return `${context.dataset.label}: ${context.raw}`;
					},
				},
			},
		},
		scales: {
			x: {
				beginAtZero: true,
				title: {
					display: true,
					text: 'Número de Casos',
				},
			},
			y: {
				title: {
					display: true,
					text: 'Valor Real',
				},
			},
		},
	};

	const errorTypesOptions = {
		responsive: true,
		plugins: {
			legend: {
				position: 'left', // Coloca los labels uno al lado del otro
				labels: {
					boxWidth: 10,
					padding: 15,
				},
			},
			tooltip: {
				callbacks: {
					label: function (context) {
						return `${context.label}: ${context.raw}%`;
					},
				},
			},
		},
	};

	return (
		<div className={styles.dashboard}>
			<div className={styles.grid}>
				<div className={styles.card}>
					<h2>Total de Documentos Evaluados</h2>
					<Chart type="bar" data={totalDocsData} options={options} />
				</div>
				<div className={styles.card}>
					<h2>Porcentaje de Accuracy</h2>
					<Chart type="line" data={accuracyData} options={options} />
				</div>
				<div className={styles.card}>
					<h2>Distribución de Falsos Positivos y Negativos</h2>
					<Chart type="bar" data={errorDistributionData} options={options} />
				</div>
				<div className={styles.card}>
					<h2>Tasa de Reproceso</h2>
					<Chart type="line" data={reprocessRateData} options={options} />
				</div>
				<div className={styles.centeredChart}>
					<h2>Distribución de Tipos de Errores</h2>
					<Chart
						type="doughnut"
						data={errorTypesData}
						options={errorTypesOptions}
					/>
				</div>
				<div className={styles.card}>
					<h2>Matriz de Confusión General</h2>
					<Chart
						type="bar"
						data={confusionMatrixData}
						options={confusionMatrixOptions}
					/>
				</div>
			</div>
		</div>
	);
=======
    // Configuración de las gráficas
    const contractsChart = {
        labels: ['Aceptados', 'Rechazados'],
        datasets: [
            {
                data: [contractsStats?.accepted || 0, contractsStats?.rejected || 0],
                backgroundColor: ['#81C784', '#E57373'],
            },
        ],
    };

    const invoicesChart = {
        labels: ['Aceptadas', 'Rechazadas'],
        datasets: [
            {
                data: [invoicesStats?.totalAccepted || 0, invoicesStats?.totalRejected || 0],
                backgroundColor: ['#64B5F6', '#EF5350'],
            },
        ],
    };

    const serviceRecordsChart = {
        labels: ['Aceptados', 'Rechazados'],
        datasets: [
            {
                data: [serviceRecordsStats?.accepted || 0, serviceRecordsStats?.rejected || 0],
                backgroundColor: ['#4DB6AC', '#FF7043'],
            },
        ],
    };

    const aiMetricsChart = {
        labels: ['Precisión', 'Tiempo de Ejecución'],
        datasets: [
            {
                label: 'Promedios',
                data: [aiStats?.avgAccuracy || 0, aiStats?.avgExecutionTime || 0],
                backgroundColor: ['#42A5F5', '#FFCE56'],
            },
        ],
    };

    return (
        <div className={styles.dashboard}>
            <h1 className={styles.pageTitle}>Dashboard de Reportes</h1>
            <p className={styles.pageSubtitle}>
                Monitorea los contratos, facturas, registros de entrega y métricas de IA.
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
                        showButtonBar
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
                    <h2>Contratos</h2>
                    <Chart type="pie" data={contractsChart} />
                </div>
                <div className={styles.card}>
                    <h2>Facturas</h2>
                    <Chart type="doughnut" data={invoicesChart} />
                </div>
                <div className={styles.card}>
                    <h2>Registros de Entrega</h2>
                    <Chart type="bar" data={serviceRecordsChart} />
                </div>
                <div className={styles.card}>
                    <h2>Métricas de IA</h2>
                    <Chart type="bar" data={aiMetricsChart} />
                </div>
            </div>
        </div>
    );
>>>>>>> Stashed changes
};

export default DashboardPage;
