# Dynamic PERT-CPM Operations Decision Support System
An advanced, state-of-the-art full-stack operations management dashboard designed to calculate critical paths, execute project scheduling passes, and visualize topological Directed Acyclic Graphs (DAGs) in real-time.

Designed and engineered under academic research and course requirements for **Zagazig University**.

---

## 🎨 Premium Visual Showcase: Emerald Garden
The platform features the custom **Emerald Garden** theme—a premium, responsive, glassmorphism-inspired design system tailored to provide high-fidelity visual feedback:
*   **Dynamic Pinned Sidebar:** Sleek, fixed-viewport sidebar holding a customized high-contrast Zagazig University logo plate, a real-time calendar & clock widget, and a live WMO geocoded local weather panel.
*   **Theme Synchronization:** Supports full client-side CSS variables switching across four pre-mapped modes (Midnight Slate, Cyberpunk Neon, Nordic Snow, and Emerald Garden).
*   **Responsive Flow Stacking:** The side-by-side dashboard layout smoothly transitions to vertical stacking on mobile devices.

---

## 🚀 Key Architectural Features
1. **Headless Graph Calculations:** Exposes an asynchronous Flask API endpoint (`/solve`) that constructs project DAGs using **NetworkX**, performs cycle detection, computes forward/backward passes, and maps slack buffers.
2. **Dynamic Diagram Engine:** Renders clear sequence flow diagrams using headless layout rendering (**Matplotlib & NumPy**) dynamically synced to the active client theme palette.
3. **Geo-Location & Weather Integration:** Connects to the HTML5 Geolocation API, reverse-geocodes coordinates via **OpenStreetMap Nominatim**, and fetches real-time WMO weather states via **Open-Meteo**.
4. **Nginx Reverse-Proxy Integration:** Custom production-ready configuration including Gzip compression, static asset serving direct from storage, and extended socket timeouts.

---

## 📐 Mathematical Formulation

The core PERT-CPM engine calculates five parameters for each project activity:

*   **Expected Duration ($T_E$):** 
    $$T_E = \frac{a + 4m + b}{6}$$
    *(where $a$ = optimistic duration, $m$ = most likely duration, and $b$ = pessimistic duration)*
*   **Early Start ($ES$) & Early Finish ($EF$):** Calculated during the Forward Pass.
    $$EF(i) = ES(i) + T_E(i)$$
*   **Late Finish ($LF$) & Late Start ($LS$):** Calculated during the Backward Pass.
    $$LS(i) = LF(i) - T_E(i)$$
*   **Total Float ($TF$):** Pre-condition buffer for scheduling flexibility.
    $$TF(i) = LF(i) - EF(i) = LS(i) - ES(i)$$
*   **Free Float ($FF$):** Buffer available without delaying successor starts.
    $$FF(i) = \min(ES(\text{successors})) - EF(i)$$

---

## 🛠️ Quick Start & Installation

### Prerequisites
*   **Python 3.8+**
*   **PowerShell** (for automated Nginx setup under Windows)
*   **Git**

### 1. Setup python Environment
Clone the repository and initialize your local virtual environment:
```bash
git clone https://github.com/Mandotta/PERT-CPM-Solver.git
cd PERT-CPM-Solver

# Initialize virtual environment
python -m venv venv
source venv/bin/activate  # On Linux/macOS
.\venv\Scripts\activate   # On Windows
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Launch Flask Backend Server
```bash
python app.py
```
*The backend server will run in debug mode at `http://localhost:5000`.*

### 4. Setup and Run Nginx Proxy (Windows)
We provide a unified setup script that automatically pulls down Nginx v1.26.1, configures the reverse proxy endpoints, and runs it as a background service:
1. Open PowerShell **as Administrator** inside the repository directory.
2. Run the automation runner:
   ```powershell
   Set-ExecutionPolicy Bypass -Scope Process
   .\setup_and_run_nginx.ps1
   ```
3. Open your browser and navigate to **[http://localhost](http://localhost)** to experience the high-performance pipeline!

---

## 📂 Project Structure
```text
PERT-CPM-Solver/
│
├── app.py                     # Flask App & Core NetworkX/Matplotlib Engines
├── nginx.conf                 # Reverse Proxy & Tunneled configuration
├── setup_and_run_nginx.ps1    # Automated Nginx Downloader, Configurer & Runner
├── requirements.txt           # Python dependency locks
├── .gitignore                 # Standard system and runtime exclusion locks
│
├── templates/
│   └── index.html             # Premium semantic structure & system documentation
│
└── static/
    ├── script.js              # Geolocation tracking, API payloads, & DOM bindings
    └── style.css              # Custom theme system, layouts, & responsive CSS
```

---

## 🎓 Academic Profile
*   **Institution:** Zagazig University
*   **Department:** Computer and Systems Engineering
*   **Purpose:** Operational Operations Research & Decision Support Optimization Systems
