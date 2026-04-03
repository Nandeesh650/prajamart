const locationStatusEl = document.getElementById("deliveryLocationStatus");
const orderCards = Array.from(document.querySelectorAll(".delivery-order-card"));

const toNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

const setLocationStatus = (message, isError = false) => {
  if (!locationStatusEl) {
    return;
  }

  locationStatusEl.textContent = message;
  locationStatusEl.classList.toggle("border-red-200", isError);
  locationStatusEl.classList.toggle("bg-red-50", isError);
  locationStatusEl.classList.toggle("text-red-700", isError);
};

const calculateDistanceKm = (pointA, pointB) => {
  const toRadians = (degrees) => degrees * (Math.PI / 180);
  const earthRadiusKm = 6371;
  const deltaLatitude = toRadians(pointB.latitude - pointA.latitude);
  const deltaLongitude = toRadians(pointB.longitude - pointA.longitude);

  const haversine =
    Math.sin(deltaLatitude / 2) ** 2 +
    Math.cos(toRadians(pointA.latitude)) *
      Math.cos(toRadians(pointB.latitude)) *
      Math.sin(deltaLongitude / 2) ** 2;

  const arc = 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
  return earthRadiusKm * arc;
};

const updateOrderCards = (currentLocation) => {
  orderCards.forEach((card) => {
    const orderLatitude = toNumber(card.dataset.latitude);
    const orderLongitude = toNumber(card.dataset.longitude);
    const distanceOutput = card.querySelector("[data-distance-output]");
    const acceptButton = card.querySelector("[data-accept-button]");
    const latitudeInput = card.querySelector('input[name="latitude"]');
    const longitudeInput = card.querySelector('input[name="longitude"]');

    if (!acceptButton || !latitudeInput || !longitudeInput || !distanceOutput) {
      return;
    }

    latitudeInput.value = currentLocation.latitude;
    longitudeInput.value = currentLocation.longitude;

    if (orderLatitude === null || orderLongitude === null) {
      acceptButton.disabled = true;
      distanceOutput.textContent = "Customer location is not available";
      return;
    }

    const distanceKm = calculateDistanceKm(currentLocation, {
      latitude: orderLatitude,
      longitude: orderLongitude
    });

    distanceOutput.textContent = `${distanceKm.toFixed(1)} km from your location`;

    if (distanceKm <= 20) {
      card.classList.remove("opacity-50");
      acceptButton.disabled = false;
      return;
    }

    card.classList.add("opacity-50");
    acceptButton.disabled = true;
  });
};

if (!navigator.geolocation) {
  setLocationStatus("This browser cannot provide live location, so nearby order acceptance is unavailable.", true);
} else {
  navigator.geolocation.getCurrentPosition(
    (position) => {
      const currentLocation = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      };

      setLocationStatus("Live location connected. Orders within 20 km can now be accepted.");
      updateOrderCards(currentLocation);
    },
    () => {
      setLocationStatus("Allow location access to see and accept nearby ready orders.", true);
    },
    {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 10000
    }
  );
}
