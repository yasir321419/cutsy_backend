const express = require('express');
const cors = require("cors");
const bodyParser = require("body-parser");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 4000;
const API_PRIFEX = '/api/v1';  // Prefix for all routes
const rootRouter = require("./routes/index");
const globalErrorMiddleware = require("./middleware/globalMiddleware");
const dbConnect = require('./db/connectivity');
const adminSeed = require('./seeder/adminseed');
const socketIo = require("socket.io");
const http = require("http");
const server = http.createServer(app);
const io = socketIo(server);
const ChatRoomService = require("./service/chatService");
const jwt = require("jsonwebtoken"); // ← You need this

app.use(cors());
app.use('/public', express.static('public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.set('io', io);


app.use(API_PRIFEX, rootRouter);

// Global error handling
app.use(globalErrorMiddleware);

app.get("/", (req, res) => {
  res.send("server is running");
});

dbConnect();

adminSeed();


io.use((socket, next) => {
  const token = socket.handshake.headers?.['x-access-token'];

  if (!token) {
    console.log("Token missing in socket connection");
    return next(new Error("Authentication token missing"));
  }
  console.log(token, "token");

  try {
    const decoded = jwt.verify(token, process.env.SECRET_KEY); // your JWT secret
    socket.userId = decoded.id;
    socket.userType = decoded.userType;
    console.log(socket.userId, "userid");
    console.log(socket.userType, "userType");


    next();
  } catch (err) {
    console.log("Invalid token");
    return next(new Error("Invalid authentication token"));
  }
});


io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Join chatroom and personal socket
  socket.on("joinRoom", (data) => {
    console.log("User joined room:", data.chatroom);
    socket.join(data.chatroom);                  // Join chat room
    socket.join(socket.userId);                  // Join personal room
    ChatRoomService.getChatRoomData(socket, data);               // Load chat room data
  });

  socket.on("leaveRoom", ({ chatroom }) => {
    socket.leave(chatroom);
    socket.leave(socket.userId);
    console.log(`User left room ${chatroom}`);
  });

  socket.on("sendMessage", (data) => {
    ChatRoomService.sendMessage(io, socket, data);
  });

  // Handle barber location updates
  // socket.on('updateLocation', (locationData) => {
  //   console.log('Barber location:', locationData);
  //   socket.broadcast.emit('locationUpdate', locationData);
  // });


  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});




// app.listen(port, () => {
//   console.log(`Server is running at http://localhost:${port}`);
// });

server.listen(port, () => {
  console.log(`server is running at ${port}`);
});
