# de-ploy
open source deployment server like vercel to deploy git repo's on your own server and install &amp; manage your projects.

# Application

    This application is a simplified version of Vercel, allowing users to install, run, and manage Git repositories as projects. It provides a user-friendly interface for deploying and managing web applications.

    ## Features

    *   **User Authentication:** Secure user registration and login using JSON Web Tokens (JWT).
    *   **Project Installation:** Install projects by cloning Git repositories.
    *   **Project Management:**
        *   View a list of installed projects.
        *   Start and stop projects.
        *   Track project status (idle, running, stopped, failed).
    *   **Project Settings:**
        *   Configure environment variables for each project.
        *   Save and apply environment variables when running projects.
    *   **Error Handling:** Robust error handling with informative messages and error logging.
    *   **Dark Mode UI:** A clean and modern dark mode user interface.

    ## Architecture

    The application is built using a client-server architecture:

    *   **Frontend (Client):**
        *   Built with React and Vite.
        *   Provides the user interface for interacting with the application.
        *   Handles user authentication, project management, and settings.
        *   Communicates with the backend using HTTP requests.
    *   **Backend (Server):**
        *   Built with Node.js and Express.
        *   Handles API endpoints for user authentication, project installation, management, and settings.
        *   Uses SQLite for database storage.
        *   Uses `simple-git` for Git operations.
        *   Uses `child_process` to run project commands.
        *   Uses `jsonwebtoken` for JWT authentication.
        *   Uses `bcrypt` for password hashing.
        *   Uses `dotenv` for environment variable management.

    ## Setup and Installation

    Follow these steps to set up and run the application on an Ubuntu server:

    ### Prerequisites

    *   Ubuntu Server
    *   Node.js and npm (Node Package Manager)
    *   Git

    ### Installation Steps

    1.  **Install Node.js and npm:**

        Use the following commands in your terminal:
        ```
        sudo apt update
        sudo apt install nodejs npm
        ```

    2.  **Install Git:**

        Use the following command in your terminal:
        ```
        sudo apt install git
        ```

    3.  **Clone the repository:**

        Use the following command in your terminal, replacing `<repository_url>` with the URL of the Git repository containing the application code and `<project_directory>` with the directory where you want to clone the repository:
        ```
        git clone <repository_url>
        cd <project_directory>
        ```

    4.  **Install dependencies:**

        Navigate to the project directory in your terminal and use the following command to install all required dependencies:
        ```
        npm install
        ```

    5.  **Create a `.env` file in the `server` directory:**

        Create a file named `.env` inside the `server` directory and add the following line, replacing `your-strong-jwt-secret` with a strong, randomly generated secret key:
        ```
        JWT_SECRET=your-strong-jwt-secret
        ```
        This key is used for signing and verifying JWTs.

    ### Running the Application

    1.  **Start the application:**

        Navigate to the project directory in your terminal and use the following command to start both the backend server and the frontend development server concurrently:
        ```
        npm run dev
        ```

    2.  **Access the application:**

        Open your web browser and navigate to `http://<your_server_ip>:5173`. Replace `<your_server_ip>` with the IP address of your Ubuntu server.

        The backend server runs on port 3000, and the frontend development server runs on port 5173 by default.

    ## Usage

    1.  **User Authentication:**
        *   **Registration:** If you are a new user, click on the "Go to Register" button and enter your username and password to create an account.
        *   **Login:** If you have an existing account, enter your username and password and click the "Login" button.
    2.  **Project Installation:**
        *   After logging in, enter the Git repository URL in the input field and click the "Install" button.
        *   The application will clone the repository to the `server/projects` directory.
    3.  **Project Management:**
        *   The "Installed Projects" section displays a list of installed projects with their current status.
        *   Click on a project name to view its settings.
        *   Click the "Run" button to start a project.
        *   Click the "Stop" button to stop a running project.
    4.  **Project Settings:**
        *   In the project settings section, you can add, remove, and modify environment variables for the selected project.
        *   Click the "Add" button to add a new environment variable.
        *   Click the "Remove" button to remove an existing environment variable.
        *   Click the "Save Settings" button to save the changes.
    5.  **Logout:**
        *   Click the "Logout" button to log out of the application.

    ## Production Deployment

    For production deployment, you should:

    1.  **Build the frontend:**

        Navigate to the `client` directory in your terminal and use the following command to create a production-ready build of the frontend in the `client/dist` directory:
        ```
        cd client
        npm run build
        ```

    2.  **Serve the frontend:**

        Use a web server like Nginx or Apache to serve the static files from the `client/dist` directory.

    3.  **Run the backend:**

        Navigate to the root directory of the project and start the backend server using the following command:
        ```
        npm start
        ```

    4.  **Configure a reverse proxy:**

        Configure your web server to proxy requests to the backend server running on port 3000.

    ## Error Handling

    The application includes robust error handling:

    *   **Backend:** Errors are logged to the `server/error.log` file.
    *   **Frontend:** Informative error messages are displayed to the user.

    ## Technologies Used

    *   **Frontend:**
        *   React
        *   Vite
        *   Axios
    *   **Backend:**
        *   Node.js
        *   Express
        *   SQLite
        *   Simple-git
        *   Jsonwebtoken
        *   Bcrypt
        *   Dotenv
        *   Cors
        *   Nodemon
        *   Concurrently

    ## Contributing

    Contributions are welcome! Please feel free to submit pull requests or open issues for any bugs or feature requests.

    ## License

    This project is licensed under the MIT License.

