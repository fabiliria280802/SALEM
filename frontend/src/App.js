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
import UploadDocumentsPage from './pages/UploadDocumentsPage';
import DocumentReviewPage from './pages/DocumentReviewPage';
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
import './App.css';

const AppContent = () => {
	const location = useLocation();

	return (
		<div className="App">
			<Header />
			<div className="content">
				<Switch>
					{/* Rutas públicas */}
					<Route path="/login" component={LoginPage} />

					{/**/}

					{/* Rutas protegidas con los roles*/}
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
						path="/upload-document"
						component={UploadDocumentsPage}
						roles={['Administrador', 'Gestor', 'Proveedor']}
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
						path="/document-analizer"
						component={DocumentReviewPage}
						roles={['Administrador', 'Gestor', 'Proveedor']}
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
					{/* Rutas públicas */}
					<Route path="/create-password" component={CreatePasswordPage} />
					<Route path="/reset-password" component={ResetPasswordPage} />
					<Route path="/unauthorized" component={UnauthorizedPage} />
					<Route path="/" component={HomePage} />
				</Switch>
			</div>
			<Footer currentPath={location.pathname} />
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
