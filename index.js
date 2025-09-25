require("dotenv").config();
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
const jwt = require("jsonwebtoken");
const stripe = require("stripe");// ← You need this
const stripeInstance = stripe(process.env.STRIPE_KEY);
const { handlePaymentIntentSucceeded, handlePaymentIntentPaymentFailed, handleSetupIntentPaymentSucceeded } = require("./utils/paymentStatus")
const morgan = require('morgan');


app.use(morgan('dev'));

app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

app.use(cors());
app.use('/public', express.static('public'));



app.post(
  "/webhook",
  bodyParser.raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"];
    let event;

    try {
      // Verify the event
      event = stripeInstance.webhooks.constructEvent(
        req.body,
        sig,
        process.env.END_POINT_SECRET
      );
      console.log(event, "event");

      // Handle the event
      switch (event.type) {
        case "payment_intent.succeeded":
          const paymentIntentSucceeded = event.data.object;
          await handlePaymentIntentSucceeded(paymentIntentSucceeded);
          break;

        case "payment_intent.payment_failed":
          const paymentIntentPaymentFailed = event.data.object;
          await handlePaymentIntentPaymentFailed(paymentIntentPaymentFailed);
          break;

        case "setup_intent.succeeded":
          const setupIntentPaymentSucceeded = event.data.object;
          await handleSetupIntentPaymentSucceeded(setupIntentPaymentSucceeded);
          break;

        default:
          console.log(`Unhandled event type ${event.type}`);
      }

      // Respond to Stripe that the event was received successfully
      res.json({ received: true });
    } catch (err) {
      console.log(`Webhook Error: ${err.message}`);
      res.status(400).send(`Webhook Error: ${err.message}`);
    }
  }
);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.set('io', io);


app.use(API_PRIFEX, rootRouter);



// Global error handling
app.use(globalErrorMiddleware);

app.get("/", (req, res) => {
  res.send("server is running.....!!!!!");
});

app.get("/health", (req, res) => {
  console.log("Health check triggered");
  res.status(200).send("OK");
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

server.listen(port, '0.0.0.0', () => {
  console.log(`server is running at ${port}`);
});
