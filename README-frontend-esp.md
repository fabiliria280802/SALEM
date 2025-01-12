# Proyecto SALEM
El Proyecto SALEM es una aplicación web avanzada diseñada para la revisión y validación automática de documentos utilizando técnicas de aprendizaje automático de última generación. La aplicación aprovecha Redes Neuronales Convolucionales (CNNs) y Faster R-CNN para tareas de detección y clasificación de objetos, garantizando una alta precisión en el procesamiento de documentos. Al emplear estos algoritmos, SALEM puede extraer y validar de manera eficiente información clave de diversos tipos de documentos, como facturas y hojas de entrega de servicios.

La elección de las CNNs, específicamente ResNet50, permite que la aplicación se beneficie de un modelo de aprendizaje profundo preentrenado en un vasto conjunto de datos, ofreciendo capacidades robustas de extracción de características. Se utiliza Faster R-CNN debido a su rendimiento superior en detección de objetos, lo que permite la identificación precisa de campos en los documentos. Además, la aplicación incorpora técnicas como aumento de datos y early stopping para mejorar la generalización del modelo y evitar el sobreajuste.

La arquitectura de SALEM está construida sobre el patrón MVC (Modelo-Vista-Controlador), asegurando una clara separación de responsabilidades y facilitando el mantenimiento. La integración de Tesseract OCR mejora aún más la capacidad del sistema para extraer información textual de imágenes, convirtiéndolo en una solución integral para la validación de documentos.

## Lea esto en otro idioma
- [Read this in English](README.md)

## ¿Qué significa SALEM?

- **S** de **Reconocimiento Inteligente** (*Smart Recognition*): Implementación de algoritmos avanzados de inteligencia artificial para el reconocimiento automático de facturas, contratos e informes de recepción, garantizando alta precisión en la extracción de datos.

- **A** de **Procesamiento Automático** (*Automated Processing*): Optimización de flujos de trabajo de procesamiento de documentos mediante la automatización de la validación y clasificación de datos, reduciendo el esfuerzo manual y los errores.

- **L** de **Adaptabilidad de Aprendizaje** (*Learning Adaptability*): Uso de aprendizaje automático para mejorar los modelos de reconocimiento con el tiempo, adaptándose a diferentes formatos y lenguajes de documentos.

- **E** de **Validación Eficiente** (*Efficient Validation*): Garantía de consistencia y precisión en los datos mediante mecanismos inteligentes de validación y detección de errores.

- **M** de **Integración de Gestión** (*Management Integration*): Integración perfecta con sistemas de gestión empresarial para facilitar la sincronización de datos y la generación de información procesable.

Por: Fabiana Liria & Mateo Ávila

## Prerrequisitos
- Python 3.8
- Node.js
- npm (Node Package Manager)
- Cuenta en MongoDB Atlas o tener MongoDB instalado en tu máquina
- Tesseract OCR
- Azure Active Directory (AAD)

## Instalación

1. **Clona el repositorio:**
    ```bash
    git clone https://github.com/fabiliria280802/SALEM.git
    ```

2. **Abre dos terminales:**

    - **Terminal 1 (Configuración del Backend):**
      Navega al directorio del backend (ajusta la ruta si es necesario):
      ```bash
      cd ../SALEM/backend
      ```
        El servidor correrá en el puerto 5000.

      Si estás usando POSTMAN, copia y pega esta URL [http://localhost:5000/api/auth/login](http://localhost:5000/api/auth/login).

    - **Terminal 2 (Configuración del Frontend):**
      En la segunda terminal, navega al directorio del frontend (ajusta la ruta si es necesario):
      ```bash
      cd ../SALEM/frontend
      ```
        Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

3. **Instala las dependencias:**

    - **Para el Backend:**
      En la terminal del backend:
      ```bash
      npm install
      ```

**Note:**Para más información mira [esta página](Readme-backend-esp.md)

    - **Para el Frontend:**
      En la terminal del frontend:
      ```bash
      npm install
      ```

## Ejecución del Proyecto

1. **Inicia el Backend:**
    En la terminal del backend, ejecuta:
    ```bash
    npm start
    ```

2. **Inicia el Frontend:**
    En la terminal del frontend, ejecuta:
    ```bash
    npm start
    ```

## Flujo de Trabajo para Transiciones entre Ramas

El proyecto utiliza un flujo personalizado para la transición entre ramas mediante pull requests.

- **Transición de Desarrollo a QA:**
  Para pasar de la rama `development` a la rama `qa`, escribe lo siguiente en tu mensaje de commit:
    ```bash
    QA transition: TU_MENSAJE_AQUÍ
    ```

- **Transición de QA a Producción:**
  Para pasar de la rama `qa` a la rama `main`, escribe lo siguiente en tu mensaje de commit:
    ```bash
    Production transition: TU_MENSAJE_AQUÍ
    ```

Esto automatizará el proceso de creación de pull requests para las respectivas transiciones de rama.

## Pruebas y Calidad de Código

Para garantizar la calidad del código, se utilizan los siguientes scripts:

1. **Ejecutar Pruebas (Jest):**
  ```bash
  npm run test

2. **Ejecuta Linter (ESLint with Auto-fix):**
  ```bash
  npm run lint
  ```

3. **Ejecutar el Formateador de codigo (Prettier):**
  ```bash
  npm run format
  ```

Estos comandos te ayudarán a mantener un código limpio y consistente a lo largo del proyecto.