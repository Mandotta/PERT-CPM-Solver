document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('activity-container');
    const addBtn = document.getElementById('add-activity');
    const solveBtn = document.getElementById('solve-btn');
    const sampleBtn = document.getElementById('load-sample');
    const complexBtn = document.getElementById('load-complex');
    const resultsSection = document.getElementById('results-section');
    const errorBox = document.getElementById('error-box');

    // --- Helper: Create Activity Row ---
    function createRow(data = { name: '', pred: '', a: '', m: '', b: '' }) {
        const row = document.createElement('div');
        row.className = 'activity-row animate-fade';
        row.innerHTML = `
            <input type="text" placeholder="Activity Name (e.g. A)" value="${data.name}" class="act-name">
            <input type="text" placeholder="Predecessors (e.g. A,B)" value="${data.pred}" class="act-pred">
            <input type="number" placeholder="Opt (a)" value="${data.a}" class="act-a">
            <input type="number" placeholder="Likely (m)" value="${data.m}" class="act-m">
            <input type="number" placeholder="Pess (b)" value="${data.b}" class="act-b">
            <button class="btn btn-danger remove-row">×</button>
        `;
        
        row.querySelector('.remove-row').addEventListener('click', () => {
            row.remove();
        });
        
        container.appendChild(row);
    }

    // --- Initial Rows ---
    createRow();
    createRow();

    // --- Add Activity Event ---
    addBtn.addEventListener('click', () => createRow());

    // --- Load Standard Sample Data ---
    sampleBtn.addEventListener('click', () => {
        container.innerHTML = '';
        const sampleData = [
            { name: 'A', pred: '', a: 2, m: 4, b: 8 },
            { name: 'B', pred: '', a: 1, m: 3, b: 5 },
            { name: 'C', pred: 'A', a: 3, m: 6, b: 9 },
            { name: 'D', pred: 'A', a: 2, m: 5, b: 8 },
            { name: 'E', pred: 'B,C', a: 2, m: 4, b: 6 },
            { name: 'F', pred: 'D,E', a: 1, m: 3, b: 7 }
        ];
        sampleData.forEach(data => createRow(data));
    });

    // --- Load Complex Sample Data ---
    complexBtn.addEventListener('click', () => {
        container.innerHTML = '';
        const complexData = [
            { name: 'A', pred: '', a: 3, m: 5, b: 8 },
            { name: 'B', pred: '', a: 1, m: 2, b: 4 },
            { name: 'C', pred: 'A', a: 4, m: 6, b: 9 },
            { name: 'D', pred: 'A,B', a: 2, m: 4, b: 7 },
            { name: 'E', pred: 'C', a: 5, m: 8, b: 12 },
            { name: 'F', pred: 'C,D', a: 6, m: 9, b: 14 },
            { name: 'G', pred: 'D', a: 3, m: 5, b: 9 },
            { name: 'H', pred: 'E,F', a: 2, m: 4, b: 6 },
            { name: 'I', pred: 'G,H', a: 3, m: 6, b: 10 },
            { name: 'J', pred: 'I', a: 1, m: 2, b: 4 }
        ];
        complexData.forEach(data => createRow(data));
    });

    // --- Solve Event & Main Execution Logic ---
    async function runAnalysis() {
        errorBox.style.display = 'none';
        const rows = document.querySelectorAll('.activity-row');
        const activities = [];

        let valid = true;
        rows.forEach(row => {
            const name = row.querySelector('.act-name').value.trim();
            const pred = row.querySelector('.act-pred').value.trim();
            const a = row.querySelector('.act-a').value;
            const m = row.querySelector('.act-m').value;
            const b = row.querySelector('.act-b').value;

            if (!name || a === '' || m === '' || b === '') {
                valid = false;
                return;
            }

            activities.push({ name, pred, a, m, b });
        });

        if (!valid || activities.length === 0) {
            showError("Please fill in all activity details (Name, a, m, b).");
            return;
        }

        solveBtn.disabled = true;
        solveBtn.innerHTML = 'Calculating...';

        const activeTheme = document.body.getAttribute('data-theme') || 'dark-slate';

        try {
            const response = await fetch('/solve', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ activities, theme: activeTheme })
            });

            const data = await response.json();

            if (data.success) {
                renderResults(data);
                resultsSection.style.display = 'block';
            } else {
                showError(data.error);
            }
        } catch (err) {
            showError("Server communication error.");
            console.error(err);
        } finally {
            solveBtn.disabled = false;
            solveBtn.innerHTML = '<span>🚀</span> Run Analysis';
        }
    }

    solveBtn.addEventListener('click', async () => {
        await runAnalysis();
        resultsSection.scrollIntoView({ behavior: 'smooth' });
    });

    // --- Theme Switcher Logic ---
    const themeBtns = document.querySelectorAll('.theme-btn');
    
    // Load stored theme if it exists
    const savedTheme = localStorage.getItem('pert-cpm-theme') || 'dark-slate';
    document.body.setAttribute('data-theme', savedTheme);
    
    // Select correct theme button state
    themeBtns.forEach(btn => {
        if (btn.getAttribute('data-theme') === savedTheme) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    themeBtns.forEach(btn => {
        btn.addEventListener('click', async () => {
            const theme = btn.getAttribute('data-theme');
            document.body.setAttribute('data-theme', theme);
            localStorage.setItem('pert-cpm-theme', theme);
            
            // Toggle active state classes
            themeBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // If results are already active, automatically re-run to regenerate diagram with new colors
            if (resultsSection.style.display === 'block') {
                await runAnalysis();
            }
        });
    });

    // --- System Analysis Modal Logic ---
    const modal = document.getElementById('analysis-modal');
    const openModalBtn = document.getElementById('open-analysis-btn');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    openModalBtn.addEventListener('click', () => {
        modal.style.display = 'flex';
    });

    closeModalBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    // Close on clicking backdrop
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });

    // Modal Tabs Switching
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all buttons and contents
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            // Add active class to clicked button and target tab
            btn.classList.add('active');
            const targetTab = btn.getAttribute('data-tab');
            document.getElementById(`tab-${targetTab}`).classList.add('active');
        });
    });

    function showError(msg) {
        errorBox.innerText = `⚠️ Error: ${msg}`;
        errorBox.style.display = 'block';
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function renderResults(data) {
        // Stats
        document.getElementById('total-duration').innerText = data.duration;
        document.getElementById('critical-path-list').innerText = data.critical_path.join(' → ');

        // Table
        const tbody = document.getElementById('results-body');
        tbody.innerHTML = '';

        data.result.sort((a, b) => a.name.localeCompare(b.name)).forEach(row => {
            const isCritical = row.tf === 0;
            const tr = document.createElement('tr');
            if (isCritical) tr.className = 'critical-row';

            tr.innerHTML = `
                <td><strong>${row.name}</strong></td>
                <td>${row.te}</td>
                <td>${row.es}</td>
                <td>${row.ef}</td>
                <td>${row.ls}</td>
                <td>${row.lf}</td>
                <td>${row.tf}</td>
                <td>${row.ff}</td>
                <td>${isCritical ? '<span class="critical-badge">CRITICAL</span>' : '<span style="color:var(--text-secondary)">Normal</span>'}</td>
            `;
            tbody.appendChild(tr);
        });

        // Graph
        const graphImg = document.getElementById('graph-img');
        graphImg.src = data.graph;

        // Gantt Chart
        renderGantt(data);
    }

    function renderGantt(data) {
        const container = document.getElementById('gantt-chart-container');
        container.innerHTML = '';

        const maxDuration = parseFloat(data.duration);
        if (isNaN(maxDuration) || maxDuration <= 0) return;

        // Sort activities alphabetically
        const sortedActivities = [...data.result].sort((a, b) => a.name.localeCompare(b.name));

        // Create Header Row (Timeline ticks)
        const header = document.createElement('div');
        header.className = 'gantt-header';
        header.innerHTML = `
            <div class="gantt-label-col">Activity</div>
            <div class="gantt-timeline-col" id="gantt-timeline-header-ticks"></div>
        `;
        container.appendChild(header);

        const timelineHeaderTicks = header.querySelector('#gantt-timeline-header-ticks');

        // Calculate tick interval
        let step = 1;
        if (maxDuration > 100) step = 20;
        else if (maxDuration > 50) step = 10;
        else if (maxDuration > 25) step = 5;
        else if (maxDuration > 10) step = 2;
        else step = 1;

        // Scale max timeline limit to next multiple of step for professional alignment
        const limit = Math.ceil(maxDuration / step) * step;

        // Render Ticks
        for (let t = 0; t <= limit; t += step) {
            const pct = (t / limit) * 100;
            const tick = document.createElement('div');
            tick.className = 'gantt-tick';
            tick.style.left = `${pct}%`;
            tick.innerText = t;
            timelineHeaderTicks.appendChild(tick);
        }

        // Render vertical grid lines in a background container
        const gridContainer = document.createElement('div');
        gridContainer.style.position = 'absolute';
        gridContainer.style.top = '25px';
        gridContainer.style.left = '120px';
        gridContainer.style.right = '0';
        gridContainer.style.bottom = '0';
        gridContainer.style.pointerEvents = 'none';
        gridContainer.style.zIndex = '1';
        container.appendChild(gridContainer);

        for (let t = 0; t <= limit; t += step) {
            const pct = (t / limit) * 100;
            const line = document.createElement('div');
            line.className = 'gantt-tick-line';
            line.style.left = `${pct}%`;
            gridContainer.appendChild(line);
        }

        // Render Rows
        sortedActivities.forEach(act => {
            const isCritical = act.tf === 0;

            const row = document.createElement('div');
            row.className = 'gantt-row';

            const labelCol = document.createElement('div');
            labelCol.className = 'gantt-label-col';
            labelCol.innerHTML = `<strong>Activity ${act.name}</strong>`;
            row.appendChild(labelCol);

            const track = document.createElement('div');
            track.className = 'gantt-track';

            const leftPct = (act.es / limit) * 100;
            const widthPct = (act.te / limit) * 100;

            // Gantt Bar
            const bar = document.createElement('div');
            bar.className = `gantt-bar ${isCritical ? 'critical' : ''}`;
            bar.style.left = `${leftPct}%`;
            bar.style.width = `${widthPct}%`;
            bar.title = `Activity ${act.name}\nES: ${act.es}, EF: ${act.ef}\nLS: ${act.ls}, LF: ${act.lf}\nDuration: ${act.te}\nFloat: ${act.tf}`;
            bar.innerHTML = `<span>${act.te}d</span>`;
            track.appendChild(bar);

            // Slack Bar
            if (act.tf > 0) {
                const slackLeftPct = (act.ef / limit) * 100;
                const slackWidthPct = (act.tf / limit) * 100;

                const slackBar = document.createElement('div');
                slackBar.className = 'gantt-slack-bar';
                slackBar.style.left = `${slackLeftPct}%`;
                slackBar.style.width = `${slackWidthPct}%`;
                track.appendChild(slackBar);
            }

            row.appendChild(track);
            container.appendChild(row);
        });
    }



    function getWmoWeather(code, isDay) {
        const mapping = {
            0: { text: isDay ? "sunny" : "clear night", icon: isDay ? "☀️" : "🌙" },
            1: { text: isDay ? "mainly clear" : "clear night", icon: isDay ? "🌤️" : "🌙" },
            2: { text: "partly cloudy", icon: isDay ? "⛅" : "☁️" },
            3: { text: "overcast", icon: "☁️" },
            45: { text: "foggy", icon: "🌫️" },
            48: { text: "foggy", icon: "🌫️" },
            51: { text: "light drizzle", icon: "🌧️" },
            53: { text: "drizzle", icon: "🌧️" },
            55: { text: "dense drizzle", icon: "🌧️" },
            61: { text: "slight rain", icon: "🌧️" },
            63: { text: "moderate rain", icon: "🌧️" },
            65: { text: "heavy rain", icon: "🌧️" },
            71: { text: "slight snow", icon: "❄️" },
            73: { text: "moderate snow", icon: "❄️" },
            75: { text: "heavy snow", icon: "❄️" },
            77: { text: "snow grains", icon: "❄️" },
            80: { text: "slight showers", icon: "🌧️" },
            81: { text: "showers", icon: "🌧️" },
            82: { text: "heavy showers", icon: "🌧️" },
            95: { text: "thunderstorm", icon: "⛈️" },
            96: { text: "thunderstorm", icon: "⛈️" },
            99: { text: "thunderstorm", icon: "⛈️" }
        };
        return mapping[code] || { text: "unknown conditions", icon: "❓" };
    }

    async function updateWeather() {
        const tempEl = document.getElementById('widget-temp');
        const iconEl = document.getElementById('widget-weather-icon');
        const locationEl = document.getElementById('widget-location');
        if (!tempEl) return;

        const showWeatherError = () => {
            tempEl.innerText = "Unable to load weather data";
            if (iconEl) iconEl.innerText = "⚠️";
            if (locationEl) locationEl.innerText = "";
        };

        const applyWeather = (data, name) => {
            if (!data?.ok || !Number.isFinite(data.temperature)) {
                showWeatherError();
                return;
            }
            const temp = Math.round(data.temperature);
            const description = data.description || getWmoWeather(0, true).text;
            const icon = data.icon || "❓";
            tempEl.innerText = `${temp}°C, ${description}`;
            if (iconEl) iconEl.innerText = icon;
            if (locationEl) locationEl.innerText = name || "";
        };

        if (!navigator.geolocation) {
            showWeatherError();
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const autoLat = position.coords.latitude;
                const autoLon = position.coords.longitude;
                const params = new URLSearchParams({
                    lat: String(autoLat),
                    lon: String(autoLon),
                });

                try {
                    const [geoData, weatherRes] = await Promise.all([
                        fetch(`/api/geocode?${params}`)
                            .then((res) => res.json())
                            .catch((err) => {
                                console.warn("Reverse-geocoding failed.", err);
                                return { ok: false, name: "" };
                            }),
                        fetch(`/api/weather?${params}`),
                    ]);
                    const weatherData = await weatherRes.json();
                    const geoName = geoData.ok ? geoData.name : "";
                    applyWeather(weatherData, geoName);
                } catch (e) {
                    console.error("Error fetching weather data:", e);
                    showWeatherError();
                }
            },
            (err) => {
                console.warn("Geolocation unavailable:", err);
                showWeatherError();
            },
            { timeout: 10000, enableHighAccuracy: false }
        );
    }

    function updateWidgets() {
        const timeEl = document.getElementById('widget-time');
        const dateEl = document.getElementById('widget-date');
        const dayEl = document.getElementById('widget-day');

        if (!timeEl || !dateEl || !dayEl) return;

        const now = new Date();

        // Format Time: 10:54 AM
        let hours = now.getHours();
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12;
        timeEl.innerText = `${hours}:${minutes} ${ampm}`;

        // Format Date: 19th may 2026
        const day = now.getDate();
        const year = now.getFullYear();
        const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        const month = months[now.getMonth()];
        
        const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        const weekday = weekdays[now.getDay()];

        let suffix = 'th';
        if (day === 1 || day === 21 || day === 31) suffix = 'st';
        else if (day === 2 || day === 22) suffix = 'nd';
        else if (day === 3 || day === 23) suffix = 'rd';

        // Match case to mockup "19th may 2026 Tuesday"
        dateEl.innerText = `${day}${suffix} ${month.toLowerCase()} ${year}`;
        dayEl.innerText = weekday;
    }

    setInterval(updateWidgets, 1000);
    setInterval(updateWeather, 600000);
    updateWidgets();
    updateWeather();
});
