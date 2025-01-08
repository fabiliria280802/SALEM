describe('Login E2E', () => {
	//Happy path login - Administrador
	it('1.1. login exitoso del usuario (Administrador) y renderizado del Home Page', () => {
		cy.visit('http://localhost:3000/login');
		cy.get('input[name="email"]').type('fabiliria@gmail.com');
		cy.get('input[name="password"]').type('business123D');
		cy.get('[data-testid="submit-button-main-form"]').click();

		cy.get('.p-toast', { timeout: 5000 }).should('be.visible');
		cy.get('.p-toast-message-content').within(() => {
			cy.contains('Éxito').should('be.visible');
			cy.contains('Sesión iniciada correctamente').should('be.visible');
		});
		cy.url().should('include', '/');

		const adminMenuItems = [
			'Inicio',
			'Estatus',
			'Documentación',
			'Entrenamiento',
			'Permisos',
			'Gestión de usuarios',
			'Cuenta',
		];

		adminMenuItems.forEach(item => {
			cy.get('.p-menubar-root-list .p-menuitem')
				.contains(item)
				.should('be.visible');
		});

		cy.contains('ENAP Ecuador - Administrador').should('be.visible');
		cy.contains('¡Hola').should('be.visible');
		cy.contains('Mantén tus procesos bajo control fácilmente.').should(
			'be.visible',
		);
		cy.get('button').contains('Nuevo').should('be.visible');
		cy.get('button').contains('Revisión').should('be.visible');
	});
	// Happy path login - Gestor & Validar header
	it('1.1.1. login exitoso del usuario (Gestor) y renderizado del Home Page', () => {
		cy.visit('http://localhost:3000/login');
		cy.get('input[name="email"]').type('fabiana.liria@udla.edu.ec');
		cy.get('input[name="password"]').type('business123A');
		cy.get('[data-testid="submit-button-main-form"]').click();

		cy.get('.p-toast', { timeout: 5000 }).should('be.visible');
		cy.get('.p-toast-message-content').within(() => {
			cy.contains('Éxito').should('be.visible');
			cy.contains('Sesión iniciada correctamente').should('be.visible');
		});
		cy.url().should('include', '/');

		const gestorMenuItems = ['Inicio', 'Estatus', 'Documentación', 'Cuenta'];

		gestorMenuItems.forEach(item => {
			cy.get('.p-menubar-root-list .p-menuitem')
				.contains(item)
				.should('be.visible');
		});

		cy.contains('ENAP Ecuador - Gestor').should('be.visible');
		cy.contains('¡Hola').should('be.visible');
		cy.contains('Mantén tus procesos bajo control fácilmente.').should(
			'be.visible',
		);
		cy.get('button').contains('Nuevo').should('be.visible');
		cy.get('button').contains('Revisión').should('be.visible');
	});
	// Happy path login - Proveedor & Validar header
	it('1.1.2. login exitoso del usuario (Proveedor) y renderizado del Home Page', () => {
		cy.visit('http://localhost:3000/login');
		cy.get('input[name="email"]').type('teran.ma@beta.test.com');
		cy.get('input[name="password"]').type('business123A');
		cy.get('[data-testid="submit-button-main-form"]').click();

		cy.get('.p-toast', { timeout: 5000 }).should('be.visible');
		cy.get('.p-toast-message-content').within(() => {
			cy.contains('Éxito').should('be.visible');
			cy.contains('Sesión iniciada correctamente').should('be.visible');
		});
		cy.url().should('include', '/');

		const proveedorMenuItems = ['Inicio', 'Estatus', 'Documentación', 'Cuenta'];

		proveedorMenuItems.forEach(item => {
			cy.get('.p-menubar-root-list .p-menuitem')
				.contains(item)
				.should('be.visible');
		});

		cy.contains('Beta Group SA - Proveedor').should('be.visible');
		cy.contains('¡Hola').should('be.visible');
		cy.contains('Mantén tus procesos bajo control fácilmente.').should(
			'be.visible',
		);
		cy.get('button').contains('Nuevo').should('be.visible');
		cy.get('button').contains('Revisión').should('be.visible');
	});
	// Sad path login(forgot password)
	it('1.2. Muestra error y activa restablecimiento después de 3 intentos fallidos', () => {
		cy.visit('http://localhost:3000/login');

		cy.get('input[name="email"]').type('fabiliria@gmail.com');
		for (let i = 0; i < 3; i++) {
			cy.get('input[name="password"]').clear().type('contraseñaIncorrecta');
			cy.get('[data-testid="submit-button-main-form"]').click();
			cy.get('.p-toast-message-content')
				.first()
				.within(() => {
					cy.contains('Error').should('be.visible');
					cy.contains(
						`Credenciales incorrectas. Intentos restantes: ${2 - i}`,
					).should('be.visible');
				});

			cy.wait(1000);
		}

		cy.get('[data-testid="submit-button-main-form"]').should('be.disabled');

		cy.wait(1000);

		cy.get('.p-dialog').should('be.visible');
		cy.contains(
			'¿Te llegó el correo de restablecimiento de contraseña?',
		).should('be.visible');

		cy.get('.p-dialog-footer').within(() => {
			cy.get('button').contains('Sí').click();
		});

		cy.url().should('include', '/reset-password');
	});
	// Sad path login(empty fields: email & passowrd)
	it('1.2.1. Muestra error al mandar campos vacios', () => {
		cy.visit('http://localhost:3000/login');
		cy.get('input[name="email"]').type(' ');
		cy.get('input[name="password"]').type(' ');
		cy.get('[data-testid="submit-button-main-form"]').click();

		cy.get('.p-toast', { timeout: 5000 }).should('be.visible');
		cy.get('.p-toast-message-content').within(() => {
			cy.contains('Advertencia').should('be.visible');
			cy.contains('Debe llenar todos los campos del formulario').should(
				'be.visible',
			);
		});
	});
	// Sad path login(not user register)
	it('1.2.2. Muestra error al mandar un email no registrado', () => {
		cy.visit('http://localhost:3000/login');
		cy.get('input[name="email"]').type('fabixxxx@gmail.com');
		cy.get('input[name="password"]').clear().type('contraseñaIncorrecta');
		cy.get('[data-testid="submit-button-main-form"]').click();
		cy.get('.p-toast', { timeout: 5000 }).should('be.visible');
		cy.get('.p-toast-message-content').within(() => {
			cy.contains(
				'El correo electrónico ingresado no esta registrado en el sistema',
			).should('be.visible');
		});
	});
	// Sad path login (bad email)
	it('1.2.3. Muestra error al mandar un email con formato erroneo', () => {
		const invalidEmails = ['test@.com', '@.com', '@m.com', 'charlesXavier@g'];
		const randomEmail =
			invalidEmails[Math.floor(Math.random() * invalidEmails.length)];

		cy.visit('http://localhost:3000/login');
		cy.get('input[name="email"]').type(randomEmail);
		cy.get('input[name="password"]').clear().type('contraseñaIncorrecta');
		cy.get('[data-testid="submit-button-main-form"]').click();
		cy.get('.p-toast', { timeout: 5000 }).should('be.visible');
		cy.get('.p-toast-message-content').within(() => {
			cy.contains('Error').should('be.visible');
			cy.contains('El correo electrónico ingresado no es válido').should(
				'be.visible',
			);
		});
	});
});
