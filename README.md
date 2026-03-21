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

## Main Features
- User authentication using JWT echanged by cookie and password hashing
- Protected routes using authentication middleware
- Role management thanks to middleware
- Provides endpoints for the front-end to handle main front-end needs
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
- Others : Cloudinary, Resend, Socket.io...

## Prerequisites
Before running the project locally, make sure you got the front-end installed. <br>
See front-end repository : https://github.com/Thomas-Thomas-2/myteacher-frontend.git <br>
Make also sure to have a MongoDB database configured and connected to the back-end. <br>
A cloudinary account and a resend API key are necessary.

## Installation
Clone the repository and install dependencies: <br>
git clone https://github.com/Thomas-Thomas-2/myteacher-backend.git <br>
cd myteacher-backend <br>
npm install OR yarn install <br>
npm run start OR yarn start

The back-end will be available at: http://localhost:3000

## Environment variables
Create a .env .
For local launch, set these with your own values: <br>
CONNECTION_STRING=mongodb+srv://... <br>
JWT_SECRET=your_secret <br>
FRONT_URL=http://localhost:3001 <br>
RESEND_API_KEY=your_key <br>
CLOUDINARY_URL=your_url

## Deployement
This back-end is deployed on Render : 

## Demo
Watch the demonstration : <br>
[![Watch the demonstration](./public/Capture_Accueil.png)](https://player.cloudinary.com/embed/?cloud_name=dedeskvc6&public_id=MyTeacher_1_ip6zmh)

