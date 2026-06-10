
CodeAlpha - Backend Development Internship
Intern: Hachemaoui Khadija
Domain: Backend Development
Organization: CodeAlpha

# Summary:
This repository contains three backend development projects completed as part of the CodeAlpha internship program. Each project demonstrates proficiency in a different backend framework and covers core backend concepts such as routing, database management, authentication, CRUD operations, REST API design, and frontend integration.

# General Prerequisites:
Before running any of the projects, make sure you have :
Python 3.8+ (for Flask and Django projects)
Node.js 16+ and npm (for the Express.js project)
A terminal / command prompt (VS Code integrated terminal works well)

# Project 1: URL Shortener (Flask)
Description
A simple yet fully functional URL shortening service built with Flask. Users can paste a long URL and receive a short, randomized code that redirects to the original link. The application demonstrates fundamental Flask concepts including routing, template rendering with Jinja2, SQLite database operations, and form handling.
Tech Stack
Flask — Lightweight Python web framework
SQLite3 — Python's built-in database module 
HTML/CSS — Simple, clean frontend
Features
Generate a unique 6-character short code for any valid URL
Redirect short URLs to their original destination
Display a list of all shortened URLs with click counts
Click counter tracks how many times each short link is used
Responsive and clean user interface

# Setup & Running:
1. Navigate to the project folder
cd TASK

 2. Create and activate a virtual environment
python -m venv venv

 On Windows: venv\Scripts\activate
 On Mac/Linux: source venv/bin/activate

 3. Install Flask
pip install flask

 4. Run the application
python app.py


# How It Works
The user enters a long URL in the form on the homepage.
The /shorten route generates a random 6-character alphanumeric code.
The original URL and short code are saved in the SQLite database.
When a user visits http://127.0.0.1:5000/<short_code>, the /<short_code> route looks up the original URL and redirects the browser.
Each redirect increments a click counter stored in the database.
Key Concepts Demonstrated
Flask route definitions and HTTP methods (GET, POST)
SQLite database creation, insertion, and querying
Jinja2 template rendering and variable passing
HTTP redirects with redirect()
Form submission handling with request.form

---------------------------------------------------------------------------------------

# Project 2: Event Registration System (Django)
# Description
A full-featured event registration platform built with Django. It includes user authentication (signup, login, logout), event creation, event browsing, registration for events, cancellation of registrations, and a personal dashboard to view all registrations. The project follows Django's MVT (Model-View-Template) architecture and demonstrates best practices including login-protected views, foreign key relationships, and template inheritance.

# Tech Stack
Django — High-level Python web framework
SQLite — Default Django database (auto-configured)
Django Auth — Built-in authentication system
HTML/CSS — Professional frontend with responsive design

# Features
User Authentication: Sign up, log in, log out with session-based auth
Event Management: Create, view, and list events (creation requires login)
Registration System: Register for events and cancel registrations
Personal Dashboard: View all your event registrations in one place
Smart Navigation: Navbar changes based on authentication state
Protected Routes: Only authenticated users can create events or register

# Setup & Running:
 1. Navigate to the project folder
cd TASK2

 2. (Recommended) Create and activate a virtual environment
python -m venv venv

 On Windows: venv\Scripts\activate
 On Mac/Linux: source venv/bin/activate

 3. Install Django
pip install django

 4. Apply database migrations (creates tables)
python manage.py makemigrations
python manage.py migrate

 6. Run the development server
python manage.py runserver

The application will be available at http://127.0.0.1:8000

# Key Concepts Demonstrated : 
Django MVT architecture (Models, Views, Templates)
Foreign key relationships between models (models.ForeignKey)
auto_now_add for automatic timestamps
@login_required decorator for protected views
Django built-in auth: authenticate(), login(), logout()
Template inheritance with {% extends %} and {% block %}
Conditional template logic with {% if user.is_authenticated %}
makemigrations and migrate workflow
CSRF protection with {% csrf_token %}
Django admin panel integration
messages framework for user feedback
Dynamic URL parameters with <int:event_id>


-----------------------------------------------------------------------------
# Project 3: Restaurant Management System (Express.js)
# Description
A comprehensive restaurant management backend system built with Express.js. It provides a complete REST API for managing menu items, tables, inventory, orders, and reservations. The project also includes an integrated HTML/CSS frontend that consumes the API endpoints, giving users a visual interface to manage every aspect of a restaurant's daily operations.

# Tech Stack
Express.js — Fast, unopinionated Node.js web framework
better-sqlite3 — Synchronous SQLite3 driver for Node.js
REST API — Full CRUD operations across 6 database tables
HTML/CSS/JavaScript — Frontend using Fetch API to consume the backend

# Features
Menu Management: Add, view, update, and delete menu items (name, description, price, category)
Table Management: Manage restaurant tables with seat count and availability status
Inventory Tracking: Track ingredient stock with quantities and unit measurements
Order System: Create orders linked to tables, add/remove items, calculate totals, update order status
Reservation System: Book tables for specific dates and times with guest count and contact info
Interactive Frontend: A clean, tabbed HTML/CSS interface to perform all operations

# Setup & Running
 1. Navigate to the project folder
cd TASK3

 2. Initialize the project 
npm init -y

 3. Install dependencies
npm install express better-sqlite3

 4. Run the server
node server.js

The application will be available at http://localhost:3000

# Frontend Features: 
Tabbed Navigation: Switch between Menu, Tables, Inventory, Orders, and Reservations
Real-time Data: All operations immediately reflect in the UI via Fetch API calls
Forms for Creation: Each section has a form to add new records
Inline Actions: Update status, delete items, and manage orders directly from the interface
Clean Design: Professional styling with a restaurant-themed color scheme

# Key Concepts Demonstrated:
Express.js application setup and middleware (express.json(), express.static())
RESTful API design with proper HTTP methods (GET, POST, PUT, DELETE)
Request handling with req.body, req.params
JSON responses with res.json()
SQLite database operations with better-sqlite3 (synchronous driver)
Database schema design with foreign keys and relationships
CRUD operations across multiple related tables
Serving static files with express.static('public')
Frontend-backend communication using the Fetch API
Dynamic HTML rendering with JavaScript DOM manipulation
