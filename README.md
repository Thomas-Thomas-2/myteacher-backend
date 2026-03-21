# MyTeacher — Back-end API

## Summary
- **Project type**: Back-end API for web application
- **Status**: MVP
- **Built with**: Node.js, Express, MongoDB, Mongoose
- **Purpose**: To help independent teachers to manage their daily business (back-end part).

## Overview
This repository contains the back-end of **MyTeacher**. <br>
This project is an end of training bootcamp project, developed during two weeks by a team of 4 developers. <br>
This API is responsible for authentication, database interactions, file uploads, email sending, real-time chat service...

## Responsibilities
- Handle user authentication and authorization
- Expose API endpoints for the frontend
- Interact with the database
- Implement the core business logic
- Communicate with third-party services such as [Cloudinary / Resend / Socket.IO / other]

## Main Features
- User authentication using JWT echanged by cookie and password hashing
- Protected routes using authentication middleware
- Role management thanks to middleware
- Provides endpoints for the front-end to handle main front-end needs
- Email sending
- File upload using cloudinar
- [Feature 3]
- [Feature 4]
- File upload / email sending / notifications / recurring events / other

## Tech Stack
- [Node.js]
- [Express]
- [MongoDB]
- [Mongoose]
- [JWT]
- [bcrypt]
- [Cloudinary]
- [Resend]
- [Socket.IO]
- [Other important dependencies]

## Project Structure
- `routes/` : API route definitions
- `controllers/` : request handling and endpoint logic
- `models/` : database schemas and models
- `middlewares/` : Express middlewares
- `services/` : integrations with external services
- `bin/` : server entry point
- `config/` : application configuration
- `[other folder]` : [folder purpose]

## Prerequisites
Before running the project, make sure the following tools are installed:
- [Node.js]
- [npm / yarn]
- [MongoDB local instance or MongoDB Atlas connection]
- [Any required external service accounts]

## Installation
Clone the repository and install dependencies:
git clone [repository-url]
cd [repository-name]
npm install

## Authorization

[Explain here whether different roles or permissions exist.]

Example:

Teachers can access and manage their own resources
Students can only access data shared with them
