# MyTeacher — Backend API

## Summary
- **Project type**: Backend API for web application - SaaS type
- **Status**: MVP
- **Built with**: Node.js, Express, MongoDB, Mongoose
- **Purpose**: Backend API for a web application designed to help independent teachers to manage their daily business.

## Overview
This repository contains the backend of **MyTeacher**. <br>
This project is an end of training bootcamp project, developed during two weeks by a team of 4 developers. <br>
This API is responsible for authentication, database interactions, file uploads, email sending, real-time chat service and invoice pdf generation.

## Main Features
- User authentication using JWT stored in cookie and password hashing
- Protected routes using authentication middleware
- Role-based access control implemented through middleware
- Provides endpoints for the frontend to support frontend features
- Email sending
- File upload using cloudinary
- Real-time chat
- Invoice pdf generation

## Tech Stack
- Node.js
- Express
- MongoDB
- Mongoose
- JWT
- bcrypt
- Other services : Cloudinary, Resend, Pusher.

## Prerequisites
Before running the project locally, make sure the frontend is installed and configured. <br>
See frontend repository : https://github.com/Thomas-Thomas-2/myteacher-frontend.git <br>
Also make sure to have a MongoDB database configured and connected to the backend. <br>
A cloudinary account and a resend API key are necessary.

## Installation
Clone the repository and install dependencies: <br>
git clone https://github.com/Thomas-Thomas-2/myteacher-backend.git <br>
cd myteacher-backend <br>
npm install <br>
npm run start

## Environment variables
Create a .env file at the root of the project. <br>
For local launch, set these with your own values: <br>
CONNECTION_STRING=mongodb+srv://... <br>
JWT_SECRET=your_secret <br>
FRONT_URL=http://localhost:3001 <br>
RESEND_API_KEY=your_key <br>
CLOUDINARY_URL=your_url

## Deployment
This backend is deployed on Render : https://api.my-teacher-app.fr/

## Demo
Watch the demonstration : <br>
[![Watch the demonstration](./public/Capture_Accueil.png)](https://player.cloudinary.com/embed/?cloud_name=dedeskvc6&public_id=MyTeacher_1_ip6zmh)

