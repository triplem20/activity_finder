let map = L.map('map').setView([51.505, -0.09], 13);

// Add the OpenStreetMap tiles
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// Variables to store marker and circle for user's location
let marker, circle;
let activityMarkers = []; 
let routingControl; 

// Custom icons for restaurants, sports, events, and user-added activities
const restaurantIcon = L.icon({
    iconUrl: '../images/resturanticon.png',  
    iconSize: [35, 45],
    iconAnchor: [15, 41],
    popupAnchor: [1, -34],
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-shadow.png',
    shadowSize: [41, 41]
});

const sportsIcon = L.icon({
    iconUrl: '../images/sportsicon.png',  
    iconSize: [30, 41],
    iconAnchor: [15, 41],
    popupAnchor: [1, -34],
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-shadow.png',
    shadowSize: [41, 41]
});

const eventIcon = L.icon({
    iconUrl: '../images/eventsicon.png', 
    iconSize: [30, 41],
    iconAnchor: [15, 41],
    popupAnchor: [1, -34],
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-shadow.png',
    shadowSize: [41, 41]
});

const userActivityIcon = L.icon({
    iconUrl: '../images/useractivity.png',  
    iconSize: [30, 41],
    iconAnchor: [15, 41],
    popupAnchor: [1, -34],
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-shadow.png',
    shadowSize: [41, 41]
});
const adventureIcon = L.icon({
    iconUrl: '../images/tourism.png', 
    iconSize: [32, 32], 
    iconAnchor: [16, 32], 
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-shadow.png',
    shadowSize: [41, 41]
});

const relaxIcon = L.icon({
    iconUrl: '../images/exercise.png', 
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-shadow.png',
    shadowSize: [41, 41]
});

const creativeIcon = L.icon({
    iconUrl: '../images/design-thinking.png', 
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-shadow.png',
    shadowSize: [41, 41]
});

const socialRomanticIcon = L.icon({
    iconUrl: '../images/group.png', // You can choose a more fitting icon if needed
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-shadow.png',
    shadowSize: [41, 41]
});

const energeticIcon = L.icon({
    iconUrl: '../images/energy-drink.png', 
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-shadow.png',
    shadowSize: [41, 41]
});

const intellectualPlayfulIcon = L.icon({
    iconUrl: '../images/intellectual-property.png', 
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-shadow.png',
    shadowSize: [41, 41]
});

const natureFestiveIcon = L.icon({
    iconUrl: '../images/forest.png', 
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-shadow.png',
    shadowSize: [41, 41]
});


// Function to locate user
function locateUser(activityType = "restaurant") {
    navigator.geolocation.getCurrentPosition(function (pos) {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const accuracy = pos.coords.accuracy;

        if (marker) {
            map.removeLayer(marker);
            map.removeLayer(circle);
        }

        // Mark user's location
        marker = L.marker([lat, lng]).addTo(map).bindPopup("You are here!").openPopup();
        circle = L.circle([lat, lng], { radius: accuracy }).addTo(map);
        map.setView([lat, lng], 14);

        // Fetch nearby activities based on the selected activity type
        fetchActivities(lat, lng, activityType);
    }, function (err) {
        alert("Could not get your location.");
    });
}

let markers = [];

// Function to fetch activities based on type (food, parks, etc.)
function fetchActivities(lat, lng, type) {
    const limit = 20; 
    const apiUrl = `https://api.foursquare.com/v3/places/search?ll=${lat},${lng}&query=${type}&limit=${limit}`;

    fetch(apiUrl, {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
            'Authorization': '//'
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`Error fetching activities: ${response.statusText}`);
        }
        return response.json();
    })
    .then(data => {
        console.log(data); 
        const activities = data.results || []; //  API response structure
        if (activities.length > 1) {
            displayActivities(activities, type); 
        } else {
            console.warn("Only one or no activities found.");
        }
    })
    .catch(error => {
        console.error('Error fetching activities:', error);
    });

   // Get mood elements and attach click event listeners
document.querySelectorAll('li[data-type]').forEach(mood => {
    mood.addEventListener('click', () => {
        const type = mood.getAttribute('data-type'); 
        const userLat = marker.getLatLng().lat; 
        const userLng = marker.getLatLng().lng;
        
        fetchActivities(userLat, userLng, type); // Fetch activities based on selected mood type
    });
});

    
}

// Function to display activities on the map
function displayActivities(activities, type) {
    markers.forEach(marker => marker.remove()); // Clear existing markers
    markers = []; // Reset markers array

    if (!activities || activities.length === 0) {
        console.error("No activities found.");
        return;
    }

    activities.forEach(activity => {
        const name = activity.name || 'Unknown';
        const lat = activity.geocodes?.main?.latitude;
        const lng = activity.geocodes?.main?.longitude;

        // Choose the icon based on activity type
        const iconType = 
            type === "restaurant" ? restaurantIcon :
            type === "sports" ? sportsIcon :
            type === "events" ? eventIcon :
            activity.type === "adventure" ? adventureIcon :
            activity.type === "relax" ? relaxIcon :
            activity.type === "creative" ? creativeIcon :
            activity.type === "social" || activity.type === "romantic" ? socialRomanticIcon : 
            activity.type === "intellectual" || activity.type === "playful" ? intellectualPlayfulIcon : 
            activity.type === "nature" || activity.type === "festive" ? natureFestiveIcon : 
            userActivityIcon; 

        if (lat !== undefined && lng !== undefined) {
            const marker = L.marker([lat, lng], { icon: iconType }).addTo(map);
            marker.bindPopup(`<b>${name}</b><br>${type}`);
            markers.push(marker);
        } else {
            console.error(`Missing or invalid coordinates for activity: ${name}`);
        }
    });

    const activityList = document.getElementById("activityList");
    activityList.innerHTML = ""; // Clear the previous list
    clearMarkers(); // Remove previous activity 

    // User's current location
    const userLat = marker.getLatLng().lat;
    const userLng = marker.getLatLng().lng;

    // Update activity list without limit
    updateActivityList(activities, userLat, userLng, type);
}




function updateActivityList(activities, userLat, userLng, type) {
    const activityList = document.getElementById("activityList");
    activityList.innerHTML = ""; 

    activities.forEach(activity => {
        const name = activity.name || 'Unknown';
        const lat = activity.geocodes?.main?.latitude;
        const lng = activity.geocodes?.main?.longitude;

        const distance = calculateDistance(userLat, userLng, lat, lng).toFixed(2);
        const rating = (Math.random() * (5 - 3) + 3).toFixed(1);

        
        const iconType = 
            type === "restaurant" ? restaurantIcon :
            type === "sports" ? sportsIcon :
            type === "events" ? eventIcon :
            type === "adventure" ? adventureIcon :
            type === "relax" ? relaxIcon :
            type === "creative" ? creativeIcon :
            type === "social" ? socialRomanticIcon:
            type === "energetic" ? energeticIcon :
            type === "libary" ? intellectualPlayfulIcon :
            type === "nature" ? natureFestiveIcon :
            defaultActivityIcon; 
        
        const activityImage = iconType.options.iconUrl;

        // Create a new list item for each activity
        const activityItem = document.createElement("div");
        activityItem.className = "activity-item";
        activityItem.innerHTML = 
            `<img src="${activityImage}" alt="${name}" class="activity-img">
            <div class="activity-info">
                <h3>${name}</h3>
                <p>Rating: ${rating}<span class="star"> ★</span></p>
                <p>Distance: ${distance} km</p>
                <button class="route-button" data-lat="${lat}" data-lng="${lng}">Get Directions</button>
            </div>`;
        activityList.appendChild(activityItem);

        // Add route button functionality
        activityItem.querySelector(".route-button").addEventListener("click", () => {
            const destination = L.latLng(lat, lng);
            drawRoute(marker.getLatLng(), destination);
        });
    });

    // Handle no activities found case
    if (activities.length === 0) {
        const noActivitiesItem = document.createElement("div");
        noActivitiesItem.textContent = "No activities found.";
        alert("No Nearby Activities found :(")
        activityList.appendChild(noActivitiesItem);
    }
}








//  (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; 
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in km
    return distance;
}

// Function to clear existing markers
function clearMarkers() {
    activityMarkers.forEach(({ marker }) => {
        map.removeLayer(marker);
    });
    activityMarkers = [];
}


// Function to draw route using Leaflet Routing Machine
function drawRoute(start, end) {
  
    if (routingControl) {
        map.removeControl(routingControl);
    }

    // Create a new routing control using the OSRM service
    routingControl = L.Routing.control({
        waypoints: [
            L.latLng(start.lat, start.lng),
            L.latLng(end.lat, end.lng)
        ],
        routeWhileDragging: true,
        createMarker: function() { return null; }, // Disable default markers
        router: L.Routing.osrmv1({
            serviceUrl: 'http://router.project-osrm.org/route/v1',
            
            timeout: 10000 // Set timeout to 10 seconds
        }),
        showAlternatives: true,
        addWaypoints: false
    }).addTo(map);

    // Listen for clicks outside the routing container
    document.addEventListener('click', function (event) {
        const routingContainer = document.querySelector('.leaflet-routing-container');
        
      
    });
}





// Toggle the marathon-specific fields
document.getElementById('activityType').addEventListener('change', function() {
    const marathonPoints = document.getElementById('marathonPoints');
    if (this.value === 'marathon') {
        marathonPoints.style.display = 'block';
    } else {
        marathonPoints.style.display = 'none';
    }
});

// Show the modal when the "Add Activity" button is clicked
document.getElementById('addActivityBtn').addEventListener('click', function() {
    document.getElementById('activityFormModal').style.display = 'block';
});


document.querySelector('.close').onclick = function() {
    document.getElementById('activityFormModal').style.display = 'none';
};

// Add location by picking on the map
let tempMarker = null; // Marker for picking locations

document.getElementById('pickLocationBtn').addEventListener('click', function() {
    alert("Click on the map to select a location.");
    map.once('click', function(e) {
        if (tempMarker) {
            map.removeLayer(tempMarker);
        }
        tempMarker = L.marker([e.latlng.lat, e.latlng.lng]).addTo(map);
        document.getElementById('activityLocation').value = `${e.latlng.lat},${e.latlng.lng}`;
    });
});

document.getElementById('pickStartBtn').addEventListener('click', function() {
    alert("Click on the map to select the start location.");
    map.once('click', function(e) {
        if (tempMarker) {
            map.removeLayer(tempMarker);
        }
        tempMarker = L.marker([e.latlng.lat, e.latlng.lng]).addTo(map);
        document.getElementById('startLocation').value = `${e.latlng.lat},${e.latlng.lng}`;
    });
});

document.getElementById('pickEndBtn').addEventListener('click', function() {
    alert("Click on the map to select the end location.");
    map.once('click', function(e) {
        if (tempMarker) {
            map.removeLayer(tempMarker);
        }
        tempMarker = L.marker([e.latlng.lat, e.latlng.lng]).addTo(map);
        document.getElementById('endLocation').value = `${e.latlng.lat},${e.latlng.lng}`;
    });
});

// Handle form submission and add activity to the map
document.getElementById('activityForm').onsubmit = function(event) {
    event.preventDefault();
    
    const activityName = document.getElementById('activityName').value;
    const activityType = document.getElementById('activityType').value;
    const activityLocation = document.getElementById('activityLocation').value;

    let icon = userActivityIcon;

    if (activityType === 'restaurant') {
        icon =userActivityIcon;
    } else if (activityType === 'sports') {
        icon = userActivityIcon;
    } else if (activityType === 'event') {
        icon = userActivityIcon;
    }

    geocodeAndAddToMap(activityLocation, activityName, icon, activityType);

    document.getElementById('activityFormModal').style.display = 'none';
};





function geocodeAndAddToMap(location, name, icon, type) {
    const geocodeUrl = `https://nominatim.openstreetmap.org/search?q=${location}&format=json&limit=1`;

    fetch(geocodeUrl)
        .then(response => response.json())
        .then(data => {
            if (data.length > 0) {
                const lat = data[0].lat;
                const lng = data[0].lon;

                const newMarker = L.marker([lat, lng], { icon: icon }).addTo(map)
                    .bindPopup(`<strong>${name}</strong><br>Type: ${type}<br><button class="remove-button">Remove</button>`)
                    .openPopup();

                activityMarkers.push({ marker: newMarker, type });

                newMarker.on('popupopen', function() {
                    const popupContent = newMarker.getPopup().getContent();
                    const tempDiv = document.createElement('div');
                    tempDiv.innerHTML = popupContent;

                    const removeButton = tempDiv.querySelector('.remove-button');
                    if (removeButton) {
                        removeButton.onclick = () => removeUserActivity(newMarker);
                    }

                    newMarker.setPopupContent(tempDiv.innerHTML);
                });
            } else {
                alert("Location not found");
            }
        })
        .catch(error => console.error("Geocoding error:", error));
}


function removeUserActivity(marker) {
    // Remove the marker from the map
    map.removeLayer(marker);

    // Find the index of the marker in activityMarkers array
    const index = activityMarkers.findIndex(activity => activity.marker === marker);
    if (index !== -1) {
        // Remove from the markers array
        activityMarkers.splice(index, 1);
    }

    
    // Close the popup to avoid dangling reference
    marker.closePopup();
}

// Map search functionality

document.getElementById('mapSearchBtn').addEventListener('click', function() {
    const query = document.getElementById('mapSearchInput').value;

    if (query) {
        const geocodeUrl =`https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`;

        fetch(geocodeUrl)
            .then(response => response.json())
            .then(data => {
                if (data.length > 0) {
                    const lat = data[0].lat;
                    const lng = data[0].lon;

                    
                    map.setView([lat, lng], 14);
                    
                    // Add marker for the searched location
                    const searchMarker = L.marker([lat, lng]).addTo(map)
                        .bindPopup(`<strong>${data[0].display_name}</strong>`)
                        .openPopup();

                    // Fetch activities near the searched location
                    fetchActivities(lat, lng, "restaurant"); 
                } else {
                    alert("Location not found");
                }
            })
            .catch(error => console.error("Geocoding error:", error));
    }
});


document.getElementById("restaurantsFilter").addEventListener("click", () => applyFilter("restaurant"));
document.getElementById("sportsFilter").addEventListener("click", () => applyFilter("sports"));
document.getElementById("eventsFilter").addEventListener("click", () => applyFilter("events"));

function applyFilter(type) {
    const userLat = marker.getLatLng().lat;
    const userLng = marker.getLatLng().lng;

    
    clearMarkers();

    // Fetch new activities based on the selected filter type
    fetchActivities(userLat, userLng, type);
}



// Function to display filtered activities on the map
function displayActivitiesOnMap(activities) {
    activities.forEach(({ marker }) => {
        marker.addTo(map);
    });
}


locateUser();

document.getElementById("locate-btn").addEventListener("click", locateUser);




