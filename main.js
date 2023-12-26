mapboxgl.accessToken =
  "pk.eyJ1IjoiYmlrZXJpZGEiLCJhIjoiY2l5bDJxcG83MDAyNDJxbnJmcWk0NzFxMSJ9.EWdwgIGRuN4ALQPvICFCog";
const map = new mapboxgl.Map({
  container: "map",
  // Choose from Mapbox's core styles, or make your own style with Mapbox Studio
  style: "mapbox://styles/mapbox/streets-v12",
  center: [-105.5, 39],
  maxZoom: 20,
  minZoom: 1,
  zoom: 6,
});

// Holds visible airport features for filtering
let airports = [];

// Create a popup, but don't add it to the map yet.
const popup = new mapboxgl.Popup({
  closeButton: false,
});

const filterEl = document.getElementById("feature-filter");
const listingEl = document.getElementById("feature-listing");

function renderListings(features) {
  const empty = document.createElement("p");
  // Clear any existing listings
  listingEl.innerHTML = "";
  if (features.length) {
    for (const feature of features) {
      const itemLink = document.createElement("a");
      const label = `${feature.properties.name} (${feature.properties.abbrev})`;
      itemLink.href = feature.properties.wikipedia;
      itemLink.target = "_blank";
      itemLink.textContent = label;
      itemLink.addEventListener("mouseover", () => {
        // Highlight corresponding feature on the map
        popup.setLngLat(feature.geometry.coordinates).setText(label).addTo(map);
      });
      listingEl.appendChild(itemLink);
    }

    // Show the filter input
    filterEl.parentNode.style.display = "block";
  } else if (features.length === 0 && filterEl.value !== "") {
    empty.textContent = "No results found";
    listingEl.appendChild(empty);
  } else {
    empty.textContent = "Drag the map to populate results";
    listingEl.appendChild(empty);

    // Hide the filter input
    filterEl.parentNode.style.display = "none";

    // remove features filter
    map.setFilter("airport", ["has", "abbrev"]);
  }
}

function normalize(string) {
  return string.trim().toLowerCase();
}

// Because features come from tiled vector data,
// feature geometries may be split
// or duplicated across tile boundaries.
// As a result, features may appear
// multiple times in query results.
function getUniqueFeatures(features, comparatorProperty) {
  const uniqueIds = new Set();
  const uniqueFeatures = [];
  for (const feature of features) {
    const id = feature.properties[comparatorProperty];
    if (!uniqueIds.has(id)) {
      uniqueIds.add(id);
      uniqueFeatures.push(feature);
    }
  }
  return uniqueFeatures;
}

map.on("load", () => {
  map.addSource("airports", {
    type: "vector",
    url: "mapbox://mapbox.04w69w5j",
  });
  map.addLayer({
    id: "airport",
    source: "airports",
    "source-layer": "ne_10m_airports",
    type: "circle",
    paint: {
      "circle-color": "#4264fb",
      "circle-radius": 4,
      "circle-stroke-width": 2,
      "circle-stroke-color": "#ffffff",
    },
  });

  map.on("movestart", () => {
    // reset features filter as the map starts moving
    map.setFilter("airport", ["has", "abbrev"]);
  });

  map.on("moveend", () => {
    const features = map.queryRenderedFeatures({ layers: ["airport"] });

    if (features) {
      const uniqueFeatures = getUniqueFeatures(features, "iata_code");
      // Populate features for the listing overlay.
      renderListings(uniqueFeatures);

      // Clear the input container
      filterEl.value = "";

      // Store the current features in sn `airports` variable to
      // later use for filtering on `keyup`.
      airports = uniqueFeatures;
    }
  });

  map.on("mousemove", "airport", (e) => {
    // Change the cursor style as a UI indicator.
    map.getCanvas().style.cursor = "pointer";

    // Populate the popup and set its coordinates based on the feature.
    const feature = e.features[0];
    popup
      .setLngLat(feature.geometry.coordinates)
      .setText(`${feature.properties.name} (${feature.properties.abbrev})`)
      .addTo(map);
  });

  map.on("mouseleave", "airport", () => {
    map.getCanvas().style.cursor = "";
    popup.remove();
  });

  filterEl.addEventListener("keyup", (e) => {
    const value = normalize(e.target.value);

    // Filter visible features that match the input value.
    const filtered = [];
    for (const feature of airports) {
      const name = normalize(feature.properties.name);
      const code = normalize(feature.properties.abbrev);
      if (name.includes(value) || code.includes(value)) {
        filtered.push(feature);
      }
    }

    // Populate the sidebar with filtered results
    renderListings(filtered);

    // Set the filter to populate features into the layer.
    if (filtered.length) {
      map.setFilter("airport", [
        "match",
        ["get", "abbrev"],
        filtered.map((feature) => {
          return feature.properties.abbrev;
        }),
        true,
        false,
      ]);
    }
  });

  // Call this function on initialization
  // passing an empty array to render an empty state
  renderListings([]);
});

map.on("load", () => {
  // Add a data source containing GeoJSON data.
  map.addSource("salida", {
    type: "geojson",
    data: {
      type: "Feature",
      geometry: {
        type: "Polygon",
        // These coordinates outline Salida.
        coordinates: [
          [
            [-106.512955190280394, 38.938149780547057],
            [-106.509733091850293, 38.409924628238421],
            [-105.772786403443007, 38.412461026660708],
            [-105.785803487965595, 38.941505819698222],
            [-106.512955190280394, 38.938149780547057],
          ],
        ],
      },
    },
  });

  // Add a new layer to visualize the polygon.
  map.addLayer({
    id: "salida",
    type: "fill",
    source: "salida", // reference the data source
    layout: {},
    paint: {
      "fill-color": "#0080ff", // blue color fill
      "fill-opacity": 0.5,
    },
  });
  // Add a black outline around the polygon.
  map.addLayer({
    id: "outline",
    type: "line",
    source: "salida",
    layout: {},
    paint: {
      "line-color": "#000",
      "line-width": 3,
    },
  });
});
