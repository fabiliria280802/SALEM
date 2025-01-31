import React from 'react';
import { Route, Redirect } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

const PrivateRoute = ({ component: Component, roles, ...rest }) => {
	const { isAuthenticated, user, loading } = useAuth();

	if (loading) return null;

	return (
		<Route
			{...rest}
			render={props => {
				// Si no hay usuario autenticado, redirige al login
				if (!isAuthenticated) {
					return (
						<Redirect
							to={{ pathname: '/login', state: { from: props.location } }}
						/>
					);
				}

				// Si el rol del usuario no está en los roles permitidos, redirige a una página de no autorizado
				if (isAuthenticated && user && roles && !roles.includes(user.role)) {
					return <Redirect to="/unauthorized" />;
				}

				// Si el usuario está autenticado y tiene acceso, renderiza el componente
				return <Component {...props} />;
			}}
		/>
	);
};

export default PrivateRoute;
