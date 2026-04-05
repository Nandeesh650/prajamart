// ----------------------------
// delivery-dashboard.js
// ----------------------------

const locationStatusEl = document.getElementById("deliveryLocationStatus");
const orderCards = Array.from(document.querySelectorAll(".delivery-order-card"));

const toNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

const setLocationStatus = (message, isError = false) => {
  if (!locationStatusEl) return;
  locationStatusEl.textContent = message;
  locationStatusEl.classList.toggle("border-red-200", isError);
  locationStatusEl.classList.toggle("bg-red-50", isError);
  locationStatusEl.classList.toggle("text-red-700", isError);
};

const calculateDistanceKm = (pointA, pointB) => {
  const toRadians = (deg) => deg * (Math.PI / 180);
  const R = 6371; // Earth radius in km
  const dLat = toRadians(pointB.latitude - pointA.latitude);
  const dLng = toRadians(pointB.longitude - pointA.longitude);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(pointA.latitude)) *
      Math.cos(toRadians(pointB.latitude)) *
      Math.sin(dLng / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const updateOrderCards = (currentLocation) => {
  orderCards.forEach((card) => {
    const orderLat = toNumber(card.dataset.latitude);
    const orderLng = toNumber(card.dataset.longitude);
    const distanceOutput = card.querySelector("[data-distance-output]");
    const acceptBtn = card.querySelector("[data-accept-button]");
    const latInput = card.querySelector('input[name="latitude"]');
    const lngInput = card.querySelector('input[name="longitude"]');

    if (!acceptBtn || !latInput || !lngInput || !distanceOutput) return;

    latInput.value = currentLocation.latitude;
    lngInput.value = currentLocation.longitude;

    if (orderLat === null || orderLng === null) {
      acceptBtn.disabled = true;
      distanceOutput.textContent = "Customer location is not available";
      return;
    }

    const distanceKm = calculateDistanceKm(currentLocation, { latitude: orderLat, longitude: orderLng });
    distanceOutput.textContent = `${distanceKm.toFixed(1)} km from your location`;

    if (distanceKm <= 20) {
      card.classList.remove("opacity-50");
      acceptBtn.disabled = false;
    } else {
      card.classList.add("opacity-50");
      acceptBtn.disabled = true;
    }
  });
};

// Get live location
if (!navigator.geolocation) {
  setLocationStatus("Your browser cannot provide live location.", true);
} else {
  navigator.geolocation.getCurrentPosition(
    (position) => {
      const currentLocation = { latitude: position.coords.latitude, longitude: position.coords.longitude };
      setLocationStatus("Live location connected. Orders within 20 km can now be accepted.");
      updateOrderCards(currentLocation);
    },
    () => setLocationStatus("Allow location access to see and accept nearby orders.", true),
    { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
  );
}
