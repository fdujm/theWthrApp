import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import { getDatabase, ref, get, set, update } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-database.js";

window.addEventListener("DOMContentLoaded", () => {
  const firebaseConfig = {
    apiKey: "AIzaSyAlPTVvP5rzT5roLZ1ZH2jx1T3rWoWkkxc",
    authDomain: "theweatherthebetterproj.firebaseapp.com",
    databaseURL: "https://theweatherthebetterproj-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "theweatherthebetterproj",
    storageBucket: "theweatherthebetterproj.appspot.com",
    messagingSenderId: "382904854538",
    appId: "1:382904854538:web:7b60d55776b44db61cd7f3"
  };

  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getDatabase(app);

  const savedLocationsList = document.getElementById("savedLocationsList");
  const searchInput = document.getElementById("searchInput");
  const suggestionsList = document.getElementById("suggestions");
  const weatherInfoDiv = document.getElementById("weatherInfo");
  const weatherInfo2 = document.getElementById("weatherInfo2")
  const saveBtn = document.getElementById("saveLocationBtn");

  const link1 = document.getElementById("link1");
  const link2 = document.getElementById("link2");
  const logoutLink = document.getElementById("logoutLink");

  let map = L.map("map").setView([45.8, 15.9], 8);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  let lastMarker = null;
  let currentLocation = null;

  // ------------------------
  // AUTH STATE
  // ------------------------
onAuthStateChanged(auth, async (user) => {//aktivira se kada je auth state promijenjen tj kad se loada stranica
  if (user) {
    console.log("Logged in as:", user.email);
    link1.style.display = "none"
    link2.style.display = "none"

    logoutLink.textContent = "Logout";
    logoutLink.style.display = "inline-block";

    // Load saved locations
    const snapshot = await get(ref(db, "users/" + user.uid + "/locations"));
    const locationsObj = snapshot.exists() ? snapshot.val() : {};
    renderSavedLocations(locationsObj);

  } else {
    console.log("Not logged in");

    logoutLink.textContent = "Sign Up";
    logoutLink.style.display = "inline-block"; // keep visible, but acts differently
  }
});

logoutLink.addEventListener("click", async (e) => {
  e.preventDefault();

  if (auth.currentUser) {
    // If logged in → sign out
    await signOut(auth);
    window.location.href = "login.html";
  } else {
    // If not logged in → go to Sign Up
    window.location.href = "prijava.html";
  }
});

// funkcija koja pretvara koordinate u string i mijenja tocku
  // u povlaku radi lakseg kasnijeg koristenja
  function generateLocationId(lat, lon) {   
    return `${lat.toFixed(5).replace('.', '-')}_${lon.toFixed(5).replace('.', '-')}`;
  }

 //PRIKAZ SPREMLJENIH LOKACIJA NA STRANICI
function renderSavedLocations(locationsObj) {   
  savedLocationsList.innerHTML = ""; 
  const keys = Object.keys(locationsObj);

  if (keys.length === 0) {
    savedLocationsList.innerHTML = "<li>No saved locations yet.</li>";
    return;
  }

  for (const [id, loc] of Object.entries(locationsObj)) {
    const li = document.createElement("li");

    // Use "Unnamed" if no name exists
    const displayName = loc.name || `Unnamed (${loc.lat.toFixed(2)}, ${loc.lon.toFixed(2)})`;

    li.innerHTML = `
      <b>${displayName}</b> 
       <div class="actions">
          <button class="renameBtn">Rename</button>
          <button class="deleteBtn">Delete</button>
       </div>
    `;

    // Click on <li> itself moves map + fetches weather
    li.addEventListener("click", () => {
      map.setView([loc.lat, loc.lon], 13);
      fetchWeather(loc.lat, loc.lon, loc.name || "Unnamed");
    });

    // Delete button
    li.querySelector(".deleteBtn").addEventListener("click", async (e) => {
      e.stopPropagation(); //sprjecava aktivaciju radi parent elemenata
      const user = auth.currentUser;
      if (!user) return;
      await set(ref(db, `users/${user.uid}/locations/${id}`), null);
      li.remove();
    });

    // Rename button
    li.querySelector(".renameBtn").addEventListener("click", async (e) => {
      e.stopPropagation();
      //pomocu prompta mijenjamo ime
      const newName = prompt("Enter a new name for this location:", loc.name || "");
      if (!newName || newName.trim() === "") return;

      const user = auth.currentUser;
      if (!user) return;

      // Update in Firebase
      await set(ref(db, `users/${user.uid}/locations/${id}`), {//set(ref())overwrites data
        ...loc,//siri svojstva iz starog objekta u novi
        name: newName
      });

      // Update UI immediately
      li.querySelector("b").textContent = newName;
    });

    savedLocationsList.appendChild(li);
  }
}

     suggestionsList.style.display = "none"

// ------------------------
// SEARCH CROATIA (CORS-safe, OpenCage) with debounce
// ------------------------
const apiKey = "fe4999ef2e294c0fb246da6fb3a30548";//OpenCage API
let searchTimeout = null;

searchInput.addEventListener("input", () => {
  const query = searchInput.value.trim();
  
  // Clear previous timeout
  if (searchTimeout) clearTimeout(searchTimeout);    //timeout da se ne spamma api

  if (query.length < 3) {
    suggestionsList.innerHTML = "";
    return;
  }

  // Set a debounce delay (e.g., 400ms)
  searchTimeout = setTimeout(async () => {
    try {
      const url = `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(query)}&key=${apiKey}&countrycode=hr&limit=5`;
      const response = await fetch(url);
      const data = await response.json();

      suggestionsList.innerHTML = "";

      if (!data.results || data.results.length === 0) {
        suggestionsList.innerHTML = "<li>No results found</li>";
        return;
      }
      data.results.forEach(result => {
             suggestionsList.style.display = "block"

        const item = document.createElement("li");
        item.textContent = result.formatted;//jer open cage vraca formatted
        item.style.cursor = "pointer";

        item.addEventListener("click", async () => {
         suggestionsList.style.display = "none"

          const lat = result.geometry.lat;
          const lon = result.geometry.lng;
          const name = result.formatted;
          currentLocation = { name, lat, lon };

          map.setView([lat, lon], 13);
          await fetchWeather(lat, lon, name);

          suggestionsList.innerHTML = "";
          searchInput.value = "";
        });

        suggestionsList.appendChild(item);
      });

    } catch (err) {
      console.error("Search error:", err);
      suggestionsList.innerHTML = "<li>Failed to load suggestions</li>";
    }
  }, 400); // wait 400ms after user stops typing
});


const weatherInfoPanel = document.getElementById("weatherInfoPanel");

weatherInfoPanel.style.display = "none"
weatherInfoDiv.style.display = "none"
  // ------------------------
  // MAP CLICK
  // ------------------------
  map.on("click", async (e) => { 
    weatherInfoDiv.style.display = "block"
    weatherInfoPanel.style.display = "none"
    weatherInfo2.innerHTML = ""; 
    moreBtn.style.display = "block";  
    const { lat, lng } = e.latlng;
    currentLocation = { name: `Lat: ${lat.toFixed(3)}, Lon: ${lng.toFixed(3)}`, lat, lon: lng };
    await fetchWeather(lat, lng, currentLocation.name);//na klik pozivamo fetch weather
  });

// ------------------------
// MORE BUTTON
// ------------------------
const moreBtn = document.getElementById("moreBtn");
moreBtn.addEventListener("click", () => {
  weatherInfoPanel.style.display = "block"

  if (!lastWeatherData) {
    alert("Please select a location first!");
    return;
  }
  // ✅ show daily forecast using last fetched data
  weatherInfo2.innerHTML = dailyProg(lastWeatherData);
  moreBtn.style.display = "none"; 
});


//stilizacija za gumb prije klika
moreBtn.style.display = "none";
map.on("click", async (e) => {
    moreBtn.style.display = "block"; 
});

// ------------------------
// SAVE LOCATION
// ------------------------
saveBtn.addEventListener("click", async () => {
  const user = auth.currentUser;                       
  if (!user) return alert("You must be logged in to save locations!");
  if (!currentLocation) return alert("Select a location first!");

  const locId = generateLocationId(currentLocation.lat, currentLocation.lon);
  const locRef = ref(db, `users/${user.uid}/locations`);

  // Always provide a safe fallback
  const safeName = currentLocation.name && currentLocation.name.trim() !== ""
    ? currentLocation.name
    : "Unnamed";

  try {
    await update(locRef, {       
      [locId]: {
        name: safeName,
        lat: currentLocation.lat,
        lon: currentLocation.lon
      }
    });

    const snapshot = await get(ref(db, `users/${user.uid}/locations`));
    const locationsObj = snapshot.exists() ? snapshot.val() : {};
    renderSavedLocations(locationsObj);

    alert(`Location "${safeName}" saved!`);
  } catch (err) {
    console.error("Error saving location:", err);
    alert("Failed to save location: " + err.message);
  }
});


  // ------------------------
  // WEATHER
  // ------------------------
  let lastWeatherData = null; 

  async function fetchWeather(lat, lon, name) {
const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=temperature_2m,precipitation,weathercode,windspeed_10m,uv_index&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weathercode,sunrise,sunset&timezone=auto`;
    try {
      const res = await fetch(weatherUrl);
      const data = await res.json();
      lastWeatherData = data; //globalno spremimo podatke za more btn
      displayWeather(data, name, data.daily);

      if (lastMarker) map.removeLayer(lastMarker);
      const w = data.current_weather;
      const hourIndex = data.hourly.time.findIndex(t => t === w.time);
      let uv = hourIndex !== -1 ? data.hourly.uv_index[hourIndex] : "N/A";
      let precipitation = hourIndex !== -1 ? data.hourly.precipitation[hourIndex] : "N/A";
      const rec = getRecommendation(w.weathercode);


      const popupContent = `
        <b>${name}</b><br>
        🌡️ Temp: ${w.temperature}°C<br>
        🌧️ Precipitation: ${precipitation} mm<br>
      `;     

      lastMarker = L.marker([lat, lon])
          .addTo(map)
          .bindPopup(popupContent)
          .openPopup();


    } catch (err) {
      weatherInfoDiv.innerHTML = "Weather data unavailable.";
      console.error(err);
    }  

  }

//----------------------------
//  7 DNEVNA I PO SATU PROGNOZA
//----------------------------
//po satu
  function dailyProg(data, hIdx = 0){
        let html =""
       html += `<h5>Prognoza po satima</h5><div style="display:flex; gap:10px; overflow-x:auto;">`;
     for (let i = hIdx; i < Math.min(hIdx + 12, data.hourly.time.length); i++) {
     if (!data.hourly.time[i]) continue; // safety check
            html += `
        <div class="wthrbox">
        <br>
          <div><strong>${data.hourly.time[i].slice(11, 16)}</strong></div>
          <div>${data.hourly.temperature_2m[i]}°C</div>
          <div>${data.hourly.precipitation[i]}mm</div>
          <br>
        </div>
      `;
        }
        html += `</div>`;

        // 7-day forecast
        html += `<h5>Prognoza za 7 dana</h5><div style="display:flex; gap:10px; overflow-x:auto;">`;
        for (let i = 0; i < data.daily.time.length; i++) {
            const day = new Date(data.daily.time[i]).toLocaleDateString('hr-HR', {
                weekday: 'short'
            });
            html += `
        <div class="wthrbox" >
        <br>
          <div><strong>${day}</strong></div>
          <div>${data.daily.temperature_2m_min[i]}°C / ${data.daily.temperature_2m_max[i]}°C</div>
          <div>${data.daily.precipitation_sum[i]}mm</div>
          <br>
        </div>
          

      `;
        }
        html += `</div>`;

       
return html; // return the finished string

  }

  function displayWeather(data, name, daily) {
    if (!data.current_weather) {
      weatherInfoDiv.innerHTML = "Weather data unavailable.";
      return;
    }
    
    const w = data.current_weather;
    const hourIndex = data.hourly.time.findIndex(t => t === w.time);
    let uv = hourIndex !== -1 ? data.hourly.uv_index[hourIndex] : "N/A";
    let precipitation = hourIndex !== -1 ? data.hourly.precipitation[hourIndex] : "N/A";
    const rec = getRecommendation(w.weathercode);

  const sunrise = new Date(daily.sunrise[0]).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const sunset = new Date(daily.sunset[0]).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    weatherInfoDiv.innerHTML = `
      <b>${name}</b><br>
      🌡️ Temp: ${w.temperature}°C<br>
      💨 Wind: ${w.windspeed} km/h<br>
      🌧️ Precipitation: ${precipitation} mm<br>
      🌞 UV Index: ${uv} ${uvRecommendation(uv)}<br>
      🌅 Sunrise: ${sunrise}<br>
      🌇 Sunset: ${sunset}<br>
          <b>Recommendation:</b> ${rec}
    `;
 
  }

function getRecommendation(code) {
    if (code === 0) return "☀️ Clear sky – great for outdoor activities!";
    if ([1,2,3].includes(code)) return "⛅ Partly cloudy – good for a walk or jog.";
    if ([45,48].includes(code)) return "🌫️ Fog – be cautious when driving or cycling.";
    if ([51,53,55].includes(code)) return "🌦️ Light drizzle – take a light rain jacket.";
    if ([56,57].includes(code)) return "🥶 Freezing drizzle – avoid slippery roads and dress warm.";
    if ([61,63,65].includes(code)) return "🌧️ Rain – bring an umbrella and waterproof shoes.";
    if ([66,67].includes(code)) return "⚠️ Freezing rain – dangerous conditions, stay indoors if possible.";
    if ([71,73,75,77].includes(code)) return "❄️ Snowfall – wear boots and warm clothing.";
    if ([85,86].includes(code)) return "🌨️ Snow showers – dress warmly, roads might be slippery.";
    if ([80,81,82].includes(code)) return "🌧️ Rain showers – carry waterproof gear.";
    if (code === 95) return "🌩️ Thunderstorm – better to stay indoors.";
    if ([96,99].includes(code)) return "⛈️ Severe thunderstorm with hail – stay inside!";
    return "🔍 No specific recommendation for this weather code.";
  }

  function uvRecommendation(uv) {
    if (uv >= 8) return "– ⚠️ Very high, wear sunscreen and stay in shade.";
    if (uv >= 6) return "– 🧴 High, use sunscreen.";
    if (uv >= 3) return "– 🧢 Moderate, hat and glasses recommended.";
    return "– ✅ Low, no protection needed.";
  }
  
  
});


//modal
const modalOverlay = document.getElementById("modalOverlay");
const modalContent = document.getElementById("modalContent");
const moreBtn = document.getElementById("moreBtn");
const closeBtn = document.querySelector(".modal-close");

function isMobile() {
  return window.innerWidth <= 480;
}

moreBtn.addEventListener("click", () => {
  if (isMobile()) {
    modalContent.appendChild(weatherInfoPanel); // move panel inside modal
    modalOverlay.style.display = "flex";
  }
});
closeBtn.addEventListener("click", () => {
  modalOverlay.style.display = "none";
  if (isMobile()) {
    document.querySelector(".panels").appendChild(weatherInfoPanel); // move it back
  }
});

modalOverlay.addEventListener("click", (e) => {
  if (e.target === modalOverlay) {
    modalOverlay.style.display = "none";
 
  }
});


