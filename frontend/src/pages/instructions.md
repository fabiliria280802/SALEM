# Instrucciones para Modificar el Flujo de Carga de Documentos

## 1. Modificación de archivos existentes

1. Actualiza UploadContractPage.js para que el tipo de documento sea Contract, pero que visualmente se muestre como "Contrato". Asegúrate de que solo se puedan cargar archivos en formato PDF.
2. Actualiza UploadServiceDeliveryRecordPage.js para que el tipo de documento sea ServiceDeliveryRecord, pero que visualmente se muestre como "Acta de Servicio". Asegúrate de que solo se puedan cargar archivos en formato PDF.
3. Actualiza UploadInvoicePage.js para que el tipo de documento sea Invoice, pero que visualmente se muestre como "Factura". Permite que se puedan cargar archivos en formato PDF y PNG.

## 2. Creación y modificación de páginas de revisión

4. Crea ReviewContractPage.js basado en DocumentReviewPage.js. Esta página debe:

- Permitir visualizar un contrato.
- Evaluar los parámetros del documento. Si el contrato cumple con los parámetros de evaluación:
  - Aceptar la revisión y redirigir a la página UploadServiceRecord.
  - Si no cumple, permitir solicitar una revalidación por IA.
  - Si la revalidación es denegada nuevamente, enviar un correo electrónico a todos los usuarios con el rol de "Gestor".

5. Crea ReviewServiceRecordPage.js basado en DocumentReviewPage.js. Esta página debe:

- Permitir visualizar el acta de servicio.
- Evaluar los parámetros del documento. Si el acta cumple con los parámetros de evaluación:
  - Aceptar la revisión y redirigir a la página UploadInvoice.
  - Si no cumple, permitir solicitar una revalidación por IA.
  - Si la revalidación es denegada nuevamente, enviar un correo electrónico a todos los usuarios con el rol de "Gestor".

6. Crea ReviewInvoicePage.js basado en DocumentReviewPage.js. Esta página debe:

- Permitir visualizar una factura.
- Evaluar los parámetros del documento.
- Si cumple los parámetros, permitir aceptar la revisión mediante un botón.
- Si no cumple, permitir solicitar una revalidación por IA mediante otro botón.
- Si el documento es denegado:
  - Enviar un correo electrónico a todos los usuarios con el rol de "Gestor". Esto necesitara un arreglo en el backend para enviar el correo a los gestores en notificationController.js y mail.js para agregar la funcionalidad.

## 3. Detalles adicionales para los pasos 7, 8 y 9

7. Asegúrate de que ReviewInvoicePage.js permita visualizar y evaluar las facturas de la misma manera que en el paso 6. Si el documento es denegado, enviar un correo a los gestores como se describe.

8. Similar al paso 7, implementa la misma funcionalidad en ReviewInvoicePage.js.

9. En ReviewInvoicePage.js:

- Si la revalidación por IA del documento da resultado positivo, redirigir al usuario a la pestaña DocumentListPage.js al hacer clic en el botón "Mis Documentos".
- Si la revalidación por IA da resultado negativo, enviar un correo a todos los usuarios con el rol de "Gestor". Mostrar un mensaje emergente (pop-up) que indique que el documento fue rechazado por la IA y que se está en espera de una validación manual por parte de un gestor.

## 4. Modificar Estructura de Rutas

1. Actualizar `App.js` para incluir nuevas rutas y importar las páginas:
   ```javascript
   <PrivateRoute path="/upload-contract" component={UploadContractPage} roles={['Administrador', 'Gestor', 'Proveedor']} />
   <PrivateRoute path="/review-contract/:id" component={ReviewContractPage} roles={['Administrador', 'Gestor', 'Proveedor']} />
   <PrivateRoute path="/upload-service-record" component={UploadServiceRecordPage} roles={['Administrador', 'Gestor', 'Proveedor']} />
   <PrivateRoute path="/review-service-record/:id" component={ReviewServiceRecordPage} roles={['Administrador', 'Gestor', 'Proveedor']} />
   <PrivateRoute path="/upload-invoice" component={UploadInvoicePage} roles={['Administrador', 'Gestor', 'Proveedor']} />
   <PrivateRoute path="/review-invoice/:id" component={ReviewInvoicePage} roles={['Administrador', 'Gestor', 'Proveedor']} />
   ```

## 5. Crear Nuevos Servicios en Frontend

1. Modificar `documentService.js` para incluir métodos específicos:
   ```javascript
   const documentService = {
   	uploadContract: formData => axios.post(`${API_URL}/contract`, formData),
   	uploadServiceRecord: formData =>
   		axios.post(`${API_URL}/service-record`, formData),
   	uploadInvoice: formData => axios.post(`${API_URL}/invoice`, formData),
   	getContractById: id => axios.get(`${API_URL}/contract/${id}`),
   	getServiceRecordById: id => axios.get(`${API_URL}/service-record/${id}`),
   	getInvoiceById: id => axios.get(`${API_URL}/invoice/${id}`),
   };
   ```

## 6. Actualizar Backend Controllers

1. Migra las funcionaliodades de `documentController.js` para usar controladores específicos en:
   - `contractController.js`
   - `serviceDeliveryRecordController.js`
   - `invoiceController.js`
2. Luego elimina el archivo `documentController.js` porque ya no es necesario.

3. Cada controlador especifico debe:
   - Validar el documento usando IA
   - Guardar en la base de datos
   - Retornar ID para redirección a página de revisión

## 7. Modificar IA.py

1. Actualizar `process_single_document` para validar documentos en secuencia:
   ```python
   def validate_document_sequence(document_type, previous_document_id=None):
       if document_type == "ServiceDeliveryRecord":
           # Verificar que existe un contrato válido
           contract = get_contract(previous_document_id)
           if not contract:
               raise ValueError("Se requiere un contrato válido")
       elif document_type == "Invoice":
           # Verificar que existe un acta válida
           record = get_service_record(previous_document_id)
           if not record:
               raise ValueError("Se requiere un acta de servicio válida")
   ```

## 8. Crear Páginas de Carga

1. Implementar `UploadContractPage.js`:

   - Formulario para cargar contrato
   - Validación de campos
   - Redirección a `ReviewContractPage` al éxito

2. Implementar `UploadServiceRecordPage.js`:

   - Mostrar información del contrato relacionado
   - Formulario para cargar acta
   - Validación de campos
   - Redirección a `ReviewServiceRecordPage` al éxito

3. Implementar `UploadInvoicePage.js`:
   - Mostrar información del acta relacionada
   - Formulario para cargar factura
   - Validación de campos
   - Redirección a `ReviewInvoicePage` al éxito

## 9. Crear Páginas de Revisión

1. Implementar páginas de revisión:
   - Mostrar documento procesado
   - Mostrar datos extraídos
   - Opciones para aprobar/rechazar
   - Botón para continuar al siguiente paso

## 10. Implementar Flujo de Navegación

1. En `ReviewContractPage.js`:

   ```javascript
   const handleApprove = async () => {
   	await approveContract(id);
   	history.push(`/upload-service-record/${id}`);
   };
   ```

2. En `ReviewServiceRecordPage.js`:
   ```javascript
   const handleApprove = async () => {
   	await approveServiceRecord(id);
   	history.push(`/upload-invoice/${id}`);
   };
   ```

## 11. Actualizar Validaciones

1. Modificar middleware de autenticación para verificar secuencia:
   ```javascript
   const validateDocumentSequence = async (req, res, next) => {
   	const { documentType, previousDocumentId } = req.body;
   	try {
   		await validateSequence(documentType, previousDocumentId);
   		next();
   	} catch (error) {
   		res.status(400).json({ error: error.message });
   	}
   };
   ```

## 12. Actualizar Rutas del Backend

1. Modificar `routes/api.js`:
   ```javascript
   router.post(
   	'/contract',
   	uploadMiddleware,
   	contractController.createContract,
   );
   router.post(
   	'/service-record',
   	validateDocumentSequence,
   	uploadMiddleware,
   	serviceRecordController.createServiceRecord,
   );
   router.post(
   	'/invoice',
   	validateDocumentSequence,
   	uploadMiddleware,
   	invoiceController.createInvoice,
   );
   ```

## 13. Pruebas

1. Probar flujo completo:
   - Carga de contrato → Revisión
   - Carga de acta → Revisión
   - Carga de factura → Revisión
2. Verificar validaciones de secuencia
3. Verificar extracción de datos
4. Verificar navegación entre páginas
