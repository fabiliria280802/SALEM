## Read this in another language
- [Lea esto en español](README-frontend-esp.md)

# Project SALEM
Project SALEM is an advanced web application designed for the automatic review and validation of documents using cutting-edge machine learning techniques. The application leverages Convolutional Neural Networks (CNNs) and Faster R-CNN for object detection and classification tasks, ensuring high accuracy in document processing. By utilizing these algorithms, SALEM can efficiently extract and validate key information from various document types, such as invoices and service delivery notes.

The choice of CNNs, specifically ResNet50, allows the application to benefit from a deep learning model pre-trained on a vast dataset, providing robust feature extraction capabilities. Faster R-CNN is employed for its superior performance in object detection, enabling precise identification of document fields. Additionally, the application incorporates techniques like data augmentation and early stopping to enhance model generalization and prevent overfitting.

SALEM's architecture is built on the MVC (Model-View-Controller) pattern, ensuring a clean separation of concerns and facilitating maintainability. The integration of Tesseract OCR further enhances the system's ability to extract textual information from images, making it a comprehensive solution for document validation.

## What does SALEM mean?

- **S** for **Smart Recognition**: Implementing advanced AI algorithms for the automatic recognition of invoices, contracts, and reception reports, ensuring high accuracy in data extraction.

- **A** for **Automated Processing**: Streamlining document processing workflows by automating data validation and classification, reducing manual effort and errors.

- **L** for **Learning Adaptability**: Utilizing machine learning to improve recognition models over time, adapting to different document formats and languages.

- **E** for **Efficient Validation**: Ensuring data consistency and correctness through intelligent validation mechanisms and error detection.

- **M** for **Management Integration**: Seamlessly integrating with enterprise management systems to facilitate data synchronization and actionable insights.

By: Fabiana Liria & Mateo Ávila

## Prerequisites
- Python 3.8
- Node.js
- npm (Node Package Manager)
- Account in MongoDB Atlas or you must have install MongoDB on your machine
- Tesseract OCR
- Azure Active Directory (AAD)

## Installation

1. **Clone the repository:**
    ```bash
    git clone https://github.com/fabiliria280802/SALEM.git
    ```

2. **Open two terminals:**

    - **Terminal 1 (Backend setup):**
      Navigate to the backend directory (adjust the path accordingly if needed):
      ```bash
      cd ../SALEM/backend
      ```
        Server will run on port 5000

      if you are using POSTMAN, you should copy and paste this url [http://localhost:5000/api/auth/login](http://localhost:5000/api/auth/login)

    - **Terminal 2 (Frontend setup):**
      In the second terminal, navigate to the frontend directory (adjust the path accordingly if needed):
      ```bash
      cd ../SALEM/frontend
      ```
        Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

3. **Install dependencies:**

    - **For Backend:**
      In the backend terminal:
      ```bash
      npm install
      ```
      
      **Note:** For more information about backend see [this page](Readme-backend-ing.md)

    - **For Frontend:**
      In the frontend terminal:
      ```bash
      npm install
      ```

## Running the Project

1. **Start the Backend:**
    In the backend terminal, run:
    ```bash
    npm start
    ```

2. **Start the Frontend:**
    In the frontend terminal, run:
    ```bash
    npm start
    ```

## Workflow for Branch Transition

The project uses a custom workflow for transitioning between branches through pull requests.

- **Transition from Development to QA:**
  To transition from `development` branch to the `qa` branch, you must write the following in your commit message:
    ```bash
    QA transition: YOUR_MESSAGE_CONTENT
    ```

- **Transition from QA to Production:**
To transition from `qa` branch to the `main` branch, write the following in your commit message:
    ```bash
    Production transition: YOUR_MESSAGE_CONTENT
    ```

This will automate the process of creating pull requests for the respective branch transitions.

## Testing and Code Quality

To ensure the quality of the code, the following scripts are used:

1. **Run Tests (Jest):**
  ```bash
  npm run test
  ```

2. **Run Linter (ESLint with Auto-fix):**
  ```bash
  npm run lint
  ```

3. **Run Code Formatter (Prettier):**
  ```bash
  npm run format
  ```

These commands will help you maintain clean and consistent code throughout the project.
