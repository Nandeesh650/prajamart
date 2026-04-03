// Core Module
const path = require('path');
const dns = require('dns');
const http = require('http');

dns.setServers(['8.8.8.8', '8.8.4.4']); 

// External Module
const express = require('express');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const { default: mongoose } = require('mongoose');
const multer = require('multer');
const DB_PATH = "mongodb+srv://root:root@nandeesh.3tbg3gi.mongodb.net/?appName=Nandeesh";

//Local Module
const storeRouter = require("./routes/storeRouter")
const hostRouter = require("./routes/hostRouter")
const orderRouter = require("./routes/orderRouter")
const deliveryRouter = require("./routes/deliveryboy")
const authRouter = require("./routes/authRouter")
const rootDir = require("./utils/pathUtil");
const errorsController = require("./controllers/errors");
const User = require("./models/user");
const { attachTrackingSockets } = require("./utils/trackingSocket");

const app = express();
const server = http.createServer(app);

let SocketIOServer = null;

try {
  ({ Server: SocketIOServer } = require("socket.io"));
} catch (error) {
  ({ Server: SocketIOServer } = require("./tracking/node_modules/socket.io"));
}

const io = new SocketIOServer(server);
attachTrackingSockets(io);

app.set('view engine', 'ejs');
app.set('views', [
  path.join(rootDir, 'views'),
  path.join(rootDir, 'tracking', 'views')
]);

const store = new MongoDBStore({
  uri: DB_PATH,
  collection: 'sessions'
});

const randomString = (length) => {
  const characters = 'abcdefghijklmnopqrstuvwxyz';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, randomString(10) + '-' + file.originalname);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'image/png' || file.mimetype === 'image/jpg' || file.mimetype === 'image/jpeg') {
    cb(null, true);
  } else {
    cb(null, false);
  }
}

const multerOptions = {
  storage, fileFilter
};

app.use(express.urlencoded({ extended: true }));
app.use(multer(multerOptions).single('photo'));
app.use(express.static(path.join(rootDir, 'public')))
app.use("/tracking-assets", express.static(path.join(rootDir, 'tracking', 'public')));
app.use("/uploads", express.static(path.join(rootDir, 'uploads')))
app.use("/products/uploads", express.static(path.join(rootDir, 'uploads')));

app.use(session({
  secret: "KnowledgeGate AI with Complete Coding",
  resave: false,
  saveUninitialized: true,
  store
}));

app.use((req, res, next) => {
  req.isLoggedIn = req.session.isLoggedIn
  next();
})

app.use(async (req, res, next) => {
  res.locals.cartCount = 0;

  if (!req.session.user?._id) {
    return next();
  }

  try {
    const freshUser = await User.findById(req.session.user._id).select("firstName lastName email phoneNumber userType cart");

    if (!freshUser) {
      req.session.isLoggedIn = false;
      req.session.user = null;
      req.isLoggedIn = false;
      return next();
    }

    req.session.user = freshUser;
    req.isLoggedIn = true;
    res.locals.cartCount = Array.isArray(freshUser.cart)
      ? freshUser.cart.filter(Boolean).length
      : 0;
    next();
  } catch (err) {
    console.log("Error loading user for navbar:", err);
    next();
  }
});

app.use(authRouter)
app.use(storeRouter);

app.use("/orders", (req, res, next) => {
  if (req.isLoggedIn) {
    if (req.session.user?.userType === "deliveryboy") {
      return res.redirect("/delivery/orders");
    }
    next();
  } else {
    res.redirect("/login");
  }
});
app.use("/orders", orderRouter);

app.use("/delivery", (req, res, next) => {
  if (!req.isLoggedIn) {
    return res.redirect("/login");
  }

  if (req.session.user?.userType !== "deliveryboy") {
    return res.redirect("/");
  }

  next();
});
app.use("/delivery", deliveryRouter);

app.use("/host", (req, res, next) => {
  if (!req.isLoggedIn) {
    return res.redirect("/login");
  }

  if (req.session.user?.userType !== "host") {
    return res.redirect("/");
  }

  next();
});
app.use("/host", hostRouter);

app.use(errorsController.pageNotFound);

const PORT = 5001;

mongoose.connect(DB_PATH).then(() => {
  console.log('Connected to Mongo');
  server.listen(PORT, () => {
    console.log(`Server running on address http://localhost:${PORT}`);
  });
}).catch(err => {
  console.log('Error while connecting to Mongo: ', err);
});
