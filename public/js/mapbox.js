/* eslint-disable */
//we are disabling eslint for this file, since we have configured only NodeJS
// const locations = JSON.parse(document.getElementById('map').dataset.locations);//we will shift this index.js file
// since locations is a string , we convert it back to a JSON object

// console.log(locations);

export const displayMap = (locations) => {
  mapboxgl.accessToken =
    'pk.eyJ1IjoidmFzYW50aGd4IiwiYSI6ImNsb2NvcmMwdjAwNXEya3J3bmlmY29wenIifQ.xG_Af2Jufx7Yh56QrGjNwg';
  var map = new mapboxgl.Map({
    container: 'map',
    //this container will look for an id#map within our map section.[ which we have #map]
    //   style: 'mapbox://styles/mapbox/streets-v11',
    style: 'mapbox://styles/vasanthgx/clo5w480w00rk01r20ppu2ury',
    scrollZoom: false,
    // center: [-118.113491, 34.111745],
    // zoom: 10,
    // interactive: false,
  });

  const bounds = new mapboxgl.LngLatBounds();

  locations.forEach((loc) => {
    // Create marker
    const el = document.createElement('div');
    el.className = 'marker';

    // Add marker
    new mapboxgl.Marker({
      element: el,
      anchor: 'bottom',
    })
      .setLngLat(loc.coordinates)
      .addTo(map);

    // Add popup
    new mapboxgl.Popup({
      offset: 30,
    })
      .setLngLat(loc.coordinates)
      .setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`)
      .addTo(map);

    // Extend map bounds to include current location
    bounds.extend(loc.coordinates);
  });
  map.fitBounds(bounds, {
    padding: {
      top: 200,
      bottom: 150,
      left: 100,
      right: 100,
    },
  });
};

/////////////////////////////////////////////////////////////////////////
/* eslint-disable */
// export const displayMap = (locations) => {
//   mapboxgl.accessToken =
//     'pk.eyJ1Ijoiam9uYXNzY2htZWR0bWFubiIsImEiOiJjam54ZmM5N3gwNjAzM3dtZDNxYTVlMnd2In0.ytpI7V7w7cyT1Kq5rT9Z1A';

//   var map = new mapboxgl.Map({
//     container: 'map',
//     style: 'mapbox://styles/jonasschmedtmann/cjvi9q8jd04mi1cpgmg7ev3dy',
//     scrollZoom: false,
//     // center: [-118.113491, 34.111745],
//     // zoom: 10,
//     // interactive: false
//   });

//   const bounds = new mapboxgl.LngLatBounds();

//   locations.forEach((loc) => {
//     // Create marker
//     const el = document.createElement('div');
//     el.className = 'marker';

//     // Add marker
//     new mapboxgl.Marker({
//       element: el,
//       anchor: 'bottom',
//     })
//       .setLngLat(loc.coordinates)
//       .addTo(map);

//     // Add popup
//     new mapboxgl.Popup({
//       offset: 30,
//     })
//       .setLngLat(loc.coordinates)
//       .setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`)
//       .addTo(map);

//     // Extend map bounds to include current location
//     bounds.extend(loc.coordinates);
//   });

//   map.fitBounds(bounds, {
//     padding: {
//       top: 200,
//       bottom: 150,
//       left: 100,
//       right: 100,
//     },
//   });
// };
