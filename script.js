'use strict';

const searchURL = 'https://www.loc.gov/collections/chronicling-america/';
const mapURL = 'https://maps.googleapis.com/maps/api/geocode/json';
const apiKey = '';
let map;
let locations = [];
let markers = [];
let markersArray = [];
const iconImage = 'https://maps.google.com/mapfiles/kml/shapes/library_maps.png';
const spinner = document.getElementById("spinner");

function formatQueryParams(params) {
  const queryItems = Object.keys(params)
  .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`);
  return queryItems.join('&');
};

/// Takes in the response from getNews(), gets the title, img, date, and url to dsisplay
function displayResults(responseJson) {
  $('.results-container').empty();
  for (let i = 0; i < responseJson.results.length; i++){
    let title = responseJson.results[i].partof_title;
    let date = responseJson.results[i].date; 
    let url = responseJson.results[i].id;
    let img = responseJson.results[i].image_url[1];
    let newspapers = `
      <div class="group">
        <div id="results-list" class="item">
          <ul>
            <li><h3>Source Newspaper: ${title}</h3></li>
            <li><a href="${url}" target="_blank"><img src="${img}" alt="digital image of newspaper"></a></li> 
            <li><p><strong>Publication Date:</strong> ${date}</p></li>
            <li><h4><a href="${url}" target="_blank">See more</a></h4></li>
          </ul>
        </div>
      </div>        
      `
    $('.results-container').append(newspapers);
  };
  $('.results-container').removeClass('hidden');
  $('#map-container').removeClass('hidden');
};

// Gets coordinates from the Google Map API
function geocode(location){
  for(let i = 0; i < location.results.length; i++) {
    markers.push({
      coords: {
        lat: location.results[0].geometry.location.lat,
        lng: location.results[0].geometry.location.lng
      },
      content: `<p>${location.results[0].formatted_address}</p>`
    });
    initMap();
  };
};

/// Takes in the response getNews(), gets the city and state, constructs search URL from parameters
function getLocations(responseJson, response){
  for (let i = 0; i < responseJson.results.length; i++) {
    let city = responseJson.results[i].location_city[0]
    let state = responseJson.results[i].location_state[0]
    let location = city + ' ' + state
    locations.push(location)
  };
  for (let i = 0; i < locations.length; i++) {
    let loc = locations[i]
    const params = {
      address: loc,
      key: apiKey
    };
    const queryString = formatQueryParams(params);
    const url = mapURL + '?' + queryString;
    fetch(url)
    .then(response => {
      if (response.ok) {
        return response.json();
      }
      throw new Error(response.statusText);        
    })
    .then(responseJson => {
      geocode(responseJson)
    })
    .catch(err => {
      $('#js-error-message').text(`Something went wrong: ${err.message}`);        
    });
  };
};

///Takes in search terms and construct query url
///Takes the query url, gets the response, calls dispalyResults() and searchMap()
function getNews(searchTerm, maxResults=10) {
  const params = {
    q: searchTerm,
    c: maxResults
  };
  const queryString = formatQueryParams(params);
  const url = searchURL + '?' + queryString + '&fo=json';
  spinner.removeAttribute('hidden');
  fetch(url)
  .then(response => {
    if (response.ok) {
      return response.json();
    };
    throw new Error(response.statusText);
  })
  .then(responseJson => {
    displayResults(responseJson)
    getLocations(responseJson)
    spinner.setAttribute('hidden', '');
  }) 
  .catch(err => {
    $('#js-error-message').text(`Something went wrong: ${err.message}`);
  });
};

//Initializes the map and adds markers to the maps based on the coordinates returned from geocode()
function initMap() {
  var options = {
    zoom: 4,
    center: {lat: 39, lng: -95}
  };
  var map = new google.maps.Map(document.getElementById('map'), options);
  for (let i = 0; i < markers.length; i++){
    addMarker(markers[i])
  };
  function addMarker(property) {
    let marker = new google.maps.Marker({
      position: property.coords,
    });
    if(property.content){
      let infoWindow = new google.maps.InfoWindow({
        content: property.content
      });
      marker.addListener('click', function(){
        infoWindow.open(map, marker)
      });
    };
    markersArray.push(marker)
    marker.setMap(map)
  };
};

// Removes the overlays from the map, but keeps them in the array
function clearOverlays() {
  if (markers) {
    for (i in markers) {
      markers[i].setMap(null);
    };
  };
};

// Shows any overlays currently in the array
function showOverlays() {
  if (markers) {
    for (i in markers) {
      markers[i].setMap(map);
    };
  };
};

// Deletes all markers in the array by removing references to them
function deleteOverlays() {
  if (markersArray.length) {
    for (let i in markersArray) {
      markersArray[i].setMap(null);
    };
    markers.length = 0;
  };
};

////Watches for the form submit event and creates variables out of the seacrch inputs
function watchForm() {
  $('form').submit(event => {
    event.preventDefault();
    markers.length = 0;
    locations.length = 0;
    const searchTerm = $('#js-search-term').val();
    const maxResults = $('#js-max-results').val();
    getNews(searchTerm, maxResults);
    deleteOverlays();
  });
};
  
$(watchForm);

