const CITY_COORDINATES = {
  Bangalore: { latitude: 12.9716, longitude: 77.5946 },
  Chennai: { latitude: 13.0827, longitude: 80.2707 },
  Delhi: { latitude: 28.6139, longitude: 77.209 },
  Hyderabad: { latitude: 17.385, longitude: 78.4867 },
  Kolkata: { latitude: 22.5726, longitude: 88.3639 },
  Mumbai: { latitude: 19.076, longitude: 72.8777 },
  Pune: { latitude: 18.5204, longitude: 73.8567 }
};

const toText = (value) => String(value || "").trim();
const clampText = (value, maxLength = 160) => toText(value).slice(0, maxLength);
const toFiniteNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

const findCityName = (value) => {
  const normalizedValue = toText(value).toLowerCase();

  if (!normalizedValue) {
    return "";
  }

  return Object.keys(CITY_COORDINATES).find((city) =>
    normalizedValue.includes(city.toLowerCase())
  ) || "";
};

exports.CITY_COORDINATES = CITY_COORDINATES;

exports.getLocationDetails = (primaryValue, fallbackValue = "") => {
  const cityName = findCityName(primaryValue) || findCityName(fallbackValue);

  if (!cityName) {
    return null;
  }

  return {
    city: cityName,
    latitude: CITY_COORDINATES[cityName].latitude,
    longitude: CITY_COORDINATES[cityName].longitude
  };
};

exports.buildDeliveryLocation = (payload = {}) => {
  const latitude = toFiniteNumber(payload.deliveryLatitude);
  const longitude = toFiniteNumber(payload.deliveryLongitude);

  if (
    latitude === null ||
    longitude === null ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    return null;
  }

  const normalizedLabel = toText(payload.addressLabel).toLowerCase();
  const label = normalizedLabel === "other" ? "Other" : "Home";
  const addressDetails = clampText(payload.addressDetails, 160);
  const placeName = clampText(payload.deliveryPlaceName, 160) || "Pinned location";
  const formattedAddress = clampText(payload.deliveryFormattedAddress, 260);
  const city =
    clampText(payload.deliveryCity, 80) ||
    findCityName(formattedAddress) ||
    findCityName(placeName) ||
    "";

  const shippingAddressParts = [label];

  if (addressDetails) {
    shippingAddressParts.push(addressDetails);
  }

  if (formattedAddress) {
    shippingAddressParts.push(formattedAddress);
  } else if (placeName) {
    shippingAddressParts.push(placeName);
  }

  return {
    shippingAddress: shippingAddressParts.join(" - "),
    deliveryLocation: {
      label,
      addressDetails,
      placeName,
      formattedAddress,
      city,
      latitude,
      longitude
    }
  };
};

exports.calculateDistanceKm = (pointA, pointB) => {
  const latitudeA = Number(pointA?.latitude);
  const longitudeA = Number(pointA?.longitude);
  const latitudeB = Number(pointB?.latitude);
  const longitudeB = Number(pointB?.longitude);

  if (
    !Number.isFinite(latitudeA) ||
    !Number.isFinite(longitudeA) ||
    !Number.isFinite(latitudeB) ||
    !Number.isFinite(longitudeB)
  ) {
    return Number.POSITIVE_INFINITY;
  }

  const toRadians = (degrees) => degrees * (Math.PI / 180);
  const earthRadiusKm = 6371;
  const deltaLatitude = toRadians(latitudeB - latitudeA);
  const deltaLongitude = toRadians(longitudeB - longitudeA);

  const haversine =
    Math.sin(deltaLatitude / 2) ** 2 +
    Math.cos(toRadians(latitudeA)) *
      Math.cos(toRadians(latitudeB)) *
      Math.sin(deltaLongitude / 2) ** 2;

  const arc = 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));

  return earthRadiusKm * arc;
};
