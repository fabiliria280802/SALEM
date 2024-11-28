# project SALEM
A responsive web application for automatic document review and validation using the MVC (Model-View-Controller) architecture, streamlining the validation process. This application has components of Google API Vision, SharePoint, Power Automate and Power Apps and AI.

# By:
Fabiana Liria & Mateo Ávila

## Prerequisites
- Python 3.8
- Node.js
- npm (Node Package Manager)
- SharePoint
- Power Automate
- Power Apps
- OCR
- Azure Active Directory (AAD)

# Project SALEM

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
  To transition from the `development` branch to the `QA` branch, you must write the following in your commit message:
    ```bash
    QA transition: YOUR_MESSAGE_CONTENT
    ```

- **Transition from QA to Production:**
To transition from the `QA` branch to the `production` branch, write the following in your commit message:
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
