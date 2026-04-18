// Core Modules
const path = require('path');
const dns = require('dns');
const http = require('http');

dns.setServers(['8.8.8.8', '8.8.4.4']); 

// External Modules
const express = require('express');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const { default: mongoose } = require('mongoose');
const multer = require('multer');

const DB_PATH = "mongodb+srv://root:root@nandeesh.3tbg3gi.mongodb.net/?appName=Nandeesh";

// --- MULTER CONFIGURATION (Fixed & Ordered) ---
const randomString = (length) => {
  const characters = 'abcdefghijklmnopqrstuvwxyz';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); 
  },
  filename: (req, file, cb) => {
    cb(null, randomString(10) + '-' + file.originalname);
  }
});

const fileFilter = (req, file, cb) => {
  if (['image/png', 'image/jpg', 'image/jpeg'].includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

const upload = multer({ storage, fileFilter });

// Local Modules
const rootDir = require("./utils/pathUtil");
const User = require("./models/user");
const { attachTrackingSockets } = require("./utils/trackingSocket");

const app = express();
const server = http.createServer(app);

// Socket.io Setup
let SocketIOServer = null;
try {
  ({ Server: SocketIOServer } = require("socket.io"));
} catch (error) {
  ({ Server: SocketIOServer } = require("./tracking/node_modules/socket.io"));
}
const io = new SocketIOServer(server);
attachTrackingSockets(io);

// View Engine
app.set('view engine', 'ejs');
app.set('views', [
  path.join(rootDir, 'views'),
  path.join(rootDir, 'tracking', 'views')
]);

const store = new MongoDBStore({
  uri: DB_PATH,
  collection: 'sessions'
});

// Middleware
app.use(express.urlencoded({ extended: true }));
// REMOVED: app.use(multer(multerOptions).single('photo')); // This line was causing the crash
app.use(express.static(path.join(rootDir, 'public')))
app.use("/tracking-assets", express.static(path.join(rootDir, 'tracking', 'public')));
app.use("/uploads", express.static(path.join(rootDir, 'uploads')))

app.use(session({
  secret: "KnowledgeGate AI with Complete Coding",
  resave: false,
  saveUninitialized: true,
  store
}));

// Auth & User Middleware
app.use((req, res, next) => {
  req.isLoggedIn = req.session.isLoggedIn
  next();
})

app.use(async (req, res, next) => {
  res.locals.cartCount = 0;
  if (!req.session.user?._id) return next();

  try {
    const freshUser = await User.findById(req.session.user._id).select("firstName lastName email phoneNumber userType cart");
    if (!freshUser) {
      req.session.destroy();
      return next();
    }
    req.session.user = freshUser;
    req.isLoggedIn = true;
    res.locals.cartCount = Array.isArray(freshUser.cart) ? freshUser.cart.length : 0;
    next();
  } catch (err) {
    next();
  }
});

// Routes
const authRouter = require("./routes/authRouter");
const storeRouter = require("./routes/storeRouter");
const hostRouter = require("./routes/hostRouter");
const orderRouter = require("./routes/orderRouter");
const deliveryRouter = require("./routes/deliveryboy");
const errorsController = require("./controllers/errors");

app.use(authRouter);
app.use(storeRouter);
app.use("/orders", orderRouter);
app.use("/delivery", deliveryRouter);
app.use("/host", hostRouter);

app.use(errorsController.pageNotFound);

// Database Connection
const PORT = 5001;
mongoose.connect(DB_PATH).then(() => {
  console.log('Connected to Mongo');
  server.listen(PORT, () => {
    console.log(`Server running on: http://localhost:${PORT}`);
  });
}).catch(err => console.log(err));

// EXPORT upload so hostRouter.js can use it
module.exports = { app, upload };