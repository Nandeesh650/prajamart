const Order = require("../models/order");

const DEFAULT_CENTER = {
  latitude: 14.2698,
  longitude: 75.3564
};

const trackingSessions = new Map();

const hashValue = (value = "") => {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = ((hash << 5) - hash) + value.charCodeAt(index);
    hash |= 0;
  }

  return Math.abs(hash);
};

const buildDefaultTrackingState = (orderId, deliveryLocation = null) => {
  const seed = hashValue(orderId);
  const latitudeOffset = ((seed % 200) - 100) / 50000;
  const longitudeOffset = (((Math.floor(seed / 200)) % 200) - 100) / 50000;

  const baseLatitude = Number.isFinite(Number(deliveryLocation?.latitude))
    ? Number(deliveryLocation.latitude)
    : DEFAULT_CENTER.latitude;
  const baseLongitude = Number.isFinite(Number(deliveryLocation?.longitude))
    ? Number(deliveryLocation.longitude)
    : DEFAULT_CENTER.longitude;

  const customerLatitude = baseLatitude + latitudeOffset / 5;
  const customerLongitude = baseLongitude + longitudeOffset / 5;
  const driverLatitude = customerLatitude - 0.0022;
  const driverLongitude = customerLongitude - 0.0018;

  return {
    customer: {
      id: "customer",
      latitude: customerLatitude,
      longitude: customerLongitude,
      role: "customer"
    },
    driver: {
      id: "driver",
      latitude: driverLatitude,
      longitude: driverLongitude,
      role: "delivery boy"
    }
  };
};

const getTrackingSession = async (orderId) => {
  if (!trackingSessions.has(orderId)) {
    const order = await Order.findById(orderId).select("deliveryLocation");
    trackingSessions.set(orderId, buildDefaultTrackingState(orderId, order?.deliveryLocation));
  }

  return trackingSessions.get(orderId);
};

const buildRoomName = (orderId) => `tracking:${orderId}`;

exports.attachTrackingSockets = (io) => {
  io.on("connection", async (socket) => {
    const orderId = typeof socket.handshake.query?.orderId === "string"
      ? socket.handshake.query.orderId.trim()
      : "";

    if (!orderId) {
      socket.emit("trackingError", "Tracking could not start because the order ID is missing.");
      socket.disconnect(true);
      return;
    }

    let trackingSession;

    try {
      trackingSession = await getTrackingSession(orderId);
    } catch (error) {
      socket.emit("trackingError", "Tracking could not load this order.");
      socket.disconnect(true);
      return;
    }
    const roomName = buildRoomName(orderId);

    socket.join(roomName);
    socket.emit("receiveLocation", trackingSession.customer);
    socket.emit("receiveLocation", trackingSession.driver);

    socket.on("driverLocationUpdate", (location) => {
      const latitude = Number(location?.latitude);
      const longitude = Number(location?.longitude);

      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        socket.emit("trackingError", "Invalid delivery coordinates received.");
        return;
      }

      trackingSession.driver = {
        id: "driver",
        latitude,
        longitude,
        role: "delivery boy"
      };

      io.to(roomName).emit("receiveLocation", trackingSession.driver);
    });
  });
};
