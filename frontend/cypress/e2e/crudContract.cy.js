describe('Flujo de carga y validación de contrato', () => {
    beforeEach(() => {
        // Login antes de cada prueba
        cy.visit('http://localhost:3000/login');
        cy.get('input[name="email"]').type('admin@example.com');
        cy.get('input[name="password"]').type('admin123');
        cy.get('button[type="submit"]').click();
        
        // Esperar redirección al dashboard
        cy.url().should('include', '/dashboard');
    });

    it('Debería cargar y validar un contrato correctamente', () => {
        // Navegar a la página de carga de contratos
        cy.visit('http://localhost:3000/upload-contract');
        cy.url().should('include', '/upload-contract');

        // Verificar elementos del formulario
        cy.get('h1').should('contain', 'Nuevo contrato');
        cy.get('input[name="ruc"]').should('exist');
        cy.get('input[name="contract"]').should('exist');
        cy.get('input[type="file"]').should('exist');

        // Llenar el formulario
        cy.get('input[name="ruc"]').type('1234567890001');
        cy.get('input[name="contract"]').type('contract-001');
        
        // Cargar archivo
        cy.fixture('contract-sample.pdf', 'binary')
            .then(Cypress.Blob.binaryStringToBlob)
            .then(fileContent => {
                const file = new File([fileContent], 'contract-sample.pdf', { type: 'application/pdf' });
                const dataTransfer = new DataTransfer();
                dataTransfer.items.add(file);

                cy.get('input[type="file"]').then(input => {
                    input[0].files = dataTransfer.files;
                    cy.wrap(input).trigger('change', { force: true });
                });
            });

        // Enviar formulario
        cy.get('button').contains('Cargar').click();

        // Verificar mensaje de éxito
        cy.get('.p-toast-message-success').should('exist')
            .and('contain', 'Contrato cargado correctamente');

        // Esperar redirección a la página de revisión
        cy.url().should('include', '/review-contract/');

        // Verificar elementos en la página de revisión
        cy.get('.document-status').should('exist');
        cy.get('.document-preview').should('exist');
        cy.get('.validation-results').should('exist');

        // Verificar datos extraídos
        cy.get('.extracted-data').within(() => {
            cy.get('[data-testid="contracting-company"]')
                .should('contain', 'ENAP SIPETROL S.A.');
            cy.get('[data-testid="contract-number"]')
                .should('contain', 'contract-001');
        });

        // Verificar estado del documento
        cy.get('.document-status')
            .should('contain', 'Aceptado')
            .should('have.class', 'status-accepted');

        // Verificar botones de acción
        cy.get('button').contains('Aprobar').should('exist');
        cy.get('button').contains('Solicitar revalidación').should('exist');
    });

    it('Debería manejar errores de validación', () => {
        cy.visit('http://localhost:3000/upload-contract');

        // Intentar enviar sin datos
        cy.get('button').contains('Cargar').click();
        cy.get('.p-toast-message-warn').should('exist')
            .and('contain', 'Debe llenar todos los campos del formulario');

        // Intentar con RUC inválido
        cy.get('input[name="ruc"]').type('123');
        cy.get('input[name="ruc"]').blur();
        cy.get('.p-toast-message-error').should('exist')
            .and('contain', 'El RUC no está registrado o no pertenece a un proveedor');

        // Intentar con archivo no PDF
        cy.fixture('invalid-file.txt', 'binary')
            .then(Cypress.Blob.binaryStringToBlob)
            .then(fileContent => {
                const file = new File([fileContent], 'invalid-file.txt', { type: 'text/plain' });
                const dataTransfer = new DataTransfer();
                dataTransfer.items.add(file);

                cy.get('input[type="file"]').then(input => {
                    input[0].files = dataTransfer.files;
                    cy.wrap(input).trigger('change', { force: true });
                });
            });

        cy.get('.p-toast-message-error').should('exist')
            .and('contain', 'Solo se permiten archivos PDF');
    });

    it('Debería permitir cancelar la carga', () => {
        cy.visit('http://localhost:3000/upload-contract');
        
        // Click en botón cancelar
        cy.get('button').contains('Cancelar').click();
        
        // Verificar redirección
        cy.url().should('eq', 'http://localhost:3000/');
    });
});
