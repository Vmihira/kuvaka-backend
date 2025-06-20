Nexus Chat

A real-time group chat application using React, Node.js, Express and MongoDB.

Live Application -> https://kuvaka-frontend-nine.vercel.app

Backend Setup

1. Navigate to the backend folder:

   cd chatroom-backend

2. Install dependencies:

   npm install

3. Update MongoDB connection string in `server.js`.

4. Start the server:

   npm run dev

   Runs on: `http://localhost:5000`


How It Works

Users can create or join rooms.
Each room has a unique link.
Messages are sent and received in real-time using WebSockets.
Active users, typing indicators, and participants are shown live.
Messages are stored in MongoDB and loaded on room join.

Design Decisions

 Unique room links.
 Messages stored per room.
 Emoji picker for enhanced user interaction.

Deployment Links

Frontend:[https://kuvaka-frontend-nine.vercel.app]

Backend:[https://kuvaka-backend-5jl5.onrender.com]
