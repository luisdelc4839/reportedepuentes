document.addEventListener("DOMContentLoaded", fetchBorderData);

async function fetchBorderData() {
    const waitTimesDiv = document.getElementById("waitTimes");
    const lastUpdatedEl = document.getElementById("lastUpdated");
    waitTimesDiv.innerHTML = "Obteniendo datos...";

    try {
        const response = await fetch("https://api.allorigins.win/raw?url=https://bwt.cbp.gov/api/waittimes");
        const data = await response.json();

        if (!Array.isArray(data)) {
            waitTimesDiv.innerHTML = "Error: Formato de respuesta de API inesperado.";
            return;
        }

        // Filter out "Stanton DCL" and include only "El Paso" and "Santa Teresa"
        const elPasoPorts = data.filter(port => 
            (port.port_name.includes("El Paso") || port.port_name.includes("Santa Teresa")) &&
            !port.port_name.toLowerCase().includes("stanton dcl") &&
            !port.crossing_name.toLowerCase().includes("stanton dcl")
        );

        if (elPasoPorts.length === 0) {
            waitTimesDiv.innerHTML = "No hay datos disponibles para los cruces.";
            return;
        }

        const latestUpdate = elPasoPorts.reduce((latest, port) => {
            const currentTime = new Date(`${port.date} ${port.time}`);
            return currentTime > latest ? currentTime : latest;
        }, new Date(0));

        lastUpdatedEl.textContent = `Última actualización: ${latestUpdate.toLocaleString("es-MX")}`;

        let htmlContent = "";
        elPasoPorts.forEach((port) => {

            function getHighestWaitTime() {
                const times = [
                    port.passenger_vehicle_lanes?.standard_lanes?.delay_minutes || 0,
                    port.passenger_vehicle_lanes?.ready_lanes?.delay_minutes || 0,
                    port.pedestrian_lanes?.standard_lanes?.delay_minutes || 0,
                    port.pedestrian_lanes?.ready_lanes?.delay_minutes || 0
                ].map(t => (t === "N/A" ? 0 : parseInt(t, 10)));

                return Math.max(...times);
            }

            function getWaitTimeIndicator(minutes) {
                if (minutes <= 20) return '<span class="material-icons indicator green">lens</span>';
                if (minutes <= 40) return '<span class="material-icons indicator yellow">lens</span>';
                return '<span class="material-icons indicator red">lens</span>';
            }

            const highestWaitTime = getHighestWaitTime();
            const indicator = getWaitTimeIndicator(highestWaitTime);

            const passengerStandardLanesOpen = port.passenger_vehicle_lanes?.standard_lanes?.lanes_open || "N/A";
            const passengerReadyLanesOpen = port.passenger_vehicle_lanes?.ready_lanes?.lanes_open || "N/A";
            const pedestrianStandardLanesOpen = port.pedestrian_lanes?.standard_lanes?.lanes_open || "N/A";
            const pedestrianReadyLanesOpen = port.pedestrian_lanes?.ready_lanes?.lanes_open || "N/A";

            htmlContent += `
                <div class="crossing">
                    <div class="crossing-header">
                        <h3>${port.crossing_name} (${port.port_name})</h3>
                        ${indicator} 
                    </div>

                    <hr class="divider">

                    <h4><span class="material-icons">directions_car</span> Vehículos</h4>
                    <p><strong>Estándar:</strong> <span class="wait-time">${port.passenger_vehicle_lanes?.standard_lanes?.delay_minutes || "0"} min</span></p>
                    <p><strong>Ready Lane:</strong> <span class="wait-time">${port.passenger_vehicle_lanes?.ready_lanes?.delay_minutes || "0"} min</span></p>
                    <p><strong>Líneas abiertas:</strong> ${passengerStandardLanesOpen} estándar | ${passengerReadyLanesOpen} Ready Lane</p>

                    <hr class="divider">

                    <h4><span class="material-icons">directions_walk</span> Peatones</h4>
                    <p><strong>Estándar:</strong> <span class="wait-time">${port.pedestrian_lanes?.standard_lanes?.delay_minutes || "0"} min</span></p>
                    <p><strong>Ready Lane:</strong> <span class="wait-time">${port.pedestrian_lanes?.ready_lanes?.delay_minutes || "0"} min</span></p>
                    <p><strong>Líneas abiertas:</strong> ${pedestrianStandardLanesOpen} estándar | ${pedestrianReadyLanesOpen} Ready Lane</p>

                    <button class="camera-btn" onclick="openModal('${port.crossing_name}')">
                        <span class="material-icons">videocam</span> Ver en vivo
                    </button>

                    <hr class="divider">
                </div>
            `;
        });

        waitTimesDiv.innerHTML = htmlContent;

    } catch (error) {
        waitTimesDiv.innerHTML = "Error al obtener los datos.";
    }
}

const bridgeCams = {
    "Bridge of the Americas (BOTA)": [
        { name: "Vista Norte", url: "https://www.youtube.com/embed/mp3RS0y77tY" },
        { name: "Vista Sur", url: "https://www.youtube.com/embed/CZM5TpXLzE8" },
        { name: "Av Rafael Perez Serna", url: "https://www.youtube.com/embed/uS6hY-0hpME" }
    ],
    "Paso Del Norte (PDN)": [
        { name: "Vista Sur", url: "https://www.youtube.com/embed/IcvugJWPXz8" },
        { name: "Vista Norte", url: "https://www.youtube.com/embed/0Pg3S6s76IE" }
    ],
    "Santa Teresa": [
        { name: "Vista General", url: "https://www.youtube.com/embed/example6" }
    ],
    "Ysleta": [
        { name: "Vista Sur", url: "https://www.youtube.com/embed/GC5RY3zipa4" },
        { name: "Av. Waterfill", url: "https://www.youtube.com/embed/o5h9RB7qwY8" },
        { name: "Vista Norte", url: "https://www.youtube.com/embed/KX-bm-Lhy3w" }
    ]
};

function openModal(crossingName) {
    const modal = document.getElementById("videoModal");
    const videoFrame = document.getElementById("videoFrame");
    const modalTitle = document.getElementById("modalTitle");
    const modalButtons = document.getElementById("modalButtons");

    modal.style.display = "flex";

    const cleanedName = crossingName.replace(/\(El Paso\)/g, "").trim();

    if (bridgeCams.hasOwnProperty(cleanedName)) {
        const cameras = bridgeCams[cleanedName];

        modalTitle.textContent = `Vista en Vivo - ${cleanedName}`;
        videoFrame.src = `${cameras[0].url}?autoplay=1`;

        modalButtons.innerHTML = "";
        cameras.forEach((cam) => {
            const btn = document.createElement("button");
            btn.classList.add("modal-cam-btn");
            btn.textContent = cam.name;
            btn.onclick = () => {
                videoFrame.src = `${cam.url}?autoplay=1`;
            };
            modalButtons.appendChild(btn);
        });
    } else {
        alert("No hay video disponible para este cruce.");
        modal.style.display = "none";
    }
}

function closeModal() {
    const modal = document.getElementById("videoModal");
    modal.style.display = "none";
    document.getElementById("videoFrame").src = "";
}

window.onclick = function(event) {
    const modal = document.getElementById("videoModal");
    if (event.target === modal) {
        closeModal();
    }
};

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("videoModal").style.display = "none";
});

window.openModal = openModal;
window.closeModal = closeModal;
