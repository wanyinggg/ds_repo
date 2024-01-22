# Data Science Project Management System

## Introduction
The Data Science Project Management System is a comprehensive tool designed to streamline and enhance the management of Data Science final year projects. This web-based application integrates a React-based frontend and a Django Rest Framework backend for efficient data handling and processing.

## Table of Contents
- [Introduction](#introduction)
- [Technologies Used](#technologies-used)
- [Setup and Installation](#setup-and-installation)
- [Usage](#usage)
- [How to Contribute](#how-to-contribute)
- [License](#license)

## Technologies Used
- **Frontend**
  - React.js
- **Backend**
  - Django Rest Framework
  - SQLite file 

## Setup and Installation
### Frontend Setup
1. Navigate to the `frontend` folder.
2. Install Node.js dependencies: `npm install`.
3. Start the React app: `npm start`.
   
### Backend Setup
1. Navigate to the `backend` folder.
2. Set up a virtual environment:
   - For Unix or MacOS, run: `python3 -m venv dsmanagement`
   - For Windows, run: `python -m venv dsmanagement`
3. Activate the virtual environment:
   - For Unix or MacOS, run: `source dsmanagement/bin/activate`
   - For Windows, run: `dsmanagement\Scripts\activate`
4. Install dependencies: `pip install -r requirements.txt`.
5. Run migrations: `python manage.py migrate`.
6. Start the server: `python manage.py runserver`.

### Email Configuration
1. Open the `settings.py` file in the `dsmanagementwebproject` directory.
2. Locate the `EMAIL_*` settings.
3. Replace the `EMAIL_HOST_USER` and `EMAIL_HOST_PASSWORD` with your email credentials. If you're using Gmail, you might need to generate an app-specific password.
4. Update the `DEFAULT_FROM_EMAIL` to the email address you want to use for sending emails.

### Google API Configuration for Google Meet Links
1. **Create a Project in Google Cloud Platform:**
   - Visit [Google Cloud Console](https://console.cloud.google.com/).
   - Create a new project or select an existing one.

2. **Enable Google Calendar API:**
   - Navigate to "APIs & Services > Dashboard" in the Google Cloud Console.
   - Click on “ENABLE APIS AND SERVICES”.
   - Search for "Google Calendar API" and enable it.

3. **Configure OAuth Consent Screen:**
   - Go to "APIs & Services > OAuth consent screen" in the Google Cloud Console.
   - Set up the consent screen with necessary information.

4. **Create OAuth 2.0 Client IDs:**
   - Access "Credentials" and click “Create Credentials” > “OAuth client ID”.
   - Choose "Web application" as the application type.
   - Add `http://localhost:8000` (or the backend server URI) to "Authorized redirect URIs".
   - Download the JSON file after creating the client ID.

5. **Place the `client_secret.json` in the Project:**
   - Place this file in the `dsmanagementapp` directory of the project.


## Usage
After setting up both the frontend and backend, access the web interface at `http://localhost:3000`. The Django API can be accessed at `http://localhost:8000/api`.

