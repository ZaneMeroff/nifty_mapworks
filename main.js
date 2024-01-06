import { mapboxgl } from 'mapbox-gl';

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



