(function () {

    loadLeaflet();

    createInfoScreen();
    let infoVisible = true;

    let loadingIndicator = createLoadingIndicator();
    document.body.appendChild(loadingIndicator);
  
    document.addEventListener("keydown", function (e) {
    
        if (e.key.toLowerCase() === "r") {
            reloadScript();
        } else if (e.key.toLowerCase() === "x") {
            toggleVisibility();
        } else if (e.key.toLowerCase() === "t") {
            toggleInfoScreen();
        } else if (e.key.toLowerCase() === "q") {
            if (!zoomInterval) {
                zoomInterval = setInterval(function () {
                    map.zoomIn();
                }, 10);
            }
        } else if (e.key.toLowerCase() === "e") {
            if (!zoomInterval) {
                zoomInterval = setInterval(function () {
                    map.zoomOut();
                }, 10);
            }
        }

    });

    document.addEventListener("keyup", function (e) {
    
        if (e.key.toLowerCase() === "q" || e.key.toLowerCase() === "e") {
            clearInterval(zoomInterval);
            zoomInterval = null;
        }
    });

    let containerX = 8;
    let containerY = window.innerHeight - 288;

    let map;
    let zoomInterval;

    let visible = true;

    function createLoadingIndicator() {
      let indicator = document.createElement('div');
      indicator.id = 'loading-indicator';
      indicator.style = `
          position: fixed;
          bottom: 10px;
          right: 10px;
          width: 50px;
          height: 50px;
          background: url('https://i.imgur.com/8vY2ovQ.gif') no-repeat center center;
          background-size: contain;
          display: none;
          z-index: 10001;
      `;
      return indicator;
  }


    function loadLeaflet() {
        if (!window.L) {
            let link = document.createElement("link");
            link.rel = "stylesheet";
            link.href = "https://unpkg.com/leaflet/dist/leaflet.css";
            document.head.appendChild(link);

            let script = document.createElement("script");
            script.src = "https://unpkg.com/leaflet/dist/leaflet.js";
            script.onload = function () {
                runScript();
            };
            document.body.appendChild(script);
        } else {
            runScript();
        }
    }

    function reloadScript() {
        let container = document.getElementById("map-container");

        if (!visible) {
            containerX = 8;
            containerY = window.innerHeight - 288;
            visible = true;
        } else if (container) {
            containerX = container.offsetLeft;
            containerY = container.offsetTop;
        }

        runScript();
    }

    function runScript() {
        createUI();
        let coordinates = extractLocationFromIframe();

        if (!coordinates) {
            return;
        }

        map = L.map("cheat-map").setView([coordinates.lat, coordinates.long], 15);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: "&copy; OpenStreetMap contributors"
        }).addTo(map);

        let customIcon = L.icon({
            iconUrl: "https://i.ibb.co/tPXW1101/marker.png",
            iconSize: [20, 32],
            iconAnchor: [10, 30],
            popupAnchor: [0, -32]
        });

        L.marker([coordinates.lat, coordinates.long], { icon: customIcon })
            .bindPopup(`Lat: ${coordinates.lat}<br>Lng: ${coordinates.long}`)
            .addTo(map);

    }

    function createUI() {
        let oldContainer = document.getElementById("map-container");
        if (oldContainer) oldContainer.remove();

        let container = document.createElement("div");
        container.id = "map-container";
        container.style = `
            position: fixed;
            left: ${containerX}px;
            top: ${containerY}px;
            width: 250px;
            height: 280px;
            z-index: 10000;
            background: white;
            display: flex;
            flex-direction: column;
            box-shadow: 3px 3px 10px rgba(0, 0, 0, 0.3);
            font-family: Arial, sans-serif;
            border-radius: 10px;
        `;
        document.body.appendChild(container);

        let banner = document.createElement("div");
        banner.id = "drag-banner";
        banner.style = `
            width: 100%;
            height: 30px;
            background: lightgreen;
            cursor: grab;
            border-top-left-radius: 10px;
            border-top-right-radius: 10px;
        `;
        banner.onmousedown = dragElement;
        container.appendChild(banner);

        let mapDiv = document.createElement("div");
        mapDiv.id = "cheat-map";
        mapDiv.style = "width: 100%; height: 250px;";
        container.appendChild(mapDiv);

        let reloadButton = document.createElement("button");
        reloadButton.innerHTML = "Reload";
        reloadButton.style = `
            width: 100%;
            height: 30px;
            background-color: lightgreen;
            border: none;
            color: white;
            cursor: pointer;
        `;
        reloadButton.onclick = function () {
            reloadScript();
        };
        container.appendChild(reloadButton);

        let closeButton = document.createElement("div");
        closeButton.innerHTML = "❌";
        closeButton.style = `
            position: absolute;
            right: 5px;
            top: 5px;
            cursor: pointer;
            font-size: 14px;
            color: red;
            font-weight: bold;
        `;
        closeButton.onclick = toggleVisibility;
        container.appendChild(closeButton);

        let openMapButton = document.createElement("button");
        openMapButton.innerHTML = "Open Map";
        openMapButton.style = `
            width: 100%;
            height: 30px;
            background-color: dodgerblue;
            border: none;
            color: white;
            cursor: pointer;
            border-bottom-left-radius: 10px;
            border-bottom-right-radius: 10px;
        `;
        openMapButton.onclick = function () {
            if (map) {
                let center = map.getCenter();
                let googleMapsUrl = `https://www.google.com/maps?q=${center.lat},${center.lng}`;
                window.open(googleMapsUrl, "_blank");
            } else {
              showMapErrorPopup();
            }
        };
        container.appendChild(openMapButton);
    }

    function dragElement(event) {
        event.preventDefault();
        let container = document.getElementById("map-container");

        let gridSize = 8;

        let startX = event.clientX;
        let startY = event.clientY;
        let startLeft = container.offsetLeft;
        let startTop = container.offsetTop;

        document.onmousemove = function (e) {
            let newX = startLeft + (e.clientX - startX);
            let newY = startTop + (e.clientY - startY);

            newX = Math.round(newX / gridSize) * gridSize;
            newY = Math.round(newY / gridSize) * gridSize;
          
            container.style.left = newX + "px";
            container.style.top = newY + "px";
          
            containerX = newX;
            containerY = newY;
        };

        document.onmouseup = function () {
            document.onmousemove = null;
            document.onmouseup = null;
        };
    }

    function showLoadingIndicator() {
        if (loadingIndicator) {
            loadingIndicator.style.display = 'block';
        }
    }
    
    function hideLoadingIndicator() {
        if (loadingIndicator) {
            loadingIndicator.style.display = 'none';
        }
    }

    function extractLocationFromIframe() {
        showLoadingIndicator();
        const iframe = document.querySelector('iframe[src^="/svEmbed"]');
        if (!iframe) {
            hideLoadingIndicator();
            return null;
        }
    
        const urlParams = new URLSearchParams(iframe.src.split('?')[1]);
        const lat = parseFloat(urlParams.get('lat'));
        const long = parseFloat(urlParams.get('long'));
    
        if (!isNaN(lat) && !isNaN(long)) {
            hideLoadingIndicator();
            return { lat, long, timestamp: new Date() };
        }
        hideLoadingIndicator();
        return null;
    }

    function toggleVisibility() {
        let container = document.getElementById("map-container");
        if (!container) return;

        if (visible) {

            container.style.width = "40px";
            container.style.height = "40px";
            container.style.overflow = "hidden";
            container.style.display = "flex";
            container.style.alignItems = "center";
            container.style.justifyContent = "center";
            container.innerHTML = "<div id='restore-pin' style='cursor: grab; font-size: 20px;'>📌</div>";

            let pin = document.getElementById("restore-pin");
            pin.onmousedown = dragElement;

            pin.oncontextmenu = function (e) {
              e.preventDefault();
              createUI();
              loadLeaflet();
            };

        } else {
            createUI();
            loadLeaflet();
        }

        visible = !visible;
    }

    function createInfoScreen() {
        let infoContainer = document.createElement("div");
        infoContainer.id = "info-screen";
        infoContainer.style = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 600px;
            height: 500px;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 20px;
            border-radius: 10px;
            text-align: center;
            z-index: 10001;
            font-family: Arial, sans-serif;
        `;
        infoContainer.innerHTML = `
            <h2><strong>HackGuessr</strong></h2>
            <br>
            <p>This tool helps you locate your position in a WorldGuessr game using a map.</p>
            <br>
            <h3><strong>Controls:</strong></h3>
            <p>To reset the map, press "R" or click "Reload."</p>
            <p>To hide the popup, press "X" or click "❌."</p>
            <p>To unhide the popup, press "X" or right-click "📌."</p>
            <p>To reposition the popup, click and drag at the top banner.</p>
            <p>To reposition the "📌" button, click and drag it.</p>
            <p>To zoom in / out, use the on-screen "+" and "−" buttons, press "Q" or "E," or use the mouse wheel.</p>
            <p>To pan the map, click and drag.</p>
            <p>To open the current coordinates, click "Open Map."</p>
            <p>To view the coordinates, click on the map marker.</p>
        `;
        document.body.appendChild(infoContainer);
    }

    function toggleInfoScreen() {
        let infoScreen = document.getElementById("info-screen");
        if (infoScreen) {
            document.body.removeChild(infoScreen);
        } else {
            createInfoScreen();
        }
        infoVisible = !infoVisible;
    }
})();
