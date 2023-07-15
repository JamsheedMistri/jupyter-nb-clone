# Jupyter Notebook Clone

**Jupyter Notebook Clone** is a web application that allows users to create, edit, and run notebooks containing code snippets and markdown content. This README provides instructions for setting up and running both the frontend and backend components of the application.

## Backend Setup and Running

1. Install the required dependencies:

```shell
cd backend
pip install -r requirements.txt
```

2. Set up environment variables by creating a `.env` file and populating it with the necessary values. Example file can be found in `backend/.env.example`.

3. Start the backend server:

```shell
uvicorn main:app --reload
```

The backend server will run at [localhost:8000](http://localhost:8000). You can access the FastAPI OpenAPI schema at [localhost:8000/docs](http://localhost:8000/docs) or [localhost:8000/redoc](http://localhost:8000/redoc).

**Note:** Make sure you have MongoDB and Supabase set up and running.

## Frontend Setup and Running

1. Install the required dependencies:

```shell
cd frontend
npm install
```

2. Start the frontend development server:

```shell
npm run dev
```

   The frontend development server will run at [localhost:3000](http://localhost:3000). You can access the running application by opening this URL in your web browser.
