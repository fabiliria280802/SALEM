import React from 'react';
import {
	BrowserRouter as Router,
	Route,
	Switch,
	useLocation,
} from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import ResetPasswordPage from './pages/ResetPassawordPage';
import CreateUserPage from './pages/CreateUserPage';
import DashboardPage from './pages/DashboardPage';
import DocumentsListPage from './pages/DocumentsListPage';
import UserAcountPage from './pages/UserAcountPage';
import UsersManagementPage from './pages/UsersManagementPage';
import EditUserPage from './pages/EditUserPage';
import PrivateRoute from './components/PrivateRoute';
import CreatePasswordPage from './pages/CreatePasswordPage';
import TrainingPage from './pages/TrainingPage';
import Header from './components/Layout/Header';
import Footer from './components/Layout/Footer';
import UnauthorizedPage from './pages/UnauthorizedPage';
import ReviewContractPage from './pages/ReviewContractPage';
import ReviewServiceRecordPage from './pages/ReviewServiceRecordPage';
import ReviewInvoicePage from './pages/ReviewInvoicePage';
import UploadContractPage from './pages/UploadContractPage';
import UploadServiceDeliveryRecordPage from './pages/UploadServiceDeliveryRecordPage';
import UploadInvoicePage from './pages/UploadInvoicePage';
import useAuth from './hooks/useAuth';
import './App.css';

const AppContent = () => {
	const location = useLocation();
	const { isAuthenticated, loading } = useAuth();

	const publicRoutes = [
		'/login',
		'/reset-password',
		'/create-password',
		'/unauthorized',
	];
	const isPublicRoute = publicRoutes.includes(location.pathname);

	if (loading) {
		return (
			<div style={{ textAlign: 'center', marginTop: '50px' }}>Cargando...</div>
		); // Spinner de carga
	}

	return (
		<div className="App">
			{/* Renderizar Header solo en rutas privadas */}
			{!isPublicRoute && isAuthenticated && <Header />}
			<div className="content">
				<Switch>
					{/* Rutas públicas */}
					<Route path="/login" component={LoginPage} />
					<Route path="/create-password" component={CreatePasswordPage} />
					<Route path="/reset-password" component={ResetPasswordPage} />
					<Route path="/unauthorized" component={UnauthorizedPage} />

					{/* Rutas privadas */}
					<PrivateRoute
						path="/upload-contract"
						component={UploadContractPage}
						roles={['Administrador', 'Gestor', 'Proveedor']}
					/>
					<PrivateRoute
						path="/review-contract/:id"
						component={ReviewContractPage}
						roles={['Administrador', 'Gestor', 'Proveedor']}
					/>
					<PrivateRoute
						path="/upload-service-record"
						component={UploadServiceDeliveryRecordPage}
						roles={['Administrador', 'Gestor', 'Proveedor']}
					/>
					<PrivateRoute
						path="/review-service-record/:id"
						component={ReviewServiceRecordPage}
						roles={['Administrador', 'Gestor', 'Proveedor']}
					/>
					<PrivateRoute
						path="/upload-invoice"
						component={UploadInvoicePage}
						roles={['Administrador', 'Gestor', 'Proveedor']}
					/>
					<PrivateRoute
						path="/review-invoice/:id"
						component={ReviewInvoicePage}
						roles={['Administrador', 'Gestor', 'Proveedor']}
					/>
					<PrivateRoute
						path="/dashboard"
						component={DashboardPage}
						roles={['Administrador', 'Gestor']}
					/>
					<PrivateRoute
						path="/create-user"
						component={CreateUserPage}
						roles={['Administrador']}
					/>
					<PrivateRoute
						path="/documents"
						component={DocumentsListPage}
						roles={['Administrador', 'Gestor', 'Proveedor']}
					/>
					<PrivateRoute
						path="/training"
						component={TrainingPage}
						roles={['Administrador', 'Gestor']}
					/>
					<PrivateRoute
						path="/users-management"
						component={UsersManagementPage}
						roles={['Administrador']}
					/>
					<PrivateRoute
						path="/edit-user/:id"
						component={EditUserPage}
						roles={['Administrador', 'Gestor', 'Proveedor']}
					/>
					<PrivateRoute
						path="/user-account"
						component={UserAcountPage}
						roles={['Administrador', 'Gestor', 'Proveedor']}
					/>
					<PrivateRoute
						path="/"
						component={HomePage}
						roles={['Administrador', 'Gestor', 'Proveedor']}
					/>
				</Switch>
			</div>
			{/* Renderizar Footer solo en rutas privadas */}
			{!isPublicRoute && isAuthenticated && (
				<Footer currentPath={location.pathname} />
			)}
		</div>
	);
};

const App = () => {
	return (
		<AuthProvider>
			<Router>
				<AppContent />
			</Router>
		</AuthProvider>
	);
};

export default App;
