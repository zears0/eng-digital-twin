// TwinEdu Labs - Lean, AIoT, Metaheuristic & ML/PINN Digital Twin
// Core Logic and Simulation Engine

document.addEventListener('DOMContentLoaded', () => {
  // --- STATE MANAGEMENT ---
  const state = {
    activePage: 'lean',
    theme: 'dark',
    
    // Page 1: Lean Line Balancing State
    lean: {
      activeScenario: 'garment', // 'garment', 'bubbletea', 'burger'
      demand: 500, // pcs per day
      workingHours: 8, // hours per day
      efficiencyTarget: 85, // %
      hiddenWaste: 20, // % switching/setup waste in traditional batch
      stations: [
        { id: 1, name: 'ตัดผ้า (Cutting)', ctBase: 40, operators: 1 },
        { id: 2, name: 'เย็บตัวเสื้อ (Sewing Body)', ctBase: 90, operators: 1 },
        { id: 3, name: 'เย็บแขนเสื้อ (Sewing Sleeves)', ctBase: 50, operators: 1 },
        { id: 4, name: 'ประกอบร่าง (Assembly)', ctBase: 80, operators: 1 },
        { id: 5, name: 'เย็บกระดุม/รีด (Finishing)', ctBase: 45, operators: 1 },
        { id: 6, name: 'QC & แพ็คกิ้ง (QC & Pack)', ctBase: 35, operators: 1 }
      ],
      simulationSpeed: 1, // 1x, 2x, 5x
      isRunning: false,
      brokenStationId: null, // ID of the currently broken station
      lastTickTime: 0,
      chart: null,
      
      // Independent simulation states
      traditional: {
        elapsedSimTime: 0,
        garmentCounter: 0,
        leadTimes: [],
        avgLeadTime: 0,
        throughput: 0,
        totalWip: 0,
        workers: []
      },
      lean: {
        elapsedSimTime: 0,
        garmentCounter: 0,
        leadTimes: [],
        avgLeadTime: 0,
        throughput: 0,
        totalWip: 0,
        buffers: [],
        movingGarments: [],
        stations: []
      }
    },
    
    // Page 2: AIoT Motor Digital Twin State
    aiot: {
      activeDevice: 'pump', // 'pump', 'washer', 'hvac'
      rpm: 1500,
      vibration: 2.5, // mm/s RMS
      temperature: 45, // °C
      faultMode: 'normal', // 'normal', 'unbalance', 'misalignment', 'bearing'
      isAlertActive: false,
      mqttLogs: [],
      maxLogs: 30,
      lastMqttSend: 0,
      animationFrameId: null,
      timeOffset: 0
    },

    // Page 3: Metaheuristic Lab State
    meta: {
      activeAlgo: 'ga', // 'ga', 'aco', 'sa', 'pso'
      activeScenario: 'parcel', // 'parcel', 'food', 'garbage'
      numVehicles: 1,
      cities: [],
      numCities: 20,
      capacityEnable: false,
      capacityLimit: 5,
      bestPath: [],
      bestDistance: Infinity,
      iteration: 0,
      isRunning: false,
      animationFrameId: null,
      history: [], // For convergence chart
      chart: null,
      lastStepTime: 0,
      subProblems: [],
      vehicleColors: ['#00f2fe', '#10b981', '#ef4444', '#f59e0b', '#a855f7'],
      
      // GA Parameters
      ga: { popSize: 50, mutationRate: 0.15 },
      // ACO Parameters
      aco: { numAnts: 15, evaporation: 0.2, alpha: 1.0, beta: 2.0, pheromones: [] },
      // SA Parameters
      sa: { temp: 100.0, coolingRate: 0.992, currentPath: [], currentDist: Infinity },
      // PSO Parameters
      pso: { numParticles: 25, w: 0.3, c1: 0.4, c2: 0.5, particles: [] }
    },

    // Page 4: ML & PINN Sandbox State
    ml: {
      // K-Means
      kmeans: {
        points: [],
        centroids: [],
        assignments: [],
        k: 3,
        converged: false
      },
      // Regression
      regression: {
        points: [],
        m: 0, // slope
        c: 0, // intercept
        lr: 0.05,
        epoch: 0,
        loss: 0,
        isTraining: false
      },
      // PINN vs DNN
      pinn: {
        damping: 0.5,
        spring: 10.0,
        numPoints: 10,
        physicsWeight: 0.5,
        epoch: 0,
        isTraining: false,
        dnnNet: null,
        pinnNet: null,
        groundTruth: [],
        dataPoints: [],
        collocationPoints: [],
        dnnLoss: 0,
        pinnDataLoss: 0,
        pinnPhysLoss: 0,
        animationTime: 0
      },
      // Linear Programming (Weekly Production Planning)
      lp: {
        demands: [50, 80, 30, 90, 70],
        production: [50, 70, 40, 70, 70]
      }
    },

    // Page 5: Smart Traffic Lab State
    traffic: {
      activeLogic: 'fixed', // 'fixed', 'smart', 'ai'
      density: 50, // % spawning probability
      isRunning: false,
      animationFrameId: null,
      lastTickTime: 0,
      elapsedSimTime: 0,
      
      // 4 lanes: 0 = North, 1 = East, 2 = South, 3 = West
      lanes: [
        { dir: 'North', queue: [], light: 'red', timer: 0, spawnAccumulator: 0 },
        { dir: 'East', queue: [], light: 'red', timer: 0, spawnAccumulator: 0 },
        { dir: 'South', queue: [], light: 'red', timer: 0, spawnAccumulator: 0 },
        { dir: 'West', queue: [], light: 'red', timer: 0, spawnAccumulator: 0 }
      ],
      
      currentGreenLaneIdx: 0, // currently green lane index
      yellowTimer: 0, // timer for yellow transition
      fixedTimer: 0, // timer for fixed time logic
      
      // KPIs
      totalCarsPassed: 0,
      totalWaitTime: 0,
      maxQueueLength: 0,
      waitTimesList: []
    },
    
    // Page 6: Catapult & DOE State
    catapult: {
      releaseAngle: 45,
      pullbackAngle: 90,
      stopAngle: 60,
      cupAngle: 0,
      
      isLaunching: false,
      launchStage: 'idle', // 'idle', 'pullback', 'swing', 'flight'
      stageTimer: 0,
      armAngle: 60, // current angle of the arm during animation
      
      ball: {
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        active: false,
        path: [] // trace path
      },
      
      landings: [], // history of landings
      
      // 2^(4-1) Fractional Factorial
      doeRuns: [
        { id: 1, a: -1, b: -1, c: -1, d: -1, distance: null },
        { id: 2, a:  1, b: -1, c: -1, d:  1, distance: null },
        { id: 3, a: -1, b:  1, c: -1, d:  1, distance: null },
        { id: 4, a:  1, b:  1, c: -1, d: -1, distance: null },
        { id: 5, a: -1, b: -1, c:  1, d:  1, distance: null },
        { id: 6, a:  1, b: -1, c:  1, d: -1, distance: null },
        { id: 7, a: -1, b:  1, c:  1, d: -1, distance: null },
        { id: 8, a:  1, b:  1, c:  1, d:  1, distance: null }
      ],
      
      effects: {
        release: 0,
        pullback: 0,
        stop: 0,
        cup: 0
      }
    }
  };

  // --- INITIALIZATIONS ---
  function initLeanBuffers() {
    const numStations = state.lean.stations.length;
    const totalOperators = state.lean.stations.reduce((sum, s) => sum + s.operators, 0);
    
    // Initialize Traditional Parallel Workers state
    state.lean.traditional.elapsedSimTime = 0;
    state.lean.traditional.garmentCounter = 0;
    state.lean.traditional.leadTimes = [];
    state.lean.traditional.avgLeadTime = 0;
    state.lean.traditional.throughput = 0;
    state.lean.traditional.totalWip = 0;
    state.lean.traditional.workers = Array(totalOperators).fill(0).map((_, idx) => ({
      id: idx + 1,
      currentBatch: null,
      progress: 0,
      queue: []
    }));
    
    // Initialize Lean state
    state.lean.lean.elapsedSimTime = 0;
    state.lean.lean.garmentCounter = 0;
    state.lean.lean.leadTimes = [];
    state.lean.lean.avgLeadTime = 0;
    state.lean.lean.throughput = 0;
    state.lean.lean.totalWip = 0;
    state.lean.lean.buffers = Array(numStations - 1).fill(0).map(() => []);
    state.lean.lean.movingGarments = [];
    state.lean.lean.stations = state.lean.stations.map(s => ({
      ...s,
      subStations: Array(s.operators).fill(0).map(() => ({
        currentGarment: null,
        progress: 0
      }))
    }));
  }
  initLeanBuffers();

  // --- DOM ELEMENTS ---
  const sidebarItems = document.querySelectorAll('.nav-item');
  const pages = document.querySelectorAll('.page-container');
  const themeToggleBtn = document.getElementById('theme-toggle');
  
  // Page 1 (Lean) DOM
  const leanScenarioSelect = document.getElementById('lean-scenario-select');
  const leanPageTitle = document.getElementById('lean-page-title');
  const leanPageSubtitle = document.getElementById('lean-page-subtitle');
  const demandInput = document.getElementById('demand-input');
  const hoursInput = document.getElementById('hours-input');
  const demandVal = document.getElementById('demand-val');
  const hoursVal = document.getElementById('hours-val');
  
  const kpiTakt = document.getElementById('kpi-takt');
  const kpiBottleneck = document.getElementById('kpi-bottleneck');
  
  const kpiEffTrad = document.getElementById('kpi-eff-trad');
  const kpiEffLean = document.getElementById('kpi-eff-lean');
  const kpiLtTrad = document.getElementById('kpi-lt-trad');
  const kpiLtLean = document.getElementById('kpi-lt-lean');
  const kpiWipTrad = document.getElementById('kpi-wip-trad');
  const kpiWipLean = document.getElementById('kpi-wip-lean');
  const kpiTpTrad = document.getElementById('kpi-tp-trad');
  const kpiTpLean = document.getElementById('kpi-tp-lean');
  
  const hiddenWasteInput = document.getElementById('hidden-waste-input');
  const hiddenWasteVal = document.getElementById('hidden-waste-val');
  
  const stationListContainer = document.getElementById('station-list');
  const conveyorBelt = document.getElementById('conveyor-belt');
  const conveyorLegend = document.getElementById('conveyor-legend');
  
  const btnPlayPause = document.getElementById('btn-play-pause');
  const btnReset = document.getElementById('btn-reset');
  const btnAutoBalance = document.getElementById('btn-auto-balance');
  const btnAddStation = document.getElementById('btn-add-station');
  const btnRemoveStation = document.getElementById('btn-remove-station');
  const speedBtns = document.querySelectorAll('.sim-speed-btn');
  const simSpeedInput = document.getElementById('sim-speed-input');
  
  // Page 2 (AIoT) DOM
  const aiotDeviceSelect = document.getElementById('aiot-device-select');
  const aiotPageTitle = document.getElementById('aiot-page-title');
  const aiotPageSubtitle = document.getElementById('aiot-page-subtitle');
  const rpmInput = document.getElementById('rpm-input');
  const vibrationInput = document.getElementById('vibration-input');
  const tempInput = document.getElementById('temp-input');
  const rpmVal = document.getElementById('rpm-val');
  const vibrationVal = document.getElementById('vibration-val');
  const tempVal = document.getElementById('temp-val');
  
  const kpiHealth = document.getElementById('kpi-health');
  const kpiRul = document.getElementById('kpi-rul');
  const kpiProb = document.getElementById('kpi-prob');
  const kpiFault = document.getElementById('kpi-fault');
  
  const motorElement = document.getElementById('motor-twin');
  const heatOverlay = document.getElementById('heat-overlay');
  const motorRotor = document.getElementById('motor-rotor');
  const timeCanvas = document.getElementById('time-canvas');
  const freqCanvas = document.getElementById('freq-canvas');
  const terminalConsole = document.getElementById('terminal-console');
  const alertBanner = document.getElementById('alert-banner');
  const alertTitle = document.getElementById('alert-title');
  const alertDesc = document.getElementById('alert-desc');

  // Page 3 (Metaheuristic) DOM
  const tspCanvas = document.getElementById('tsp-canvas');
  const kpiMetaModel = document.getElementById('kpi-meta-model');
  const kpiMetaDistance = document.getElementById('kpi-meta-distance');
  const kpiMetaIteration = document.getElementById('kpi-meta-iteration');
  const kpiMetaSpeed = document.getElementById('kpi-meta-speed');
  
  const algoTabBtns = document.querySelectorAll('.algo-tab-btn');
  const citiesInput = document.getElementById('cities-input');
  const citiesVal = document.getElementById('cities-val');
  const vehiclesInput = document.getElementById('vehicles-input');
  const vehiclesVal = document.getElementById('vehicles-val');
  const tspCapacityEnable = document.getElementById('tsp-capacity-enable');
  const tspCapacityContainer = document.getElementById('tsp-capacity-container');
  const tspCapacityInput = document.getElementById('tsp-capacity-input');
  const tspCapacityVal = document.getElementById('tsp-capacity-val');
  const dynamicParamsContainer = document.getElementById('dynamic-params-container');
  
  const btnMetaStart = document.getElementById('btn-meta-start');
  const btnMetaPause = document.getElementById('btn-meta-pause');
  const btnMetaReset = document.getElementById('btn-meta-reset');
  const btnMetaGenerate = document.getElementById('btn-meta-generate');
  const metaExplainCard = document.getElementById('meta-explain-card');

  // Page 4 (ML & PINN) DOM
  const kmeansCanvas = document.getElementById('kmeans-canvas');
  const kInput = document.getElementById('k-input');
  const kVal = document.getElementById('k-val');
  const btnKmeansStep = document.getElementById('btn-kmeans-step');
  const btnKmeansRun = document.getElementById('btn-kmeans-run');
  const btnKmeansReset = document.getElementById('btn-kmeans-reset');
  
  // Page 4 (Weekly Production Planning) DOM
  const lpTableBody = document.getElementById('lp-table-body');
  const lpTotalCost = document.getElementById('lp-total-cost');
  const lpPlanStatus = document.getElementById('lp-plan-status');

  const regressionCanvas = document.getElementById('regression-canvas');
  const regressionLossCanvas = document.getElementById('regression-loss-canvas');
  const lrInput = document.getElementById('lr-input');
  const lrVal = document.getElementById('lr-val');
  const btnRegTrain = document.getElementById('btn-reg-train');
  const btnRegReset = document.getElementById('btn-reg-reset');
  const regLossVal = document.getElementById('reg-loss-val');
  const regEpochVal = document.getElementById('reg-epoch-val');

  const pinnCanvas = document.getElementById('pinn-canvas');
  const pinnCInput = document.getElementById('pinn-c-input');
  const pinnKInput = document.getElementById('pinn-k-input');
  const pinnPointsInput = document.getElementById('pinn-points-input');
  const pinnWeightInput = document.getElementById('pinn-weight-input');
  
  const pinnCVal = document.getElementById('pinn-c-val');
  const pinnKVal = document.getElementById('pinn-k-val');
  const pinnPointsVal = document.getElementById('pinn-points-val');
  const pinnWeightVal = document.getElementById('pinn-weight-val');
  
  const kpiDnnLoss = document.getElementById('kpi-dnn-loss');
  const kpiPinnDataLoss = document.getElementById('kpi-pinn-dataloss');
  const kpiPinnPhysLoss = document.getElementById('kpi-pinn-phyloss');
  const kpiPinnEpoch = document.getElementById('kpi-pinn-epoch');
  
  const btnPinnTrain = document.getElementById('btn-pinn-train');
  const btnPinnResample = document.getElementById('btn-pinn-resample');

  // --- PAGE NAVIGATION ---
  sidebarItems.forEach(item => {
    item.addEventListener('click', () => {
      const pageId = item.getAttribute('data-page');
      switchPage(pageId);
    });
  });

  function switchPage(pageId) {
    state.activePage = pageId;
    
    sidebarItems.forEach(item => {
      if (item.getAttribute('data-page') === pageId) item.classList.add('active');
      else item.classList.remove('active');
    });
    
    pages.forEach(page => {
      if (page.id === `${pageId}-page`) page.classList.add('active');
      else page.classList.remove('active');
    });
    
    // Stop all loops first
    stopAiotLoop();
    stopMetaLoop();
    stopMlLoops();
    stopTrafficLoop();
    stopCatapultLoop();
    
    // Start specific loop
    if (pageId === 'aiot') {
      startAiotLoop();
    } else if (pageId === 'lean') {
      updateLeanCharts();
    } else if (pageId === 'meta') {
      initTspProblem();
      updateMetaUI();
    } else if (pageId === 'ml') {
      initKMeans();
      initRegression();
      initPinnProblem();
      drawKMeans();
      drawRegression();
      drawPinn();
      updateLpSolution();
    } else if (pageId === 'traffic') {
      initTrafficProblem();
      drawTraffic();
    } else if (pageId === 'catapult') {
      initCatapultProblem();
      drawCatapult();
    }
  }

  // --- THEME TOGGLE ---
  themeToggleBtn.addEventListener('click', () => {
    if (state.theme === 'dark') {
      state.theme = 'light';
      document.body.setAttribute('data-theme', 'light');
      themeToggleBtn.innerHTML = `<span>☀️</span> โหมดสว่าง`;
    } else {
      state.theme = 'dark';
      document.body.removeAttribute('data-theme');
      themeToggleBtn.innerHTML = `<span>🌙</span> โหมดมืด`;
    }
    // Update charts if they exist
    if (state.lean.chart) updateChartColors(state.lean.chart);
    if (state.meta.chart) updateChartColors(state.meta.chart);
  });

  function updateChartColors(chart) {
    const textColor = state.theme === 'dark' ? '#9ca3af' : '#4b5563';
    const gridColor = state.theme === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)';
    chart.options.scales.x.grid.color = gridColor;
    chart.options.scales.y.grid.color = gridColor;
    chart.options.scales.x.ticks.color = textColor;
    chart.options.scales.y.ticks.color = textColor;
    chart.update();
  }

  // ==========================================
  // PAGE 1: LEAN LINE BALANCING
  // ==========================================
  function calculateLeanMetrics() {
    const totalWorkingSeconds = state.lean.workingHours * 3600;
    const taktTime = totalWorkingSeconds / state.lean.demand;
    let totalCycleTime = 0;
    let maxCycleTime = 0;
    let bottleneckName = 'ไม่มี';
    
    state.lean.stations.forEach(station => {
      const effCt = station.ctBase / station.operators;
      totalCycleTime += effCt;
      if (effCt > maxCycleTime) {
        maxCycleTime = effCt;
        bottleneckName = station.name.split(' ')[0];
      }
    });
    
    const numStations = state.lean.stations.length;
    const lineEfficiency = maxCycleTime > 0 
      ? (totalCycleTime / (numStations * maxCycleTime)) * 100 
      : 0;
    
    kpiTakt.textContent = taktTime.toFixed(1);
    kpiBottleneck.textContent = `${maxCycleTime.toFixed(1)}s (${bottleneckName})`;
    if (kpiEffTrad) kpiEffTrad.textContent = lineEfficiency.toFixed(1) + '%';
    if (kpiEffLean) kpiEffLean.textContent = lineEfficiency.toFixed(1) + '%';
    
    updateKpiColors(taktTime, maxCycleTime, lineEfficiency);
    return { taktTime, bottleneckTime: maxCycleTime, lineEfficiency };
  }
  
  function updateKpiColors(taktTime, bottleneckTime, efficiency) {
    if (bottleneckTime > taktTime) {
      kpiBottleneck.parentElement.style.setProperty('--kpi-color', 'var(--color-rose)');
      kpiBottleneck.style.color = 'var(--color-rose)';
    } else {
      kpiBottleneck.parentElement.style.setProperty('--kpi-color', 'var(--color-emerald)');
      kpiBottleneck.style.color = 'var(--text-primary)';
    }
    
    // Simplified indicator
    const effIndicator = document.getElementById('kpi-efficiency');
    if (effIndicator) {
      if (efficiency >= 85) {
        effIndicator.parentElement.style.setProperty('--kpi-color', 'var(--color-emerald)');
        effIndicator.style.color = 'var(--color-emerald)';
      } else if (efficiency >= 70) {
        effIndicator.parentElement.style.setProperty('--kpi-color', 'var(--color-amber)');
        effIndicator.style.color = 'var(--color-amber)';
      } else {
        effIndicator.parentElement.style.setProperty('--kpi-color', 'var(--color-rose)');
        effIndicator.style.color = 'var(--color-rose)';
      }
    }
  }

  function renderStationControls() {
    stationListContainer.innerHTML = '';
    const metrics = calculateLeanMetrics();
    
    state.lean.stations.forEach((station, index) => {
      const effCt = station.ctBase / station.operators;
      const isBottleneck = effCt === metrics.bottleneckTime;
      
      const card = document.createElement('div');
      card.className = `station-card ${isBottleneck ? 'bottleneck' : ''}`;
      card.innerHTML = `
        <div class="station-card-header">
          <div class="station-name" style="display: flex; align-items: center; gap: 0.3rem;">
            <span style="font-weight: bold; color: var(--color-cyan);">ST${index + 1}:</span>
            <input type="text" class="station-name-input" value="${station.name}" data-id="${station.id}" style="background: transparent; border: none; border-bottom: 1px dashed var(--border-color); color: var(--text-primary); font-size: 0.85rem; font-weight: bold; width: 140px; padding: 0 4px; outline: none;" title="คลิกเพื่อแก้ไขชื่อสถานี">
          </div>
          <span class="station-badge">${isBottleneck ? '⚠️ คอขวด (Bottleneck)' : 'ปกติ'}</span>
        </div>
        <div class="input-field">
          <div class="input-header">
            <span class="input-label">เวลาทำงานพื้นฐาน (Base CT)</span>
            <div style="display: flex; align-items: center; gap: 0.25rem;">
              <input type="number" class="base-ct-number" value="${station.ctBase}" data-id="${station.id}" min="5" max="300" style="width: 55px; background: var(--bg-secondary); border: 1px solid var(--border-color); color: var(--text-primary); border-radius: 4px; text-align: center; font-family: var(--font-mono); font-size: 0.8rem; padding: 1px;" title="พิมพ์เพื่อกำหนดเวลาทำงานพื้นฐาน">
              <span class="input-value" style="font-size: 0.8rem;">วินาที</span>
            </div>
          </div>
          <input type="range" min="5" max="300" step="5" value="${station.ctBase}" data-id="${station.id}" class="base-ct-slider">
        </div>
        <div class="station-detail-row">
          <span>จำนวนผู้ปฏิบัติงาน (Operators)</span>
          <div class="number-stepper">
            <button class="stepper-btn dec-op" data-id="${station.id}">-</button>
            <span class="stepper-value">${station.operators}</span>
            <button class="stepper-btn inc-op" data-id="${station.id}">+</button>
          </div>
        </div>
        <div class="station-detail-row" style="margin-top: 0.25rem; border-top: 1px dashed var(--border-color); padding-top: 0.5rem;">
          <span>เวลาทำงานจริง (Effective CT)</span>
          <span style="font-family: var(--font-mono); font-weight: 700; color: ${effCt > metrics.taktTime ? 'var(--color-rose)' : 'var(--color-cyan)'}">
            ${effCt.toFixed(1)} วินาที
          </span>
        </div>
      `;
      stationListContainer.appendChild(card);
    });
    
    // Sliders event listeners
    document.querySelectorAll('.base-ct-slider').forEach(slider => {
      slider.addEventListener('input', (e) => {
        const id = parseInt(e.target.getAttribute('data-id'));
        const val = parseInt(e.target.value);
        const station = state.lean.stations.find(s => s.id === id);
        station.ctBase = val;
        updateLeanUI();
      });
    });

    // Number input event listeners
    document.querySelectorAll('.base-ct-number').forEach(numBox => {
      numBox.addEventListener('change', (e) => {
        const id = parseInt(e.target.getAttribute('data-id'));
        let val = parseInt(e.target.value) || 10;
        if (val < 5) val = 5;
        if (val > 300) val = 300;
        const station = state.lean.stations.find(s => s.id === id);
        station.ctBase = val;
        updateLeanUI();
      });
    });

    // Station name edit event listeners
    document.querySelectorAll('.station-name-input').forEach(input => {
      input.addEventListener('change', (e) => {
        const id = parseInt(e.target.getAttribute('data-id'));
        const val = e.target.value.trim() || `สถานี ${id}`;
        const station = state.lean.stations.find(s => s.id === id);
        station.name = val;
        
        // Update name in active Lean simulation stations
        const leanSimStation = state.lean.lean.stations?.find(s => s.id === id);
        if (leanSimStation) {
          leanSimStation.name = val;
        }
        
        updateLeanUI();
      });
    });
    
    document.querySelectorAll('.dec-op').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = parseInt(e.target.getAttribute('data-id'));
        const station = state.lean.stations.find(s => s.id === id);
        if (station.operators > 1) {
          station.operators--;
          updateLeanUI();
        }
      });
    });
    
    document.querySelectorAll('.inc-op').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = parseInt(e.target.getAttribute('data-id'));
        const station = state.lean.stations.find(s => s.id === id);
        if (station.operators < 5) {
          station.operators++;
          updateLeanUI();
        }
      });
    });
  }

  // --- PIXEL-ART PROCEDURAL GRAPHICS ENGINE ---
  function getPixelItemSvg(scenario) {
    if (scenario === 'garment') {
      return `
        <svg width="18" height="18" viewBox="0 0 20 20" style="overflow: visible;">
          <path d="M4 4 L8 1 L12 1 L16 4 L18 8 L15 10 L14 8 L14 19 L6 19 L6 8 L5 10 L2 8 Z" fill="#00f2fe" stroke="#0369a1" stroke-width="1"/>
          <rect x="8" y="8" width="4" height="4" fill="#38bdf8"/>
        </svg>
      `;
    } else if (scenario === 'bubbletea') {
      return `
        <svg width="14" height="18" viewBox="0 0 14 18" style="overflow: visible;">
          <path d="M2 4 L12 4 L10 17 L4 17 Z" fill="#ffedd5" stroke="#c2410c" stroke-width="1"/>
          <circle cx="5" cy="11" r="1.5" fill="#18181b"/>
          <circle cx="9" cy="12" r="1.5" fill="#18181b"/>
          <circle cx="7" cy="14" r="1.5" fill="#18181b"/>
          <line x1="7" y1="1" x2="7" y2="8" stroke="#f43f5e" stroke-width="1.5"/>
        </svg>
      `;
    } else { // burger
      return `
        <svg width="18" height="16" viewBox="0 0 18 16" style="overflow: visible;">
          <path d="M2 8 Q9 2 16 8 Z" fill="#f59e0b" stroke="#b45309" stroke-width="1"/> <!-- Top Bun -->
          <rect x="1" y="8" width="16" height="1.5" fill="#22c55e"/> <!-- Lettuce -->
          <rect x="2" y="9.5" width="14" height="2.5" fill="#7c2d12"/> <!-- Patty -->
          <path d="M2 12 L16 12 L14 15 L4 15 Z" fill="#f59e0b" stroke="#b45309" stroke-width="1"/> <!-- Bottom Bun -->
        </svg>
      `;
    }
  }

  function getPixelWorkshopSvg(scenario, stationIdx, progress, hasItem, isBroken = false) {
    const isWorking = progress > 0 && progress < 100 && !isBroken;
    const bobClass = isWorking ? 'pixel-bobbing' : '';
    
    let toolSvg = '';
    let itemOnDesk = '';
    
    if (hasItem) {
      itemOnDesk = `<g style="transform: translate(22px, 20px) scale(0.7);">${getPixelItemSvg(scenario)}</g>`;
    }
    
    const tableColor = isBroken ? '#b91c1c' : '#4b5563';
    const legColor = isBroken ? '#7f1d1d' : '#374151';
    
    if (scenario === 'traditional') {
      toolSvg = `
        <!-- Cutting Mat -->
        <rect x="10" y="28" width="12" height="4" fill="#10b981"/>
        <!-- Sewing Machine -->
        <rect x="24" y="22" width="12" height="8" fill="#71717a"/>
        <rect x="30" y="16" width="4" height="8" fill="#e4e4e7"/>
        <!-- Box -->
        <rect x="40" y="24" width="10" height="8" fill="#d97706"/>
      `;
    } else if (scenario === 'garment') {
      switch(stationIdx) {
        case 0: // Cutting
          toolSvg = `
            <rect x="15" y="26" width="30" height="6" fill="#a1a1aa" rx="1"/>
            <path d="M20 18 L24 22 L20 26 M26 18 L22 22 L26 26" stroke="#f43f5e" stroke-width="1.5" fill="none"/>
          `;
          break;
        case 1: // Sewing Body
        case 2: // Sewing Sleeve
          toolSvg = `
            <rect x="15" y="24" width="30" height="8" fill="#71717a"/>
            <rect x="34" y="16" width="6" height="8" fill="#e4e4e7"/>
            <rect x="26" y="16" width="10" height="3" fill="#e4e4e7"/>
            <line x1="26" y1="19" x2="26" y2="24" stroke="#f43f5e" stroke-width="1.5" class="${isWorking ? 'pixel-shaking' : ''}"/>
          `;
          break;
        case 3: // Assembly
          toolSvg = `
            <rect x="15" y="26" width="30" height="6" fill="#d97706"/>
            <rect x="18" y="18" width="6" height="8" fill="#3b82f6"/>
            <rect x="30" y="18" width="8" height="8" fill="#10b981"/>
          `;
          break;
        case 4: // Pressing
          toolSvg = `
            <rect x="15" y="28" width="30" height="4" fill="#e4e4e7"/>
            <path d="M20 24 L32 24 L35 28 L17 28 Z" fill="#3b82f6"/>
            <rect x="22" y="20" width="8" height="4" fill="#1d4ed8"/>
          `;
          break;
        case 5: // Packaging
          toolSvg = `
            <rect x="18" y="22" width="24" height="10" fill="#d97706" rx="1"/>
            <rect x="20" y="19" width="20" height="3" fill="#b45309"/>
          `;
          break;
      }
    } else if (scenario === 'bubbletea') {
      switch(stationIdx) {
        case 0: // Order
          toolSvg = `
            <rect x="20" y="24" width="20" height="8" fill="#3f3f46"/>
            <rect x="24" y="18" width="12" height="6" fill="#22c55e"/>
          `;
          break;
        case 1: // Tea
          toolSvg = `
            <rect x="20" y="14" width="20" height="18" fill="#71717a" rx="2"/>
            <circle cx="30" cy="22" r="3" fill="#d97706"/>
            <rect x="28" y="29" width="4" height="5" fill="#ef4444"/>
          `;
          break;
        case 2: // Toppings
          toolSvg = `
            <rect x="15" y="26" width="30" height="6" fill="#e4e4e7"/>
            <circle cx="20" cy="22" r="2.5" fill="#18181b"/>
            <circle cx="30" cy="22" r="2.5" fill="#18181b"/>
            <circle cx="40" cy="22" r="2.5" fill="#18181b"/>
          `;
          break;
        case 3: // Sealing
          toolSvg = `
            <rect x="18" y="12" width="24" height="20" fill="#4b5563"/>
            <rect x="22" y="18" width="16" height="8" fill="#f43f5e"/>
          `;
          break;
        case 4: // Serving/QC
          toolSvg = `
            <rect x="15" y="27" width="30" height="5" fill="#10b981"/>
          `;
          break;
      }
    } else { // Burger
      switch(stationIdx) {
        case 0: // Toasting
          toolSvg = `
            <rect x="20" y="22" width="20" height="10" fill="#71717a" rx="1"/>
            <rect x="23" y="17" width="4" height="5" fill="#d97706"/>
            <rect x="33" y="17" width="4" height="5" fill="#d97706"/>
          `;
          break;
        case 1: // Grilling
          toolSvg = `
            <rect x="16" y="24" width="28" height="8" fill="#3f3f46"/>
            <ellipse cx="30" cy="24" rx="9" ry="2.5" fill="#ef4444" class="${isWorking ? 'pixel-shaking' : ''}"/>
          `;
          break;
        case 2: // Veggies
          toolSvg = `
            <rect x="15" y="26" width="30" height="6" fill="#e4e4e7"/>
            <circle cx="22" cy="20" r="3.5" fill="#22c55e"/>
            <circle cx="34" cy="20" r="3" fill="#ef4444"/>
          `;
          break;
        case 3: // Assembly/Sauce
          toolSvg = `
            <rect x="15" y="27" width="30" height="5" fill="#d97706"/>
            <path d="M22 18 Q24 24 22 26 Z" fill="#ef4444"/>
            <path d="M34 18 Q36 24 34 26 Z" fill="#eab308"/>
          `;
          break;
        case 4: // Packaging
          toolSvg = `
            <rect x="20" y="22" width="20" height="10" fill="#e4e4e7" rx="1"/>
          `;
          break;
      }
    }

    const radius = 27;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (progress / 100) * circumference;
    const progressColor = isBroken ? 'var(--color-rose)' : (scenario === 'traditional' ? 'var(--color-amber)' : 'var(--color-cyan)');

    return `
      <svg class="pixel-workshop-svg ${isBroken ? 'pixel-shaking' : ''}" width="60" height="60" viewBox="0 0 60 60" style="overflow: visible;">
        <!-- Table Base -->
        <rect x="5" y="30" width="50" height="5" fill="${tableColor}" rx="1"/>
        <rect x="8" y="35" width="3" height="15" fill="${legColor}"/>
        <rect x="49" y="35" width="3" height="15" fill="${legColor}"/>
        
        <!-- Progress Ring (Around the table) -->
        <circle cx="30" cy="30" r="${radius}" stroke="rgba(255,255,255,0.03)" stroke-width="2" fill="none"/>
        ${progress > 0 && !isBroken ? `<circle cx="30" cy="30" r="${radius}" stroke="${progressColor}" stroke-width="2" stroke-dasharray="${circumference} ${circumference}" stroke-dashoffset="${offset}" stroke-linecap="round" fill="none" style="transform: rotate(-90deg); transform-origin: 30px 30px; transition: stroke-dashoffset 0.1s linear;"/>` : ''}
        
        <!-- Tools -->
        ${isBroken ? '' : toolSvg}
        
        <!-- Item being worked on -->
        ${isBroken ? '' : itemOnDesk}
        
        <!-- 8-bit Worker bobbing -->
        <g class="${bobClass}" style="transform-origin: 30px 42px;">
          <rect x="23" y="33" width="14" height="10" fill="${isBroken ? '#9ca3af' : '#2563eb'}" rx="1"/> <!-- shirt -->
          <rect x="25" y="26" width="10" height="7" fill="#fbcfe8" rx="1"/> <!-- skin -->
          <rect x="24" y="23" width="12" height="3" fill="#f59e0b"/> <!-- hair/cap -->
          <!-- Eyes -->
          <rect x="27" y="28" width="1.5" height="1.5" fill="#000"/>
          <rect x="31" y="28" width="1.5" height="1.5" fill="#000"/>
        </g>

        <!-- Warning sign if broken -->
        ${isBroken ? `
          <g style="transform: translate(22px, 2px);">
            <polygon points="8,0 16,14 0,14" fill="#ef4444" stroke="#7f1d1d" stroke-width="1"/>
            <text x="8" y="12" fill="#fff" font-family="var(--font-mono)" font-size="9px" font-weight="bold" text-anchor="middle">!</text>
          </g>
        ` : ''}
      </svg>
    `;
  }

  function renderConveyorBelt() {
    renderTraditionalWorkers();
    renderConveyorBeltFor('lean', 'conveyor-belt-lean');
  }

  function renderTraditionalWorkers() {
    const container = document.getElementById('conveyor-belt-traditional');
    if (!container) return;
    container.innerHTML = '';
    
    const simState = state.lean.traditional;
    const preset = leanScenarios[state.lean.activeScenario || 'garment'];
    
    simState.workers.forEach(worker => {
      const isBroken = state.lean.brokenStationId !== null && worker.id === 1;
      const row = document.createElement('div');
      row.className = 'traditional-worker-row';
      row.style.display = 'flex';
      row.style.alignItems = 'center';
      row.style.justifyContent = 'space-between';
      row.style.background = isBroken ? 'rgba(239, 68, 68, 0.05)' : 'rgba(255,255,255,0.02)';
      row.style.border = isBroken ? '1px dashed var(--color-rose)' : '1px solid var(--border-color)';
      row.style.borderRadius = '8px';
      row.style.padding = '0.4rem 1rem';
      row.style.height = '62px';
      row.style.boxSizing = 'border-box';
      row.style.marginBottom = '0.2rem';
      
      let queueHtml = '';
      for (let q = 0; q < worker.queue.length; q++) {
        queueHtml += `
          <div class="pixel-crate" style="width: 18px; height: 14px; margin-left: 2px; display: inline-block;">
            <svg width="18" height="14" viewBox="0 0 18 14">
              <rect x="1" y="1" width="16" height="12" fill="#d97706" stroke="#78350f" stroke-width="1"/>
              <line x1="1" y1="1" x2="17" y2="13" stroke="#78350f" stroke-width="1"/>
              <line x1="17" y1="1" x2="1" y2="13" stroke="#78350f" stroke-width="1"/>
              <rect x="3" y="3" width="12" height="8" fill="none" stroke="#b45309" stroke-width="1"/>
            </svg>
          </div>
        `;
      }
      if (worker.queue.length === 0) {
        queueHtml = '<span style="font-size: 0.75rem; color: var(--color-emerald);">ไม่มีคิว</span>';
      }
      
      let statusLabel = worker.currentBatch ? `กำลังผลิต ${preset.unit} (${preset.itemEmoji} × 5)...` : 'ว่าง';
      if (isBroken) {
        statusLabel = '<span style="color: var(--color-rose); font-weight: bold;" class="pixel-shaking">⚠️ เครื่องเสีย (Breakdown)</span>';
      }
      
      row.innerHTML = `
        <div style="display: flex; align-items: center; gap: 0.5rem; width: 140px;">
          <div style="width: 40px; height: 40px; transform: scale(0.8); transform-origin: left center;">
            ${getPixelWorkshopSvg('traditional', 0, worker.progress, !!worker.currentBatch, isBroken)}
          </div>
          <div>
            <div style="font-size: 0.75rem; font-weight: bold; color: var(--color-amber);">ช่างคนที่ ${worker.id}</div>
            <div style="font-size: 0.6rem; color: var(--text-secondary);">ทำครบทุกขั้นตอน</div>
          </div>
        </div>
        
        <div style="flex-grow: 1; margin: 0 1.5rem; position: relative;">
          <div style="display: flex; justify-content: space-between; font-size: 0.65rem; color: var(--text-secondary); margin-bottom: 0.15rem;">
            <span>${statusLabel}</span>
            <span>${worker.currentBatch && !isBroken ? `${Math.round(worker.progress)}%` : ''}</span>
          </div>
          <div style="width: 100%; height: 5px; background: rgba(255,255,255,0.05); border-radius: 2.5px; overflow: hidden;">
            <div style="width: ${worker.currentBatch && !isBroken ? worker.progress : 0}%; height: 100%; background: var(--color-amber); box-shadow: 0 0 6px var(--color-amber-glow); transition: width 0.1s linear;"></div>
          </div>
        </div>
        
        <div style="display: flex; align-items: center; gap: 0.3rem; width: 180px; justify-content: flex-end;">
          <span style="font-size: 0.65rem; color: var(--text-secondary); margin-right: 0.25rem;">คิวรอ (Batch):</span>
          <div style="display: flex; align-items: center; gap: 2px;">
            ${queueHtml}
          </div>
        </div>
      `;
      container.appendChild(row);
    });
  }

  function renderConveyorBeltFor(paradigm, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';
    
    const simState = state.lean[paradigm];
    const N = state.lean.stations.length;
    
    // Render stations
    simState.stations.forEach((station, index) => {
      const stationNode = document.createElement('div');
      stationNode.className = 'conveyor-station';
      stationNode.style.left = `${((index + 0.5) / N) * 100 - 4}%`;
      stationNode.style.display = 'flex';
      stationNode.style.flexDirection = 'column';
      stationNode.style.alignItems = 'center';
      stationNode.style.justifyContent = 'center';
      stationNode.style.height = '100%';
      
      let statusText = '';
      let subStationsHtml = '';
      
      if (paradigm === 'lean') {
        const isBroken = station.id === state.lean.brokenStationId;
        const hasBlocked = index < N - 1 && simState.buffers[index].length >= 2 && station.subStations.some(sub => sub.progress >= 100);
        const hasWorking = station.subStations.some(sub => sub.currentGarment && sub.progress < 100);
        
        if (isBroken) {
          statusText = '<span style="color: var(--color-rose); font-weight: bold; font-size: 0.65rem;" class="pixel-shaking">⚠️ เครื่องเสีย</span>';
        } else if (hasBlocked) {
          statusText = '<span style="color: var(--color-rose); font-weight: bold; font-size: 0.65rem;" class="pixel-shaking">🚨 โดนบล็อก</span>';
        } else if (hasWorking) {
          statusText = '<span style="color: var(--color-cyan); font-size: 0.65rem;">กำลังผลิต</span>';
        } else {
          statusText = '<span style="color: var(--text-secondary); font-size: 0.65rem;">รอวัตถุดิบ</span>';
        }
        
        // Render parallel sub-stations stacked vertically
        const opCount = station.subStations.length;
        const scale = opCount === 1 ? 0.8 : (opCount === 2 ? 0.62 : 0.48);
        const height = opCount === 1 ? 48 : (opCount === 2 ? 36 : 28);
        
        station.subStations.forEach(sub => {
          subStationsHtml += `
            <div style="height: ${height}px; width: 60px; display: flex; align-items: center; justify-content: center; transform: scale(${scale}); transform-origin: center center; margin: -2px 0;">
              ${getPixelWorkshopSvg(state.lean.activeScenario, index, sub.progress, !!sub.currentGarment, isBroken)}
            </div>
          `;
        });
      }
      
      // Draw the pixel workshop SVG
      stationNode.innerHTML = `
        <div class="conveyor-station-label" style="font-size: 0.7rem; font-weight: bold; margin-bottom: 2px;">ST${index + 1}: ${station.name.split(' ')[0]}</div>
        <div class="conveyor-stations-container" style="display: flex; flex-direction: column; align-items: center; justify-content: center; flex-grow: 1; min-height: 60px;">
          ${subStationsHtml}
        </div>
        <div class="conveyor-station-status" style="margin-top: 2px;">
          ${statusText}
        </div>
      `;
      container.appendChild(stationNode);
      
      // Buffers between stations
      if (index < N - 1) {
        const bufferLeft = (((index + 1) / N) * 100);
        const bufferDiv = document.createElement('div');
        bufferDiv.className = 'wip-buffer';
        bufferDiv.style.left = `${bufferLeft}%`;
        bufferDiv.style.transform = 'translateX(-50%)';
        
        const wipItemsCount = simState.buffers[index] ? simState.buffers[index].length : 0;
        
        if (wipItemsCount > 0) {
          bufferDiv.innerHTML = `<div class="wip-count-badge">WIP: ${wipItemsCount}</div>`;
          const visibleBlocks = Math.min(wipItemsCount, 5);
          for (let b = 0; b < visibleBlocks; b++) {
            const block = document.createElement('div');
            block.className = 'wip-item';
            
            if (paradigm === 'lean') {
              if (wipItemsCount >= 2) block.style.backgroundColor = 'var(--color-amber)';
              else block.style.backgroundColor = 'var(--color-cyan)';
            } else {
              if (wipItemsCount >= 4) {
                block.style.backgroundColor = 'var(--color-rose)';
                block.style.boxShadow = '0 0 6px var(--color-rose-glow)';
              } else if (wipItemsCount >= 2) {
                block.style.backgroundColor = 'var(--color-amber)';
              } else {
                block.style.backgroundColor = 'var(--color-cyan)';
              }
            }
            bufferDiv.appendChild(block);
          }
        }
        container.appendChild(bufferDiv);
      }
    });
    
    // Moving garments
    simState.movingGarments.forEach(g => {
      const garmentDiv = document.createElement('div');
      garmentDiv.className = 'moving-garment';
      garmentDiv.style.left = `${g.x}%`;
      const preset = leanScenarios[state.lean.activeScenario || 'garment'];
      garmentDiv.innerHTML = `<span style="font-size: 20px; filter: drop-shadow(0 0 4px var(--color-emerald-glow));">${preset.itemEmoji}</span>`;
      container.appendChild(garmentDiv);
    });
  }

  function updateLeanCharts() {
    const ctx = document.getElementById('balance-chart');
    if (!ctx) return;
    
    const labels = state.lean.stations.map((s, i) => `ST${i+1} (${s.name.split(' ')[0]})`);
    const effTimes = state.lean.stations.map(s => s.ctBase / s.operators);
    const totalWorkingSeconds = state.lean.workingHours * 3600;
    const taktTime = totalWorkingSeconds / state.lean.demand;
    const taktLineData = Array(state.lean.stations.length).fill(taktTime);
    
    const chartData = {
      labels: labels,
      datasets: [
        {
          label: 'Effective Cycle Time (เวลาทำงานจริง)',
          data: effTimes,
          backgroundColor: effTimes.map(t => t > taktTime ? 'rgba(239, 68, 68, 0.7)' : 'rgba(0, 242, 254, 0.6)'),
          borderColor: effTimes.map(t => t > taktTime ? 'rgba(239, 68, 68, 1)' : 'rgba(0, 242, 254, 1)'),
          borderWidth: 1.5,
          borderRadius: 8,
          barPercentage: 0.6
        },
        {
          label: 'Takt Time (เวลากำหนดโดยลูกค้า)',
          data: taktLineData,
          type: 'line',
          borderColor: '#ef4444',
          borderWidth: 2,
          borderDash: [6, 6],
          fill: false,
          pointRadius: 0,
          pointHoverRadius: 0
        }
      ]
    };
    
    const textColor = state.theme === 'dark' ? '#9ca3af' : '#4b5563';
    const gridColor = state.theme === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)';

    if (state.lean.chart) {
      state.lean.chart.data = chartData;
      state.lean.chart.update('none');
    } else {
      state.lean.chart = new Chart(ctx, {
        type: 'bar',
        data: chartData,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { labels: { color: textColor, font: { family: 'Inter' } } },
            tooltip: {
              callbacks: {
                label: context => ` ${context.dataset.label}: ${context.raw.toFixed(1)} วินาที`
              }
            }
          },
          scales: {
            x: { grid: { color: gridColor }, ticks: { color: textColor, font: { family: 'Inter' } } },
            y: {
              beginAtZero: true,
              grid: { color: gridColor },
              ticks: { color: textColor, font: { family: 'Inter' } },
              title: { display: true, text: 'วินาที (Seconds)', color: textColor }
            }
          }
        }
      });
    }
  }

  function updateLeanUI() {
    calculateLeanMetrics();
    renderStationControls();
    renderConveyorBelt();
    updateLeanCharts();
  }

  // Lean simulation loop
  function leanSimulationTick(timestamp) {
    if (!state.lean.isRunning || state.activePage !== 'lean') return;
    
    if (!state.lean.lastTickTime) {
      state.lean.lastTickTime = timestamp;
      requestAnimationFrame(leanSimulationTick);
      return;
    }
    
    const dt = (timestamp - state.lean.lastTickTime) / 1000;
    state.lean.lastTickTime = timestamp;
    const simDt = dt * state.lean.simulationSpeed;
    
    const N = state.lean.stations.length;
    const moveSpeed = (50 / N); // % per sim-second
    
    // --- 1. SIMULATE TRADITIONAL PARALLEL BATCH SYSTEM ---
    {
      const simState = state.lean.traditional;
      simState.elapsedSimTime += simDt;
      
      const totalOperators = state.lean.stations.reduce((sum, s) => sum + s.operators, 0);
      
      // Synchronize parallel workers count dynamically with Lean operator count
      if (simState.workers.length !== totalOperators) {
        if (simState.workers.length < totalOperators) {
          const diff = totalOperators - simState.workers.length;
          for (let d = 0; d < diff; d++) {
            simState.workers.push({
              id: simState.workers.length + 1,
              currentBatch: null,
              progress: 0,
              queue: []
            });
          }
        } else {
          // Put waiting queues of removed workers into the remaining workers
          const removed = simState.workers.slice(totalOperators);
          simState.workers = simState.workers.slice(0, totalOperators);
          
          removed.forEach(rw => {
            if (rw.currentBatch) {
              // Re-route active batch to worker 1
              simState.workers[0].queue.push(rw.currentBatch);
            }
            rw.queue.forEach(qb => {
              simState.workers[0].queue.push(qb);
            });
          });
        }
      }
      
      const W = simState.workers.length;
      let totalQueued = 0;
      simState.workers.forEach(w => totalQueued += w.queue.length);
      
      // Spawn new batches of 5 to keep workers busy
      if (totalQueued < W * 1.5) {
        const newBatch = {
          id: simState.garmentCounter++,
          spawnTime: simState.elapsedSimTime,
          items: 5
        };
        
        // Load balancing: route to the worker with the shortest queue
        let bestWorker = simState.workers[0];
        simState.workers.forEach(w => {
          if (w.queue.length < bestWorker.queue.length) {
            bestWorker = w;
          }
        });
        bestWorker.queue.push(newBatch);
      }
      
      // Calculate total work content for 1 item (sum of all 6 stations CT)
      let totalCt = 0;
      state.lean.stations.forEach(s => totalCt += s.ctBase);
      const wasteMultiplier = 1 + (state.lean.hiddenWaste / 100);
      const batchTime = 5 * totalCt * wasteMultiplier; // time to complete 5 items including setup/switching waste!
      
      // Process batches
      simState.workers.forEach(worker => {
        const isBroken = state.lean.brokenStationId !== null && worker.id === 1;
        
        if (!worker.currentBatch && worker.queue.length > 0 && !isBroken) {
          worker.currentBatch = worker.queue.shift();
          worker.progress = 0;
        }
        
        if (worker.currentBatch) {
          if (!isBroken) {
            worker.progress += (100 / batchTime) * simDt;
            if (worker.progress >= 100) {
              const lt = simState.elapsedSimTime - worker.currentBatch.spawnTime;
              simState.leadTimes.push(lt);
              if (simState.leadTimes.length > 50) simState.leadTimes.shift();
              simState.avgLeadTime = simState.leadTimes.reduce((a, b) => a + b, 0) / simState.leadTimes.length;
              
              simState.throughput += 5;
              worker.currentBatch = null;
              worker.progress = 0;
            }
          }
        }
      });
      
      // Calculate WIP
      let currentWip = 0;
      simState.workers.forEach(w => {
        if (w.currentBatch) currentWip += 5;
        currentWip += w.queue.length * 5;
      });
      simState.totalWip = currentWip;
    }
    
    // --- 2. SIMULATE LEAN SYSTEM ---
    {
      const simState = state.lean.lean;
      simState.elapsedSimTime += simDt;
      
      // Move garments
      for (let i = simState.movingGarments.length - 1; i >= 0; i--) {
        const g = simState.movingGarments[i];
        g.x += moveSpeed * simDt;
        const targetPct = ((g.targetStation + 0.5) / N) * 100;
        if (g.x >= targetPct) {
          if (g.targetStation === 0) {
            // Find an idle sub-station at ST1
            const idleSub = simState.stations[0].subStations.find(s => !s.currentGarment);
            if (idleSub) {
              idleSub.currentGarment = g;
              idleSub.progress = 0;
            }
          } else {
            simState.buffers[g.targetStation - 1].push(g);
          }
          simState.movingGarments.splice(i, 1);
        }
      }
      
      // Update stations and their parallel sub-stations
      for (let i = N - 1; i >= 0; i--) {
        const station = simState.stations[i];
        const targetOpCount = state.lean.stations[i].operators;
        const isBroken = station.id === state.lean.brokenStationId;
        
        // Synchronize parallel sub-stations dynamically
        if (!station.subStations) {
          station.subStations = [];
        }
        
        if (station.subStations.length !== targetOpCount) {
          if (station.subStations.length < targetOpCount) {
            const diff = targetOpCount - station.subStations.length;
            for (let d = 0; d < diff; d++) {
              station.subStations.push({ currentGarment: null, progress: 0 });
            }
          } else {
            // Put active garments of removed operators back to buffer or complete them
            const removed = station.subStations.slice(targetOpCount);
            station.subStations = station.subStations.slice(0, targetOpCount);
            removed.forEach(rw => {
              if (rw.currentGarment) {
                // Return to previous buffer
                if (i > 0) {
                  simState.buffers[i - 1].push(rw.currentGarment);
                }
              }
            });
          }
        }
        
        station.ctBase = state.lean.stations[i].ctBase;
        
        // Process each sub-station in parallel
        station.subStations.forEach(sub => {
          if (sub.currentGarment) {
            if (sub.progress < 100 && !isBroken) {
              sub.progress += (100 / station.ctBase) * simDt;
              if (sub.progress > 100) sub.progress = 100;
            }
            
            if (sub.progress >= 100) {
              if (i === N - 1) {
                const g = sub.currentGarment;
                const lt = simState.elapsedSimTime - g.spawnTime;
                simState.leadTimes.push(lt);
                if (simState.leadTimes.length > 50) simState.leadTimes.shift();
                simState.avgLeadTime = simState.leadTimes.reduce((a, b) => a + b, 0) / simState.leadTimes.length;
                
                simState.throughput++;
                sub.currentGarment = null;
                sub.progress = 0;
              } else {
                if (simState.buffers[i].length < 2) {
                  const g = sub.currentGarment;
                  g.x = ((i + 0.5) / N) * 100;
                  g.targetStation = i + 1;
                  simState.movingGarments.push(g);
                  
                  sub.currentGarment = null;
                  sub.progress = 0;
                }
              }
            }
          } else {
            // If idle, pull from previous buffer
            if (i > 0 && !isBroken) {
              const buffer = simState.buffers[i - 1];
              if (buffer.length > 0) {
                sub.currentGarment = buffer.shift();
                sub.progress = 0;
              }
            }
          }
        });
      }
      
      // Spawning for ST1
      const totalActiveST1 = simState.stations[0].subStations.filter(s => s.currentGarment).length;
      const garmentsMovingToST1 = simState.movingGarments.filter(g => g.targetStation === 0).length;
      if (totalActiveST1 < simState.stations[0].subStations.length && garmentsMovingToST1 === 0) {
        simState.movingGarments.push({
          id: simState.garmentCounter++,
          spawnTime: simState.elapsedSimTime,
          x: 0,
          targetStation: 0
        });
      }
      
      // Calculate WIP
      let currentWip = 0;
      simState.buffers.forEach(b => currentWip += b.length);
      simState.stations.forEach(s => {
        if (s.subStations) {
          s.subStations.forEach(sub => {
            if (sub.currentGarment) currentWip++;
          });
        }
      });
      currentWip += simState.movingGarments.length;
      simState.totalWip = currentWip;
    }
    
    // --- 3. UPDATE COMPARATIVE KPIS & SUMMARIES ---
    const tradSummary = document.getElementById('traditional-summary');
    const leanSummaryText = document.getElementById('lean-summary');
    
    const tradLtText = state.lean.traditional.avgLeadTime > 0 ? `${state.lean.traditional.avgLeadTime.toFixed(1)}s` : '---';
    const leanLtText = state.lean.lean.avgLeadTime > 0 ? `${state.lean.lean.avgLeadTime.toFixed(1)}s` : '---';
    
    if (tradSummary) {
      tradSummary.textContent = `WIP: ${state.lean.traditional.totalWip} ชิ้น | ผลผลิต: ${state.lean.traditional.throughput} ชิ้น | เวลานำเฉลี่ย: ${tradLtText}`;
    }
    if (leanSummaryText) {
      leanSummaryText.textContent = `WIP: ${state.lean.lean.totalWip} ชิ้น | ผลผลิต: ${state.lean.lean.throughput} ชิ้น | เวลานำเฉลี่ย: ${leanLtText}`;
    }
    
    if (kpiWipTrad) kpiWipTrad.textContent = `${state.lean.traditional.totalWip} ชิ้น`;
    if (kpiWipLean) kpiWipLean.textContent = `${state.lean.lean.totalWip} ชิ้น`;
    if (kpiTpTrad) kpiTpTrad.textContent = `${state.lean.traditional.throughput} ชิ้น`;
    if (kpiTpLean) kpiTpLean.textContent = `${state.lean.lean.throughput} ชิ้น`;
    if (kpiLtTrad) kpiLtTrad.textContent = tradLtText;
    if (kpiLtLean) kpiLtLean.textContent = leanLtText;
    
    renderConveyorBelt();
    requestAnimationFrame(leanSimulationTick);
  }

  // Play/Pause Lean
  btnPlayPause.addEventListener('click', () => {
    state.lean.isRunning = !state.lean.isRunning;
    if (state.lean.isRunning) {
      btnPlayPause.innerHTML = '<span>⏸️</span> หยุดจำลอง';
      btnPlayPause.classList.remove('btn-primary');
      btnPlayPause.classList.add('btn-danger');
      state.lean.lastTickTime = 0;
      requestAnimationFrame(leanSimulationTick);
    } else {
      btnPlayPause.innerHTML = '<span>▶️</span> เริ่มจำลอง';
      btnPlayPause.classList.remove('btn-danger');
      btnPlayPause.classList.add('btn-primary');
    }
  });
  
  btnReset.addEventListener('click', () => {
    state.lean.isRunning = false;
    state.lean.brokenStationId = null;
    
    const btnTriggerBreakdown = document.getElementById('btn-trigger-breakdown');
    if (btnTriggerBreakdown) {
      btnTriggerBreakdown.innerHTML = '<span>⚡</span> จำลองเครื่องเสีย (Breakdown)';
      btnTriggerBreakdown.classList.remove('btn-success');
      btnTriggerBreakdown.classList.add('btn-warning');
    }
    
    btnPlayPause.innerHTML = '<span>▶️</span> เริ่มจำลอง';
    btnPlayPause.classList.remove('btn-danger');
    btnPlayPause.classList.add('btn-primary');
    initLeanBuffers();
    updateLeanUI();
  });
  
  const btnTriggerBreakdown = document.getElementById('btn-trigger-breakdown');
  if (btnTriggerBreakdown) {
    btnTriggerBreakdown.addEventListener('click', () => {
      if (state.lean.brokenStationId === null) {
        // Trigger breakdown: select a random station (not first, not last)
        const stations = state.lean.stations;
        if (stations.length > 2) {
          const randomIdx = 1 + Math.floor(Math.random() * (stations.length - 2));
          state.lean.brokenStationId = stations[randomIdx].id;
        } else {
          state.lean.brokenStationId = stations[0].id;
        }
        
        btnTriggerBreakdown.innerHTML = '<span>🔧</span> ซ่อมแซมเครื่องจักร (Repair)';
        btnTriggerBreakdown.classList.remove('btn-warning');
        btnTriggerBreakdown.classList.add('btn-success');
      } else {
        // Repair
        state.lean.brokenStationId = null;
        btnTriggerBreakdown.innerHTML = '<span>⚡</span> จำลองเครื่องเสีย (Breakdown)';
        btnTriggerBreakdown.classList.remove('btn-success');
        btnTriggerBreakdown.classList.add('btn-warning');
      }
      updateLeanUI();
    });
  }
  
  speedBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      speedBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const speed = parseFloat(btn.getAttribute('data-speed'));
      state.lean.simulationSpeed = speed;
      if (simSpeedInput) simSpeedInput.value = speed;
    });
  });
  
  if (simSpeedInput) {
    simSpeedInput.addEventListener('input', e => {
      const speed = parseFloat(e.target.value) || 1;
      state.lean.simulationSpeed = speed;
      
      speedBtns.forEach(btn => {
        const btnSpeed = parseFloat(btn.getAttribute('data-speed'));
        if (btnSpeed === speed) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      });
    });
  }
  
  demandInput.addEventListener('input', e => {
    state.lean.demand = parseInt(e.target.value);
    demandVal.textContent = state.lean.demand + ' ชิ้น';
    updateLeanUI();
  });
  
  if (hiddenWasteInput) {
    hiddenWasteInput.addEventListener('input', e => {
      state.lean.hiddenWaste = parseInt(e.target.value);
      hiddenWasteVal.textContent = state.lean.hiddenWaste + '%';
      updateLeanUI();
    });
  }
  
  hoursInput.addEventListener('input', e => {
    state.lean.workingHours = parseFloat(e.target.value);
    hoursVal.textContent = state.lean.workingHours + ' ชม.';
    updateLeanUI();
  });
  
  btnAddStation.addEventListener('click', () => {
    const N = state.lean.stations.length;
    if (N < 8) {
      const names = [
        'รีดเตรียมผ้า (Fabric Ironing)',
        'เย็บปกเสื้อ (Collar Sewing)',
        'เย็บกระเป๋าเสื้อ (Pocket Sewing)',
        'ปักโลโก้ (Logo Embroidery)',
        'พับและแพ็คคู่ (Double Packaging)'
      ];
      let name = names[N % names.length];
      state.lean.stations.push({
        id: Date.now(),
        name: name,
        ctBase: 40 + Math.floor(Math.random() * 40),
        operators: 1,
        progress: 0,
        currentGarment: null
      });
      initLeanBuffers();
      updateLeanUI();
    } else {
      alert('จำลองสถานีได้สูงสุด 8 สถานีเพื่อการศึกษา');
    }
  });
  
  btnRemoveStation.addEventListener('click', () => {
    if (state.lean.stations.length > 3) {
      state.lean.stations.pop();
      initLeanBuffers();
      updateLeanUI();
    } else {
      alert('ต้องมีสถานีทำงานอย่างน้อย 3 สถานี');
    }
  });
  
  btnAutoBalance.addEventListener('click', () => {
    let totalOps = state.lean.stations.reduce((sum, s) => sum + s.operators, 0);
    const N = state.lean.stations.length;
    if (totalOps <= N) totalOps = N + 2;
    
    state.lean.stations.forEach(s => s.operators = 1);
    let remainingOps = totalOps - N;
    
    while (remainingOps > 0) {
      let maxCt = 0;
      let bottleneckStation = null;
      
      state.lean.stations.forEach(s => {
        const effCt = s.ctBase / s.operators;
        if (effCt > maxCt && s.operators < 5) {
          maxCt = effCt;
          bottleneckStation = s;
        }
      });
      
      if (bottleneckStation) {
        bottleneckStation.operators++;
        remainingOps--;
      } else {
        break;
      }
    }
    
    alert(`ระบบจัดสรรกำลังคนอัตโนมัติ (Line Balancing) สำเร็จ:\nจัดวางผู้ปฏิบัติงานรวม ${totalOps} คน เข้ายัง ${N} สถานีงาน`);
    updateLeanUI();
  });

  // --- LEAN PRESETS CONFIG ---
  const leanScenarios = {
    garment: {
      title: 'การปรับสมดุลสายการผลิตเสื้อผ้า',
      subtitle: 'การจำลองสถานการณ์และจัดสรรกำลังคนในสายการผลิตเพื่อขจัดความสูญเสีย (Lean Line Balancing & WIP Simulation)',
      unit: 'ชิ้น',
      itemEmoji: '👕',
      doneEmoji: '📦',
      stations: [
        { name: 'ตัดผ้า (Cutting)', ctBase: 40 },
        { name: 'เย็บตัวเสื้อ (Sewing Body)', ctBase: 90 },
        { name: 'เย็บแขนเสื้อ (Sewing Sleeves)', ctBase: 50 },
        { name: 'ประกอบร่าง (Assembly)', ctBase: 80 },
        { name: 'เย็บกระดุม/รีด (Finishing)', ctBase: 45 },
        { name: 'QC & แพ็คกิ้ง (QC & Pack)', ctBase: 35 }
      ]
    },
    bubbletea: {
      title: 'การปรับสมดุลไลน์บริการร้านชานมไข่มุก',
      subtitle: 'จำลองการรับออเดอร์ ปรุงชา เติมท็อปปิ้ง และส่งมอบชานมเพื่อลดเวลารอลูกค้า (Queue & Service Balancing)',
      unit: 'แก้ว',
      itemEmoji: '🧋',
      doneEmoji: '🛍️',
      stations: [
        { name: 'รับออเดอร์/คิดเงิน (Take Order)', ctBase: 25 },
        { name: 'ต้มชา/ตักน้ำแข็ง (Brew & Ice)', ctBase: 45 },
        { name: 'เติมท็อปปิ้ง/ไข่มุก (Add Toppings)', ctBase: 30 },
        { name: 'ซีลฝาแก้ว (Seal Lid)', ctBase: 20 },
        { name: 'ส่งมอบเครื่องดื่ม (Serve)', ctBase: 25 }
      ]
    },
    burger: {
      title: 'การปรับสมดุลสายการประกอบเบอร์เกอร์ฟาสต์ฟู้ด',
      subtitle: 'จำลองการปิ้งขนมปัง ย่างเนื้อ ใส่ผักห่อกระดาษ และ QC ในครัวร้านฟาสต์ฟู้ด (Food Prep Line Balancing)',
      unit: 'ชิ้น',
      itemEmoji: '🍔',
      doneEmoji: '🍟',
      stations: [
        { name: 'ปิ้งขนมปัง (Toast Buns)', ctBase: 20 },
        { name: 'ย่างเนื้อ/แพตตี้ (Grill Patty)', ctBase: 50 },
        { name: 'ใส่ผักและซอส (Add Veggies)', ctBase: 30 },
        { name: 'ประกอบห่อกระดาษ (Wrap)', ctBase: 25 },
        { name: 'QC & บรรจุถุง (Pack Bag)', ctBase: 20 }
      ]
    }
  };

  // Lean Scenario Selector Event Listener
  leanScenarioSelect.addEventListener('change', (e) => {
    state.lean.activeScenario = e.target.value;
    const preset = leanScenarios[e.target.value];
    
    // Update titles
    leanPageTitle.textContent = preset.title;
    leanPageSubtitle.textContent = preset.subtitle;
    
    // Update unit labels in KPIs
    document.querySelectorAll('#lean-page .kpi-unit').forEach(unit => {
      if (unit.textContent.includes('ชิ้น') || unit.textContent.includes('แก้ว')) {
        if (unit.textContent.includes('/ตัว') || unit.textContent.includes('/แก้ว') || unit.textContent.includes('/ชิ้น')) {
          unit.textContent = `วินาที/${preset.unit}`;
        } else {
          unit.textContent = preset.unit;
        }
      }
    });
    
    // Update stations in state
    state.lean.stations = preset.stations.map((s, idx) => ({
      id: idx + 1,
      name: s.name,
      ctBase: s.ctBase,
      operators: 1,
      progress: 0,
      currentGarment: null,
      batchGarments: [],
      finishedBatch: []
    }));
    
    // Reset buffer simulation
    initLeanBuffers();
    updateLeanUI();
  });



  // Page 2: AIoT Device Selector Event Listener
  aiotDeviceSelect.addEventListener('change', (e) => {
    state.aiot.activeDevice = e.target.value;
    
    // Toggle SVG casings
    document.getElementById('device-pump').style.display = e.target.value === 'pump' ? 'block' : 'none';
    document.getElementById('device-washer').style.display = e.target.value === 'washer' ? 'block' : 'none';
    document.getElementById('device-hvac').style.display = e.target.value === 'hvac' ? 'block' : 'none';
    
    // Update subtitles & labels
    if (e.target.value === 'washer') {
      aiotPageSubtitle.textContent = 'จำลองการสั่นสะเทือนของเครื่องซักผ้าหยอดเหรียญจากการจัดผ้าไม่สมดุลและการคาดการณ์โช้คอัพชำรุด';
      kpiHealth.previousElementSibling.textContent = 'สุขภาพเครื่องซักผ้า (Health Index)';
      document.getElementById('fault-unbalance').textContent = 'ผ้ากองข้างเดียว (Unbalance)';
      document.getElementById('fault-misalignment').textContent = 'แกนถังเบี้ยว (Tub Misalign)';
      document.getElementById('fault-bearing').textContent = 'ลูกปืนถังแตก (Bearing Fault)';
    } else if (e.target.value === 'hvac') {
      aiotPageSubtitle.textContent = 'จำลองการสั่นสะเทือนของพัดลมคอยล์เย็นเครื่องปรับอากาศจากการสะสมของฝุ่นและใบพัดบิ่น';
      kpiHealth.previousElementSibling.textContent = 'สุขภาพพัดลมแอร์ (Health Index)';
      document.getElementById('fault-unbalance').textContent = 'ใบพัดฝุ่นเกาะ (Unbalance)';
      document.getElementById('fault-misalignment').textContent = 'เพลาพัดลมคด (Shaft Misalign)';
      document.getElementById('fault-bearing').textContent = 'ตลับลูกปืนฝืด (Bearing Fault)';
    } else {
      aiotPageSubtitle.textContent = 'จำลองการสั่นสะเทือนมอเตอร์ปั๊มน้ำอุตสาหกรรมเพื่อวิเคราะห์และคาดการณ์ความเสียหายล่วงหน้า';
      kpiHealth.previousElementSibling.textContent = 'สุขภาพปั๊มน้ำ (Health Index)';
      document.getElementById('fault-unbalance').textContent = 'แกนไม่สมดุล (Unbalance)';
      document.getElementById('fault-misalignment').textContent = 'เพลาเยื้องศูนย์ (Misalign)';
      document.getElementById('fault-bearing').textContent = 'ลูกปืนเสื่อม (Bearing)';
    }
    
    document.getElementById('fault-normal').click(); // Reset to normal
  });

  // Page 3: Metaheuristic Scenario Selector Event Listener
  const metaScenarioSelect = document.getElementById('meta-scenario-select');
  const metaPageTitle = document.getElementById('meta-page-title');
  const metaPageSubtitle = document.getElementById('meta-page-subtitle');

  metaScenarioSelect.addEventListener('change', (e) => {
    state.meta.activeScenario = e.target.value;
    
    if (e.target.value === 'food') {
      metaPageSubtitle.textContent = 'จำลองการค้นหาเส้นทางของไรเดอร์ส่งอาหารจากครัวกลางไปยังคอนโดลูกค้าหลายๆ แห่ง';
    } else if (e.target.value === 'garbage') {
      metaPageSubtitle.textContent = 'จำลองการจัดเส้นทางของรถเก็บขยะ กทม. เพื่อแวะเก็บขยะในแต่ละชุมชนให้ประหยัดน้ำมันสูงสุด';
    } else {
      metaPageSubtitle.textContent = 'จำลองการจัดเส้นทางขนส่งพัสดุด่วนของรถจัดส่งในเขตกรุงเทพฯ และปริมณฑล';
    }
    
    resetMetaheuristic();
    renderMetaExplanation();
  });

  // ==========================================
  // PAGE 2: AIoT MOTOR DIGITAL TWIN
  // ==========================================
  function startAiotLoop() {
    if (state.aiot.animationFrameId) return;
    state.aiot.lastMqttSend = Date.now();
    
    function loop(timestamp) {
      state.aiot.timeOffset += 0.05;
      updateMotorAnimation();
      drawTimeDomainWave();
      drawFrequencyDomainFFT();
      simulateMqttPublish();
      state.aiot.animationFrameId = requestAnimationFrame(loop);
    }
    state.aiot.animationFrameId = requestAnimationFrame(loop);
  }
  
  function stopAiotLoop() {
    if (state.aiot.animationFrameId) {
      cancelAnimationFrame(state.aiot.animationFrameId);
      state.aiot.animationFrameId = null;
    }
  }

  function updateMotorAnimation() {
    const rpm = state.aiot.rpm;
    const vib = state.aiot.vibration;
    const temp = state.aiot.temperature;
    
    if (rpm > 0) {
      motorRotor.style.animationPlayState = 'running';
      motorRotor.style.animationDuration = `${60 / rpm}s`;
    } else {
      motorRotor.style.animationPlayState = 'paused';
    }
    
    if (vib > 0.5) {
      motorElement.classList.add('motor-shake');
      const shakeAmp = Math.min(vib / 4, 3.5);
      motorElement.style.setProperty('--shake-amp-x', `${shakeAmp}px`);
      motorElement.style.setProperty('--shake-amp-y', `${shakeAmp * 1.2}px`);
      motorElement.style.animationDuration = `${Math.max(0.04, 0.45 - (vib * 0.03))}s`;
    } else {
      motorElement.classList.remove('motor-shake');
      motorElement.style.transform = 'none';
    }
    
    const tempPct = Math.max(0, Math.min((temp - 40) / 60, 0.9));
    heatOverlay.style.opacity = tempPct;
    
    updateAiDiagnostics(rpm, vib, temp);
  }

  function updateAiDiagnostics(rpm, vib, temp) {
    let health = 100;
    let probFailure = 0;
    let rul = 5000;
    let faultText = 'ปกติ (Normal)';
    
    let vibImpact = 0;
    if (vib > 7.1) vibImpact = (vib - 7.1) * 8 + 35;
    else if (vib > 4.5) vibImpact = (vib - 4.5) * 6 + 15;
    else if (vib > 1.8) vibImpact = (vib - 1.8) * 3 + 2;
    
    let tempImpact = 0;
    if (temp > 85) tempImpact = (temp - 85) * 2.5 + 25;
    else if (temp > 65) tempImpact = (temp - 65) * 1.0 + 5;
    
    health = Math.max(0, 100 - (vibImpact + tempImpact));
    probFailure = Math.max(0, Math.min(100, (100 - health) * 1.15));
    
    if (health > 90) {
      rul = Math.round(4000 + (health - 90) * 100);
    } else {
      rul = Math.round(Math.max(12, 4000 * Math.pow(health / 100, 3.5)));
    }
    
    if (vib > 4.5 || temp > 75) {
      if (state.aiot.faultMode === 'normal') {
        if (temp > 80 && vib < 5) state.aiot.faultMode = 'bearing';
        else if (vib > 6) state.aiot.faultMode = Math.random() > 0.5 ? 'unbalance' : 'misalignment';
      }
    } else {
      state.aiot.faultMode = 'normal';
    }
    
    switch (state.aiot.faultMode) {
      case 'unbalance': faultText = '❌ ความไม่สมดุลของโรเตอร์ (Unbalance)'; break;
      case 'misalignment': faultText = '❌ เพลาเยื้องศูนย์ (Shaft Misalignment)'; break;
      case 'bearing': faultText = '❌ ตลับลูกปืนชำรุด (Bearing Fault)'; break;
      default: faultText = '✅ ปกติ (Normal)';
    }
    
    kpiHealth.textContent = Math.round(health) + '%';
    kpiProb.textContent = Math.round(probFailure) + '%';
    kpiRul.textContent = rul + ' ชม.';
    kpiFault.textContent = faultText;
    
    setAiotKpiColors(health, probFailure);
    
    if (health < 60) {
      triggerAiotAlert(true, faultText, vib, temp);
    } else {
      triggerAiotAlert(false);
    }
    updateFaultButtonsUI();
  }

  function setAiotKpiColors(health, prob) {
    if (health >= 85) {
      kpiHealth.parentElement.style.setProperty('--kpi-color', 'var(--color-emerald)');
      kpiHealth.style.color = 'var(--color-emerald)';
    } else if (health >= 60) {
      kpiHealth.parentElement.style.setProperty('--kpi-color', 'var(--color-amber)');
      kpiHealth.style.color = 'var(--color-amber)';
    } else {
      kpiHealth.parentElement.style.setProperty('--kpi-color', 'var(--color-rose)');
      kpiHealth.style.color = 'var(--color-rose)';
    }
    
    if (prob > 50) kpiProb.style.color = 'var(--color-rose)';
    else if (prob > 20) kpiProb.style.color = 'var(--color-amber)';
    else kpiProb.style.color = 'var(--color-emerald)';
  }

  function triggerAiotAlert(active, faultModeName = '', vib = 0, temp = 0) {
    if (active) {
      state.aiot.isAlertActive = true;
      alertBanner.classList.add('active');
      alertTitle.innerHTML = `🚨 แจ้งเตือนความเสียหายล่วงหน้า (Predictive Maintenance Alert)`;
      alertDesc.innerHTML = `ตรวจพบความผิดปกติ: <strong>${faultModeName}</strong><br>
        ความสั่นสะเทือน: <span style="color:var(--color-rose)">${vib.toFixed(2)} mm/s RMS</span> | 
        อุณหภูมิ: <span style="color:var(--color-rose)">${temp.toFixed(1)} °C</span><br>
        <span style="font-size:0.8rem; opacity:0.8;">*ระบบ AI คาดการณ์ว่าตลับลูกปืนจะชำรุดเสียหายในอีกไม่ช้า กรุณาวางแผนเข้าบำรุงรักษาเครื่องจักร*</span>`;
    } else {
      state.aiot.isAlertActive = false;
      alertBanner.classList.remove('active');
    }
  }

  function drawTimeDomainWave() {
    const ctx = timeCanvas.getContext('2d');
    const w = timeCanvas.width;
    const h = timeCanvas.height;
    ctx.clearRect(0, 0, w, h);
    
    ctx.strokeStyle = state.theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 40) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
    ctx.beginPath(); ctx.moveTo(0, h/2); ctx.lineTo(w, h/2); ctx.stroke();
    
    ctx.strokeStyle = state.aiot.isAlertActive ? '#ef4444' : '#00f2fe';
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    const rpm = state.aiot.rpm;
    const vib = state.aiot.vibration;
    const mode = state.aiot.faultMode;
    const f1 = (rpm / 60) * 0.01;
    
    for (let x = 0; x < w; x++) {
      const t = x + state.aiot.timeOffset * 15;
      let y = h / 2;
      let noise = (Math.sin(t * 0.7) + Math.cos(t * 1.3) + Math.sin(t * 2.5)) * 0.08 * vib;
      let signal = 0;
      
      if (mode === 'unbalance') {
        signal = Math.sin(t * f1) * vib * 4.5;
      } else if (mode === 'misalignment') {
        signal = (Math.sin(t * f1) * 3 + Math.sin(t * 2 * f1) * 3) * (vib / 2) * 1.5;
      } else if (mode === 'bearing') {
        const period = 80;
        const phase = t % period;
        const impact = Math.exp(-phase * 0.1) * Math.sin(phase * 0.8) * vib * 6;
        signal = impact + Math.sin(t * f1) * vib * 1.5;
      } else {
        signal = Math.sin(t * f1) * vib * 3;
      }
      
      y += signal + (noise * 10);
      y = Math.max(5, Math.min(h - 5, y));
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  function drawFrequencyDomainFFT() {
    const ctx = freqCanvas.getContext('2d');
    const w = freqCanvas.width;
    const h = freqCanvas.height;
    ctx.clearRect(0, 0, w, h);
    
    ctx.strokeStyle = state.theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 50) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
    for (let y = 0; y < h; y += 30) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }
    
    const mode = state.aiot.faultMode;
    const vib = state.aiot.vibration;
    
    const f1X = 100;
    const f2X = 200;
    const fBearingX = 380;
    
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    for (let x = 0; x < w; x++) {
      let noiseFloor = 5 + Math.random() * 4 + (vib * 0.5);
      let p1 = 0;
      let p2 = 0;
      let pBearing = 0;
      
      const dist1 = Math.abs(x - f1X);
      const h1 = mode === 'unbalance' ? (vib * 12) : (vib * 4);
      p1 = h1 * Math.exp(-Math.pow(dist1 / 5, 2));
      
      const dist2 = Math.abs(x - f2X);
      const h2 = mode === 'misalignment' ? (vib * 10) : (vib * 1.2);
      p2 = h2 * Math.exp(-Math.pow(dist2 / 5, 2));
      
      if (mode === 'bearing') {
        const distB1 = Math.abs(x - fBearingX);
        const distB2 = Math.abs(x - (fBearingX + 40));
        pBearing = (vib * 6) * Math.exp(-Math.pow(distB1 / 15, 2)) + 
                   (vib * 4) * Math.exp(-Math.pow(distB2 / 10, 2));
      }
      
      let amp = noiseFloor + p1 + p2 + pBearing;
      let y = h - amp;
      y = Math.max(5, Math.min(h - 5, y));
      
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    
    ctx.fillStyle = state.theme === 'dark' ? '#9ca3af' : '#4b5563';
    ctx.font = '9px Orbitron';
    ctx.fillText('1X (RPM)', f1X - 20, h - 5);
    ctx.fillText('2X (RPM)', f2X - 20, h - 5);
    
    // Draw Peak Annotations to help students understand what the wiggles mean!
    ctx.textAlign = 'center';
    ctx.font = 'bold 9.5px Inter';
    if (mode === 'unbalance') {
      ctx.fillStyle = '#ef4444';
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 1.5;
      
      // Draw arrow
      ctx.beginPath();
      ctx.moveTo(f1X, 25);
      ctx.lineTo(f1X, 48);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(f1X - 4, 43);
      ctx.lineTo(f1X, 48);
      ctx.lineTo(f1X + 4, 43);
      ctx.stroke();
      
      ctx.fillText('🚨 1X Peak (แกนหมุนไม่สมดุล)', f1X, 16);
    } else if (mode === 'misalignment') {
      ctx.fillStyle = '#ef4444';
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 1.5;
      
      // Draw arrow at 2X
      ctx.beginPath();
      ctx.moveTo(f2X, 30);
      ctx.lineTo(f2X, 50);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(f2X - 4, 45);
      ctx.lineTo(f2X, 50);
      ctx.lineTo(f2X + 4, 45);
      ctx.stroke();
      
      ctx.fillText('🚨 2X Peak (เพลาเบี้ยว/เยื้องศูนย์)', f2X, 21);
    } else if (mode === 'bearing') {
      // Draw shaded area
      ctx.fillStyle = 'rgba(239, 68, 68, 0.08)';
      ctx.fillRect(fBearingX - 35, 20, 75, h - 45);
      
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
      ctx.setLineDash([3, 3]);
      ctx.strokeRect(fBearingX - 35, 20, 75, h - 45);
      ctx.setLineDash([]);
      
      ctx.fillStyle = '#ef4444';
      ctx.fillText('🚨 High-Freq Band (ลูกปืนแตก/เสื่อม)', fBearingX + 2, 15);
    }
  }

  function simulateMqttPublish() {
    const now = Date.now();
    if (now - state.aiot.lastMqttSend < 1500) return;
    state.aiot.lastMqttSend = now;
    
    const rpm = state.aiot.rpm;
    const vib = state.aiot.vibration;
    const temp = state.aiot.temperature;
    let status = 'OK';
    
    if (vib > 7.1 || temp > 85) status = 'CRITICAL';
    else if (vib > 4.5 || temp > 65) status = 'WARNING';
    
    const timestamp = new Date().toLocaleTimeString();
    const payload = {
      device_id: "motor_twin_01",
      metrics: { speed_rpm: rpm, vibration_rms_mms: parseFloat(vib.toFixed(2)), bearing_temp_c: parseFloat(temp.toFixed(1)) },
      ai_diagnostic: {
        health_index_pct: parseInt(kpiHealth.textContent),
        failure_probability_pct: parseInt(kpiProb.textContent),
        predicted_fault: kpiFault.textContent.replace(/[✅❌]/g, '').trim(),
        status: status
      }
    };
    
    const logLine = document.createElement('div');
    logLine.className = 'terminal-line';
    logLine.innerHTML = `
      <span class="terminal-timestamp">[${timestamp}]</span>
      <span class="terminal-topic">MQTT: pub/telemetry/motor_01</span> -> 
      <span class="terminal-payload">${JSON.stringify(payload)}</span>
    `;
    terminalConsole.appendChild(logLine);
    terminalConsole.scrollTop = terminalConsole.scrollHeight;
    
    while (terminalConsole.children.length > state.aiot.maxLogs) {
      terminalConsole.removeChild(terminalConsole.firstChild);
    }
  }

  rpmInput.addEventListener('input', e => {
    state.aiot.rpm = parseInt(e.target.value);
    rpmVal.textContent = state.aiot.rpm + ' RPM';
  });
  vibrationInput.addEventListener('input', e => {
    state.aiot.vibration = parseFloat(e.target.value);
    vibrationVal.textContent = state.aiot.vibration.toFixed(1) + ' mm/s';
  });
  tempInput.addEventListener('input', e => {
    state.aiot.temperature = parseInt(e.target.value);
    tempVal.textContent = state.aiot.temperature + ' °C';
  });
  
  function updateFaultButtonsUI() {
    const normalBtn = document.getElementById('fault-normal');
    const unbalanceBtn = document.getElementById('fault-unbalance');
    const misalignmentBtn = document.getElementById('fault-misalignment');
    const bearingBtn = document.getElementById('fault-bearing');
    
    if (!normalBtn || !unbalanceBtn || !misalignmentBtn || !bearingBtn) return;
    
    if (state.aiot.faultMode === 'normal') {
      normalBtn.className = 'btn btn-primary';
      unbalanceBtn.className = 'btn btn-danger';
      misalignmentBtn.className = 'btn btn-danger';
      bearingBtn.className = 'btn btn-danger';
    } else {
      normalBtn.className = 'btn'; // outline cyan
      unbalanceBtn.className = state.aiot.faultMode === 'unbalance' ? 'btn btn-danger active' : 'btn btn-danger';
      misalignmentBtn.className = state.aiot.faultMode === 'misalignment' ? 'btn btn-danger active' : 'btn btn-danger';
      bearingBtn.className = state.aiot.faultMode === 'bearing' ? 'btn btn-danger active' : 'btn btn-danger';
    }
  }

  document.getElementById('fault-normal').addEventListener('click', () => {
    state.aiot.faultMode = 'normal';
    state.aiot.vibration = 1.8 + Math.random() * 0.6;
    state.aiot.temperature = 42 + Math.floor(Math.random() * 5);
    vibrationInput.value = state.aiot.vibration;
    vibrationVal.textContent = state.aiot.vibration.toFixed(1) + ' mm/s';
    tempInput.value = state.aiot.temperature;
    tempVal.textContent = state.aiot.temperature + ' °C';
    updateFaultButtonsUI();
  });
  document.getElementById('fault-unbalance').addEventListener('click', () => {
    state.aiot.faultMode = 'unbalance';
    state.aiot.vibration = 7.5 + Math.random() * 2;
    state.aiot.temperature = 52 + Math.floor(Math.random() * 6);
    vibrationInput.value = state.aiot.vibration;
    vibrationVal.textContent = state.aiot.vibration.toFixed(1) + ' mm/s';
    tempInput.value = state.aiot.temperature;
    tempVal.textContent = state.aiot.temperature + ' °C';
    updateFaultButtonsUI();
  });
  document.getElementById('fault-misalignment').addEventListener('click', () => {
    state.aiot.faultMode = 'misalignment';
    state.aiot.vibration = 6.2 + Math.random() * 1.5;
    state.aiot.temperature = 58 + Math.floor(Math.random() * 5);
    vibrationInput.value = state.aiot.vibration;
    vibrationVal.textContent = state.aiot.vibration.toFixed(1) + ' mm/s';
    tempInput.value = state.aiot.temperature;
    tempVal.textContent = state.aiot.temperature + ' °C';
    updateFaultButtonsUI();
  });
  document.getElementById('fault-bearing').addEventListener('click', () => {
    state.aiot.faultMode = 'bearing';
    state.aiot.vibration = 8.8 + Math.random() * 3;
    state.aiot.temperature = 88 + Math.floor(Math.random() * 8);
    vibrationInput.value = state.aiot.vibration;
    vibrationVal.textContent = state.aiot.vibration.toFixed(1) + ' mm/s';
    tempInput.value = state.aiot.temperature;
    tempVal.textContent = state.aiot.temperature + ' °C';
    updateFaultButtonsUI();
  });

  // ==========================================
  // PAGE 3: METAHEURISTIC OPTIMIZATION LAB
  // ==========================================
  function initTspProblem() {
    if (state.meta.cities.length === state.meta.numCities) return; 
    
    state.meta.cities = [];
    const w = tspCanvas.width;
    const h = tspCanvas.height;
    const margin = 40;
    
    state.meta.cities.push({ x: w / 2, y: h / 2, isDepot: true });
    
    for (let i = 1; i < state.meta.numCities; i++) {
      state.meta.cities.push({
        x: margin + Math.random() * (w - 2 * margin),
        y: margin + Math.random() * (h - 2 * margin),
        isDepot: false
      });
    }
    
    resetMetaheuristic();
  }

  function clusterCities() {
    const M = state.meta.numVehicles;
    const cities = state.meta.cities;
    const N = cities.length;
    if (M <= 1 || N <= M) {
      cities.forEach(c => c.clusterId = 0);
      return;
    }
    
    const clients = cities.filter(c => !c.isDepot);
    let centroids = [];
    let tempClients = [...clients];
    for (let i = 0; i < M; i++) {
      if (tempClients.length === 0) break;
      let idx = Math.floor(Math.random() * tempClients.length);
      centroids.push({ x: tempClients[idx].x, y: tempClients[idx].y });
      tempClients.splice(idx, 1);
    }
    
    for (let iter = 0; iter < 10; iter++) {
      clients.forEach(c => {
        let minDist = Infinity;
        let bestCluster = 0;
        centroids.forEach((cent, cIdx) => {
          let d = Math.hypot(c.x - cent.x, c.y - cent.y);
          if (d < minDist) {
            minDist = d;
            bestCluster = cIdx;
          }
        });
        c.clusterId = bestCluster;
      });
      
      for (let cIdx = 0; cIdx < M; cIdx++) {
        let clusterClients = clients.filter(c => c.clusterId === cIdx);
        if (clusterClients.length > 0) {
          let sumX = 0, sumY = 0;
          clusterClients.forEach(c => { sumX += c.x; sumY += c.y; });
          centroids[cIdx] = { x: sumX / clusterClients.length, y: sumY / clusterClients.length };
        }
      }
    }
  }

  function resetMetaheuristic() {
    state.meta.iteration = 0;
    state.meta.bestDistance = 0;
    state.meta.history = [];
    
    clusterCities();
    
    const M = state.meta.numVehicles;
    state.meta.subProblems = [];
    
    for (let v = 0; v < M; v++) {
      let cityIndices = [];
      state.meta.cities.forEach((c, idx) => {
        if (idx > 0 && c.clusterId === v) {
          cityIndices.push(idx);
        }
      });
      
      let path = [0, ...cityIndices];
      
      const sub = {
        vehicleId: v,
        cityIndices: [0, ...cityIndices],
        bestPath: [...path],
        bestDistance: getSubPathDistance(path),
        sa: {
          temp: 120.0,
          currentPath: [...path],
          currentDist: getSubPathDistance(path)
        },
        ga: { population: [] },
        aco: { pheromones: Array(cityIndices.length + 1).fill(0).map(() => Array(cityIndices.length + 1).fill(1.0)) },
        pso: { particles: [] }
      };
      
      for (let p = 0; p < state.meta.ga.popSize; p++) sub.ga.population.push(shufflePathWithoutDepot(path));
      for (let p = 0; p < state.meta.pso.numParticles; p++) {
        let pPath = shufflePathWithoutDepot(path);
        sub.pso.particles.push({ position: pPath, bestPosition: [...pPath], bestDist: getSubPathDistance(pPath) });
      }
      
      state.meta.subProblems.push(sub);
      state.meta.bestDistance += sub.bestDistance;
    }
    
    drawTspMap();
    updateMetaCharts();
    kpiMetaDistance.innerHTML = `${state.meta.bestDistance.toFixed(1)}<span class="kpi-unit">กม.</span>`;
    kpiMetaIteration.textContent = '0';
  }

  function shufflePathWithoutDepot(path) {
    let sub = path.slice(1);
    shuffleArray(sub);
    return [0, ...sub];
  }

  function decodeCvrpPath(path) {
    if (!path || path.length === 0) return [];
    if (!state.meta.capacityEnable) return path;
    
    const cap = state.meta.capacityLimit;
    const decoded = [0];
    let currentLoad = 0;
    
    const clients = path.slice(1).filter(idx => idx !== 0);
    clients.forEach(cIdx => {
      if (currentLoad === cap) {
        decoded.push(0);
        currentLoad = 0;
      }
      decoded.push(cIdx);
      currentLoad++;
    });
    
    if (decoded[decoded.length - 1] !== 0) {
      decoded.push(0);
    }
    return decoded;
  }

  function getSubPathDistance(path) {
    if (!path || path.length <= 1) return 0;
    
    const actualPath = decodeCvrpPath(path);
    let dist = 0;
    for (let i = 0; i < actualPath.length - 1; i++) {
      dist += getDistance(state.meta.cities[actualPath[i]], state.meta.cities[actualPath[i+1]]);
    }
    return dist;
  }

  function getDistance(c1, c2) {
    return Math.sqrt((c1.x - c2.x)**2 + (c1.y - c2.y)**2);
  }

  function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  // --- SOLVER ITERATION LOGICS ---
  
  function solveSaStep() {
    state.meta.bestDistance = 0;
    const coolingRate = state.meta.sa.coolingRate;
    
    state.meta.subProblems.forEach(sub => {
      if (sub.cityIndices.length <= 2) {
        state.meta.bestDistance += sub.bestDistance;
        return;
      }
      
      let sa = sub.sa;
      if (sa.temp < 0.1) {
        state.meta.bestDistance += sub.bestDistance;
        return;
      }
      
      const N = sub.cityIndices.length;
      let i = 1 + Math.floor(Math.random() * (N - 2));
      let j = i + 1 + Math.floor(Math.random() * (N - i - 1));
      
      let nextPath = [...sa.currentPath];
      let subArr = nextPath.slice(i, j + 1).reverse();
      nextPath.splice(i, subArr.length, ...subArr);
      
      let nextDist = getSubPathDistance(nextPath);
      let delta = nextDist - sa.currentDist;
      
      if (delta < 0 || Math.random() < Math.exp(-delta / sa.temp)) {
        sa.currentPath = nextPath;
        sa.currentDist = nextDist;
        
        if (nextDist < sub.bestDistance) {
          sub.bestDistance = nextDist;
          sub.bestPath = [...nextPath];
        }
      }
      
      sa.temp *= coolingRate;
      state.meta.bestDistance += sub.bestDistance;
    });
    
    state.meta.iteration++;
  }

  function solveGaStep() {
    state.meta.bestDistance = 0;
    const mutateRate = state.meta.ga.mutationRate;
    
    state.meta.subProblems.forEach(sub => {
      if (sub.cityIndices.length <= 2) {
        state.meta.bestDistance += sub.bestDistance;
        return;
      }
      
      let pop = sub.ga.population;
      let fitness = pop.map(path => 1 / (getSubPathDistance(path) || 1));
      
      let bestIdx = 0;
      let maxFit = 0;
      fitness.forEach((fit, idx) => {
        if (fit > maxFit) {
          maxFit = fit;
          bestIdx = idx;
        }
      });
      
      const currentBestPath = pop[bestIdx];
      const currentBestDist = getSubPathDistance(currentBestPath);
      if (currentBestDist < sub.bestDistance) {
        sub.bestDistance = currentBestDist;
        sub.bestPath = [...currentBestPath];
      }
      
      let nextPop = [];
      nextPop.push([...sub.bestPath]); // Elitism
      
      while (nextPop.length < state.meta.ga.popSize) {
        let p1 = selectTournament(pop, fitness);
        let p2 = selectTournament(pop, fitness);
        
        let child = crossoverOX(p1, p2);
        
        if (Math.random() < mutateRate) {
          mutateSwap(child);
        }
        nextPop.push(child);
      }
      
      sub.ga.population = nextPop;
      state.meta.bestDistance += sub.bestDistance;
    });
    
    state.meta.iteration++;
  }

  function selectTournament(pop, fitness) {
    const k = 3;
    let best = null;
    let bestFit = -1;
    for (let i = 0; i < k; i++) {
      let idx = Math.floor(Math.random() * pop.length);
      if (fitness[idx] > bestFit) {
        bestFit = fitness[idx];
        best = pop[idx];
      }
    }
    return best;
  }

  function crossoverOX(p1, p2) {
    const N = p1.length;
    let child = Array(N).fill(-1);
    child[0] = 0; // Depot
    
    if (N <= 2) return [...p1];
    
    let start = 1 + Math.floor(Math.random() * (N - 2));
    let end = start + Math.floor(Math.random() * (N - start - 1));
    
    for (let i = start; i <= end; i++) {
      child[i] = p1[i];
    }
    
    let p2Idx = 1;
    for (let i = 1; i < N; i++) {
      if (child[i] === -1) {
        while (child.includes(p2[p2Idx])) {
          p2Idx++;
        }
        child[i] = p2[p2Idx++];
      }
    }
    return child;
  }

  function mutateSwap(path) {
    const N = path.length;
    if (N <= 2) return;
    let i = 1 + Math.floor(Math.random() * (N - 1));
    let j = 1 + Math.floor(Math.random() * (N - 1));
    [path[i], path[j]] = [path[j], path[i]];
  }

  // 3. Ant Colony Optimization Step per Subproblem
  function solveAcoStep() {
    state.meta.bestDistance = 0;
    state.meta.subProblems.forEach(sub => {
      if (sub.cityIndices.length <= 2) {
        state.meta.bestDistance += sub.bestDistance;
        return;
      }
      
      solveAcoSubStep(sub);
      state.meta.bestDistance += sub.bestDistance;
    });
    state.meta.iteration++;
  }

  function solveAcoSubStep(sub) {
    const N = sub.cityIndices.length;
    let aco = state.meta.aco;
    let antTours = [];
    let antDistances = [];
    
    for (let a = 0; a < aco.numAnts; a++) {
      let tour = [0];
      let visited = new Set([0]);
      
      while (tour.length < N) {
        let currentLocal = tour[tour.length - 1];
        let nextLocal = chooseNextCityAcoLocal(sub, currentLocal, visited);
        tour.push(nextLocal);
        visited.add(nextLocal);
      }
      
      let globalTour = tour.map(localIdx => sub.cityIndices[localIdx]);
      antTours.push(tour);
      antDistances.push(getSubPathDistance(globalTour));
    }
    
    let bestIdx = 0;
    let minD = Infinity;
    antDistances.forEach((d, idx) => {
      if (d < minD) {
        minD = d;
        bestIdx = idx;
      }
    });
    
    if (minD < sub.bestDistance) {
      sub.bestDistance = minD;
      sub.bestPath = antTours[bestIdx].map(localIdx => sub.cityIndices[localIdx]);
    }
    
    // Evaporate pheromones locally
    for (let i = 0; i < N; i++) {
      for (let j = 0; j < N; j++) {
        sub.aco.pheromones[i][j] *= (1 - aco.evaporation);
        if (sub.aco.pheromones[i][j] < 0.1) sub.aco.pheromones[i][j] = 0.1;
      }
    }
    
    // Deposit pheromones locally
    for (let a = 0; a < aco.numAnts; a++) {
      let tour = antTours[a];
      let d = antDistances[a];
      let delta = 100 / (d || 1);
      
      for (let i = 0; i < N - 1; i++) {
        sub.aco.pheromones[tour[i]][tour[i+1]] += delta;
        sub.aco.pheromones[tour[i+1]][tour[i]] += delta;
      }
      sub.aco.pheromones[tour[N-1]][tour[0]] += delta;
      sub.aco.pheromones[tour[0]][tour[N-1]] += delta;
    }
  }

  function chooseNextCityAcoLocal(sub, currentLocal, visited) {
    const N = sub.cityIndices.length;
    let aco = state.meta.aco;
    let probs = [];
    let sum = 0;
    
    const currentGlobal = sub.cityIndices[currentLocal];
    
    for (let j = 0; j < N; j++) {
      if (!visited.has(j)) {
        let pheromone = Math.pow(sub.aco.pheromones[currentLocal][j], aco.alpha);
        let globalJ = sub.cityIndices[j];
        let distanceVal = getDistance(state.meta.cities[currentGlobal], state.meta.cities[globalJ]);
        let visibility = Math.pow(1 / (distanceVal || 1), aco.beta);
        let weight = pheromone * visibility;
        probs.push({ city: j, weight: weight });
        sum += weight;
      }
    }
    
    if (sum === 0) {
      for (let j = 0; j < N; j++) {
        if (!visited.has(j)) return j;
      }
    }
    
    let rand = Math.random() * sum;
    let acc = 0;
    for (let p of probs) {
      acc += p.weight;
      if (rand <= acc) return p.city;
    }
    return probs[probs.length - 1].city;
  }

  // 4. Particle Swarm Optimization (PSO) Step per Subproblem
  function solvePsoStep() {
    state.meta.bestDistance = 0;
    let pso = state.meta.pso;
    
    state.meta.subProblems.forEach(sub => {
      if (sub.cityIndices.length <= 2) {
        state.meta.bestDistance += sub.bestDistance;
        return;
      }
      
      sub.pso.particles.forEach(p => {
        let nextPath = [...p.position];
        const len = nextPath.length;
        
        // Apply swaps towards personal best
        for (let i = 1; i < len; i++) {
          if (Math.random() < pso.c1) {
            let targetCity = p.bestPosition[i];
            let currIdx = nextPath.indexOf(targetCity);
            if (currIdx !== i && currIdx !== -1) {
              [nextPath[i], nextPath[currIdx]] = [nextPath[currIdx], nextPath[i]];
            }
          }
        }
        
        // Apply swaps towards global best
        for (let i = 1; i < len; i++) {
          if (Math.random() < pso.c2) {
            let targetCity = sub.bestPath[i];
            let currIdx = nextPath.indexOf(targetCity);
            if (currIdx !== i && currIdx !== -1) {
              [nextPath[i], nextPath[currIdx]] = [nextPath[currIdx], nextPath[i]];
            }
          }
        }
        
        // Inertia: random swap
        if (Math.random() < pso.w) {
          mutateSwap(nextPath);
        }
        
        p.position = nextPath;
        let d = getSubPathDistance(nextPath);
        if (d < p.bestDist) {
          p.bestDist = d;
          p.bestPosition = [...nextPath];
        }
        
        if (d < sub.bestDistance) {
          sub.bestDistance = d;
          sub.bestPath = [...nextPath];
        }
      });
      
      state.meta.bestDistance += sub.bestDistance;
    });
    
    state.meta.iteration++;
  }

  // --- DRAWING & UI ---
  // --- PIXEL-ART CANVAS ENGINE ---
  const pixelSprites = {
    package: {
      matrix: [
        [0, 1, 1, 1, 0],
        [1, 2, 3, 2, 1],
        [1, 2, 3, 2, 1],
        [1, 2, 2, 2, 1],
        [0, 1, 1, 1, 0]
      ],
      colors: { 1: '#78350f', 2: '#d97706', 3: '#f59e0b' }
    },
    trash: {
      matrix: [
        [0, 1, 1, 1, 0],
        [1, 3, 3, 3, 1],
        [0, 2, 2, 2, 0],
        [0, 2, 2, 2, 0],
        [0, 2, 2, 2, 0],
        [0, 1, 1, 1, 0]
      ],
      colors: { 1: '#1f2937', 2: '#9ca3af', 3: '#6b7280' }
    },
    burger: {
      matrix: [
        [0, 1, 1, 1, 0],
        [1, 2, 2, 2, 1],
        [1, 3, 3, 3, 1],
        [0, 1, 1, 1, 0]
      ],
      colors: { 1: '#f59e0b', 2: '#22c55e', 3: '#7c2d12' }
    },
    warehouse: {
      matrix: [
        [0,0,1,1,1,0,0],
        [0,1,2,2,2,1,0],
        [1,2,2,2,2,2,1],
        [1,2,3,3,3,2,1],
        [1,2,3,4,3,2,1],
        [1,2,3,4,3,2,1],
        [1,1,1,1,1,1,1]
      ],
      colors: { 1: '#991b1b', 2: '#ef4444', 3: '#4b5563', 4: '#9ca3af' }
    },
    kitchen: {
      matrix: [
        [1,1,1,1,1,1,1],
        [1,2,2,2,2,2,1],
        [1,3,3,1,3,3,1],
        [1,2,2,1,2,2,1],
        [1,4,4,1,4,4,1],
        [1,4,4,1,4,4,1],
        [1,1,1,1,1,1,1]
      ],
      colors: { 1: '#374151', 2: '#f3f4f6', 3: '#ef4444', 4: '#1f2937' }
    },
    recycle: {
      matrix: [
        [0,0,1,1,1,0,0],
        [0,1,2,2,2,1,0],
        [1,2,1,2,1,2,1],
        [1,2,2,2,2,2,1],
        [1,2,1,1,1,2,1],
        [1,2,2,2,2,2,1],
        [1,1,1,1,1,1,1]
      ],
      colors: { 1: '#065f46', 2: '#10b981' }
    },
    van: {
      matrix: [
        [0,1,1,1,1,1,0],
        [1,2,2,2,2,2,1],
        [1,2,2,2,2,3,1],
        [1,2,2,2,2,2,1],
        [0,1,0,0,0,1,0]
      ],
      colors: { 1: '#1f2937', 2: '#ea580c', 3: '#38bdf8' }
    },
    scooter: {
      matrix: [
        [0,0,2,2,0,0],
        [0,1,2,2,1,0],
        [1,1,1,1,1,1],
        [0,1,1,1,1,0],
        [0,3,0,0,3,0]
      ],
      colors: { 1: '#ef4444', 2: '#d97706', 3: '#1f2937' }
    },
    truck: {
      matrix: [
        [0,1,1,1,1,1,1,0],
        [1,2,2,2,2,3,3,1],
        [1,2,2,2,2,3,3,1],
        [1,2,2,2,2,2,2,1],
        [0,1,0,0,0,0,1,0]
      ],
      colors: { 1: '#1f2937', 2: '#10b981', 3: '#e2e8f0' }
    }
  };

  function drawPixelSprite(ctx, spriteName, cx, cy, pixelSize = 2.5) {
    const sprite = pixelSprites[spriteName];
    if (!sprite) return;
    const matrix = sprite.matrix;
    const colors = sprite.colors;
    const rows = matrix.length;
    const cols = matrix[0].length;
    const startX = cx - (cols * pixelSize) / 2;
    const startY = cy - (rows * pixelSize) / 2;
    
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const val = matrix[r][c];
        if (val > 0 && colors[val]) {
          ctx.fillStyle = colors[val];
          ctx.fillRect(
            Math.round(startX + c * pixelSize),
            Math.round(startY + r * pixelSize),
            pixelSize,
            pixelSize
          );
        }
      }
    }
  }

  // --- DRAWING & UI ---
  function drawBangkokBackground(ctx, w, h) {
    // 1. Draw Chao Phraya River as a stepped pixelated path
    ctx.strokeStyle = state.theme === 'dark' ? 'rgba(0, 242, 254, 0.08)' : 'rgba(0, 180, 216, 0.1)';
    ctx.lineWidth = 16;
    ctx.lineCap = 'square';
    ctx.lineJoin = 'miter';
    
    ctx.beginPath();
    // Stepped River Path
    const riverPoints = [
      {x: w * 0.45, y: 0},
      {x: w * 0.48, y: h * 0.15},
      {x: w * 0.52, y: h * 0.28},
      {x: w * 0.40, y: h * 0.40},
      {x: w * 0.34, y: h * 0.52},
      {x: w * 0.46, y: h * 0.65},
      {x: w * 0.58, y: h * 0.78},
      {x: w * 0.50, y: h * 0.88},
      {x: w * 0.44, y: h}
    ];
    
    ctx.moveTo(riverPoints[0].x, riverPoints[0].y);
    for (let i = 1; i < riverPoints.length; i++) {
      // Round to nearest 8 pixels for stepped look
      const rx = Math.round(riverPoints[i].x / 8) * 8;
      const ry = Math.round(riverPoints[i].y / 8) * 8;
      ctx.lineTo(rx, ry);
    }
    ctx.stroke();
    
    // 2. Draw Bangkok Expressways (Grid of roads - stepped/dashed)
    ctx.strokeStyle = state.theme === 'dark' ? 'rgba(255, 255, 255, 0.025)' : 'rgba(0, 0, 0, 0.02)';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 8]);
    
    // Expressways
    ctx.beginPath();
    ctx.moveTo(Math.round(w * 0.28 / 8) * 8, 0); ctx.lineTo(Math.round(w * 0.28 / 8) * 8, h);
    ctx.moveTo(Math.round(w * 0.72 / 8) * 8, 0); ctx.lineTo(Math.round(w * 0.72 / 8) * 8, h);
    ctx.moveTo(0, Math.round(h * 0.35 / 8) * 8); ctx.lineTo(w, Math.round(h * 0.35 / 8) * 8);
    ctx.moveTo(0, Math.round(h * 0.75 / 8) * 8); ctx.lineTo(w, Math.round(h * 0.75 / 8) * 8);
    ctx.stroke();
    ctx.setLineDash([]); // reset
    
    // 3. District Labels (Retro font)
    ctx.fillStyle = state.theme === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.15)';
    ctx.font = '7px var(--font-retro)';
    ctx.textAlign = 'center';
    
    ctx.fillText('CHATUCHAK', w * 0.5, h * 0.12);
    ctx.fillText('THONBURI', w * 0.23, h * 0.62);
    ctx.fillText('SIAM', w * 0.58, h * 0.42);
    ctx.fillText('SUKHUMVIT', w * 0.8, h * 0.52);
    ctx.fillText('SILOM', w * 0.52, h * 0.65);
    ctx.fillText('BANGNA', w * 0.82, h * 0.84);
  }

  function drawTspMap() {
    const ctx = tspCanvas.getContext('2d');
    const w = tspCanvas.width;
    const h = tspCanvas.height;
    ctx.clearRect(0, 0, w, h);
    
    // Disable image smoothing for crisp pixel art rendering
    ctx.imageSmoothingEnabled = false;
    
    // 0. Draw Bangkok Background Map
    drawBangkokBackground(ctx, w, h);
    
    // 1. Draw Pheromones if ACO is active (local pheromones for each subproblem)
    if (state.meta.activeAlgo === 'aco') {
      state.meta.subProblems.forEach(sub => {
        if (sub.cityIndices.length <= 1 || !sub.aco || !sub.aco.pheromones) return;
        const N = sub.cityIndices.length;
        ctx.lineWidth = 1;
        for (let i = 0; i < N; i++) {
          for (let j = i + 1; j < N; j++) {
            let p = sub.aco.pheromones[i][j];
            if (p > 1.1) {
              let alpha = Math.min(0.5, (p - 1) * 0.12);
              ctx.strokeStyle = `rgba(16, 185, 129, ${alpha})`;
              ctx.beginPath();
              ctx.moveTo(state.meta.cities[sub.cityIndices[i]].x, state.meta.cities[sub.cityIndices[i]].y);
              ctx.lineTo(state.meta.cities[sub.cityIndices[j]].x, state.meta.cities[sub.cityIndices[j]].y);
              ctx.stroke();
            }
          }
        }
      });
    }
    
    // 2. Draw best paths for all vehicles
    state.meta.subProblems.forEach((sub, vIdx) => {
      const path = decodeCvrpPath(sub.bestPath);
      if (path && path.length > 0) {
        const color = state.meta.vehicleColors[vIdx % state.meta.vehicleColors.length];
        ctx.strokeStyle = color;
        ctx.lineWidth = 3.2;
        ctx.shadowColor = color;
        ctx.shadowBlur = 8;
        
        ctx.beginPath();
        ctx.moveTo(state.meta.cities[path[0]].x, state.meta.cities[path[0]].y);
        for (let i = 1; i < path.length; i++) {
          ctx.lineTo(state.meta.cities[path[i]].x, state.meta.cities[path[i]].y);
        }
        ctx.stroke();
        ctx.shadowBlur = 0; // reset
        
        // --- ANIMATE VEHICLES DRIVING ALONG THE PATHS ---
        if (state.meta.isRunning) {
          const speedFactor = 0.0015;
          const time = Date.now() * speedFactor;
          const totalSegments = path.length - 1;
          
          if (totalSegments > 0) {
            const segmentIdx = Math.floor(time) % totalSegments;
            const nextSegmentIdx = segmentIdx + 1;
            const t = time % 1; // interpolation factor (0 to 1)
            
            const startCity = state.meta.cities[path[segmentIdx]];
            const endCity = state.meta.cities[path[nextSegmentIdx]];
            
            const posX = startCity.x + (endCity.x - startCity.x) * t;
            const posY = startCity.y + (endCity.y - startCity.y) * t;
            
            // Determine vehicle type based on scenario
            let vehicleType = 'van';
            if (state.meta.activeScenario === 'food') vehicleType = 'scooter';
            else if (state.meta.activeScenario === 'garbage') vehicleType = 'truck';
            
            // Draw the vehicle sprite
            drawPixelSprite(ctx, vehicleType, posX, posY, 2.2);
          }
        }
      }
    });
    
    // 3. Draw cities
    state.meta.cities.forEach((c, idx) => {
      if (c.isDepot) {
        let depotSprite = 'warehouse';
        if (state.meta.activeScenario === 'food') depotSprite = 'kitchen';
        else if (state.meta.activeScenario === 'garbage') depotSprite = 'recycle';
        
        drawPixelSprite(ctx, depotSprite, c.x, c.y, 3.2);
        
        // Label Depot
        ctx.fillStyle = '#fff';
        ctx.font = '6px var(--font-retro)';
        ctx.textAlign = 'center';
        ctx.fillText('DEPOT', c.x, c.y - 18);
      } else {
        let citySprite = 'package';
        if (state.meta.activeScenario === 'food') {
          citySprite = 'burger';
        } else if (state.meta.activeScenario === 'garbage') {
          citySprite = 'trash';
        }
        
        drawPixelSprite(ctx, citySprite, c.x, c.y, 2.8);
        
        // Index label colored by cluster!
        const color = state.meta.numVehicles > 1 
          ? state.meta.vehicleColors[c.clusterId % state.meta.vehicleColors.length]
          : 'rgba(255,255,255,0.7)';
        ctx.fillStyle = color;
        ctx.font = 'bold 9px var(--font-mono)';
        ctx.textAlign = 'center';
        ctx.fillText(idx, c.x, c.y - 14);
      }
    });
  }

  function updateLeaderboard() {
    const algo = state.meta.activeAlgo;
    const dist = state.meta.bestDistance;
    const iter = state.meta.iteration;
    
    if (dist !== Infinity && dist > 0) {
      if (!state.meta.leaderboard) {
        state.meta.leaderboard = {
          ga: { dist: '-', iter: '-' },
          aco: { dist: '-', iter: '-' },
          sa: { dist: '-', iter: '-' },
          pso: { dist: '-', iter: '-' }
        };
      }
      
      const currentBest = state.meta.leaderboard[algo].dist;
      if (currentBest === '-' || dist < parseFloat(currentBest)) {
        state.meta.leaderboard[algo] = {
          dist: dist.toFixed(1),
          iter: iter
        };
      }
    }
    
    const body = document.getElementById('leaderboard-body');
    if (!body) return;
    
    const algoNames = {
      ga: '🧬 Genetic Algorithm (GA)',
      aco: '🐜 Ant Colony Optimization (ACO)',
      sa: '🌡️ Simulated Annealing (SA)',
      pso: '🐦 Particle Swarm Optimization (PSO)'
    };
    
    body.innerHTML = '';
    Object.keys(algoNames).forEach(key => {
      const record = state.meta.leaderboard ? state.meta.leaderboard[key] : { dist: '-', iter: '-' };
      const isActive = state.meta.activeAlgo === key;
      
      const tr = document.createElement('tr');
      tr.style.borderBottom = '1px solid var(--border-color)';
      tr.style.fontSize = '0.9rem';
      if (isActive) {
        tr.style.backgroundColor = 'rgba(0, 242, 254, 0.05)';
        tr.style.color = 'var(--color-cyan)';
      }
      
      tr.innerHTML = `
        <td style="padding: 0.75rem; font-weight: ${isActive ? 'bold' : 'normal'};">${algoNames[key]}</td>
        <td style="padding: 0.75rem; font-family: var(--font-mono);">${record.dist !== '-' ? record.dist + ' กม.' : '-'}</td>
        <td style="padding: 0.75rem; font-family: var(--font-mono);">${record.iter}</td>
        <td style="padding: 0.75rem;">
          ${isActive ? '<span class="badge" style="background: var(--color-cyan-glow); color: var(--color-cyan); padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.75rem;">Active</span>' : '<span style="color: var(--text-secondary); font-size: 0.75rem;">Standby</span>'}
        </td>
      `;
      body.appendChild(tr);
    });
  }

  function resetLeaderboard() {
    state.meta.leaderboard = {
      ga: { dist: '-', iter: '-' },
      aco: { dist: '-', iter: '-' },
      sa: { dist: '-', iter: '-' },
      pso: { dist: '-', iter: '-' }
    };
    updateLeaderboard();
  }

  function updateMetaCharts() {
    const ctx = document.getElementById('meta-chart');
    if (!ctx) return;
    
    const textColor = state.theme === 'dark' ? '#9ca3af' : '#4b5563';
    const gridColor = state.theme === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)';
    
    const labels = state.meta.history.map((_, idx) => idx);
    const data = state.meta.history.map(d => d);
    
    const chartData = {
      labels: labels,
      datasets: [{
        label: 'Best Path Length (ระยะทางที่สั้นที่สุด)',
        data: data,
        borderColor: '#00f2fe',
        borderWidth: 2,
        fill: false,
        pointRadius: 0
      }]
    };
    
    if (state.meta.chart) {
      state.meta.chart.data = chartData;
      state.meta.chart.update('none');
    } else {
      state.meta.chart = new Chart(ctx, {
        type: 'line',
        data: chartData,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false }
          },
          scales: {
            x: {
              grid: { color: gridColor },
              ticks: { color: textColor, maxTicksLimit: 10 },
              title: { display: true, text: 'รอบการคำนวณ (Iterations)', color: textColor }
            },
            y: {
              grid: { color: gridColor },
              ticks: { color: textColor },
              title: { display: true, text: 'ระยะทาง (Pixels / Km)', color: textColor }
            }
          }
        }
      });
    }
  }

  // Update dynamic parameter sliders based on selected tab
  function renderMetaParameters() {
    const algo = state.meta.activeAlgo;
    dynamicParamsContainer.innerHTML = '';
    
    if (algo === 'ga') {
      dynamicParamsContainer.innerHTML = `
        <div class="input-field">
          <div class="input-header">
            <span class="input-label">ขนาดกลุ่มประชากร (Population Size)</span>
            <span class="input-value" id="ga-pop-val">${state.meta.ga.popSize}</span>
          </div>
          <input type="range" id="ga-pop-input" min="10" max="100" step="5" value="${state.meta.ga.popSize}">
        </div>
        <div class="input-field">
          <div class="input-header">
            <span class="input-label">อัตราการผ่าเหล่า (Mutation Rate)</span>
            <span class="input-value" id="ga-mut-val">${(state.meta.ga.mutationRate * 100).toFixed(0)}%</span>
          </div>
          <input type="range" id="ga-mut-input" min="0.01" max="0.5" step="0.01" value="${state.meta.ga.mutationRate}">
        </div>
      `;
      
      document.getElementById('ga-pop-input').addEventListener('input', e => {
        state.meta.ga.popSize = parseInt(e.target.value);
        document.getElementById('ga-pop-val').textContent = state.meta.ga.popSize;
        resetMetaheuristic();
      });
      document.getElementById('ga-mut-input').addEventListener('input', e => {
        state.meta.ga.mutationRate = parseFloat(e.target.value);
        document.getElementById('ga-mut-val').textContent = (state.meta.ga.mutationRate * 100).toFixed(0) + '%';
      });
      
    } else if (algo === 'aco') {
      dynamicParamsContainer.innerHTML = `
        <div class="input-field">
          <div class="input-header">
            <span class="input-label">จำนวนมดจำลอง (Number of Ants)</span>
            <span class="input-value" id="aco-ants-val">${state.meta.aco.numAnts} ตัว</span>
          </div>
          <input type="range" id="aco-ants-input" min="5" max="30" step="1" value="${state.meta.aco.numAnts}">
        </div>
        <div class="input-field">
          <div class="input-header">
            <span class="input-label">อัตราการระเหยฟีโรโมน (Evaporation Rate)</span>
            <span class="input-value" id="aco-evap-val">${(state.meta.aco.feedbackEvap || state.meta.aco.evaporation * 100).toFixed(0)}%</span>
          </div>
          <input type="range" id="aco-evap-input" min="0.05" max="0.5" step="0.05" value="${state.meta.aco.evaporation}">
        </div>
      `;
      
      document.getElementById('aco-ants-input').addEventListener('input', e => {
        state.meta.aco.numAnts = parseInt(e.target.value);
        document.getElementById('aco-ants-val').textContent = state.meta.aco.numAnts + ' ตัว';
        resetMetaheuristic();
      });
      document.getElementById('aco-evap-input').addEventListener('input', e => {
        state.meta.aco.evaporation = parseFloat(e.target.value);
        document.getElementById('aco-evap-val').textContent = (state.meta.aco.evaporation * 100).toFixed(0) + '%';
      });
      
    } else if (algo === 'sa') {
      dynamicParamsContainer.innerHTML = `
        <div class="input-field">
          <div class="input-header">
            <span class="input-label">ความเร็วในการเย็นตัว (Cooling Rate)</span>
            <span class="input-value" id="sa-cool-val">${state.meta.sa.coolingRate}</span>
          </div>
          <input type="range" id="sa-cool-input" min="0.95" max="0.999" step="0.001" value="${state.meta.sa.coolingRate}">
        </div>
      `;
      
      document.getElementById('sa-cool-input').addEventListener('input', e => {
        state.meta.sa.coolingRate = parseFloat(e.target.value);
        document.getElementById('sa-cool-val').textContent = state.meta.sa.coolingRate;
        resetMetaheuristic();
      });
      
    } else if (algo === 'pso') {
      dynamicParamsContainer.innerHTML = `
        <div class="input-field">
          <div class="input-header">
            <span class="input-label">จำนวนอนุภาค (Swarm Size)</span>
            <span class="input-value" id="pso-size-val">${state.meta.pso.numParticles}</span>
          </div>
          <input type="range" id="pso-size-input" min="10" max="50" step="5" value="${state.meta.pso.numParticles}">
        </div>
        <div class="input-field">
          <div class="input-header">
            <span class="input-label">น้ำหนักการเรียนรู้ฝูง (c2 - Global Learning)</span>
            <span class="input-value" id="pso-c2-val">${state.meta.pso.c2}</span>
          </div>
          <input type="range" id="pso-c2-input" min="0.1" max="0.9" step="0.1" value="${state.meta.pso.c2}">
        </div>
      `;
      
      document.getElementById('pso-size-input').addEventListener('input', e => {
        state.meta.pso.numParticles = parseInt(e.target.value);
        document.getElementById('pso-size-val').textContent = state.meta.pso.numParticles;
        resetMetaheuristic();
      });
      document.getElementById('pso-c2-input').addEventListener('input', e => {
        state.meta.pso.c2 = parseFloat(e.target.value);
        document.getElementById('pso-c2-val').textContent = state.meta.pso.c2;
      });
    }
  }

  function renderMetaExplanation() {
    const algo = state.meta.activeAlgo;
    let explain = '';
    
    if (algo === 'ga') {
      explain = `
        <strong>🧬 อัลกอริทึมพันธุกรรม (Genetic Algorithm):</strong><br>
        จำลองการสืบพันธุ์และการคัดเลือกตามธรรมชาติของดาร์วิน โดยคำตอบ (เส้นทางเดินรถ) เปรียบเสมือนโครโมโซม 
        เส้นทางที่สั้นกว่าจะถูกเลือกมาเป็นพ่อแม่เพื่อทำ Crossover (ผสมยีน) และมีการ Mutation (ผ่าเหล่าแบบสุ่ม) 
        ทำให้หลุดจากทางตันได้ดี<br><br>
        <strong>การประยุกต์ใช้จริง:</strong> วางแผนลำดับขั้นตอนประกอบรถยนต์ของ Toyota, จัดตารางเวลาสายการบิน, 
        การจัดพอร์ตวิเคราะห์ความเสี่ยงการลงทุนหุ้นทางการเงิน
      `;
    } else if (algo === 'aco') {
      explain = `
        <strong>🐜 อัลกอริทึมฝูงมด (Ant Colony Optimization):</strong><br>
        เลียนแบบมดธรรมชาติที่จะปล่อยสารเคมีที่เรียกว่า "ฟีโรโมน" ทิ้งไว้ตามทางเดินเมื่อหาอาหารได้สำเร็จ 
        มดตัวต่อๆ ไปจะเลือกเดินตามเส้นทางที่มีสารเคมีเข้มข้นที่สุด (ทางลัดที่เดินจบรอบเร็ว) 
        ทำให้ฝูงมดค้นหาทางลัดและทางเลี่ยงได้อย่างรวดเร็ว<br><br>
        <strong>การประยุกต์ใช้จริง:</strong> ระบบจัดเส้นทางการเดินรถส่งของอัตโนมัติของ Kerry/Flash Express, 
        การจัดเส้นทางการส่งข้อมูลในระบบอินเทอร์เน็ตเพื่อเลี่ยงทราฟฟิกหนาแน่น
      `;
    } else if (algo === 'sa') {
      explain = `
        <strong>🌡️ การจำลองการอบเหนียว (Simulated Annealing):</strong><br>
        เลียนแบบความร้อนและการเย็นตัวช้าๆ ของโลหะ ในช่วงที่อุณหภูมิสูง (อุ่นเครื่อง) อัลกอริทึมจะยอมสุ่มกระโดดไปยังทิศทางแย่ๆ 
        (กระตุ้นพลังงาน) เพื่อทดลองและหลุดจากกับดักคำตอบเฉพาะที่ (Local Optima) และจะค่อยๆ ลู่เข้าหาคำตอบที่ดีที่สุดอย่างแม่นยำ
        เมื่ออุณหภูมิลดต่ำลง<br><br>
        <strong>การประยุกต์ใช้จริง:</strong> การจัดวางโครงสร้างทรานซิสเตอร์บนแผ่นซิลิคอนชิปประมวลผล (IC Layout Design), 
        การวางเครือข่ายท่อส่งก๊าซธรรมชาติให้สูญเสียแรงดันน้อยที่สุด
      `;
    } else if (algo === 'pso') {
      explain = `
        <strong>🐦 อัลกอริทึมฝูงอนุภาค (Particle Swarm Optimization):</strong><br>
        จำลองฝูงนกหรือปลาที่กำลังหาอาหาร อนุภาคแต่ละตัว (นก) จะบินหาเป้าหมายโดยเปรียบเทียบระหว่างจุดที่ดีที่สุดที่ตนเองเคยเจอ (pbest) 
        กับจุดที่ดีที่สุดที่เพื่อนในฝูงทั้งหมดค้นพบ (gbest) แล้วบินรุมพุ่งไปหาเป้าหมายร่วมกัน<br><br>
        <strong>การประยุกต์ใช้จริง:</strong> การปรับแต่งปีกเครื่องบินแอร์บัสและรถแข่ง F1 ให้ลู่ลมที่สุด, 
        การหาจุดกระจายคลังสินค้าของร้านสะดวกซื้อ 7-Eleven ให้ครอบคลุมทุกตำบล
      `;
    }
    metaExplainCard.innerHTML = explain;
  }

  function updateMetaUI() {
    kpiMetaModel.textContent = state.meta.activeAlgo.toUpperCase() + ' Solver';
    renderMetaParameters();
    renderMetaExplanation();
    drawTspMap();
    updateLeaderboard();
  }

  // --- META SOLVER LOOP ---
  function metaheuristicLoop(timestamp) {
    if (!state.meta.isRunning || state.activePage !== 'meta') return;
    
    // Control step speed (e.g. run every 30ms to let students see)
    const stepInterval = 30; // ms
    if (timestamp - state.meta.lastStepTime >= stepInterval) {
      const tStart = performance.now();
      
      // Execute 1 step of active algorithm
      const algo = state.meta.activeAlgo;
      if (algo === 'sa') solveSaStep();
      else if (algo === 'ga') solveGaStep();
      else if (algo === 'aco') solveAcoStep();
      else if (algo === 'pso') solvePsoStep();
      
      const tEnd = performance.now();
      
      // Record history
      state.meta.history.push(state.meta.bestDistance);
      if (state.meta.history.length > 500) state.meta.history.shift();
      
      // Update UI
      kpiMetaDistance.innerHTML = `${state.meta.bestDistance.toFixed(1)}<span class="kpi-unit">กม.</span>`;
      kpiMetaIteration.textContent = state.meta.iteration;
      kpiMetaSpeed.textContent = (tEnd - tStart).toFixed(2) + ' ms';
      
      drawTspMap();
      updateMetaCharts();
      updateLeaderboard();
      
      state.meta.lastStepTime = timestamp;
    }
    
    state.meta.animationFrameId = requestAnimationFrame(metaheuristicLoop);
  }

  function startMetaLoop() {
    if (state.meta.animationFrameId) return;
    state.meta.isRunning = true;
    state.meta.lastStepTime = 0;
    state.meta.animationFrameId = requestAnimationFrame(metaheuristicLoop);
  }

  function stopMetaLoop() {
    if (state.meta.animationFrameId) {
      cancelAnimationFrame(state.meta.animationFrameId);
      state.meta.animationFrameId = null;
    }
    state.meta.isRunning = false;
  }

  // --- META EVENT LISTENERS ---
  algoTabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      algoTabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      state.meta.activeAlgo = btn.getAttribute('data-algo');
      stopMetaLoop();
      btnMetaStart.innerHTML = '<span>▶️</span> เริ่มคำนวณ';
      btnMetaStart.classList.remove('btn-danger');
      btnMetaStart.classList.add('btn-primary');
      
      resetMetaheuristic();
      updateMetaUI();
    });
  });

  citiesInput.addEventListener('input', e => {
    state.meta.numCities = parseInt(e.target.value);
    citiesVal.textContent = state.meta.numCities + ' เมือง';
    stopMetaLoop();
    btnMetaStart.innerHTML = '<span>▶️</span> เริ่มคำนวณ';
    btnMetaStart.classList.remove('btn-danger');
    btnMetaStart.classList.add('btn-primary');
    
    state.meta.cities = []; // Trigger regeneration
    initTspProblem();
    updateMetaUI();
    resetLeaderboard();
  });

  vehiclesInput.addEventListener('input', e => {
    state.meta.numVehicles = parseInt(e.target.value);
    vehiclesVal.textContent = state.meta.numVehicles + ' คัน';
    stopMetaLoop();
    btnMetaStart.innerHTML = '<span>▶️</span> เริ่มคำนวณ';
    btnMetaStart.classList.remove('btn-danger');
    btnMetaStart.classList.add('btn-primary');
    
    resetMetaheuristic();
    updateMetaUI();
    resetLeaderboard();
  });

  if (tspCapacityEnable) {
    tspCapacityEnable.addEventListener('change', e => {
      state.meta.capacityEnable = e.target.checked;
      tspCapacityContainer.style.display = e.target.checked ? 'block' : 'none';
      stopMetaLoop();
      btnMetaStart.innerHTML = '<span>▶️</span> เริ่มคำนวณ';
      btnMetaStart.classList.remove('btn-danger');
      btnMetaStart.classList.add('btn-primary');
      resetMetaheuristic();
    });
  }

  if (tspCapacityInput) {
    tspCapacityInput.addEventListener('input', e => {
      state.meta.capacityLimit = parseInt(e.target.value);
      tspCapacityVal.textContent = state.meta.capacityLimit + ' ชิ้น';
      stopMetaLoop();
      btnMetaStart.innerHTML = '<span>▶️</span> เริ่มคำนวณ';
      btnMetaStart.classList.remove('btn-danger');
      btnMetaStart.classList.add('btn-primary');
      resetMetaheuristic();
    });
  }

  btnMetaStart.addEventListener('click', () => {
    if (state.meta.isRunning) {
      stopMetaLoop();
      btnMetaStart.innerHTML = '<span>▶️</span> เริ่มคำนวณ';
      btnMetaStart.classList.remove('btn-danger');
      btnMetaStart.classList.add('btn-primary');
    } else {
      btnMetaStart.innerHTML = '<span>⏸️</span> หยุดการทำงาน';
      btnMetaStart.classList.remove('btn-primary');
      btnMetaStart.classList.add('btn-danger');
      startMetaLoop();
    }
  });

  btnMetaPause.addEventListener('click', () => {
    stopMetaLoop();
    btnMetaStart.innerHTML = '<span>▶️</span> เริ่มคำนวณ';
    btnMetaStart.classList.remove('btn-danger');
    btnMetaStart.classList.add('btn-primary');
  });

  btnMetaReset.addEventListener('click', () => {
    stopMetaLoop();
    btnMetaStart.innerHTML = '<span>▶️</span> เริ่มคำนวณ';
    btnMetaStart.classList.remove('btn-danger');
    btnMetaStart.classList.add('btn-primary');
    resetMetaheuristic();
  });

  btnMetaGenerate.addEventListener('click', () => {
    stopMetaLoop();
    btnMetaStart.innerHTML = '<span>▶️</span> เริ่มคำนวณ';
    btnMetaStart.classList.remove('btn-danger');
    btnMetaStart.classList.add('btn-primary');
    
    state.meta.cities = []; // Force regeneration
    initTspProblem();
    updateMetaUI();
    resetLeaderboard();
  });

  // ==========================================
  // PAGE 4: MACHINE LEARNING & PINN SANDBOX
  // ==========================================
  
  // --- 1. K-MEANS CLUSTERING ---
  function initKMeans() {
    const w = kmeansCanvas.width;
    const h = kmeansCanvas.height;
    state.ml.kmeans.points = [];
    state.ml.kmeans.centroids = [];
    state.ml.kmeans.assignments = [];
    state.ml.kmeans.converged = false;
    
    // Generate clustered points for visualization
    const K = state.ml.kmeans.k;
    const pointsPerCluster = Math.floor(100 / K);
    
    // Define random center zones for points
    const centers = [];
    for (let c = 0; c < K; c++) {
      centers.push({
        x: 50 + Math.random() * (w - 100),
        y: 50 + Math.random() * (h - 100)
      });
    }
    
    for (let c = 0; c < K; c++) {
      for (let p = 0; p < pointsPerCluster; p++) {
        state.ml.kmeans.points.push({
          x: centers[c].x + (Math.random() - 0.5) * 60,
          y: centers[c].y + (Math.random() - 0.5) * 60
        });
        state.ml.kmeans.assignments.push(-1);
      }
    }
    
    // Initialize centroids randomly in space
    for (let c = 0; c < K; c++) {
      state.ml.kmeans.centroids.push({
        x: Math.random() * w,
        y: Math.random() * h
      });
    }
  }

  function stepKMeans() {
    if (state.ml.kmeans.converged) return;
    
    const K = state.ml.kmeans.k;
    const points = state.ml.kmeans.points;
    const centroids = state.ml.kmeans.centroids;
    
    // Step A: Assign points to nearest centroid
    let changed = false;
    for (let i = 0; i < points.length; i++) {
      let minDist = Infinity;
      let closestCentroid = -1;
      
      for (let c = 0; c < K; c++) {
        let d = Math.sqrt((points[i].x - centroids[c].x)**2 + (points[i].y - centroids[c].y)**2);
        if (d < minDist) {
          minDist = d;
          closestCentroid = c;
        }
      }
      
      if (state.ml.kmeans.assignments[i] !== closestCentroid) {
        state.ml.kmeans.assignments[i] = closestCentroid;
        changed = true;
      }
    }
    
    // Step B: Re-calculate centroids
    for (let c = 0; c < K; c++) {
      let sumX = 0;
      let sumY = 0;
      let count = 0;
      
      for (let i = 0; i < points.length; i++) {
        if (state.ml.kmeans.assignments[i] === c) {
          sumX += points[i].x;
          sumY += points[i].y;
          count++;
        }
      }
      
      if (count > 0) {
        centroids[c].x = sumX / count;
        centroids[c].y = sumY / count;
      }
    }
    
    if (!changed) {
      state.ml.kmeans.converged = true;
    }
    drawKMeans();
  }

  function drawKMeans() {
    const ctx = kmeansCanvas.getContext('2d');
    const w = kmeansCanvas.width;
    const h = kmeansCanvas.height;
    ctx.clearRect(0, 0, w, h);
    
    // Disable image smoothing for crisp pixelated feel
    ctx.imageSmoothingEnabled = false;
    
    // Draw grid
    ctx.strokeStyle = state.theme === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 30) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
    
    // Colors for clusters
    const colors = ['#00f2fe', '#10b981', '#ff1744', '#f59e0b', '#6366f1', '#e0f2fe'];
    
    // Draw points as 8-bit customer avatars
    state.ml.kmeans.points.forEach((p, idx) => {
      const assign = state.ml.kmeans.assignments[idx];
      const color = assign === -1 ? '#9ca3af' : colors[assign % colors.length];
      
      ctx.fillStyle = color;
      ctx.fillRect(p.x - 1, p.y - 2, 2, 1.5); // head
      ctx.fillRect(p.x - 2, p.y - 0.5, 4, 1.5); // body
      ctx.fillRect(p.x - 1, p.y + 1, 1, 1.5); // left leg
      ctx.fillRect(p.x + 0, p.y + 1, 1, 1.5); // right leg
    });
    
    // Draw centroids as 8-bit Cafe Coffee Cups
    state.ml.kmeans.centroids.forEach((c, idx) => {
      const color = colors[idx % colors.length];
      const cupMatrix = [
        [0,1,0,1,0],
        [2,2,2,2,1],
        [2,2,2,2,1],
        [0,2,2,2,0],
        [2,2,2,2,2]
      ];
      
      const pixelSize = 2.5;
      const startX = c.x - 6.25;
      const startY = c.y - 6.25;
      
      // Draw a glowing shadow behind the centroid cup
      ctx.shadowColor = color;
      ctx.shadowBlur = 8;
      ctx.fillStyle = color;
      ctx.fillRect(c.x - 4, c.y - 4, 8, 8);
      ctx.shadowBlur = 0; // reset
      
      for (let r = 0; r < 5; r++) {
        for (let colIdx = 0; colIdx < 5; colIdx++) {
          const val = cupMatrix[r][colIdx];
          if (val === 2) {
            ctx.fillStyle = color;
            ctx.fillRect(startX + colIdx * pixelSize, startY + r * pixelSize, pixelSize, pixelSize);
          } else if (val === 1) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(startX + colIdx * pixelSize, startY + r * pixelSize, pixelSize, pixelSize);
          }
        }
      }
    });
  }

  kInput.addEventListener('input', e => {
    state.ml.kmeans.k = parseInt(e.target.value);
    kVal.textContent = state.ml.kmeans.k + ' กลุ่ม';
    initKMeans();
    drawKMeans();
  });
  btnKmeansStep.addEventListener('click', () => {
    stepKMeans();
  });
  btnKmeansRun.addEventListener('click', () => {
    let limit = 0;
    while (!state.ml.kmeans.converged && limit < 100) {
      stepKMeans();
      limit++;
    }
  });
  btnKmeansReset.addEventListener('click', () => {
    initKMeans();
    drawKMeans();
  });

  // --- 2. LINEAR REGRESSION ---
  function initRegression() {
    const w = regressionCanvas.width;
    const h = regressionCanvas.height;
    state.ml.regression.points = [];
    state.ml.regression.m = Math.random() * 2 - 1; // Random initial guess
    state.ml.regression.c = 0;
    state.ml.regression.epoch = 0;
    state.ml.regression.loss = 0;
    state.ml.regression.isTraining = false;
    
    // Generate linear data with noise: y = 0.5 * x + 40 + noise
    // Map coords: X [30, w-30], Y [h-30, 30]
    for (let i = 0; i < 30; i++) {
      let xPct = 0.1 + 0.8 * (i / 30);
      let x = xPct * w;
      // Ideal line
      let yIdeal = h - (0.5 * x + 30);
      let noise = (Math.random() - 0.5) * 35;
      state.ml.regression.points.push({ x: x, y: yIdeal + noise });
    }
    calculateRegressionLoss();
  }

  function calculateRegressionLoss() {
    let totalLoss = 0;
    const points = state.ml.regression.points;
    const m = state.ml.regression.m;
    const c = state.ml.regression.c;
    
    points.forEach(p => {
      let pred = m * p.x + c;
      totalLoss += (p.y - pred)**2;
    });
    state.ml.regression.loss = totalLoss / points.length;
    
    regLossVal.textContent = `Loss (MSE): ${state.ml.regression.loss.toFixed(2)}`;
    regEpochVal.textContent = `Epoch: ${state.ml.regression.epoch}`;
  }

  function stepRegression() {
    const points = state.ml.regression.points;
    const N = points.length;
    let m = state.ml.regression.m;
    let c = state.ml.regression.c;
    const lr = state.ml.regression.lr;
    
    // Compute Gradients
    let gradM = 0;
    let gradC = 0;
    
    for (let i = 0; i < N; i++) {
      let pred = m * points[i].x + c;
      let diff = pred - points[i].y;
      gradM += (2/N) * diff * points[i].x;
      gradC += (2/N) * diff;
    }
    
    // If learning rate is small, we apply gradient clipping to keep it stable.
    // If learning rate is large, we let it explode naturally to teach divergence!
    if (lr < 0.4) {
      const maxGrad = 1000;
      if (Math.abs(gradM) > maxGrad) gradM = Math.sign(gradM) * maxGrad;
    }
    
    // Update weights
    state.ml.regression.m -= (lr * 0.00001) * gradM; 
    state.ml.regression.c -= lr * gradC;
    state.ml.regression.epoch++;
    
    calculateRegressionLoss();
    drawRegression();
  }

  function drawRegression() {
    const ctx = regressionCanvas.getContext('2d');
    const w = regressionCanvas.width;
    const h = regressionCanvas.height;
    ctx.clearRect(0, 0, w, h);
    
    ctx.imageSmoothingEnabled = false;
    
    // Draw grid
    ctx.strokeStyle = state.theme === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)';
    ctx.lineWidth = 1;
    for (let y = 0; y < h; y += 30) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }
    
    // Draw data points as tiny 8-bit Air Conditioners
    state.ml.regression.points.forEach(p => {
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(p.x - 4, p.y - 3, 8, 5); // main casing
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(p.x - 3, p.y + 1, 6, 1); // air grill
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(p.x + 1, p.y - 2, 2, 1.5); // small display light
    });
    
    // Draw Regression Line
    const m = state.ml.regression.m;
    const c = state.ml.regression.c;
    ctx.strokeStyle = '#00f2fe';
    ctx.lineWidth = 2.5;
    ctx.shadowColor = 'rgba(0, 242, 254, 0.4)';
    ctx.shadowBlur = 8;
    
    ctx.beginPath();
    ctx.moveTo(0, c);
    ctx.lineTo(w, m * w + c);
    ctx.stroke();
    
    ctx.shadowBlur = 0; // reset
    
    // Draw the Loss Landscape
    drawRegressionLoss();
  }

  function drawRegressionLoss() {
    if (!regressionLossCanvas) return;
    const ctx = regressionLossCanvas.getContext('2d');
    const w = regressionLossCanvas.width;
    const h = regressionLossCanvas.height;
    ctx.clearRect(0, 0, w, h);
    
    // Draw grid
    ctx.strokeStyle = state.theme === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)';
    ctx.lineWidth = 1;
    for (let y = 0; y < h; y += 30) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }
    
    // Draw a Parabola representing the Loss Surface J(w)
    const minX = w / 2;
    const minY = h - 40;
    const a = 0.012; // curvature
    
    ctx.strokeStyle = '#4b5563';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let x = 10; x < w - 10; x++) {
      let y = a * Math.pow(x - minX, 2) + minY;
      if (x === 10) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    
    // Draw labels
    ctx.fillStyle = '#9ca3af';
    ctx.font = '9px Orbitron';
    ctx.textAlign = 'center';
    ctx.fillText('J(w) Loss', minX, 20);
    ctx.fillText('w (Slope)', w - 30, h - 10);
    
    // Current weight position
    const currentM = state.ml.regression.m;
    const optimalM = 0.8;
    const scaleX = 60; // pixels per unit
    const ballX = minX + (currentM - optimalM) * scaleX;
    const ballY = a * Math.pow(ballX - minX, 2) + minY;
    
    // Check for Exploding Gradient
    if (isNaN(ballX) || !isFinite(ballX) || isNaN(ballY) || !isFinite(ballY) || state.ml.regression.loss > 100000) {
      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 10px var(--font-retro)';
      ctx.textAlign = 'center';
      ctx.fillText('EXPLODED! 💥', minX, h / 2 - 10);
      ctx.font = '7px var(--font-retro)';
      ctx.fillText('LR TOO HIGH', minX, h / 2 + 10);
      ctx.fillStyle = '#9ca3af';
      ctx.font = '6px var(--font-retro)';
      ctx.fillText('PRESS RESET', minX, h / 2 + 25);
      return;
    }
    
    // Draw Gradient Vector arrow pointing towards the minimum
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    const arrowDir = ballX > minX ? -15 : 15;
    if (Math.abs(ballX - minX) > 5 && ballX >= 0 && ballX <= w && ballY >= 0 && ballY <= h) {
      ctx.moveTo(ballX, ballY);
      ctx.lineTo(ballX + arrowDir, ballY + Math.abs(arrowDir) * 0.5);
      ctx.stroke();
      
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(ballX + arrowDir, ballY + Math.abs(arrowDir) * 0.5, 3, 0, 2*Math.PI);
      ctx.fill();
    }
    
    // Draw Current Weight Ball (only if on screen)
    if (ballX >= -10 && ballX <= w + 10 && ballY >= -10 && ballY <= h + 10) {
      ctx.fillStyle = '#ef4444';
      ctx.shadowColor = 'rgba(239, 68, 68, 0.6)';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(ballX, ballY, 6, 0, 2 * Math.PI);
      ctx.fill();
      ctx.shadowBlur = 0;
      
      // Label at ball
      ctx.fillStyle = '#fff';
      ctx.font = '8px var(--font-mono)';
      ctx.fillText(`Loss: ${state.ml.regression.loss.toFixed(2)}`, ballX, ballY - 12);
    }
  }

  lrInput.addEventListener('input', e => {
    state.ml.regression.lr = parseFloat(e.target.value);
    lrVal.textContent = state.ml.regression.lr.toFixed(2);
  });
  
  let regressionInterval = null;
  btnRegTrain.addEventListener('click', () => {
    if (state.ml.regression.isTraining) {
      clearInterval(regressionInterval);
      state.ml.regression.isTraining = false;
      btnRegTrain.textContent = '🧠 ฝึกฝนโมเดล (Train)';
    } else {
      state.ml.regression.isTraining = true;
      btnRegTrain.textContent = '⏸️ หยุดเทรน';
      regressionInterval = setInterval(() => {
        for (let i = 0; i < 20; i++) { // run 20 epochs per tick for speed
          stepRegression();
        }
        if (state.ml.regression.epoch > 1500) {
          clearInterval(regressionInterval);
          state.ml.regression.isTraining = false;
          btnRegTrain.textContent = '🧠 ฝึกฝนโมเดล (Train)';
        }
      }, 50);
    }
  });

  btnRegReset.addEventListener('click', () => {
    clearInterval(regressionInterval);
    initRegression();
    drawRegression();
    btnRegTrain.textContent = '🧠 ฝึกฝนโมเดล (Train)';
  });

  // --- 3. PHYSICS-INFORMED NEURAL NETWORKS (PINN) vs DNN ---
  
  // Simple Multilayer Perceptron Class
  class SimpleMLP {
    constructor(inputDim, hiddenDim, outputDim) {
      // Initialize weights randomly with a smaller range to prevent tanh saturation over t in [0, 6]
      this.w1 = Array(hiddenDim).fill(0).map(() => Array(inputDim).fill(0).map(() => Math.random() * 0.6 - 0.3));
      this.b1 = Array(hiddenDim).fill(0).map(() => Math.random() * 0.6 - 0.3);
      this.w2 = Array(outputDim).fill(0).map(() => Array(hiddenDim).fill(0).map(() => Math.random() * 0.6 - 0.3));
      this.b2 = Array(outputDim).fill(0).map(() => Math.random() * 0.2 - 0.1);
    }
    
    forward(x) {
      this.h = [];
      for (let i = 0; i < this.w1.length; i++) {
        let z = this.w1[i][0] * x + this.b1[i];
        this.h.push(Math.tanh(z));
      }
      let out = 0;
      for (let i = 0; i < this.w2[0].length; i++) {
        out += this.w2[0][i] * this.h[i];
      }
      out += this.b2[0];
      return out;
    }

    forwardDerivatives(x) {
      const h = [];
      const hiddenDim = this.w1.length;
      for (let i = 0; i < hiddenDim; i++) {
        let z = this.w1[i][0] * x + this.b1[i];
        h.push(Math.tanh(z));
      }
      
      let out = 0;
      let dx = 0;
      let ddx = 0;
      
      for (let i = 0; i < hiddenDim; i++) {
        let hi = h[i];
        let w1_i = this.w1[i][0];
        let w2_i = this.w2[0][i];
        
        out += w2_i * hi;
        
        let dh = (1 - hi * hi) * w1_i;
        dx += w2_i * dh;
        
        let ddh = -2 * hi * (1 - hi * hi) * w1_i * w1_i;
        ddx += w2_i * ddh;
      }
      out += this.b2[0];
      
      return { x: out, dx, ddx };
    }
  }

  // Flatten & restore weights helpers for numerical gradient descent
  function getWeights(net) {
    let w = [];
    for (let i = 0; i < net.w1.length; i++) {
      w.push(net.w1[i][0]);
      w.push(net.b1[i]);
    }
    for (let i = 0; i < net.w2[0].length; i++) {
      w.push(net.w2[0][i]);
    }
    w.push(net.b2[0]);
    return w;
  }

  function setWeights(net, w) {
    let idx = 0;
    for (let i = 0; i < net.w1.length; i++) {
      net.w1[i][0] = w[idx++];
      net.b1[i] = w[idx++];
    }
    for (let i = 0; i < net.w2[0].length; i++) {
      net.w2[0][i] = w[idx++];
    }
    net.b2[0] = w[idx++];
  }

  function computeDnnLoss(net, dataPoints) {
    let loss = 0;
    for (let p of dataPoints) {
      let pred = net.forward(p.t);
      loss += (pred - p.x)**2;
    }
    return loss / dataPoints.length;
  }

  function computePinnLoss(net, dataPoints, collocationPoints, c, k, lambda) {
    // Data Loss
    let dataLoss = 0;
    for (let p of dataPoints) {
      let pred = net.forward(p.t);
      dataLoss += (pred - p.x)**2;
    }
    dataLoss /= dataPoints.length;
    
    // Physics Loss: m * x'' + c * x' + k * x = 0 (m = 1) using analytical derivatives
    let physicsLoss = 0;
    for (let t of collocationPoints) {
      const { x, dx, ddx } = net.forwardDerivatives(t);
      let residual = ddx + c * dx + k * x;
      physicsLoss += residual * residual;
    }
    physicsLoss /= collocationPoints.length;
    
    return {
      total: dataLoss + lambda * physicsLoss,
      dataLoss: dataLoss,
      physLoss: physicsLoss
    };
  }

  // Train one step using numerical finite-difference gradients (fast for 32 params)
  function trainNetworkStep(net, isPinn, dataPoints, collocationPoints, c, k, lambda, lr) {
    let weights = getWeights(net);
    const nParams = weights.length;
    const grads = Array(nParams).fill(0);
    const eps = 1e-4;
    
    // Compute gradients numerically
    for (let i = 0; i < nParams; i++) {
      let orig = weights[i];
      
      // f(w + eps)
      weights[i] = orig + eps;
      setWeights(net, weights);
      let lossPlus = isPinn 
        ? computePinnLoss(net, dataPoints, collocationPoints, c, k, lambda).total
        : computeDnnLoss(net, dataPoints);
        
      // f(w - eps)
      weights[i] = orig - eps;
      setWeights(net, weights);
      let lossMinus = isPinn 
        ? computePinnLoss(net, dataPoints, collocationPoints, c, k, lambda).total
        : computeDnnLoss(net, dataPoints);
        
      weights[i] = orig; // restore
      grads[i] = (lossPlus - lossMinus) / (2 * eps);
    }
    
    // Gradient descent step
    for (let i = 0; i < nParams; i++) {
      // Clamp gradient to prevent exploding (clamped to [-2, 2] for PINN stability)
      let g = Math.max(-2, Math.min(2, grads[i]));
      weights[i] -= lr * g;
    }
    setWeights(net, weights);
  }

  function initPinnProblem() {
    state.ml.pinn.epoch = 0;
    state.ml.pinn.isTraining = false;
    
    // Initialize 2 MLPs (hidden size 10)
    state.ml.pinn.dnnNet = new SimpleMLP(1, 10, 1);
    state.ml.pinn.pinnNet = new SimpleMLP(1, 10, 1);
    
    // Generate Damped Harmonic Oscillator Ground Truth: x(t) = e^(-gamma * t) * cos(omega * t)
    // m = 1, c, k
    const c = state.ml.pinn.damping;
    const k = state.ml.pinn.spring;
    const gamma = c / 2;
    const omega = Math.sqrt(Math.max(0.1, k - gamma*gamma));
    
    state.ml.pinn.groundTruth = [];
    const tMax = 6.0;
    const steps = 100;
    for (let i = 0; i <= steps; i++) {
      let t = (i / steps) * tMax;
      let x = Math.exp(-gamma * t) * Math.cos(omega * t);
      state.ml.pinn.groundTruth.push({ t, x });
    }
    
    // Sample sparse, noisy training points
    state.ml.pinn.dataPoints = [];
    const numPoints = state.ml.pinn.numPoints;
    for (let i = 0; i < numPoints; i++) {
      // Sample spaced out points
      let t = (i / (numPoints - 1)) * (tMax - 0.5) + 0.2;
      let xTrue = Math.exp(-gamma * t) * Math.cos(omega * t);
      // Add noise (e.g. 5% amplitude)
      let noise = (Math.random() - 0.5) * 0.12;
      state.ml.pinn.dataPoints.push({ t, x: xTrue + noise });
    }
    
    // Collocation points for physics loss (denser grid, no labels needed)
    state.ml.pinn.collocationPoints = [];
    for (let i = 0; i < 25; i++) {
      state.ml.pinn.collocationPoints.push((i / 24) * tMax);
    }
    
    calculatePinnLosses();
  }

  function calculatePinnLosses() {
    const dnnLoss = computeDnnLoss(state.ml.pinn.dnnNet, state.ml.pinn.dataPoints);
    const pinnLossResult = computePinnLoss(
      state.ml.pinn.pinnNet, 
      state.ml.pinn.dataPoints, 
      state.ml.pinn.collocationPoints, 
      state.ml.pinn.damping, 
      state.ml.pinn.spring, 
      state.ml.pinn.physicsWeight
    );
    
    state.ml.pinn.dnnLoss = dnnLoss;
    state.ml.pinn.pinnDataLoss = pinnLossResult.dataLoss;
    state.ml.pinn.pinnPhysLoss = pinnLossResult.physLoss;
    
    kpiDnnLoss.textContent = dnnLoss.toFixed(5);
    kpiPinnDataLoss.textContent = pinnLossResult.dataLoss.toFixed(5);
    kpiPinnPhysLoss.textContent = pinnLossResult.physLoss.toFixed(5);
    kpiPinnEpoch.textContent = state.ml.pinn.epoch;
  }

  function drawPinn() {
    const ctx = pinnCanvas.getContext('2d');
    const w = pinnCanvas.width;
    const h = pinnCanvas.height;
    ctx.clearRect(0, 0, w, h);
    
    // Draw Grid
    ctx.strokeStyle = state.theme === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 50) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
    ctx.beginPath(); ctx.moveTo(0, h/2); ctx.lineTo(w, h/2); ctx.stroke();
    
    // Coordinate mapping helpers
    const tMax = 6.0;
    const xMax = 1.2;
    
    function getX(t) { return (t / tMax) * (w - 120) + 30; }
    function getY(x) { return h/2 - (x / xMax) * (h/2 - 20); }
    
    // 1. Draw Ground Truth Curve (Green Dashed)
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.45)';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    state.ml.pinn.groundTruth.forEach((pt, idx) => {
      if (idx === 0) ctx.moveTo(getX(pt.t), getY(pt.x));
      else ctx.lineTo(getX(pt.t), getY(pt.x));
    });
    ctx.stroke();
    ctx.setLineDash([]); // reset
    
    // 2. Draw DNN Curve (Red)
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.85)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let i = 0; i <= 100; i++) {
      let t = (i / 100) * tMax;
      let x = state.ml.pinn.dnnNet.forward(t);
      if (i === 0) ctx.moveTo(getX(t), getY(x));
      else ctx.lineTo(getX(t), getY(x));
    }
    ctx.stroke();
    
    // 3. Draw PINN Curve (Blue/Indigo)
    ctx.strokeStyle = 'rgba(99, 102, 241, 0.9)';
    ctx.lineWidth = 2.5;
    ctx.shadowColor = 'rgba(99, 102, 241, 0.3)';
    ctx.shadowBlur = 6;
    ctx.beginPath();
    for (let i = 0; i <= 100; i++) {
      let t = (i / 100) * tMax;
      let x = state.ml.pinn.pinnNet.forward(t);
      if (i === 0) ctx.moveTo(getX(t), getY(x));
      else ctx.lineTo(getX(t), getY(x));
    }
    ctx.stroke();
    ctx.shadowBlur = 0; // reset
    
    // 4. Draw Noisy Training Points (Yellow Circles)
    state.ml.pinn.dataPoints.forEach(pt => {
      ctx.fillStyle = '#ffea00';
      ctx.strokeStyle = '#0a0e17';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(getX(pt.t), getY(pt.x), 5, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
    });
    
    // 5. Draw Damped Spring-Mass Visual on the right side
    drawSpringMassVisual(ctx, w, h);
  }

  function drawSpringMassVisual(ctx, canvasWidth, canvasHeight) {
    const ry = canvasHeight / 2;
    const tMax = 6.0;
    const xMax = 1.2;
    state.ml.pinn.animationTime += 0.04;
    const t = (state.ml.pinn.animationTime % tMax);
    
    // Get predictions from DNN and PINN
    const xDnn = state.ml.pinn.dnnNet ? state.ml.pinn.dnnNet.forward(t) : 0;
    const xPinn = state.ml.pinn.pinnNet ? state.ml.pinn.pinnNet.forward(t) : 0;
    
    // Map displacement to visual Y offset (center at ry)
    const massYDnn = ry - (xDnn / xMax) * 60;
    const massYPinn = ry - (xPinn / xMax) * 60;
    
    const numCoils = 8;
    
    // --- DRAW DNN SYSTEM (LEFT - NO DAMPER, OVERFITTING) ---
    const rxDnn = canvasWidth - 85;
    
    // Ceiling anchor (Retro blocky style)
    ctx.fillStyle = '#4b5563';
    ctx.fillRect(rxDnn - 20, 16, 40, 6);
    ctx.fillStyle = '#1f2937';
    ctx.fillRect(rxDnn - 20, 22, 40, 2);
    
    // Spring (Thick retro zig-zag)
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(rxDnn, 24);
    const springLenDnn = massYDnn - 16 - 24;
    for (let i = 0; i < numCoils; i++) {
      let phase = i / numCoils;
      let sy = 24 + phase * springLenDnn;
      let sx = rxDnn + (i % 2 === 0 ? 8 : -8);
      ctx.lineTo(Math.round(sx / 2) * 2, Math.round(sy / 2) * 2);
    }
    ctx.lineTo(rxDnn, massYDnn - 16);
    ctx.stroke();
    
    // Mass Box (Retro metal block)
    ctx.fillStyle = '#ef4444'; // Main body
    ctx.fillRect(rxDnn - 15, massYDnn - 15, 30, 30);
    ctx.strokeStyle = '#7f1d1d'; // Dark border
    ctx.lineWidth = 2;
    ctx.strokeRect(rxDnn - 15, massYDnn - 15, 30, 30);
    ctx.fillStyle = '#fee2e2'; // Light highlight (top-left)
    ctx.fillRect(rxDnn - 13, massYDnn - 13, 26, 2);
    ctx.fillRect(rxDnn - 13, massYDnn - 13, 2, 26);
    
    ctx.fillStyle = '#fff';
    ctx.font = '7px var(--font-retro)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('DNN', rxDnn, massYDnn);
    
    // --- DRAW PINN SYSTEM (RIGHT - WITH DAMPER, PHYSICALLY CORRECT) ---
    const rxPinn = canvasWidth - 35;
    
    // Ceiling anchor
    ctx.fillStyle = '#4b5563';
    ctx.fillRect(rxPinn - 20, 16, 40, 6);
    ctx.fillStyle = '#1f2937';
    ctx.fillRect(rxPinn - 20, 22, 40, 2);
    
    // Spring (Thick retro zig-zag)
    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(rxPinn, 24);
    const springLenPinn = massYPinn - 16 - 24;
    for (let i = 0; i < numCoils; i++) {
      let phase = i / numCoils;
      let sy = 24 + phase * springLenPinn;
      let sx = rxPinn + (i % 2 === 0 ? 8 : -8);
      ctx.lineTo(Math.round(sx / 2) * 2, Math.round(sy / 2) * 2);
    }
    ctx.lineTo(rxPinn, massYPinn - 16);
    ctx.stroke();
    
    // Damper (Piston) for PINN (Retro blocky hydraulic cylinder)
    const dx = rxPinn - 22;
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2;
    // Rod
    ctx.beginPath();
    ctx.moveTo(dx, 24);
    ctx.lineTo(dx, massYPinn - 6);
    ctx.stroke();
    // Piston Head
    ctx.fillStyle = '#10b981';
    ctx.fillRect(dx - 4, massYPinn - 6, 8, 3);
    // Cylinder Body
    ctx.strokeStyle = '#065f46';
    ctx.strokeRect(dx - 6, massYPinn - 3, 12, 16);
    ctx.fillStyle = 'rgba(16, 185, 129, 0.2)';
    ctx.fillRect(dx - 5, massYPinn - 2, 10, 14);
    
    // Mass Box (Retro metal block)
    ctx.fillStyle = '#6366f1';
    ctx.fillRect(rxPinn - 15, massYPinn - 15, 30, 30);
    ctx.strokeStyle = '#312e81';
    ctx.lineWidth = 2;
    ctx.strokeRect(rxPinn - 15, massYPinn - 15, 30, 30);
    ctx.fillStyle = '#e0e7ff'; // Light highlight
    ctx.fillRect(rxPinn - 13, massYPinn - 13, 26, 2);
    ctx.fillRect(rxPinn - 13, massYPinn - 13, 2, 26);
    
    ctx.fillStyle = '#fff';
    ctx.font = '7px var(--font-retro)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('PINN', rxPinn, massYPinn);
    
    // Time Label
    ctx.fillStyle = 'var(--text-secondary)';
    ctx.font = '8px var(--font-mono)';
    ctx.textAlign = 'right';
    ctx.fillText(`TIME: ${t.toFixed(2)}s`, canvasWidth - 10, canvasHeight - 15);
  }

  // Live NN training loop
  let pinnInterval = null;
  function runPinnTraining() {
    if (!state.ml.pinn.isTraining) return;
    
    // Run 10 training epochs per frame for speed
    const lr = 0.015;
    for (let e = 0; e < 10; e++) {
      // 1. Train DNN (Pure data-driven)
      trainNetworkStep(state.ml.pinn.dnnNet, false, state.ml.pinn.dataPoints, null, null, null, null, lr);
      
      // 2. Train PINN (Data + Physics)
      trainNetworkStep(
        state.ml.pinn.pinnNet, 
        true, 
        state.ml.pinn.dataPoints, 
        state.ml.pinn.collocationPoints, 
        state.ml.pinn.damping, 
        state.ml.pinn.spring, 
        state.ml.pinn.physicsWeight, 
        lr
      );
      state.ml.pinn.epoch++;
    }
    
    calculatePinnLosses();
    drawPinn();
    
    if (state.ml.pinn.epoch < 1000) {
      requestAnimationFrame(runPinnTraining);
    } else {
      state.ml.pinn.isTraining = false;
      btnPinnTrain.textContent = '⚙️ Train AI Models';
    }
  }

  btnPinnTrain.addEventListener('click', () => {
    if (state.ml.pinn.isTraining) {
      state.ml.pinn.isTraining = false;
      btnPinnTrain.textContent = '⚙️ Train AI Models';
    } else {
      state.ml.pinn.isTraining = true;
      btnPinnTrain.textContent = '⏸️ หยุดเทรน';
      requestAnimationFrame(runPinnTraining);
    }
  });

  btnPinnResample.addEventListener('click', () => {
    state.ml.pinn.isTraining = false;
    btnPinnTrain.textContent = '⚙️ Train AI Models';
    initPinnProblem();
    drawPinn();
  });

  // Handle PINN sliders
  pinnCInput.addEventListener('input', e => {
    state.ml.pinn.damping = parseFloat(e.target.value);
    pinnCVal.textContent = state.ml.pinn.damping.toFixed(2);
    initPinnProblem();
    drawPinn();
  });
  pinnKInput.addEventListener('input', e => {
    state.ml.pinn.spring = parseFloat(e.target.value);
    pinnKVal.textContent = state.ml.pinn.spring.toFixed(2);
    initPinnProblem();
    drawPinn();
  });
  pinnPointsInput.addEventListener('input', e => {
    state.ml.pinn.numPoints = parseInt(e.target.value);
    pinnPointsVal.textContent = state.ml.pinn.numPoints + ' จุด';
    initPinnProblem();
    drawPinn();
  });
  pinnWeightInput.addEventListener('input', e => {
    state.ml.pinn.physicsWeight = parseFloat(e.target.value);
    pinnWeightVal.textContent = state.ml.pinn.physicsWeight.toFixed(2);
    initPinnProblem();
    drawPinn();
  });

  // Loop to keep spring mass visual animating even when not training
  function drawPinnVisualLoop() {
    if (state.activePage === 'ml') {
      drawPinn();
    }
    requestAnimationFrame(drawPinnVisualLoop);
  }
  requestAnimationFrame(drawPinnVisualLoop);

  function stopMlLoops() {
    clearInterval(regressionInterval);
    state.ml.regression.isTraining = false;
    state.ml.pinn.isTraining = false;
    if (btnRegTrain) btnRegTrain.textContent = '🧠 ฝึกฝนโมเดล (Train)';
    if (btnPinnTrain) btnPinnTrain.textContent = '⚙️ Train AI Models';
  }

  // ==========================================
  // PAGE 5: SMART TRAFFIC LIGHT INTERSECTION
  // ==========================================
  const trafficCanvas = document.getElementById('traffic-canvas');
  const kpiTrafficLogic = document.getElementById('kpi-traffic-logic');
  const kpiTrafficWait = document.getElementById('kpi-traffic-wait');
  const kpiTrafficMaxQueue = document.getElementById('kpi-traffic-max-queue');
  const kpiTrafficThroughput = document.getElementById('kpi-traffic-throughput');
  
  const trafficLogicTabBtns = document.querySelectorAll('#traffic-logic-tabs .algo-tab-btn');
  const trafficDensityInput = document.getElementById('traffic-density-input');
  const trafficDensityVal = document.getElementById('traffic-density-val');
  
  const btnTrafficStart = document.getElementById('btn-traffic-start');
  const btnTrafficReset = document.getElementById('btn-traffic-reset');
  const trafficExplainCard = document.getElementById('traffic-explain-card');

  function updateTrafficUI() {
    let avgWait = 0;
    if (state.traffic.waitTimesList.length > 0) {
      avgWait = state.traffic.waitTimesList.reduce((a, b) => a + b, 0) / state.traffic.waitTimesList.length;
    }
    
    kpiTrafficWait.innerHTML = `${avgWait.toFixed(1)}<span class="kpi-unit">วินาที</span>`;
    kpiTrafficMaxQueue.innerHTML = `${state.traffic.maxQueueLength}<span class="kpi-unit">คัน</span>`;
    kpiTrafficThroughput.innerHTML = `${state.traffic.totalCarsPassed}<span class="kpi-unit">คัน</span>`;
    
    let logicLabel = '⏱️ Fixed Time';
    let explainText = '';
    
    if (state.traffic.activeLogic === 'smart') {
      logicLabel = '🔌 Smart Sensors';
      explainText = `
        <p><strong>ตรรกะแบบ Smart Actuated (Rule-Based):</strong></p>
        <ul style="margin-left: 1.5rem; margin-top: 0.5rem; list-style-type: square;">
          <li>สี่แยกจะติดตั้งเซนเซอร์ตรวจวัดกระแสรถยนต์ใต้พื้นถนน (เส้นประสีชมพู)</li>
          <li><strong>กฎเงื่อนไข (If-Else):</strong> หากสถานีสีเขียวไม่มีรถเหลืออยู่เลย <em>และ</em> มีรถติดอยู่ที่ทิศอื่น ไฟจะสลับไปเขียวทิศนั้นทันทีโดยไม่ต้องรอให้หมดเวลา</li>
          <li>ลดปัญหาการ "ปล่อยไฟเขียวว่างเปล่า" เมื่อไม่มีรถวิ่ง ช่วยให้สายทางจราจรเกิด Flow ที่รวดเร็วขึ้นอย่างชัดเจน</li>
        </ul>
      `;
    } else if (state.traffic.activeLogic === 'ai') {
      logicLabel = '🧠 AI Queue';
      explainText = `
        <p><strong>ตรรกะแบบ AI Queue Length Minimization (Optimization):</strong></p>
        <ul style="margin-left: 1.5rem; margin-top: 0.5rem; list-style-type: square;">
          <li>อัลกอริทึมจะคอยมอนิเตอร์ความยาวคิวรถสะสม (Queue Length) ของทิศทางต่างๆ อย่างต่อเนื่อง</li>
          <li>ทุกๆ 8 วินาที ระบบจะตัดสินใจเลือกปล่อยไฟเขียวให้แก่ <strong>ทิศทางที่มีคิวรถสะสมมากที่สุดเป็นอันดับ 1</strong> เพื่อลดการเกิดขยะในระบบ (WIP หรือคิวรอสะสม)</li>
          <li>สอนให้นักศึกษาเข้าใจหลักการของการมองปัญหารวมเป็นระบบ ค้นหาทิศทางที่มีความหนาแน่นสูงเพื่อระบายคอขวดออกก่อน</li>
        </ul>
      `;
    } else {
      explainText = `
        <p><strong>ตรรกะแบบ Fixed Time (ตั้งเวลาคงที่):</strong></p>
        <ul style="margin-left: 1.5rem; margin-top: 0.5rem; list-style-type: square;">
          <li>เป็นระบบควบคุมไฟจราจรแบบดั้งเดิมที่เรียบง่ายที่สุด โดยสลับทิศทางปล่อยรถวนตามเข็มนาฬิกาทุกๆ 12 วินาทีอย่างเท่าเทียม</li>
          <li><strong>ข้อเสียหลัก:</strong> หากมีทิศทางใดทิศหนึ่งรถหนาแน่นเป็นพิเศษ หรือบางทิศทางไม่มีรถเลย ระบบก็จะไม่สามารถปรับเปลี่ยนเวลาตามใจได้</li>
          <li>ทำให้นักศึกษาได้เปรียบเทียบข้อดีข้อเสียระหว่างระบบควบคุมแบบดั้งเดิมกับระบบอัจฉริยะแบบป้อนกลับ (Feedback-Loop)</li>
        </ul>
      `;
    }
    
    kpiTrafficLogic.textContent = logicLabel;
    if (trafficExplainCard) trafficExplainCard.innerHTML = explainText;
  }

  function getRandomCarColor() {
    const colors = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4', '#f43f5e'];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  function initTrafficProblem() {
    state.traffic.totalCarsPassed = 0;
    state.traffic.totalWaitTime = 0;
    state.traffic.maxQueueLength = 0;
    state.traffic.waitTimesList = [];
    state.traffic.fixedTimer = 0;
    state.traffic.yellowTimer = 0;
    state.traffic.currentGreenLaneIdx = 0;
    
    state.traffic.lanes = [
      { dir: 'North', queue: [], light: 'green', timer: 0, spawnAccumulator: 0 },
      { dir: 'East', queue: [], light: 'red', timer: 0, spawnAccumulator: 0 },
      { dir: 'South', queue: [], light: 'red', timer: 0, spawnAccumulator: 0 },
      { dir: 'West', queue: [], light: 'red', timer: 0, spawnAccumulator: 0 }
    ];
    
    for (let i = 0; i < 4; i++) {
      const lane = state.traffic.lanes[i];
      const count = Math.floor(Math.random() * 3) + 1;
      for (let c = 0; c < count; c++) {
        lane.queue.push({
          id: Math.random(),
          progress: 0.85 - c * 0.12,
          color: getRandomCarColor(),
          spawnTime: performance.now()
        });
      }
    }
    
    updateTrafficUI();
  }

  function stopTrafficLoop() {
    state.traffic.isRunning = false;
    if (state.traffic.animationFrameId) {
      cancelAnimationFrame(state.traffic.animationFrameId);
      state.traffic.animationFrameId = null;
    }
  }

  function startTrafficLoop() {
    stopTrafficLoop();
    state.traffic.isRunning = true;
    state.traffic.lastTickTime = performance.now();
    
    function loop(now) {
      if (!state.traffic.isRunning) return;
      const dt = Math.min(0.1, (now - state.traffic.lastTickTime) / 1000);
      state.traffic.lastTickTime = now;
      
      trafficSimulationTick(dt);
      drawTraffic();
      
      state.traffic.animationFrameId = requestAnimationFrame(loop);
    }
    state.traffic.animationFrameId = requestAnimationFrame(loop);
  }

  function triggerTrafficSwitch(nextIdx) {
    const currentIdx = state.traffic.currentGreenLaneIdx;
    if (currentIdx === nextIdx) return;
    
    state.traffic.lanes[currentIdx].light = 'yellow';
    state.traffic.yellowTimer = 2.0;
    state.traffic.currentGreenLaneIdx = nextIdx;
  }

  function trafficSimulationTick(dt) {
    const density = state.traffic.density;
    const spawnInterval = density > 0 ? (150 / density) : 999999;
    
    state.traffic.lanes.forEach(lane => {
      lane.spawnAccumulator += dt;
      if (lane.spawnAccumulator >= spawnInterval && lane.queue.length < 8) {
        lane.queue.push({
          id: Math.random(),
          progress: 0,
          color: getRandomCarColor(),
          spawnTime: performance.now()
        });
        lane.spawnAccumulator = 0;
      }
    });
    
    // Update progress of cars in each lane
    state.traffic.lanes.forEach((lane) => {
      const isGreen = lane.light === 'green';
      
      lane.queue.forEach((car, carIdx) => {
        let targetProgress = 1.2; // can exit the screen
        
        if (car.progress > 0.8) {
          // If the car has already crossed the stop line, it must clear the intersection
          targetProgress = 1.2;
        } else {
          // If it hasn't crossed the stop line yet
          if (isGreen) {
            targetProgress = (carIdx === 0) ? 1.2 : (lane.queue[carIdx - 1].progress - 0.12);
          } else {
            targetProgress = (carIdx === 0) ? 0.8 : Math.min(lane.queue[carIdx - 1].progress - 0.12, 0.8);
          }
        }
        
        // Move towards target progress (speed is 0.4 units per second)
        if (car.progress < targetProgress) {
          car.progress = Math.min(targetProgress, car.progress + dt * 0.4);
        }
      });
      
      // Check if the front car has cleared the intersection
      if (lane.queue.length > 0 && lane.queue[0].progress >= 1.2) {
        const passedCar = lane.queue.shift();
        state.traffic.totalCarsPassed++;
        const waitTime = (performance.now() - passedCar.spawnTime) / 1000;
        state.traffic.waitTimesList.push(waitTime);
        // Keep list size reasonable
        if (state.traffic.waitTimesList.length > 50) {
          state.traffic.waitTimesList.shift();
        }
      }
    });
    
    let currentMaxQ = 0;
    state.traffic.lanes.forEach(l => {
      if (l.queue.length > currentMaxQ) currentMaxQ = l.queue.length;
    });
    if (currentMaxQ > state.traffic.maxQueueLength) {
      state.traffic.maxQueueLength = currentMaxQ;
    }
    
    if (state.traffic.yellowTimer > 0) {
      state.traffic.yellowTimer -= dt;
      if (state.traffic.yellowTimer <= 0) {
        state.traffic.lanes.forEach((l, idx) => {
          if (idx === state.traffic.currentGreenLaneIdx) {
            l.light = 'green';
          } else {
            l.light = 'red';
          }
        });
        state.traffic.fixedTimer = 0;
      }
    } else {
      state.traffic.fixedTimer += dt;
      const currentIdx = state.traffic.currentGreenLaneIdx;
      const logic = state.traffic.activeLogic;
      
      const otherLanesHaveQueue = state.traffic.lanes.some((l, idx) => idx !== currentIdx && l.queue.length > 0 && l.queue[0].progress >= 0.8);
      
      if (logic === 'fixed') {
        if (state.traffic.fixedTimer >= 12.0) {
          triggerTrafficSwitch((currentIdx + 1) % 4);
        }
      } else if (logic === 'smart') {
        const currentLaneEmpty = state.traffic.lanes[currentIdx].queue.length === 0 || state.traffic.lanes[currentIdx].queue[0].progress > 1.0;
        if (currentLaneEmpty && otherLanesHaveQueue) {
          let nextIdx = currentIdx;
          for (let i = 1; i <= 4; i++) {
            const testIdx = (currentIdx + i) % 4;
            if (state.traffic.lanes[testIdx].queue.length > 0) {
              nextIdx = testIdx;
              break;
            }
          }
          triggerTrafficSwitch(nextIdx);
        } else if (state.traffic.fixedTimer >= 8.0 && otherLanesHaveQueue) {
          triggerTrafficSwitch((currentIdx + 1) % 4);
        }
      } else if (logic === 'ai') {
        // AI Queue Length Minimization: every 8s, switch to the lane with the longest queue
        if (state.traffic.fixedTimer >= 8.0) {
          let longestQueueIdx = currentIdx;
          let maxQ = state.traffic.lanes[currentIdx].queue.length;
          
          state.traffic.lanes.forEach((l, idx) => {
            if (l.queue.length > maxQ) {
              maxQ = l.queue.length;
              longestQueueIdx = idx;
            }
          });
          
          if (longestQueueIdx !== currentIdx) {
            triggerTrafficSwitch(longestQueueIdx);
          } else {
            // Reset timer even if we stay green
            state.traffic.fixedTimer = 0;
          }
        }
      }
    }

    updateTrafficUI();
  }

  function getCarCoords(laneDir, progress) {
    const cx = 275;
    const cy = 175;
    const w = 550;
    const h = 350;
    const roadHalfWidth = 40;
    
    let x, y, angle;
    
    if (laneDir === 'North') {
      x = cx - 20;
      angle = Math.PI / 2; // facing down
      if (progress <= 0.8) {
        y = (progress / 0.8) * (cy - roadHalfWidth);
      } else {
        y = (cy - roadHalfWidth) + ((progress - 0.8) / 0.4) * (h - (cy - roadHalfWidth));
      }
    } else if (laneDir === 'East') {
      y = cy - 20;
      angle = Math.PI; // facing left
      if (progress <= 0.8) {
        x = w - (progress / 0.8) * (w - (cx + roadHalfWidth));
      } else {
        x = (cx + roadHalfWidth) - ((progress - 0.8) / 0.4) * (cx + roadHalfWidth);
      }
    } else if (laneDir === 'South') {
      x = cx + 20;
      angle = -Math.PI / 2; // facing up
      if (progress <= 0.8) {
        y = h - (progress / 0.8) * (h - (cy + roadHalfWidth));
      } else {
        y = (cy + roadHalfWidth) - ((progress - 0.8) / 0.4) * (cy + roadHalfWidth);
      }
    } else if (laneDir === 'West') {
      y = cy + 20;
      angle = 0; // facing right
      if (progress <= 0.8) {
        x = (progress / 0.8) * (cx - roadHalfWidth);
      } else {
        x = (cx - roadHalfWidth) + ((progress - 0.8) / 0.4) * (w - (cx - roadHalfWidth));
      }
    }
    return { x, y, angle };
  }

  function drawTraffic() {
    const ctx = trafficCanvas.getContext('2d');
    const w = trafficCanvas.width;
    const h = trafficCanvas.height;
    ctx.clearRect(0, 0, w, h);
    
    const isDark = state.theme === 'dark';
    
    // 1. Background (grass/ground)
    ctx.fillStyle = isDark ? '#0f172a' : '#f3f4f6';
    ctx.fillRect(0, 0, w, h);
    
    // Draw green background elements in the 4 corners
    ctx.fillStyle = isDark ? '#14532d' : '#dcfce7';
    ctx.fillRect(10, 10, 275 - 40 - 20, 175 - 40 - 20);
    ctx.fillRect(275 + 40 + 10, 10, w - (275 + 40 + 20), 175 - 40 - 20);
    ctx.fillRect(10, 175 + 40 + 10, 275 - 40 - 20, h - (175 + 40 + 20));
    ctx.fillRect(275 + 40 + 10, 175 + 40 + 10, w - (275 + 40 + 20), h - (175 + 40 + 20));
    
    const cx = 275;
    const cy = 175;
    const roadHalfWidth = 40;
    
    // 2. Roads
    ctx.fillStyle = isDark ? '#1e293b' : '#e5e7eb';
    ctx.fillRect(cx - roadHalfWidth, 0, roadHalfWidth * 2, h);
    ctx.fillRect(0, cy - roadHalfWidth, w, roadHalfWidth * 2);
    
    // Center Intersection Box
    ctx.fillStyle = isDark ? '#334155' : '#cbd5e1';
    ctx.fillRect(cx - roadHalfWidth, cy - roadHalfWidth, roadHalfWidth * 2, roadHalfWidth * 2);
    
    // Center yellow divider lines (dashed)
    ctx.strokeStyle = '#eab308';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(cx, 0); ctx.lineTo(cx, cy - roadHalfWidth);
    ctx.moveTo(cx, cy + roadHalfWidth); ctx.lineTo(cx, h);
    ctx.moveTo(0, cy); ctx.lineTo(cx - roadHalfWidth, cy);
    ctx.moveTo(cx + roadHalfWidth, cy); ctx.lineTo(w, cy);
    ctx.stroke();
    
    // 3. Stop lines (solid white)
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(cx - roadHalfWidth, cy - roadHalfWidth); ctx.lineTo(cx, cy - roadHalfWidth);
    ctx.moveTo(cx + roadHalfWidth, cy - roadHalfWidth); ctx.lineTo(cx + roadHalfWidth, cy);
    ctx.moveTo(cx, cy + roadHalfWidth); ctx.lineTo(cx + roadHalfWidth, cy + roadHalfWidth);
    ctx.moveTo(cx - roadHalfWidth, cy); ctx.lineTo(cx - roadHalfWidth, cy + roadHalfWidth);
    ctx.stroke();
    
    // 4. Zebra Crossings (pedestrian)
    function drawZebra(x, y, w, h, isVertical) {
      ctx.fillStyle = isDark ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.9)';
      const step = 8;
      if (isVertical) {
        for (let currY = y; currY < y + h; currY += step) {
          ctx.fillRect(x, currY, w, 4);
        }
      } else {
        for (let currX = x; currX < x + w; currX += step) {
          ctx.fillRect(currX, y, 4, h);
        }
      }
    }
    
    drawZebra(cx - roadHalfWidth, cy - roadHalfWidth - 16, roadHalfWidth * 2, 10, false);
    drawZebra(cx - roadHalfWidth, cy + roadHalfWidth + 6, roadHalfWidth * 2, 10, false);
    drawZebra(cx - roadHalfWidth - 16, cy - roadHalfWidth, 10, roadHalfWidth * 2, true);
    drawZebra(cx + roadHalfWidth + 6, cy - roadHalfWidth, 10, roadHalfWidth * 2, true);
    
    // 5. Draw Smart Sensors (if active)
    if (state.traffic.activeLogic === 'smart') {
      ctx.strokeStyle = 'rgba(236, 72, 153, 0.6)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 3]);
      ctx.strokeRect(cx - 30, cy - 90, 20, 45);
      ctx.strokeRect(cx + 45, cy - 30, 45, 20);
      ctx.strokeRect(cx + 10, cy + 45, 20, 45);
      ctx.strokeRect(cx - 90, cy + 10, 45, 20);
      ctx.setLineDash([]);
    }
    
    // 6. Draw Traffic Lights
    state.traffic.lanes.forEach((lane) => {
      let lx, ly;
      let isVert = false;
      if (lane.dir === 'North') {
        lx = cx - roadHalfWidth - 15;
        ly = cy - roadHalfWidth - 25;
        isVert = true;
      } else if (lane.dir === 'East') {
        lx = cx + roadHalfWidth + 5;
        ly = cy - roadHalfWidth - 15;
        isVert = false;
      } else if (lane.dir === 'South') {
        lx = cx + roadHalfWidth + 5;
        ly = cy + roadHalfWidth + 5;
        isVert = true;
      } else if (lane.dir === 'West') {
        lx = cx - roadHalfWidth - 25;
        ly = cy + roadHalfWidth + 5;
        isVert = false;
      }
      
      // Draw housing
      ctx.fillStyle = '#1e293b';
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 1.5;
      if (isVert) {
        ctx.fillRect(lx, ly, 10, 22);
        ctx.strokeRect(lx, ly, 10, 22);
      } else {
        ctx.fillRect(lx, ly, 22, 10);
        ctx.strokeRect(lx, ly, 22, 10);
      }
      
      // Draw light circles (Red, Yellow, Green)
      const rColor = lane.light === 'red' ? '#ef4444' : '#451a1a';
      const yColor = lane.light === 'yellow' ? '#fbbf24' : '#45351a';
      const gColor = lane.light === 'green' ? '#10b981' : '#143026';
      
      if (isVert) {
        ctx.fillStyle = rColor;
        ctx.beginPath(); ctx.arc(lx + 5, ly + 4, 3, 0, 2*Math.PI); ctx.fill();
        ctx.fillStyle = yColor;
        ctx.beginPath(); ctx.arc(lx + 5, ly + 11, 3, 0, 2*Math.PI); ctx.fill();
        ctx.fillStyle = gColor;
        ctx.beginPath(); ctx.arc(lx + 5, ly + 18, 3, 0, 2*Math.PI); ctx.fill();
      } else {
        ctx.fillStyle = rColor;
        ctx.beginPath(); ctx.arc(lx + 4, ly + 5, 3, 0, 2*Math.PI); ctx.fill();
        ctx.fillStyle = yColor;
        ctx.beginPath(); ctx.arc(lx + 11, ly + 5, 3, 0, 2*Math.PI); ctx.fill();
        ctx.fillStyle = gColor;
        ctx.beginPath(); ctx.arc(lx + 18, ly + 5, 3, 0, 2*Math.PI); ctx.fill();
      }
      
      // Add glow if active
      if (lane.light === 'red' || lane.light === 'green' || lane.light === 'yellow') {
        ctx.save();
        ctx.shadowBlur = 8;
        if (lane.light === 'red') {
          ctx.shadowColor = '#ef4444';
          ctx.fillStyle = '#ef4444';
          ctx.beginPath(); ctx.arc(isVert ? lx + 5 : lx + 4, isVert ? ly + 4 : ly + 5, 3.5, 0, 2*Math.PI); ctx.fill();
        } else if (lane.light === 'yellow') {
          ctx.shadowColor = '#fbbf24';
          ctx.fillStyle = '#fbbf24';
          ctx.beginPath(); ctx.arc(isVert ? lx + 5 : lx + 11, isVert ? ly + 11 : ly + 5, 3.5, 0, 2*Math.PI); ctx.fill();
        } else if (lane.light === 'green') {
          ctx.shadowColor = '#10b981';
          ctx.fillStyle = '#10b981';
          ctx.beginPath(); ctx.arc(isVert ? lx + 5 : lx + 18, isVert ? ly + 18 : ly + 5, 3.5, 0, 2*Math.PI); ctx.fill();
        }
        ctx.restore();
      }
    });
    
    // 7. Draw Cars
    state.traffic.lanes.forEach(lane => {
      lane.queue.forEach(car => {
        const { x, y, angle } = getCarCoords(lane.dir, car.progress);
        
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);
        
        // Draw tires
        ctx.fillStyle = '#000000';
        ctx.fillRect(-8, -7, 3, 2); // front-left
        ctx.fillRect(5, -7, 3, 2);  // rear-left
        ctx.fillRect(-8, 5, 3, 2);  // front-right
        ctx.fillRect(5, 5, 3, 2);   // rear-right
        
        // Draw car body
        ctx.fillStyle = car.color;
        ctx.fillRect(-10, -5, 20, 10);
        
        // Draw roof/windshield
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(-3, -4, 8, 8);
        ctx.fillStyle = '#bae6fd'; // windshield
        ctx.fillRect(1, -3, 2, 6);
        ctx.fillStyle = '#f8fafc'; // rear window
        ctx.fillRect(-3, -3, 1, 6);
        
        // Draw headlights
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(9, -4, 1, 2);
        ctx.fillRect(9, 2, 1, 2);
        
        ctx.restore();
      });
    });
  }

  // Bind Event Listeners for Traffic Section
  btnTrafficStart.addEventListener('click', () => {
    if (state.traffic.isRunning) {
      stopTrafficLoop();
      btnTrafficStart.innerHTML = '<span>▶️</span> เริ่มจำลอง';
    } else {
      startTrafficLoop();
      btnTrafficStart.innerHTML = '<span>⏸️</span> หยุดจำลอง';
    }
  });

  btnTrafficReset.addEventListener('click', () => {
    stopTrafficLoop();
    initTrafficProblem();
    drawTraffic();
    btnTrafficStart.innerHTML = '<span>▶️</span> เริ่มจำลอง';
  });

  trafficDensityInput.addEventListener('input', e => {
    state.traffic.density = parseInt(e.target.value);
    trafficDensityVal.textContent = state.traffic.density + '%';
  });

  trafficLogicTabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      trafficLogicTabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.traffic.activeLogic = btn.getAttribute('data-logic');
      updateTrafficUI();
      state.traffic.fixedTimer = 0;
      if (!state.traffic.isRunning) {
        drawTraffic();
      }
    });
  });

  let lpInitialized = false;
  function initLpSection() {
    if (lpInitialized || !lpTableBody) return;
    
    const days = ['จันทร์ (Mon)', 'อังคาร (Tue)', 'พุธ (Wed)', 'พฤหัสบดี (Thu)', 'ศุกร์ (Fri)'];
    const demands = state.ml.lp.demands;
    const production = state.ml.lp.production;
    
    let html = '';
    for (let t = 0; t < 5; t++) {
      const D = demands[t];
      const P = production[t];
      
      html += `
        <tr style="border-bottom: 1px solid var(--border-color); height: 42px;">
          <td style="text-align: left; padding: 0.5rem; font-weight: bold;">${days[t]}</td>
          <td style="padding: 0.5rem; font-family: var(--font-mono);">${D} ชิ้น</td>
          <td style="padding: 0.5rem; text-align: center;">
            <div style="display: flex; align-items: center; gap: 0.5rem; justify-content: center;">
              <input type="range" min="0" max="90" step="5" value="${P}" data-day="${t}" class="lp-prod-slider" id="lp-slider-${t}" style="width: 100px; margin: 0; cursor: pointer;">
              <span id="lp-prod-val-${t}" style="font-family: var(--font-mono); width: 30px; text-align: right; font-weight: bold; color: var(--color-cyan);">${P}</span>
            </div>
          </td>
          <td id="lp-cap-val-${t}" style="padding: 0.5rem; font-family: var(--font-mono); font-size: 0.75rem;">
            เวลาปกติ
          </td>
          <td id="lp-eq-val-${t}" style="padding: 0.5rem; font-family: var(--font-mono); color: var(--text-secondary); font-size: 0.75rem;">
            -
          </td>
          <td id="lp-inv-val-${t}" style="padding: 0.5rem; font-family: var(--font-mono);">
            0 ชิ้น
          </td>
        </tr>
      `;
    }
    
    lpTableBody.innerHTML = html;
    
    // Bind listeners once
    for (let t = 0; t < 5; t++) {
      const slider = document.getElementById(`lp-slider-${t}`);
      if (slider) {
        slider.addEventListener('input', e => {
          const val = parseInt(e.target.value);
          state.ml.lp.production[t] = val;
          document.getElementById(`lp-prod-val-${t}`).textContent = val;
          updateLpSolution();
        });
      }
    }
    
    lpInitialized = true;
  }

  function updateLpSolution() {
    initLpSection();
    
    const demands = state.ml.lp.demands;
    const production = state.ml.lp.production;
    
    let prevInventory = 0;
    let totalHolding = 0;
    let totalOT = 0;
    let totalShortage = 0;
    let hasOverCapacity = false;
    let hasShortage = false;
    
    for (let t = 0; t < 5; t++) {
      const D = demands[t];
      const P = production[t];
      const I = prevInventory + P - D;
      
      const isOT = P > 70;
      const otAmount = Math.max(0, P - 70);
      const isOverCap = P > 90;
      if (isOverCap) hasOverCapacity = true;
      
      const isShort = I < 0;
      if (isShort) hasShortage = true;
      
      // Calculate daily costs
      if (I > 0) totalHolding += I * 10;
      if (I < 0) totalShortage += (-I) * 100;
      totalOT += otAmount * 50;
      
      // Update cells in-place
      const capCell = document.getElementById(`lp-cap-val-${t}`);
      const eqCell = document.getElementById(`lp-eq-val-${t}`);
      const invCell = document.getElementById(`lp-inv-val-${t}`);
      
      const invClass = isShort ? 'color: var(--color-rose); font-weight: bold;' : 'color: var(--color-emerald);';
      const capClass = isOverCap ? 'color: var(--color-rose); font-weight: bold;' : (isOT ? 'color: var(--color-amber);' : 'color: var(--text-secondary);');
      
      if (capCell) {
        capCell.style.cssText = `padding: 0.5rem; font-family: var(--font-mono); ${capClass} font-size: 0.75rem;`;
        capCell.innerHTML = P > 70 ? `OT (+${otAmount})` : 'เวลาปกติ';
        if (isOverCap) capCell.innerHTML += ' ⚠️ เกิน!';
      }
      
      if (eqCell) {
        eqCell.innerHTML = `
          <span style="color: var(--text-primary);">${prevInventory}</span> (ยกมา) + 
          <span style="color: var(--color-cyan); font-weight: bold;">${P}</span> (ผลิต) - 
          <span style="color: var(--color-amber);">${D}</span> (ดีมานด์) = 
          <span style="${invClass}">${I}</span>
        `;
      }
      
      if (invCell) {
        invCell.style.cssText = `padding: 0.5rem; font-family: var(--font-mono); ${invClass}`;
        invCell.innerHTML = `${I} ชิ้น ${isShort ? ' ❌ ขาดแคลน!' : ''}`;
      }
      
      prevInventory = I;
    }
    
    // Calculate total cost
    const totalCost = totalHolding + totalOT + totalShortage;
    if (lpTotalCost) lpTotalCost.textContent = totalCost.toLocaleString();
    
    if (lpPlanStatus) {
      if (hasOverCapacity) {
        lpPlanStatus.innerHTML = '<span style="color: var(--color-rose); font-weight: bold;" class="pixel-shaking">❌ แผนไม่ผ่าน: ผลิตเกินกำลังเครื่องจักรสูงสุด! (ทำ OT ได้สูงสุดวันละ 20 ชิ้น)</span>';
      } else if (hasShortage) {
        lpPlanStatus.innerHTML = '<span style="color: var(--color-rose); font-weight: bold;" class="pixel-shaking">❌ แผนไม่ผ่าน: เกิดสินค้าขาดมือในบางวัน! (Ending Inventory ต้องห้ามติดลบ)</span>';
      } else {
        lpPlanStatus.innerHTML = '<span style="color: var(--color-emerald); font-weight: bold;">✅ แผนผ่านการอนุมัติ (FEASIBLE PLAN) - พยายามเลื่อนสไลเดอร์เพื่อหาแผนที่ลดต้นทุนรวมลงอีก!</span>';
      }
    }
  }

  // ==========================================
  // PAGE 6: CATAPULT & DOE LAB
  // ==========================================
  const catapultCanvas = document.getElementById('catapult-canvas');
  const catapultReleaseInput = document.getElementById('catapult-release-input');
  const catapultReleaseVal = document.getElementById('catapult-release-val');
  const catapultPullbackInput = document.getElementById('catapult-pullback-input');
  const catapultPullbackVal = document.getElementById('catapult-pullback-val');
  const catapultStopInput = document.getElementById('catapult-stop-input');
  const catapultStopVal = document.getElementById('catapult-stop-val');
  const catapultCupInput = document.getElementById('catapult-cup-input');
  const catapultCupVal = document.getElementById('catapult-cup-val');
  
  const btnCatapultFire = document.getElementById('btn-catapult-fire');
  const btnCatapultReset = document.getElementById('btn-catapult-reset');
  
  const btnDoeRunAll = document.getElementById('btn-doe-run-all');
  const btnDoeClear = document.getElementById('btn-doe-clear');
  const doeTableBody = document.getElementById('doe-table-body');
  const doeEffectsChart = document.getElementById('doe-effects-chart');

  // Interactive DOE Level Inputs
  const doeLevelALow = document.getElementById('doe-level-a-low');
  const doeLevelAHigh = document.getElementById('doe-level-a-high');
  const doeLevelBLow = document.getElementById('doe-level-b-low');
  const doeLevelBHigh = document.getElementById('doe-level-b-high');
  const doeLevelCLow = document.getElementById('doe-level-c-low');
  const doeLevelCHigh = document.getElementById('doe-level-c-high');
  const doeLevelDLow = document.getElementById('doe-level-d-low');
  const doeLevelDHigh = document.getElementById('doe-level-d-high');

  // Target Solver Elements
  const catapultTargetInput = document.getElementById('catapult-target-input');
  const catapultTargetVal = document.getElementById('catapult-target-val');
  const btnCatapultSolve = document.getElementById('btn-catapult-solve');
  const catapultSolveResults = document.getElementById('catapult-solve-results');
  const btnCatapultApplySolve = document.getElementById('btn-catapult-apply-solve');
  const solveResultA = document.getElementById('solve-result-a');
  const solveResultB = document.getElementById('solve-result-b');
  const solveResultC = document.getElementById('solve-result-c');
  const solveResultD = document.getElementById('solve-result-d');
  const solveResultDist = document.getElementById('solve-result-dist');

  let lastSolvedSettings = null;

  function getDoeLevels() {
    return {
      a: { low: parseInt(doeLevelALow.value) || 35, high: parseInt(doeLevelAHigh.value) || 55 },
      b: { low: parseInt(doeLevelBLow.value) || 70, high: parseInt(doeLevelBHigh.value) || 110 },
      c: { low: parseInt(doeLevelCLow.value) || 45, high: parseInt(doeLevelCHigh.value) || 75 },
      d: { low: parseInt(doeLevelDLow.value) || -10, high: parseInt(doeLevelDHigh.value) || 10 }
    };
  }

  function initCatapultProblem() {
    state.catapult.isLaunching = false;
    state.catapult.launchStage = 'idle';
    state.catapult.stageTimer = 0;
    state.catapult.armAngle = state.catapult.pullbackAngle; // rests pulled back
    state.catapult.doeRunningAll = false;
    state.catapult.activeDoeRunId = null;
    state.catapult.hitTarget = false;
    state.catapult.targetDistance = parseFloat(catapultTargetInput.value) || 25;
    
    state.catapult.ball = {
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      active: false,
      path: []
    };
    
    resetBallToCup();
    renderDoeTable();
    updateEffectsUI();
    
    if (catapultSolveResults) catapultSolveResults.style.display = 'none';
  }

  function resetBallToCup() {
    const cx = 100;
    const cy = 250;
    const R = 70;
    const rad = state.catapult.armAngle * Math.PI / 180;
    
    state.catapult.ball.x = cx + R * Math.cos(rad);
    state.catapult.ball.y = cy - R * Math.sin(rad) - 3;
    state.catapult.ball.active = false;
    state.catapult.ball.vx = 0;
    state.catapult.ball.vy = 0;
    state.catapult.ball.path = [];
  }

  function updateCatapultSlidersUI() {
    catapultReleaseInput.value = state.catapult.releaseAngle;
    catapultReleaseVal.textContent = state.catapult.releaseAngle + '°';
    
    catapultPullbackInput.value = state.catapult.pullbackAngle;
    catapultPullbackVal.textContent = state.catapult.pullbackAngle + '°';
    
    catapultStopInput.value = state.catapult.stopAngle;
    catapultStopVal.textContent = state.catapult.stopAngle + '°';
    
    catapultCupInput.value = state.catapult.cupAngle;
    catapultCupVal.textContent = state.catapult.cupAngle + '°';
    
    state.catapult.armAngle = state.catapult.pullbackAngle;
    resetBallToCup();
  }

  function renderDoeTable() {
    if (!doeTableBody) return;
    const runs = state.catapult.doeRuns;
    const lvls = getDoeLevels();
    let html = '';
    runs.forEach(run => {
      const distStr = run.distance !== null ? `<strong>${run.distance.toFixed(2)} ม.</strong>` : '<span style="color: var(--text-secondary);">-</span>';
      const btnText = run.distance !== null ? 'ยิงซ้ำ' : 'ยิงทดสอบ';
      const btnClass = run.distance !== null ? 'btn' : 'btn btn-primary';
      
      html += `
        <tr style="border-bottom: 1px solid var(--border-color); height: 42px;">
          <td style="font-weight: bold; color: var(--color-cyan);">${run.id}</td>
          <td>${run.a === -1 ? `<span style="color: var(--color-rose); font-weight:bold;">- (${lvls.a.low}°)</span>` : `<span style="color: var(--color-emerald); font-weight:bold;">+ (${lvls.a.high}°)</span>`}</td>
          <td>${run.b === -1 ? `<span style="color: var(--color-rose); font-weight:bold;">- (${lvls.b.low}°)</span>` : `<span style="color: var(--color-emerald); font-weight:bold;">+ (${lvls.b.high}°)</span>`}</td>
          <td>${run.c === -1 ? `<span style="color: var(--color-rose); font-weight:bold;">- (${lvls.c.low}°)</span>` : `<span style="color: var(--color-emerald); font-weight:bold;">+ (${lvls.c.high}°)</span>`}</td>
          <td>${run.d === -1 ? `<span style="color: var(--color-rose); font-weight:bold;">- (${lvls.d.low}°)</span>` : `<span style="color: var(--color-emerald); font-weight:bold;">+ (${lvls.d.high}°)</span>`}</td>
          <td style="font-family: var(--font-mono);">${distStr}</td>
          <td style="padding: 0.25rem;">
            <button class="btn-run-doe ${btnClass}" data-run-id="${run.id}" style="padding: 0.25rem 0.5rem; font-size: 0.75rem; margin: 0 auto; display: flex;">
              ${btnText}
            </button>
          </td>
        </tr>
      `;
    });
    doeTableBody.innerHTML = html;
  }

  function updateEffectsUI() {
    if (!doeEffectsChart) return;
    const runs = state.catapult.doeRuns;
    const completed = runs.every(r => r.distance !== null);
    
    if (!completed) {
      doeEffectsChart.innerHTML = `
        <div style="text-align: center; color: var(--text-secondary); padding: 2rem 0; font-size: 0.85rem;">
          <span>⚠️ กรุณารันการทดลองให้ครบทั้ง 8 ข้อเพื่อคำนวณอิทธิพลของแต่ละปัจจัย (Main Effects)</span>
        </div>
      `;
      return;
    }
    
    const getVal = (id) => runs.find(r => r.id === id).distance;
    
    const r1 = getVal(1), r2 = getVal(2), r3 = getVal(3), r4 = getVal(4);
    const r5 = getVal(5), r6 = getVal(6), r7 = getVal(7), r8 = getVal(8);
    
    const effA = ((r2 + r4 + r6 + r8) - (r1 + r3 + r5 + r7)) / 4;
    const effB = ((r3 + r4 + r7 + r8) - (r1 + r2 + r5 + r6)) / 4;
    const effC = ((r5 + r6 + r7 + r8) - (r1 + r2 + r3 + r4)) / 4;
    const effD = ((r2 + r3 + r5 + r8) - (r1 + r4 + r6 + r7)) / 4;
    
    state.catapult.effects.release = effA;
    state.catapult.effects.pullback = effB;
    state.catapult.effects.stop = effC;
    state.catapult.effects.cup = effD;
    
    const factors = [
      { name: 'A: องศาการยิง (Release Angle)', val: effA },
      { name: 'B: องศาการง้าง (Pullback Angle)', val: effB },
      { name: 'C: องศาการหยุด (Stop Angle)', val: effC },
      { name: 'D: องศาของถ้วย (Cup Angle)', val: effD }
    ];
    
    const maxVal = Math.max(...factors.map(f => Math.abs(f.val)), 0.1);
    
    let html = '';
    factors.forEach(f => {
      const absPct = Math.min(100, Math.round((Math.abs(f.val) / maxVal) * 80));
      const isPos = f.val >= 0;
      const barClass = isPos ? 'positive' : 'negative';
      
      let leftMargin = '50%';
      let width = `${absPct / 2}%`;
      if (!isPos) {
        leftMargin = `${50 - (absPct / 2)}%`;
      }
      
      html += `
        <div class="effect-row">
          <span class="effect-label">${f.name}</span>
          <div class="effect-bar-track">
            <div style="position: absolute; left: 50%; top: 0; bottom: 0; width: 1px; background: rgba(255,255,255,0.25); z-index: 2;"></div>
            <div class="effect-bar ${barClass}" style="position: absolute; left: ${leftMargin}; width: ${width};"></div>
          </div>
          <span class="effect-value">${isPos ? '+' : ''}${f.val.toFixed(2)}m</span>
        </div>
      `;
    });
    
    doeEffectsChart.innerHTML = html;
  }

  let activeDragHandle = null; // 'pullback' or 'stop'
  
  if (catapultCanvas) {
    catapultCanvas.addEventListener('mousedown', e => {
      if (state.catapult.isLaunching) return;
      
      const rect = catapultCanvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      const cx = 100;
      const cy = 250;
      const R = 70;
      
      const armRad = state.catapult.armAngle * Math.PI / 180;
      const cupX = cx + R * Math.cos(armRad);
      const cupY = cy - R * Math.sin(armRad);
      
      const distToCup = Math.hypot(mouseX - cupX, mouseY - cupY);
      
      const stopRad = state.catapult.stopAngle * Math.PI / 180;
      const bumperX = cx + R * Math.cos(stopRad);
      const bumperY = cy - R * Math.sin(stopRad);
      
      const distToBumper = Math.hypot(mouseX - bumperX, mouseY - bumperY);
      
      if (distToCup < 20) {
        activeDragHandle = 'pullback';
      } else if (distToBumper < 20) {
        activeDragHandle = 'stop';
      }
    });
    
    catapultCanvas.addEventListener('mousemove', e => {
      const rect = catapultCanvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      const cx = 100;
      const cy = 250;
      const R = 70;
      
      const armRad = state.catapult.armAngle * Math.PI / 180;
      const cupX = cx + R * Math.cos(armRad);
      const cupY = cy - R * Math.sin(armRad);
      const stopRad = state.catapult.stopAngle * Math.PI / 180;
      const bumperX = cx + R * Math.cos(stopRad);
      const bumperY = cy - R * Math.sin(stopRad);
      
      const distToCup = Math.hypot(mouseX - cupX, mouseY - cupY);
      const distToBumper = Math.hypot(mouseX - bumperX, mouseY - bumperY);
      
      if (!activeDragHandle) {
        if (distToCup < 15 || distToBumper < 15) {
          catapultCanvas.style.cursor = 'grab';
        } else {
          catapultCanvas.style.cursor = 'default';
        }
      } else {
        catapultCanvas.style.cursor = 'grabbing';
        
        const dx = mouseX - cx;
        const dy = cy - mouseY;
        let angleRad = Math.atan2(dy, dx);
        let angleDeg = Math.round(angleRad * 180 / Math.PI);
        if (angleDeg < 0) angleDeg += 360;
        
        if (activeDragHandle === 'pullback') {
          angleDeg = Math.max(45, Math.min(135, angleDeg));
          if (angleDeg < state.catapult.stopAngle) {
            angleDeg = state.catapult.stopAngle;
          }
          state.catapult.pullbackAngle = angleDeg;
          catapultPullbackInput.value = angleDeg;
          catapultPullbackVal.textContent = angleDeg + '°';
          state.catapult.armAngle = angleDeg;
          resetBallToCup();
        } else if (activeDragHandle === 'stop') {
          angleDeg = Math.max(30, Math.min(90, angleDeg));
          if (angleDeg > state.catapult.pullbackAngle) {
            angleDeg = state.catapult.pullbackAngle;
          }
          state.catapult.stopAngle = angleDeg;
          catapultStopInput.value = angleDeg;
          catapultStopVal.textContent = angleDeg + '°';
          resetBallToCup();
        }
        
        drawCatapult();
      }
    });
    
    window.addEventListener('mouseup', () => {
      activeDragHandle = null;
    });
  }

  function fireCatapult(runId = null) {
    if (state.catapult.isLaunching) return;
    
    state.catapult.activeDoeRunId = runId;
    state.catapult.isLaunching = true;
    state.catapult.launchStage = 'pullback';
    state.catapult.armAngle = state.catapult.stopAngle;
    state.catapult.ball.active = false;
    state.catapult.ball.path = [];
    state.catapult.hitTarget = false;
    
    startCatapultLoop();
  }

  function runNextDoeTrial() {
    if (!state.catapult.doeRunningAll) return;
    
    const nextRun = state.catapult.doeRuns.find(r => r.distance === null);
    if (!nextRun) {
      state.catapult.doeRunningAll = false;
      state.catapult.activeDoeRunId = null;
      document.querySelectorAll('#doe-table-body tr').forEach(tr => tr.classList.remove('doe-run-active'));
      return;
    }
    
    state.catapult.activeDoeRunId = nextRun.id;
    
    document.querySelectorAll('#doe-table-body tr').forEach((tr, idx) => {
      if (idx === nextRun.id - 1) {
        tr.classList.add('doe-run-active');
      } else {
        tr.classList.remove('doe-run-active');
      }
    });
    
    const lvls = getDoeLevels();
    state.catapult.releaseAngle = nextRun.a === -1 ? lvls.a.low : lvls.a.high;
    state.catapult.pullbackAngle = nextRun.b === -1 ? lvls.b.low : lvls.b.high;
    state.catapult.stopAngle = nextRun.c === -1 ? lvls.c.low : lvls.c.high;
    state.catapult.cupAngle = nextRun.d === -1 ? lvls.d.low : lvls.d.high;
    
    updateCatapultSlidersUI();
    fireCatapult(nextRun.id);
  }

  function startCatapultLoop() {
    stopCatapultLoop();
    state.catapult.isRunning = true;
    
    let lastTime = performance.now();
    function loop(now) {
      if (!state.catapult.isRunning) return;
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;
      
      catapultSimulationTick(dt);
      drawCatapult();
      
      state.catapult.animationFrameId = requestAnimationFrame(loop);
    }
    state.catapult.animationFrameId = requestAnimationFrame(loop);
  }

  function stopCatapultLoop() {
    state.catapult.isRunning = false;
    if (state.catapult.animationFrameId) {
      cancelAnimationFrame(state.catapult.animationFrameId);
      state.catapult.animationFrameId = null;
    }
  }

  function predictDistance(release, pullback, stop, cup) {
    const cx = 100;
    const cy = 250;
    const R = 70;
    const rad = stop * Math.PI / 180;
    
    let x = cx + R * Math.cos(rad);
    let y = cy - R * Math.sin(rad) - 3;
    const xRelease = x;
    
    const deltaTheta = pullback - stop;
    if (deltaTheta <= 5) return 0;
    
    const v0 = 1.35 * Math.sqrt(deltaTheta) * (1 + 0.005 * cup);
    const vPix = v0 * 10;
    const phi = release + cup;
    
    let vx = vPix * Math.cos(phi * Math.PI / 180);
    let vy = -vPix * Math.sin(phi * Math.PI / 180);
    
    const dt = 0.005;
    for (let step = 0; step < 2000; step++) {
      x += vx * dt;
      vy += 98 * dt;
      y += vy * dt;
      
      if (y >= 267) {
        const distM = (x - xRelease) / 10;
        return Math.max(0, distM);
      }
    }
    return 0;
  }

  function solveTargetDistance() {
    const target = parseFloat(catapultTargetInput.value);
    
    let bestError = Infinity;
    let bestConfig = null;
    
    // Random grid search (20,000 samples) to handle constraints & non-linear flight equations in 1ms
    for (let i = 0; i < 20000; i++) {
      const release = Math.round(20 + Math.random() * 60); // 20 to 80
      const stop = Math.round(30 + Math.random() * 60);    // 30 to 90
      const pullback = Math.round((stop + 10) + Math.random() * (135 - (stop + 10)));
      const cup = Math.round(-30 + Math.random() * 60);     // -30 to 30
      
      if (pullback > 135) continue;
      
      const dist = predictDistance(release, pullback, stop, cup);
      const err = Math.abs(dist - target);
      
      if (err < bestError) {
        bestError = err;
        bestConfig = { release, pullback, stop, cup, distance: dist, error: err };
      }
      
      if (err < 0.01) break;
    }
    
    if (bestConfig) {
      lastSolvedSettings = bestConfig;
      
      solveResultA.textContent = bestConfig.release + '°';
      solveResultB.textContent = bestConfig.pullback + '°';
      solveResultC.textContent = bestConfig.stop + '°';
      solveResultD.textContent = bestConfig.cup + '°';
      solveResultDist.innerHTML = `<strong>${bestConfig.distance.toFixed(2)} ม.</strong> (คลาดเคลื่อน: ${bestConfig.error.toFixed(2)} ม.)`;
      
      catapultSolveResults.style.display = 'block';
    }
  }

  function catapultSimulationTick(dt) {
    const stage = state.catapult.launchStage;
    
    if (stage === 'pullback') {
      state.catapult.armAngle += 150 * dt;
      if (state.catapult.armAngle >= state.catapult.pullbackAngle) {
        state.catapult.armAngle = state.catapult.pullbackAngle;
        state.catapult.launchStage = 'swing';
      }
      resetBallToCup();
    } else if (stage === 'swing') {
      state.catapult.armAngle -= 450 * dt;
      if (state.catapult.armAngle <= state.catapult.stopAngle) {
        state.catapult.armAngle = state.catapult.stopAngle;
        state.catapult.launchStage = 'flight';
        
        const cx = 100;
        const cy = 250;
        const R = 70;
        const rad = state.catapult.armAngle * Math.PI / 180;
        
        state.catapult.ball.x = cx + R * Math.cos(rad);
        state.catapult.ball.y = cy - R * Math.sin(rad) - 3;
        state.catapult.ball.active = true;
        state.catapult.ball.path = [{ x: state.catapult.ball.x, y: state.catapult.ball.y }];
        
        const deltaTheta = state.catapult.pullbackAngle - state.catapult.stopAngle;
        if (deltaTheta > 5) {
          const v0 = 1.35 * Math.sqrt(deltaTheta) * (1 + 0.005 * state.catapult.cupAngle);
          const vPix = v0 * 10;
          
          const phi = state.catapult.releaseAngle + state.catapult.cupAngle;
          state.catapult.ball.vx = vPix * Math.cos(phi * Math.PI / 180);
          state.catapult.ball.vy = -vPix * Math.sin(phi * Math.PI / 180);
        } else {
          state.catapult.ball.vx = 0;
          state.catapult.ball.vy = 0;
        }
      }
    } else if (stage === 'flight') {
      const ball = state.catapult.ball;
      if (ball.active) {
        ball.x += ball.vx * dt;
        ball.vy += 98 * dt;
        ball.y += ball.vy * dt;
        
        ball.path.push({ x: ball.x, y: ball.y });
        
        if (ball.y >= 267) {
          if (Math.abs(ball.vy) > 15) {
            ball.vy = -ball.vy * 0.35;
            ball.vx = ball.vx * 0.55;
            ball.y = 267;
          } else {
            ball.active = false;
            state.catapult.isLaunching = false;
            state.catapult.launchStage = 'idle';
            
            const cx = 100;
            const stopRad = state.catapult.stopAngle * Math.PI / 180;
            const xRelease = cx + 70 * Math.cos(stopRad);
            const distM = (ball.x - xRelease) / 10;
            const finalDist = Math.max(0, parseFloat(distM.toFixed(2)));
            
            // Check target hit
            if (state.catapult.targetDistance) {
              const diff = Math.abs(finalDist - state.catapult.targetDistance);
              state.catapult.hitTarget = (diff <= 1.0); // hit within 1 meter tolerance
            }
            
            const activeRunId = state.catapult.activeDoeRunId;
            if (activeRunId !== null) {
              const run = state.catapult.doeRuns.find(r => r.id === activeRunId);
              if (run) {
                run.distance = finalDist;
                renderDoeTable();
                updateEffectsUI();
              }
              state.catapult.landings.push({ x: ball.x, dist: finalDist, runId: activeRunId });
              
              if (state.catapult.doeRunningAll) {
                setTimeout(runNextDoeTrial, 1000);
              }
            } else {
              state.catapult.landings.push({ x: ball.x, dist: finalDist, runId: 'M' });
            }
            
            if (state.catapult.landings.length > 8) {
              state.catapult.landings.shift();
            }
          }
        }
      }
    }
  }

  function drawCatapult() {
    if (!catapultCanvas) return;
    const ctx = catapultCanvas.getContext('2d');
    const w = catapultCanvas.width;
    const h = catapultCanvas.height;
    ctx.clearRect(0, 0, w, h);
    
    const isDark = state.theme === 'dark';
    const gy = 270;
    
    ctx.fillStyle = isDark ? '#0f172a' : '#f3f4f6';
    ctx.fillRect(0, 0, w, h);
    
    ctx.strokeStyle = isDark ? '#475569' : '#94a3b8';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, gy);
    ctx.lineTo(w, gy);
    ctx.stroke();
    
    ctx.fillStyle = isDark ? '#14532d' : '#86efac';
    ctx.fillRect(0, gy + 2, w, h - gy);
    
    ctx.fillStyle = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
    ctx.fillRect(135, gy + 5, w - 135, 12);
    ctx.fillStyle = isDark ? '#94a3b8' : '#475569';
    ctx.font = '8px var(--font-mono)';
    ctx.textAlign = 'center';
    for (let x = 150; x < w; x += 50) {
      ctx.fillRect(x, gy + 2, 1, 6);
      const m = Math.round((x - 100) / 10);
      ctx.fillText(`${m}m`, x, gy + 18);
    }
    
    const cx = 100;
    const cy = 250;
    const R = 70;
    
    if (!state.catapult.isLaunching) {
      ctx.strokeStyle = isDark ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.25)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      const startRad = -state.catapult.pullbackAngle * Math.PI / 180;
      const endRad = -state.catapult.stopAngle * Math.PI / 180;
      ctx.arc(cx, cy, R, startRad, endRad, false);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    
    // Draw Target Board
    if (state.catapult.targetDistance) {
      const stopRad = state.catapult.stopAngle * Math.PI / 180;
      const xRelease = cx + R * Math.cos(stopRad);
      const targetX = xRelease + state.catapult.targetDistance * 10;
      const targetY = gy - 25;
      
      // Target glow on hit
      if (state.catapult.hitTarget) {
        ctx.fillStyle = 'rgba(250, 204, 21, 0.4)';
        ctx.beginPath();
        ctx.arc(targetX, targetY, 18, 0, 2 * Math.PI);
        ctx.fill();
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      
      // Post
      ctx.fillStyle = '#64748b';
      ctx.fillRect(targetX - 2, gy - 25, 4, 25);
      
      // Concentric circles
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(targetX, targetY, 10, 0, 2 * Math.PI);
      ctx.fill();
      
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(targetX, targetY, 6, 0, 2 * Math.PI);
      ctx.fill();
      
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(targetX, targetY, 3, 0, 2 * Math.PI);
      ctx.fill();
      
      ctx.fillStyle = isDark ? '#facc15' : '#d97706';
      ctx.font = 'bold 8px var(--font-sans)';
      ctx.textAlign = 'center';
      ctx.fillText(state.catapult.hitTarget ? "🎯 HIT!" : "🎯 Target", targetX, targetY - 14);
    }
    
    state.catapult.landings.forEach((flag) => {
      ctx.fillStyle = '#ef4444';
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 1.5;
      
      ctx.beginPath();
      ctx.moveTo(flag.x, gy);
      ctx.lineTo(flag.x, gy - 20);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(flag.x, gy - 20);
      ctx.lineTo(flag.x + 12, gy - 16);
      ctx.lineTo(flag.x, gy - 12);
      ctx.fill();
      ctx.stroke();
      
      ctx.fillStyle = '#fff';
      ctx.font = '7px var(--font-sans)';
      ctx.textAlign = 'center';
      ctx.fillText(flag.runId, flag.x + 4, gy - 14);
    });
    
    const stopRad = state.catapult.stopAngle * Math.PI / 180;
    const stopX = cx + R * Math.cos(stopRad);
    const stopY = cy - R * Math.sin(stopRad);
    
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(stopX, stopY);
    ctx.stroke();
    ctx.fillStyle = '#047857';
    ctx.beginPath();
    ctx.arc(stopX, stopY, 5, 0, 2*Math.PI);
    ctx.fill();
    
    const armRad = state.catapult.armAngle * Math.PI / 180;
    const armX = cx + R * Math.cos(armRad);
    const armY = cy - R * Math.sin(armRad);
    
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(armX, armY);
    ctx.stroke();
    
    ctx.fillStyle = '#1e3a8a';
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    const cupRad = (state.catapult.armAngle + 90 + state.catapult.cupAngle) * Math.PI / 180;
    ctx.arc(armX, armY, 10, cupRad - Math.PI/2, cupRad + Math.PI/2, false);
    ctx.fill();
    ctx.stroke();
    
    ctx.fillStyle = '#475569';
    ctx.beginPath();
    ctx.arc(cx, cy, 7, 0, 2*Math.PI);
    ctx.fill();
    
    const ball = state.catapult.ball;
    if (state.catapult.isLaunching && ball.active) {
      ctx.strokeStyle = 'rgba(249, 115, 22, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([2, 2]);
      ctx.beginPath();
      ball.path.forEach((pt, idx) => {
        if (idx === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      });
      ctx.stroke();
      ctx.setLineDash([]);
      
      ctx.fillStyle = '#f97316';
      ctx.strokeStyle = '#c2410c';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, 6, 0, 2*Math.PI);
      ctx.fill();
      ctx.stroke();
    } else {
      ctx.fillStyle = '#f97316';
      ctx.strokeStyle = '#c2410c';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(armX, armY - 3, 6, 0, 2*Math.PI);
      ctx.fill();
      ctx.stroke();
    }
    
    ctx.fillStyle = '#78350f';
    ctx.fillRect(cx - 30, cy + 5, 60, 12);
    ctx.fillRect(cx - 15, cy - 2, 8, 8);
  }

  // Bind Listeners
  if (catapultReleaseInput) {
    catapultReleaseInput.addEventListener('input', e => {
      state.catapult.releaseAngle = parseInt(e.target.value);
      catapultReleaseVal.textContent = state.catapult.releaseAngle + '°';
      drawCatapult();
    });
    catapultPullbackInput.addEventListener('input', e => {
      state.catapult.pullbackAngle = parseInt(e.target.value);
      if (state.catapult.pullbackAngle < state.catapult.stopAngle) {
        state.catapult.pullbackAngle = state.catapult.stopAngle;
        e.target.value = state.catapult.stopAngle;
      }
      catapultPullbackVal.textContent = state.catapult.pullbackAngle + '°';
      state.catapult.armAngle = state.catapult.pullbackAngle;
      resetBallToCup();
      drawCatapult();
    });
    catapultStopInput.addEventListener('input', e => {
      state.catapult.stopAngle = parseInt(e.target.value);
      if (state.catapult.stopAngle > state.catapult.pullbackAngle) {
        state.catapult.stopAngle = state.catapult.pullbackAngle;
        e.target.value = state.catapult.pullbackAngle;
      }
      catapultStopVal.textContent = state.catapult.stopAngle + '°';
      state.catapult.armAngle = state.catapult.pullbackAngle;
      resetBallToCup();
      drawCatapult();
    });
    catapultCupInput.addEventListener('input', e => {
      state.catapult.cupAngle = parseInt(e.target.value);
      catapultCupVal.textContent = state.catapult.cupAngle + '°';
      drawCatapult();
    });
    
    btnCatapultFire.addEventListener('click', () => {
      fireCatapult();
    });
    btnCatapultReset.addEventListener('click', () => {
      stopCatapultLoop();
      initCatapultProblem();
      drawCatapult();
    });
    
    btnDoeRunAll.addEventListener('click', () => {
      if (state.catapult.isLaunching) return;
      state.catapult.doeRunningAll = true;
      runNextDoeTrial();
    });
    btnDoeClear.addEventListener('click', () => {
      state.catapult.doeRuns.forEach(r => r.distance = null);
      state.catapult.landings = [];
      state.catapult.doeRunningAll = false;
      renderDoeTable();
      updateEffectsUI();
      drawCatapult();
    });
    
    if (doeTableBody) {
      doeTableBody.addEventListener('click', e => {
        const btn = e.target.closest('.btn-run-doe');
        if (btn) {
          const runId = parseInt(btn.getAttribute('data-run-id'));
          const run = state.catapult.doeRuns.find(r => r.id === runId);
          if (run) {
            document.querySelectorAll('#doe-table-body tr').forEach(tr => tr.classList.remove('doe-run-active'));
            btn.closest('tr').classList.add('doe-run-active');
            
            const lvls = getDoeLevels();
            state.catapult.releaseAngle = run.a === -1 ? lvls.a.low : lvls.a.high;
            state.catapult.pullbackAngle = run.b === -1 ? lvls.b.low : lvls.b.high;
            state.catapult.stopAngle = run.c === -1 ? lvls.c.low : lvls.c.high;
            state.catapult.cupAngle = run.d === -1 ? lvls.d.low : lvls.d.high;
            
            updateCatapultSlidersUI();
            fireCatapult(runId);
          }
        }
      });
    }

    // DOE Level Inputs listeners
    const levelInputs = [doeLevelALow, doeLevelAHigh, doeLevelBLow, doeLevelBHigh, doeLevelCLow, doeLevelCHigh, doeLevelDLow, doeLevelDHigh];
    levelInputs.forEach(input => {
      input.addEventListener('change', () => {
        // Clear previous distances as they are no longer valid for new levels
        state.catapult.doeRuns.forEach(r => r.distance = null);
        state.catapult.landings = [];
        state.catapult.doeRunningAll = false;
        renderDoeTable();
        updateEffectsUI();
        drawCatapult();
      });
    });

    // Target Solver listeners
    catapultTargetInput.addEventListener('input', e => {
      const val = parseFloat(e.target.value);
      catapultTargetVal.textContent = val.toFixed(1) + ' ม.';
      state.catapult.targetDistance = val;
      state.catapult.hitTarget = false;
      drawCatapult();
    });

    btnCatapultSolve.addEventListener('click', () => {
      solveTargetDistance();
    });

    btnCatapultApplySolve.addEventListener('click', () => {
      if (!lastSolvedSettings) return;
      state.catapult.releaseAngle = lastSolvedSettings.release;
      state.catapult.pullbackAngle = lastSolvedSettings.pullback;
      state.catapult.stopAngle = lastSolvedSettings.stop;
      state.catapult.cupAngle = lastSolvedSettings.cup;
      updateCatapultSlidersUI();
      drawCatapult();
    });
  }

  // ==========================================
  // INITIAL PAGE SETUP
  // ==========================================
  updateLeanUI();
  switchPage('lean');
});
