(function () {
  const INDIA_CENTER = [20.5937, 78.9629];
  const pickers = [];

  const toFiniteNumber = (value) => {
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
  };

  const setStatus = (picker, message, isError) => {
    if (!picker.statusEl) {
      return;
    }

    picker.statusEl.textContent = message;
    picker.statusEl.classList.toggle("text-red-600", Boolean(isError));
    picker.statusEl.classList.toggle("text-slate-500", !isError);
  };

  const clearResults = (picker) => {
    if (!picker.resultsEl) {
      return;
    }

    picker.resultsEl.innerHTML = "";
    picker.resultsEl.classList.add("hidden");
  };

  const normalizeLocationResult = (result) => {
    const address = result.address || {};
    const latitude = toFiniteNumber(result.lat);
    const longitude = toFiniteNumber(result.lon);

    if (latitude === null || longitude === null) {
      return null;
    }

    const placeName =
      result.name ||
      address.road ||
      address.neighbourhood ||
      address.suburb ||
      address.village ||
      address.town ||
      address.city ||
      address.state ||
      "Pinned location";

    const city =
      address.city ||
      address.town ||
      address.village ||
      address.county ||
      address.state_district ||
      address.state ||
      "";

    return {
      latitude,
      longitude,
      placeName,
      city,
      formattedAddress: result.display_name || placeName
    };
  };

  const updateSelectedLocation = (picker, location, shouldRecenter) => {
    picker.latitudeInput.value = location.latitude.toFixed(6);
    picker.longitudeInput.value = location.longitude.toFixed(6);
    picker.placeNameInput.value = location.placeName;
    picker.formattedAddressInput.value = location.formattedAddress;
    picker.cityInput.value = location.city;

    picker.selectedNameEl.textContent = location.placeName;
    picker.selectedAddressEl.textContent = location.formattedAddress;
    picker.selectedCoordinatesEl.textContent = "Lat " +
      location.latitude.toFixed(6) +
      ", Lng " +
      location.longitude.toFixed(6);

    picker.marker.setLatLng([location.latitude, location.longitude]);

    if (!picker.map.hasLayer(picker.marker)) {
      picker.marker.addTo(picker.map);
    }

    if (shouldRecenter) {
      picker.map.setView([location.latitude, location.longitude], Math.max(picker.map.getZoom(), 16));
    }

    clearResults(picker);
    setStatus(picker, "Mapped location saved for delivery.", false);
  };

  const fetchJson = async (url) => {
    const response = await fetch(url, {
      headers: {
        "Accept": "application/json"
      }
    });

    if (!response.ok) {
      throw new Error("Unable to fetch location details");
    }

    return response.json();
  };

  const reverseGeocode = async (latitude, longitude) => {
    const url = new URL("https://nominatim.openstreetmap.org/reverse");
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("lat", latitude);
    url.searchParams.set("lon", longitude);
    url.searchParams.set("zoom", "18");
    url.searchParams.set("addressdetails", "1");

    const result = await fetchJson(url.toString());

    return normalizeLocationResult({
      ...result,
      lat: latitude,
      lon: longitude
    }) || {
      latitude,
      longitude,
      placeName: "Pinned location",
      city: "",
      formattedAddress: "Pinned location"
    };
  };

  const searchLocations = async (query) => {
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("q", query);
    url.searchParams.set("limit", "5");
    url.searchParams.set("addressdetails", "1");
    url.searchParams.set("countrycodes", "in");

    const results = await fetchJson(url.toString());

    return Array.isArray(results)
      ? results.map(normalizeLocationResult).filter(Boolean)
      : [];
  };

  const renderSearchResults = (picker, locations) => {
    clearResults(picker);

    if (!locations.length) {
      setStatus(picker, "No matching places found. Try a nearby landmark or click on the map.", true);
      return;
    }

    locations.forEach((location) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "block w-full border-b border-slate-100 px-4 py-3 text-left transition last:border-b-0 hover:bg-slate-50";

      const placeLine = document.createElement("div");
      placeLine.className = "text-sm font-semibold text-slate-900";
      placeLine.textContent = location.placeName;

      const addressLine = document.createElement("div");
      addressLine.className = "mt-1 text-xs text-slate-500";
      addressLine.textContent = location.formattedAddress;

      button.appendChild(placeLine);
      button.appendChild(addressLine);

      button.addEventListener("click", () => {
        updateSelectedLocation(picker, location, true);
      });

      picker.resultsEl.appendChild(button);
    });

    picker.resultsEl.classList.remove("hidden");
    setStatus(picker, "Select one of the matching places below.", false);
  };

  const pinCurrentCoordinates = async (picker, latitude, longitude, loadingMessage) => {
    setStatus(picker, loadingMessage, false);

    try {
      const location = await reverseGeocode(latitude, longitude);
      updateSelectedLocation(picker, location, true);
    } catch (error) {
      updateSelectedLocation(
        picker,
        {
          latitude,
          longitude,
          placeName: "Pinned location",
          city: "",
          formattedAddress: "Pinned location"
        },
        true
      );
      setStatus(picker, "Coordinates saved, but the place name could not be loaded.", true);
    }
  };

  const initializePicker = (root) => {
    const picker = {
      root,
      searchInput: root.querySelector("[data-location-search]"),
      searchButton: root.querySelector("[data-location-search-button]"),
      currentLocationButton: root.querySelector("[data-current-location-button]"),
      statusEl: root.querySelector("[data-location-search-status]"),
      resultsEl: root.querySelector("[data-location-search-results]"),
      mapEl: root.querySelector("[data-location-map]"),
      selectedNameEl: root.querySelector("[data-selected-location-name]"),
      selectedAddressEl: root.querySelector("[data-selected-location-address]"),
      selectedCoordinatesEl: root.querySelector("[data-selected-location-coordinates]"),
      latitudeInput: root.querySelector('input[name="deliveryLatitude"]'),
      longitudeInput: root.querySelector('input[name="deliveryLongitude"]'),
      placeNameInput: root.querySelector('input[name="deliveryPlaceName"]'),
      formattedAddressInput: root.querySelector('input[name="deliveryFormattedAddress"]'),
      cityInput: root.querySelector('input[name="deliveryCity"]')
    };

    if (!picker.mapEl || typeof L === "undefined") {
      setStatus(picker, "Map failed to load. Refresh the page and try again.", true);
      return;
    }

    picker.map = L.map(picker.mapEl, {
      zoomControl: true,
      scrollWheelZoom: true
    }).setView(INDIA_CENTER, 5);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap contributors"
    }).addTo(picker.map);

    picker.marker = L.marker(INDIA_CENTER);

    picker.map.on("click", async (event) => {
      const latitude = event.latlng.lat;
      const longitude = event.latlng.lng;
      await pinCurrentCoordinates(picker, latitude, longitude, "Saving the selected map point...");
    });

    if (picker.searchButton) {
      picker.searchButton.addEventListener("click", async () => {
        const query = (picker.searchInput?.value || "").trim();

        if (!query) {
          setStatus(picker, "Enter a place name before searching.", true);
          return;
        }

        setStatus(picker, "Searching for matching places...", false);

        try {
          const locations = await searchLocations(query);
          renderSearchResults(picker, locations);
        } catch (error) {
          clearResults(picker);
          setStatus(picker, "Unable to search right now. You can still click on the map.", true);
        }
      });
    }

    if (picker.searchInput) {
      picker.searchInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
          event.preventDefault();

          if (picker.searchButton) {
            picker.searchButton.click();
          }
        }
      });
    }

    if (picker.currentLocationButton) {
      picker.currentLocationButton.addEventListener("click", () => {
        if (!navigator.geolocation) {
          setStatus(picker, "This browser cannot share current location. Search or click on the map instead.", true);
          return;
        }

        setStatus(picker, "Requesting your current location...", false);

        navigator.geolocation.getCurrentPosition(
          async (position) => {
            await pinCurrentCoordinates(
              picker,
              position.coords.latitude,
              position.coords.longitude,
              "Saving your current location..."
            );
          },
          () => {
            setStatus(picker, "Current location access was blocked. Search or click on the map instead.", true);
          },
          {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 10000
          }
        );
      });
    }

    const initialLatitude = toFiniteNumber(picker.latitudeInput.value);
    const initialLongitude = toFiniteNumber(picker.longitudeInput.value);

    if (initialLatitude !== null && initialLongitude !== null) {
      updateSelectedLocation(
        picker,
        {
          latitude: initialLatitude,
          longitude: initialLongitude,
          placeName: picker.placeNameInput.value || "Pinned location",
          city: picker.cityInput.value || "",
          formattedAddress: picker.formattedAddressInput.value || picker.placeNameInput.value || "Pinned location"
        },
        true
      );
    }

    pickers.push(picker);
  };

  const refreshPickerMaps = () => {
    pickers.forEach((picker) => {
      if (picker.map) {
        window.setTimeout(() => {
          picker.map.invalidateSize();
        }, 100);
      }
    });
  };

  const validateOrderLocation = (form) => {
    if (!form) {
      return true;
    }

    const latitudeInput = form.querySelector('input[name="deliveryLatitude"]');
    const longitudeInput = form.querySelector('input[name="deliveryLongitude"]');

    if (!latitudeInput || !longitudeInput) {
      return true;
    }

    if (!latitudeInput.value || !longitudeInput.value) {
      window.alert("Please select the delivery location on the map before placing the order.");
      return false;
    }

    return true;
  };

  window.refreshOrderLocationPickers = refreshPickerMaps;
  window.validateOrderLocation = validateOrderLocation;

  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".js-order-location-picker").forEach(initializePicker);
    refreshPickerMaps();
  });
})();
