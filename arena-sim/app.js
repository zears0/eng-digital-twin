// IE Digital Twin Tycoon & SCADA Simulator - Core Engine

// Web Audio API Synthesizer for Retro Game SFX
const AudioContextClass = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;

function initAudio() {
  if (!audioCtx) {
    audioCtx = new AudioContextClass();
  }
}

function playBeep(freq = 440, type = 'sine', duration = 0.1) {
  try {
    initAudio();
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  } catch (e) {
    console.warn("Audio Context blocked:", e);
  }
}

function playSiren() {
  try {
    initAudio();
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(300, audioCtx.currentTime);
    osc.frequency.linearRampToValueAtTime(600, audioCtx.currentTime + 0.15);
    osc.frequency.linearRampToValueAtTime(300, audioCtx.currentTime + 0.3);
    gain.gain.setValueAtTime(0.03, audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.3);
  } catch (e) {}
}

function playChime() {
  playBeep(523.25, 'sine', 0.15);
  setTimeout(() => playBeep(659.25, 'sine', 0.15), 100);
  setTimeout(() => playBeep(783.99, 'sine', 0.3), 200);
}

function playWarning() {
  playBeep(220, 'triangle', 0.3);
  setTimeout(() => playBeep(220, 'triangle', 0.3), 350);
}

// -------------------------------------------------------------
// GAME STATE DEFINITIONS
// -------------------------------------------------------------
const state = {
  // Time and Speed Controls
  timeScale: 6.0,
  speed: 'min', // Default to slow speed so data is readable
  simTime: 0, // In simulation seconds
  playing: true,
  challenge: 'free', // 'free', 'quest1', 'quest2', 'quest3'
  prodMix: { A: 40, B: 35, C: 25 }, // Custom mix ratios for multi-product scheduling
  autoPm: { S2: 60, S3: 60, S4: 60 }, // Automated PM wear triggers
  
  // Resources
  crew1: 'free', // 'free', 'busy'
  crew2: 'free',
  crew1Target: null,
  crew2Target: null,
  crew1Timer: 0,
  crew2Timer: 0,
  
  // Finance
  revenue: 0,
  opsCost: 0,
  pmCost: 0,
  reworkCost: 0,
  downtimeCost: 0,
  netProfit: 0,
  
  // Statistics
  partsProduced: { A: 0, B: 0, C: 0 },
  partsRejected: 0,
  partsPassed: 0,
  totalWIP: 0,
  uptimeHistory: [],
  bottleneckStation: 'ไม่มี',
  
  // Urgent order
  urgentOrder: null, // { targetCount: 10, type: 'C', timeLeft: 90, reward: 2500 }
  
  // Emergency Event
  activeEvent: null, // { type: 'jam', targetStationId: 'S2', timeLeft: 15, cost: 800 }
  
  // Dynamic conveyor diverter setting (manually route S3 outputs)
  diverterGate: 'normal', // 'normal' -> goes to Package, 'rework' -> goes to Rework
  
  // Chart and UI logs
  chartData: [], // History of queue sizes
  journalLogs: []
};

// Simulation Settings & Constants
const PART_VAL = { A: 100, B: 150, C: 250 };
const PART_MAT_COST = { A: 25, B: 45, C: 70 };
const SHIFT_TARGETS = {
  free: { title: "เล่นอิสระ", desc: "บริหารโรงงานได้อย่างอิสระโดยไม่มีข้อจำกัดภารกิจ", reward: 0 },
  quest1: { title: "ทลายคอขวด (Bottleneck Buster)", desc: "หาวิธีจัดสรรกิวและรอบเวลาผลิต ให้ยอดการผลิตรวมชิ้นงาน > 30 ชิ้น/วัน ภายใต้กำไรสะสมอย่างน้อย $10,000", target: 30, profit: 10000 },
  quest2: { title: "ควบคุมคุณภาพ (Six Sigma Quest)", desc: "จัดการลดอัตรารีเจกต์ชิ้นงานไม่ผ่านเกณฑ์ (Yield > 98%) และหาวิธีซ่อมแซมให้ไม่ติดขัด", target: 98, profit: 5000 },
  quest3: { title: "ปฏิวัติลีนไร้คิว (Zero-WIP Lean)", desc: "ตั้งค่าคิวให้มีขนาดเล็กที่สุด (WIP เฉลี่ยรวม < 5 ชิ้น) โดยที่ยังคงความต้องการของตลาดไว้", target: 5, profit: 8000 }
};

// -------------------------------------------------------------
// CLASS DEFINITIONS (Entities)
// -------------------------------------------------------------
class Part {
  constructor(type, x = 30, y = 150) {
    this.id = 'P' + Math.random().toString(36).substr(2, 5);
    this.type = type; // 'A' (Red/Cyan), 'B' (Blue/Magenta), 'C' (Green/Yellow)
    this.x = x;
    this.y = y;
    this.speed = type === 'A' ? 2.5 : type === 'B' ? 1.8 : 1.2;
    this.radius = 6;
    this.color = type === 'A' ? 'var(--color-cyan)' : type === 'B' ? 'var(--color-magenta)' : 'var(--color-amber)';
    this.state = 'moving'; // 'moving', 'queued', 'processing', 'completed'
    this.currentStationId = null;
    this.conveyorProgress = 0;
    this.conveyorId = 'C1';
    this.priority = type === 'A' ? 3 : type === 'B' ? 2 : 1; // Alpha has highest priority
    this.entryTime = state.simTime;
    this.pathNodeIndex = 1;
  }
}

class Station {
  constructor(id, name, type, x, y, cycleTime = 3, queueCap = 5) {
    this.id = id;
    this.name = name;
    this.type = type; // 'generator', 'process', 'inspect', 'rework', 'package'
    this.x = x;
    this.y = y;
    
    // Core parameters (Editable in table)
    this.cycleTime = cycleTime;
    this.queueCapacity = queueCap;
    this.queueDiscipline = 'fifo'; // 'fifo', 'lifo', 'priority', 'spt'
    this.resourceCount = 1; // Parallel servers
    
    // Entity states
    this.queue = [];
    this.processingParts = []; // Current parts being worked on
    
    // IoT Sensor status
    this.temperature = 35; // base temperature
    this.vibration = 0.5; // base vibration RMS (mm/s)
    this.wear = 0; // 0% to 100% wear out
    this.overclockActive = false;
    this.state = 'idle'; // 'idle', 'busy', 'failed', 'blocked', 'maintenance'
    
    // Failure & Repairs
    this.failureRateMultiplier = 1.0;
    this.alignmentError = 0;
    
    // Local DOE Setup Lab
    this.localDoeTested = false;
    this.localDoeOptimalApplied = false;
    this.doeFactorA = 50; // Speed Level (50% or 100%)
    this.doeFactorB = 20; // Lubricant Frequency (20% or 80%)
    this.doeTrialsVibe = [0, 0, 0, 0]; // Response variables for Vibration
    this.doeTrialsCycle = [0, 0, 0, 0]; // Response variables for cycle time
  }
}

// Initial Station List
let stations = [
  new Station('S1', 'คลังวัตถุดิบ (Source)', 'generator', 60, 150, 4, 999), // Spawn rate: 4s
  new Station('S2', 'แขนกลขัดสี (Robot Paint)', 'process', 240, 150, 3, 5),
  new Station('S3', 'ระบบสแกนตรวจสอบ (QA Scan)', 'inspect', 440, 150, 2.5, 4),
  new Station('S4', 'แท่นซ่อมชิ้นงาน (Rework)', 'rework', 340, 310, 5, 5),
  new Station('S5', 'บรรจุภัณฑ์ & ส่งออก (Pack)', 'package', 640, 150, 2, 4)
];

// Conveyor Path Definition
const conveyors = {
  C1: { from: 'S1', to: 'S2', path: [[60, 150], [240, 150]] },
  C2: { from: 'S2', to: 'S3', path: [[240, 150], [440, 150]] },
  C3_pass: { from: 'S3', to: 'S5', path: [[440, 150], [640, 150]] },
  C3_fail: { from: 'S3', to: 'S4', path: [[440, 150], [440, 310], [340, 310]] },
  C4_rework: { from: 'S4', to: 'S2', path: [[340, 310], [240, 310], [240, 150]] }
};

let parts = [];

// -------------------------------------------------------------
// SOUND / EVENT LOG UTILITIES
// -------------------------------------------------------------
function addJournal(msg) {
  const clockStr = formatSimClock();
  const fullMsg = `[${clockStr}] ${msg}`;
  state.journalLogs.unshift(fullMsg);
  if (state.journalLogs.length > 25) {
    state.journalLogs.pop();
  }
  
  // Render Journal
  const el = document.getElementById('scada-journal');
  if (el) {
    el.innerHTML = state.journalLogs.map(log => `<div>${log}</div>`).join('');
  }
}

function formatSimClock() {
  const totalMins = Math.floor(state.simTime / 60);
  const totalHrs = Math.floor(totalMins / 60);
  const days = Math.floor(totalHrs / 24) + 1;
  const hrs = totalHrs % 24;
  const mins = totalMins % 60;
  
  const dayStr = String(days).padStart(2, '0');
  const hrStr = String(hrs).padStart(2, '0');
  const minStr = String(mins).padStart(2, '0');
  
  return `วัน ${dayStr} | ${hrStr}:${minStr}`;
}

// -------------------------------------------------------------
// DYNAMIC QUEUEING DISCIPLINE SORTING
// -------------------------------------------------------------
function sortQueue(station) {
  if (station.queue.length <= 1) return;
  
  switch (station.queueDiscipline) {
    case 'lifo':
      // Reverse order (newest first)
      station.queue.reverse();
      break;
    case 'priority':
      // Priority-based (Type A > B > C)
      station.queue.sort((a, b) => b.priority - a.priority);
      break;
    case 'spt':
      // Shortest Processing Time first
      // Product Alpha (A) is processed fastest by default
      station.queue.sort((a, b) => a.speed - b.speed);
      break;
    case 'fifo':
    default:
      // Keep order by entry time
      station.queue.sort((a, b) => a.entryTime - b.entryTime);
      break;
  }
}

// -------------------------------------------------------------
// DYNAMIC EVENT GENERATOR
// -------------------------------------------------------------
function checkRandomEvents(dt) {
  // Fail event rolls every hour
  if (Math.random() < 0.0003 * dt && !state.activeEvent) {
    // Exclude source and package station
    const targetStations = stations.filter(s => s.type === 'process' || s.type === 'inspect' || s.type === 'rework');
    if (targetStations.length > 0) {
      const target = targetStations[Math.floor(Math.random() * targetStations.length)];
      const eventTypes = [
        { type: 'jam', title: '🚨 สายพานสะดุดติดขัด!', desc: 'มีฝุ่นสะสมเกาะเซนเซอร์ตรวจจับชิ้นงาน ช่างต้องรีบตรวจสอบพัดลมระบายความร้อน!', cost: 800 },
        { type: 'overload', title: '⚡ หม้อแปลงโอเวอร์โหลด!', desc: 'มีไฟฟ้ากระชากสั่นไหวในตัวคัปปลิ้งหุ่นยนต์! ต้องลดความดันมอเตอร์ทันที', cost: 1200 },
        { type: 'siren', title: '🚨 เซนเซอร์สั่นสะเทือนชำรุด!', desc: 'หัวสแกนเกิดแกนสั่นสะเทือนเอียงเฉไฉ ต้องทำการกดสอบเทียบปรับตั้งศูนย์ใหม่', cost: 500 }
      ];
      const ev = eventTypes[Math.floor(Math.random() * eventTypes.length)];
      state.activeEvent = {
        type: ev.type,
        title: ev.title,
        desc: ev.desc,
        targetStationId: target.id,
        timeLeft: 15, // seconds to react
        cost: ev.cost
      };
      
      // Update machine sensors
      target.vibration += 4.5;
      target.temperature += 25;
      
      playWarning();
      addJournal(`${ev.title} เกิดขึ้นที่เครื่อง ${target.name}! มีเวลาประวิงเวลาชั่วคราว 15 วินาที`);
      triggerVisualAlarm(true, ev.title, ev.desc);
    }
  }
  
  // Handle active event countdown
  if (state.activeEvent) {
    state.activeEvent.timeLeft -= dt;
    if (state.activeEvent.timeLeft <= 0) {
      // Penalty for failing to respond
      const cost = state.activeEvent.cost;
      state.downtimeCost += cost;
      state.netProfit -= cost;
      
      // Force break machine
      const station = stations.find(s => s.id === state.activeEvent.targetStationId);
      if (station) {
        station.state = 'failed';
        station.wear = 100;
      }
      
      playBeep(180, 'sawtooth', 0.6);
      addJournal(`❌ จัดการเหตุฉุกเฉินไม่ทันเวลา! เกิดความเสียหายชำรุดและถูกปรับเป็นเงิน $${cost}`);
      state.activeEvent = null;
      triggerVisualAlarm(false);
    }
  }
}

function triggerVisualAlarm(show, title = '', desc = '') {
  const banner = document.getElementById('alarm-banner');
  const titleEl = document.getElementById('alarm-title');
  const descEl = document.getElementById('alarm-subtitle');
  if (banner) {
    if (show) {
      banner.classList.add('active');
      if (titleEl) titleEl.textContent = title;
      if (descEl) descEl.textContent = desc;
      playSiren();
    } else {
      banner.classList.remove('active');
    }
  }
}

// -------------------------------------------------------------
// DYNAMIC DEMAND & URGENT ORDERS
// -------------------------------------------------------------
function checkUrgentOrders(dt) {
  if (Math.random() < 0.0002 * dt && !state.urgentOrder) {
    const types = ['A', 'B', 'C'];
    const selectedType = types[Math.floor(Math.random() * types.length)];
    const qty = selectedType === 'A' ? 12 : selectedType === 'B' ? 8 : 5;
    const timeLimit = selectedType === 'A' ? 120 : selectedType === 'B' ? 150 : 180;
    const reward = qty * PART_VAL[selectedType] * 2.0; // 2x price bonus
    
    state.urgentOrder = {
      type: selectedType,
      targetCount: qty,
      currentCount: 0,
      timeLeft: timeLimit,
      reward: reward
    };
    
    playChime();
    addJournal(`📦 ใบสั่งซื้อเร่งด่วน! ต้องการชิ้นงานประเภท ${selectedType} จำนวน ${qty} ชิ้น ภายใน ${timeLimit} วินาที (รางวัลโบนัส: $${reward})`);
    updateUrgentOrderUI();
  }
  
  if (state.urgentOrder) {
    state.urgentOrder.timeLeft -= dt;
    updateUrgentOrderUI();
    
    if (state.urgentOrder.timeLeft <= 0) {
      // Failed order
      addJournal(`😢 ส่งมอบงานชิ้นส่วนเร่งด่วนไม่ทันเวลา! พลาดโอกาสรับโบนัสพิเศษ`);
      state.urgentOrder = null;
      updateUrgentOrderUI();
      playBeep(200, 'sine', 0.4);
    }
  }
}

function updateUrgentOrderUI() {
  const box = document.getElementById('urgent-order-box');
  if (!box) return;
  
  if (state.urgentOrder) {
    const minLeft = Math.floor(state.urgentOrder.timeLeft / 60);
    const secLeft = Math.floor(state.urgentOrder.timeLeft % 60);
    const progress = `${state.urgentOrder.currentCount}/${state.urgentOrder.targetCount}`;
    box.innerHTML = `
      <div style="font-weight: bold; color: var(--color-magenta); margin-bottom: 0.25rem;">ประเภท: ${state.urgentOrder.type} | ส่งมอบแล้ว: ${progress}</div>
      <div style="color: var(--color-cyan); font-family: monospace;">เวลาคงเหลือ: ${minLeft}:${String(secLeft).padStart(2,'0')}</div>
      <div style="font-size:0.65rem; color: var(--text-secondary); margin-top:0.25rem;">รางวัลโบนัส: $${state.urgentOrder.reward}</div>
    `;
  } else {
    box.innerHTML = `<span style="color: var(--text-secondary);">ไม่มีคำสั่งซื้อพิเศษเข้ามาในขณะนี้</span>`;
  }
}

// -------------------------------------------------------------
// PHYSICS ENGINE (IoT Sensors & PINN Wear Out Model)
// -------------------------------------------------------------
function runStationPhysics(station, dt) {
  if (station.type === 'generator' || station.type === 'package') return;
  
  const isBusy = station.processingParts.length > 0;
  
  // 1. Wear Rate accumulation
  let wearRate = 0.008; // Base wear % per second
  if (station.overclockActive) wearRate *= 4.0; // OC wear acceleration
  if (station.temperature > 65) wearRate *= 2.0; // Heat damage
  
  // Reduce wear accumulation if local optimal DOE applied
  if (station.localDoeOptimalApplied) wearRate *= 0.5;
  
  if (isBusy && station.state !== 'failed') {
    station.wear = Math.min(100.0, station.wear + wearRate * dt);
  }
  
  // 2. Temperature physics
  // T rises when working or overclocked, cools down when idle
  let targetTemp = 30.0;
  if (isBusy) targetTemp += 15.0;
  if (station.overclockActive) targetTemp += 35.0;
  // Wear adds friction heat
  targetTemp += (station.wear * 0.4);
  // Optimal lubrication from DOE cools machine
  if (station.localDoeOptimalApplied) targetTemp -= 12.0;
  
  station.temperature += (targetTemp - station.temperature) * 0.08 * dt;
  
  // 3. Vibration physics
  // Vibration is base + wear impact + speed impact + random noise
  let targetVibe = 0.4;
  if (isBusy) targetVibe += 0.5;
  if (station.overclockActive) targetVibe += 1.8;
  targetVibe += (station.wear * 0.06);
  targetVibe += station.alignmentError * 1.5;
  
  if (station.localDoeOptimalApplied) targetVibe *= 0.4; // optimal setting lowers vibration
  
  station.vibration = targetVibe + (Math.random() * 0.15 - 0.075);
  if (station.vibration < 0.1) station.vibration = 0.1;
  
  // 4. Machine failure triggers
  if (station.wear >= 100.0 && station.state !== 'failed') {
    station.state = 'failed';
    station.vibration = 0.0;
    station.temperature = 25.0; // Cools down completely
    playBeep(120, 'sawtooth', 0.8);
    addJournal(`💥 เครื่องชำรุดล้มเหลวถาวร: ${station.name}! ต้องส่งช่างบำรุงทำการยกเครื่องใหญ่ (Overhaul)`);
  }
  
  // 5. Update State Tag
  if (station.state !== 'failed' && station.state !== 'maintenance') {
    if (station.overclockActive) {
      station.state = 'overclock';
    } else if (isBusy) {
      station.state = 'busy';
    } else {
      station.state = 'idle';
    }
  }
}

// Get PINN predictive remaining time to failure (in hours)
function getPinnEstimatedTtf(station) {
  if (station.state === 'failed') return 0;
  
  // Physics formula: fatigue acceleration based on temp and vibration
  const heatFriction = Math.max(0.1, station.temperature - 28.0);
  const stressAmp = Math.max(0.1, station.vibration);
  
  const wearVelocity = (heatFriction * 0.002) + (stressAmp * 0.04);
  const hoursLeft = (100.0 - station.wear) / (wearVelocity + 0.01);
  
  return parseFloat(hoursLeft.toFixed(1));
}

// -------------------------------------------------------------
// DYNAMIC PREVENTIVE MAINTENANCE DISPATCHING
// -------------------------------------------------------------
function dispatchPm(stationId, type) {
  // Find crew
  let crewAssigned = null;
  if (state.crew1 === 'free') {
    crewAssigned = 'crew1';
  } else if (state.crew2 === 'free') {
    crewAssigned = 'crew2';
  }
  
  if (!crewAssigned) {
    addJournal("🚨 ช่างเทคนิคเต็มกำลัง! กรุณารอช่างซ่อมบำรุงคนก่อนหน้ากลับประจำการ");
    playBeep(250, 'sine', 0.2);
    return;
  }
  
  const station = stations.find(s => s.id === stationId);
  if (!station) return;
  
  let cost = 0;
  let duration = 0;
  if (type === 'lube') { cost = 50; duration = 4; }
  else if (type === 'calib') { cost = 150; duration = 7; }
  else if (type === 'overhaul') { cost = 500; duration = 12; }
  
  // Deduct PM cost
  state.pmCost += cost;
  state.netProfit -= cost;
  
  station.state = 'maintenance';
  
  if (crewAssigned === 'crew1') {
    state.crew1 = 'busy';
    state.crew1Target = stationId;
    state.crew1Timer = duration;
    document.getElementById('crew1-status').textContent = `กำลังซ่อมบำรุงที่ ${station.name} (${duration}s)`;
    document.getElementById('crew1-status').className = 'loss-text';
  } else {
    state.crew2 = 'busy';
    state.crew2Target = stationId;
    state.crew2Timer = duration;
    document.getElementById('crew2-status').textContent = `กำลังซ่อมบำรุงที่ ${station.name} (${duration}s)`;
    document.getElementById('crew2-status').className = 'loss-text';
  }
  
  playBeep(523.25, 'triangle', 0.15);
  addJournal(`🔧 ส่งช่างซ่อมบำรุง (${crewAssigned}) ไปยัง ${station.name} เพื่อทำ PM: ${type === 'lube' ? 'หยอดน้ำมัน' : type === 'calib' ? 'สอบเทียบเครื่อง' : 'ยกเครื่องใหม่'}`);
  
  updateFinancialsUI();
}

function updatePmCrews(dt) {
  // Crew 1 Update
  if (state.crew1 === 'busy') {
    state.crew1Timer -= dt;
    const station = stations.find(s => s.id === state.crew1Target);
    if (state.crew1Timer <= 0) {
      completePm(state.crew1Target, 'crew1');
    } else if (station) {
      document.getElementById('crew1-status').textContent = `ช่างกำลังทำงานที่ ${station.name} (${Math.ceil(state.crew1Timer)} วิ)`;
    }
  }
  
  // Crew 2 Update
  if (state.crew2 === 'busy') {
    state.crew2Timer -= dt;
    const station = stations.find(s => s.id === state.crew2Target);
    if (state.crew2Timer <= 0) {
      completePm(state.crew2Target, 'crew2');
    } else if (station) {
      document.getElementById('crew2-status').textContent = `ช่างกำลังทำงานที่ ${station.name} (${Math.ceil(state.crew2Timer)} วิ)`;
    }
  }
}

function completePm(stationId, crew) {
  const station = stations.find(s => s.id === stationId);
  if (station) {
    if (station.state === 'failed') {
      // Rebuilding a broken machine resets everything
      station.wear = 0.0;
      station.alignmentError = 0;
      station.temperature = 30.0;
      station.vibration = 0.3;
      station.state = 'idle';
      addJournal(`✅ ยกเครื่องใหม่ (Overhaul) ${station.name} สำเร็จ! เครื่องพร้อมทำงานใหม่ 100%`);
    } else {
      // Regular PM decreases fatigue and wear
      station.wear = Math.max(0.0, station.wear - 30.0);
      station.alignmentError = 0;
      station.state = 'idle';
      addJournal(`✅ ช่างบำรุงรักษาเชิงป้องกันที่ ${station.name} สำเร็จ! ปรับตั้งสภาวะกลับสู่โหมดประหยัด`);
    }
  }
  
  if (crew === 'crew1') {
    state.crew1 = 'free';
    state.crew1Target = null;
    document.getElementById('crew1-status').textContent = 'ว่าง (FREE)';
    document.getElementById('crew1-status').className = 'profit-text';
  } else {
    state.crew2 = 'free';
    state.crew2Target = null;
    document.getElementById('crew2-status').textContent = 'ว่าง (FREE)';
    document.getElementById('crew2-status').className = 'profit-text';
  }
  
  playChime();
}

// -------------------------------------------------------------
// LOCAL FACTORIAL DOE SIMULATION math
// -------------------------------------------------------------
function runStationDoe(stationId) {
  const station = stations.find(s => s.id === stationId);
  if (!station) return;
  
  // Factor A: Speed (Low: 50%, High: 100%)
  // Factor B: Lubricant Frequency (Low: 20%, High: 80%)
  
  // Yield response variables based on factors:
  // Trial 1: Speed Low (-), Lube Low (-) -> Vibe: Low-med (1.8), Cycle Time: Slow (5.5)
  // Trial 2: Speed High (+), Lube Low (-) -> Vibe: Very high (5.8), Cycle Time: Fast (2.0)
  // Trial 3: Speed Low (-), Lube High (+) -> Vibe: Very low (0.5), Cycle Time: Slow (5.5)
  // Trial 4: Speed High (+), Lube High (+) -> Vibe: Med-low (1.4), Cycle Time: Fast (2.0)
  
  station.doeTrialsVibe = [
    1.6 + Math.random() * 0.3,
    5.6 + Math.random() * 0.4,
    0.4 + Math.random() * 0.15,
    1.2 + Math.random() * 0.2
  ];
  
  station.doeTrialsCycle = [5.5, 2.0, 5.5, 2.0];
  station.localDoeTested = true;
  
  // Enable Apply button in UI
  const applyBtn = document.getElementById('btn-doe-apply-local');
  if (applyBtn) applyBtn.disabled = false;
  
  // Calculate Main Effects for local display
  // Effect A (Speed) = ((T2 + T4) - (T1 + T3)) / 2
  // Effect B (Lube) = ((T3 + T4) - (T1 + T2)) / 2
  const effectA = ((station.doeTrialsVibe[1] + station.doeTrialsVibe[3]) - (station.doeTrialsVibe[0] + station.doeTrialsVibe[2])) / 2.0;
  const effectB = ((station.doeTrialsVibe[2] + station.doeTrialsVibe[3]) - (station.doeTrialsVibe[0] + station.doeTrialsVibe[1])) / 2.0;
  
  // Render Modal DOE table
  renderModalDoeTable(station, effectA, effectB);
  
  playChime();
  addJournal(`🔬 ทำการวิเคราะห์การทดลอง 2² (DOE Test) ที่เครื่อง ${station.name} สำเร็จ! ค่าความสั่นสะเทือนคำนวณเรียบร้อย`);
}

function renderModalDoeTable(station, effA, effB) {
  document.getElementById('doe-t1-v').textContent = station.doeTrialsVibe[0].toFixed(2) + ' mm/s';
  document.getElementById('doe-t2-v').textContent = station.doeTrialsVibe[1].toFixed(2) + ' mm/s';
  document.getElementById('doe-t3-v').textContent = station.doeTrialsVibe[2].toFixed(2) + ' mm/s';
  document.getElementById('doe-t4-v').textContent = station.doeTrialsVibe[3].toFixed(2) + ' mm/s';
  
  document.getElementById('doe-t1-c').textContent = station.doeTrialsCycle[0] + 's';
  document.getElementById('doe-t2-c').textContent = station.doeTrialsCycle[1] + 's';
  document.getElementById('doe-t3-c').textContent = station.doeTrialsCycle[2] + 's';
  document.getElementById('doe-t4-c').textContent = station.doeTrialsCycle[3] + 's';
  
  // Visual effects bars
  // Max scale to 6.0 mm/s
  const barA = document.getElementById('doe-effect-a');
  const valA = document.getElementById('doe-effect-a-val');
  if (barA && valA) {
    const pct = Math.min(100, Math.max(0, Math.abs(effA) * 16));
    barA.style.width = pct + '%';
    barA.style.backgroundColor = effA > 0 ? 'var(--color-rose)' : 'var(--color-emerald)';
    valA.textContent = (effA > 0 ? '+' : '') + effA.toFixed(2);
  }
  
  const barB = document.getElementById('doe-effect-b');
  const valB = document.getElementById('doe-effect-b-val');
  if (barB && valB) {
    const pct = Math.min(100, Math.max(0, Math.abs(effB) * 16));
    barB.style.width = pct + '%';
    barB.style.backgroundColor = effB > 0 ? 'var(--color-rose)' : 'var(--color-emerald)';
    valB.textContent = (effB > 0 ? '+' : '') + effB.toFixed(2);
  }
  
  // Enable Apply Button
  const btn = document.getElementById('btn-doe-apply-local');
  if (btn) btn.disabled = false;
}

// -------------------------------------------------------------
// DYNAMIC FACTORY SIMULATION FLOW ENGINE
// -------------------------------------------------------------
function spawnPart(type) {
  const source = stations.find(s => s.id === 'S1');
  if (!source) return;
  
  // Check if buffer capacity of next station (S2) is full
  const nextStation = stations.find(s => s.id === 'S2');
  if (nextStation && nextStation.queue.length >= nextStation.queueCapacity) {
    source.state = 'blocked';
    return;
  }
  
  const p = new Part(type, source.x, source.y);
  parts.push(p);
  source.state = 'busy';
  
  // Subtract material cost immediately on spawn
  state.opsCost += PART_MAT_COST[type];
  state.netProfit -= PART_MAT_COST[type];
  updateFinancialsUI();
}

function processSimulation(dt) {
  // 1. Generator Spawning Logic
  const genStation = stations.find(s => s.type === 'generator');
  if (genStation) {
    genStation.timer = (genStation.timer || 0) + dt;
    if (genStation.timer >= genStation.cycleTime) {
      genStation.timer = 0;
      
      // Roll product type based on planned custom mix ratios
      const r = Math.random() * 100;
      let selectedType = 'A';
      if (r < state.prodMix.A) {
        selectedType = 'A';
      } else if (r < (state.prodMix.A + state.prodMix.B)) {
        selectedType = 'B';
      } else {
        selectedType = 'C';
      }
      
      spawnPart(selectedType);
    }
  }

  // 2. Conveyor movement and Routing (Multi-node path follower)
  parts.forEach(p => {
    if (p.state === 'moving') {
      const conv = conveyors[p.conveyorId];
      if (conv) {
        if (p.pathNodeIndex === undefined || p.pathNodeIndex === null) {
          p.pathNodeIndex = 1;
        }
        
        const p2 = conv.path[p.pathNodeIndex];
        if (p2) {
          let dx = p2[0] - p.x;
          let dy = p2[1] - p.y;
          let dist = Math.sqrt(dx*dx + dy*dy);
          
          if (dist > p.speed) {
            p.x += (dx / dist) * p.speed;
            p.y += (dy / dist) * p.speed;
          } else {
            // Reached path node
            p.x = p2[0];
            p.y = p2[1];
            p.pathNodeIndex++;
            
            // If reached the end of the path
            if (p.pathNodeIndex >= conv.path.length) {
              p.pathNodeIndex = 1; // Reset node index
              const targetId = conv.to;
              const target = stations.find(s => s.id === targetId);
              if (target) {
                p.state = 'queued';
                p.x = target.x;
                p.y = target.y;
                target.queue.push(p);
                sortQueue(target);
              }
            }
          }
        }
      }
    }
  });

  // 3. Stations Processing & IoT wear accumulation
  stations.forEach(s => {
    runStationPhysics(s, dt);
    
    if (s.type === 'generator') return;
    
    // Check if repair is active
    if (s.state === 'maintenance') return;
    
    // Machine is broken down
    if (s.state === 'failed') {
      // Accrue downtime losses ($200 per second of game speed time)
      const cost = Math.floor(80 * dt);
      state.downtimeCost += cost;
      state.netProfit -= cost;
      updateFinancialsUI();
      return;
    }
    
    // Server processing loop
    // Process queued parts up to resource count limit
    while (s.processingParts.length < s.resourceCount && s.queue.length > 0) {
      const part = s.queue.shift();
      part.state = 'processing';
      // Introduce stochastic process variability (±15% variance) resembling Arena distributions
      const varianceFactor = 0.85 + Math.random() * 0.3;
      part.processTimer = s.cycleTime * (s.overclockActive ? 0.65 : 1.0) * varianceFactor;
      s.processingParts.push(part);
    }
    
    // Tick processing parts
    for (let i = s.processingParts.length - 1; i >= 0; i--) {
      const p = s.processingParts[i];
      p.processTimer -= dt;
      
      if (p.processTimer <= 0) {
        // Processing Complete! Route to next conveyor
        s.processingParts.splice(i, 1);
        p.state = 'moving';
        p.entryTime = state.simTime;
        
        if (s.type === 'process') {
          p.conveyorId = 'C2';
          p.x = s.x; p.y = s.y;
          p.pathNodeIndex = 1;
        }
        else if (s.type === 'inspect') {
          // Decision node (Pass / Fail)
          let rejectRate = 0.15; // 15% fail by default
          if (s.overclockActive) rejectRate = 0.35; // OC degrades quality
          
          if (state.diverterGate === 'rework' || Math.random() < rejectRate) {
            p.routingDecision = 'fail';
            p.conveyorId = 'C3_fail';
            p.x = s.x; p.y = s.y;
            p.pathNodeIndex = 1;
            state.partsRejected++;
            addJournal(`⚠️ ชิ้นงานไม่ผ่านตรวจสอบ (Rejected) ที่ ${s.name}! เบี่ยงไปปรับแก้งาน`);
            playBeep(330, 'triangle', 0.25);
          } else {
            p.routingDecision = 'pass';
            p.conveyorId = 'C3_pass';
            p.x = s.x; p.y = s.y;
            p.pathNodeIndex = 1;
            state.partsPassed++;
          }
        }
        else if (s.type === 'rework') {
          p.conveyorId = 'C4_rework';
          p.x = s.x; p.y = s.y;
          p.pathNodeIndex = 1;
          // Accrue rework cost
          state.reworkCost += 30;
          state.netProfit -= 30;
          updateFinancialsUI();
        }
        else if (s.type === 'package') {
          // Dispose part from simulation and record revenue!
          parts = parts.filter(pt => pt.id !== p.id);
          state.partsProduced[p.type]++;
          
          let payout = PART_VAL[p.type];
          // Check urgent order target
          if (state.urgentOrder && state.urgentOrder.type === p.type) {
            state.urgentOrder.currentCount++;
            if (state.urgentOrder.currentCount >= state.urgentOrder.targetCount) {
              payout += state.urgentOrder.reward;
              playChime();
              addJournal(`🏆 สำเร็จภารกิจเร่งด่วน! ได้รับโบนัสพิเศษก้อนโต $${state.urgentOrder.reward}`);
              state.urgentOrder = null;
            }
          }
          
          state.revenue += payout;
          state.netProfit += payout;
          
          playBeep(880, 'sine', 0.1);
          updateFinancialsUI();
        }
      }
    }
  });
  
  // Update state variables
  state.totalWIP = parts.length;
}

function updateFinancialsUI() {
  document.getElementById('led-revenue').textContent = `$${state.revenue}`;
  document.getElementById('led-ops').textContent = `- $${state.opsCost}`;
  document.getElementById('led-pm').textContent = `- $${state.pmCost}`;
  document.getElementById('led-rework').textContent = `- $${state.reworkCost}`;
  document.getElementById('led-downtime').textContent = `- $${state.downtimeCost}`;
  
  const netEl = document.getElementById('led-net');
  if (netEl) {
    netEl.textContent = `${state.netProfit >= 0 ? '' : '-'}$${Math.abs(state.netProfit)}`;
    netEl.className = state.netProfit >= 0 ? 'profit-text' : 'loss-text';
  }
  
  const hudNet = document.getElementById('hud-net-profit');
  if (hudNet) {
    hudNet.textContent = `${state.netProfit >= 0 ? '' : '-'}$${Math.abs(state.netProfit)}`;
    hudNet.className = state.netProfit >= 0 ? 'profit-text' : 'loss-text';
  }
}

// -------------------------------------------------------------
// SCADA CONTROL PANEL & DATA TABLE RENDERER
// -------------------------------------------------------------
function renderConfigTable() {
  const tbody = document.getElementById('table-stations-body');
  if (!tbody) return;
  
  tbody.innerHTML = '';
  stations.forEach(s => {
    if (s.type === 'generator') return; // Skip source
    
    // Status Badge Markup
    let badgeClass = 'badge-idle';
    let statusText = 'ปกติ (IDLE)';
    if (s.state === 'failed') { badgeClass = 'badge-fail'; statusText = 'ชำรุด (BROKEN)'; }
    else if (s.state === 'maintenance') { badgeClass = 'badge-idle'; statusText = 'บำรุงรักษา (PM)'; }
    else if (s.state === 'overclock') { badgeClass = 'badge-overclock'; statusText = 'เร่งเครื่อง (OC)'; }
    else if (s.state === 'busy') { badgeClass = 'badge-run'; statusText = 'ทำงาน (RUN)'; }
    else if (s.queue.length >= s.queueCapacity) { badgeClass = 'badge-block'; statusText = 'คอขวด (BLOCK)'; }
    
    const cycleTimeInput = `<input type="number" step="0.5" min="1" max="15" value="${s.cycleTime}" onchange="updateStationParam('${s.id}', 'cycleTime', this.value)"> s`;
    const queueCapInput = `<input type="number" min="1" max="100" value="${s.queueCapacity}" onchange="updateStationParam('${s.id}', 'queueCapacity', this.value)">`;
    
    const discSelect = `
      <select onchange="updateStationParam('${s.id}', 'queueDiscipline', this.value)" style="width:75px; padding:0.15rem 0.35rem; font-size:0.75rem;">
        <option value="fifo" ${s.queueDiscipline === 'fifo' ? 'selected' : ''}>FIFO</option>
        <option value="lifo" ${s.queueDiscipline === 'lifo' ? 'selected' : ''}>LIFO</option>
        <option value="priority" ${s.queueDiscipline === 'priority' ? 'selected' : ''}>Priority</option>
        <option value="spt" ${s.queueDiscipline === 'spt' ? 'selected' : ''}>SPT</option>
      </select>
    `;
    
    const resourceInput = `<input type="number" min="1" max="5" value="${s.resourceCount}" onchange="updateStationParam('${s.id}', 'resourceCount', this.value)">`;
    const overclockCheck = `<input type="checkbox" ${s.overclockActive ? 'checked' : ''} onchange="toggleOverclock('${s.id}', this.checked)">`;
    
    const wearInfo = `${Math.round(s.wear)}%`;
    
    tbody.innerHTML += `
      <tr class="${s.state === 'failed' ? 'doe-run-active' : ''}">
        <td><strong>${s.id}</strong> (${s.name})</td>
        <td>${s.type}</td>
        <td>${cycleTimeInput}</td>
        <td>${queueCapInput}</td>
        <td>${discSelect}</td>
        <td>${resourceInput} คน</td>
        <td class="${s.wear > 70 ? 'loss-text' : ''}">${wearInfo}</td>
        <td style="text-align:center;">${overclockCheck}</td>
        <td><span class="badge ${badgeClass}">${statusText}</span></td>
        <td>
          <button class="btn btn-sm btn-cyan" onclick="openDigitalTwinModal('${s.id}')">📡 Digital Twin / DOE</button>
        </td>
      </tr>
    `;
  });
}

window.updateStationParam = function(id, param, val) {
  const s = stations.find(station => station.id === id);
  if (s) {
    if (param === 'cycleTime') s.cycleTime = parseFloat(val) || 3;
    if (param === 'queueCapacity') s.queueCapacity = parseInt(val) || 5;
    if (param === 'resourceCount') s.resourceCount = parseInt(val) || 1;
    if (param === 'queueDiscipline') {
      s.queueDiscipline = val;
      sortQueue(s);
    }
    renderConfigTable();
    addJournal(`⚙️ ปรับตั้งพารามิเตอร์ ${s.name}: ${param} -> ${val}`);
  }
};

window.toggleOverclock = function(id, checked) {
  const s = stations.find(station => station.id === id);
  if (s) {
    s.overclockActive = checked;
    renderConfigTable();
    playBeep(checked ? 600 : 400, 'triangle', 0.15);
    addJournal(`⚡ Toggled Overclocking on ${s.name}: ${checked ? 'เปิดใช้งาน (เสี่ยงความร้อนสูง)' : 'ปิดใช้งาน'}`);
  }
};

// -------------------------------------------------------------
// DYNAMIC TABS ROUTING
// -------------------------------------------------------------
const tabFloorBtn = document.getElementById('tab-floor-btn');
const tabLogicBtn = document.getElementById('tab-logic-btn');
const tabOptBtn = document.getElementById('tab-opt-btn');
const tabFloor = document.getElementById('tab-floor');
const tabLogic = document.getElementById('tab-logic');
const tabOpt = document.getElementById('tab-opt');

if (tabFloorBtn && tabLogicBtn && tabOptBtn && tabFloor && tabLogic && tabOpt) {
  tabFloorBtn.addEventListener('click', () => {
    tabFloorBtn.classList.add('active');
    tabLogicBtn.classList.remove('active');
    tabOptBtn.classList.remove('active');
    tabFloor.classList.add('active');
    tabLogic.classList.remove('active');
    tabOpt.classList.remove('active');
  });
  tabLogicBtn.addEventListener('click', () => {
    tabLogicBtn.classList.add('active');
    tabFloorBtn.classList.remove('active');
    tabOptBtn.classList.remove('active');
    tabFloor.classList.remove('active');
    tabLogic.classList.add('active');
    tabOpt.classList.remove('active');
    renderLogicFlowchart();
  });
  tabOptBtn.addEventListener('click', () => {
    tabOptBtn.classList.add('active');
    tabFloorBtn.classList.remove('active');
    tabLogicBtn.classList.remove('active');
    tabFloor.classList.remove('active');
    tabLogic.classList.remove('active');
    tabOpt.classList.add('active');
    initOptTab();
  });
}

function renderLogicFlowchart() {
  const view = document.getElementById('logic-flow-view');
  if (!view) return;
  
  view.innerHTML = '';
  stations.forEach(s => {
    const queueLen = s.queue.length;
    const procLen = s.processingParts.length;
    
    view.innerHTML += `
      <div style="display: flex; align-items: center; justify-content: space-between; background: rgba(255,255,255,0.03); border: 1px solid var(--border-color); padding: 0.75rem 1rem; border-radius: 6px;">
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <span style="font-family: var(--font-mono); color: var(--color-cyan); font-weight: bold;">[${s.id}]</span>
          <strong style="color: var(--text-primary);">${s.name}</strong>
        </div>
        <div style="display: flex; gap: 1.5rem; font-size: 0.8rem; font-family: monospace;">
          <span style="color: var(--color-amber);">คิวรอ (Queue): ${queueLen}/${s.type === 'generator' ? 'inf' : s.queueCapacity}</span>
          <span style="color: var(--color-emerald);">กำลังประมวลผล (WIP): ${procLen}/${s.resourceCount}</span>
        </div>
      </div>
    `;
  });
}

// -------------------------------------------------------------
// HIGH-PERFORMANCE CANVAS RENDER LOOP (Conveyor / Robot Anim)
// -------------------------------------------------------------
const canvas = document.getElementById('simulation-canvas');
let ctx = null;
if (canvas) ctx = canvas.getContext('2d');

let animationFrameId = null;
let lastTime = 0;

function drawConveyors() {
  if (!ctx) return;
  
  for (let key in conveyors) {
    const path = conveyors[key].path;
    
    // Draw outer steel rail (dark outline)
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 14;
    ctx.lineCap = 'square';
    ctx.beginPath();
    ctx.moveTo(path[0][0], path[0][1]);
    for (let i = 1; i < path.length; i++) {
      ctx.lineTo(path[i][0], path[i][1]);
    }
    ctx.stroke();
    
    // Draw conveyor body (shaded metallic gray)
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(path[0][0], path[0][1]);
    for (let i = 1; i < path.length; i++) {
      ctx.lineTo(path[i][0], path[i][1]);
    }
    ctx.stroke();
    
    // Draw conveyor roller plates (blocky stripes)
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 8;
    ctx.setLineDash([6, 8]);
    ctx.beginPath();
    ctx.moveTo(path[0][0], path[0][1]);
    for (let i = 1; i < path.length; i++) {
      ctx.lineTo(path[i][0], path[i][1]);
    }
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Animated directional arrow overlays (pixel-style arrows)
    ctx.fillStyle = '#64748b';
    const numPoints = path.length;
    for (let pIdx = 0; pIdx < numPoints - 1; pIdx++) {
      const p1 = path[pIdx];
      const p2 = path[pIdx + 1];
      const dx = p2[0] - p1[0];
      const dy = p2[1] - p1[1];
      const len = Math.sqrt(dx*dx + dy*dy);
      
      const step = 35;
      const offset = (state.simTime * 20) % step;
      for (let d = offset; d < len; d += step) {
        const ax = p1[0] + (dx / len) * d;
        const ay = p1[1] + (dy / len) * d;
        
        ctx.fillStyle = 'rgba(0, 242, 254, 0.25)';
        ctx.fillRect(ax - 2, ay - 2, 4, 4);
      }
    }
  }
}

function drawMachines() {
  if (!ctx) return;
  
  stations.forEach(s => {
    let stateColor = '#64748b'; // Idle
    if (s.state === 'failed') stateColor = '#ef4444'; // Failed
    else if (s.state === 'maintenance') stateColor = '#6366f1'; // PM
    else if (s.state === 'overclock') stateColor = '#ff007f'; // OC
    else if (s.state === 'busy') stateColor = '#10b981'; // Busy
    
    // Draw dynamic glow ring on the floor
    ctx.strokeStyle = stateColor;
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.arc(s.x, s.y + 12, 25, 0, 2 * Math.PI);
    ctx.stroke();
    
    // Draw text label with neon glow
    ctx.fillStyle = 'var(--text-secondary)';
    ctx.font = 'bold 8px var(--font-mono)';
    ctx.textAlign = 'center';
    ctx.fillText(s.id, s.x, s.y - 36);
    
    // Draw pixel art machines
    if (s.type === 'generator') {
      // 1. Warehouse Source (Pixel Art Factory)
      ctx.fillStyle = '#b91c1c';
      ctx.fillRect(s.x - 16, s.y - 10, 32, 22);
      ctx.fillStyle = '#7f1d1d';
      ctx.fillRect(s.x - 16, s.y + 8, 32, 4);
      
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.moveTo(s.x - 18, s.y - 10);
      ctx.lineTo(s.x, s.y - 22);
      ctx.lineTo(s.x + 18, s.y - 10);
      ctx.fill();
      
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(s.x - 6, s.y + 2, 12, 10);
      
      ctx.fillStyle = '#334155';
      ctx.fillRect(s.x + 8, s.y - 20, 6, 12);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(s.x + 7, s.y - 22, 8, 3);
      
      if (state.playing && Math.floor(state.simTime * 5) % 3 === 0) {
        ctx.fillStyle = 'rgba(148, 163, 184, 0.4)';
        ctx.fillRect(s.x + 9 + (Math.sin(state.simTime) * 3), s.y - 28 - (Math.floor(state.simTime * 5) % 15), 4, 4);
      }
    }
    else if (s.type === 'inspect') {
      // 2. QA Inspection Scan Arch
      ctx.fillStyle = '#334155';
      ctx.fillRect(s.x - 16, s.y - 18, 6, 32);
      ctx.fillRect(s.x + 10, s.y - 18, 6, 32);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(s.x - 16, s.y - 22, 32, 6);
      
      ctx.fillStyle = (state.simTime % 1.0 > 0.5) ? 'var(--color-cyan)' : '#075985';
      ctx.fillRect(s.x - 13, s.y - 20, 3, 3);
      ctx.fillStyle = (state.simTime % 1.0 < 0.5) ? 'var(--color-cyan)' : '#075985';
      ctx.fillRect(s.x + 10, s.y - 20, 3, 3);
      
      if (s.state === 'busy' || s.state === 'overclock') {
        const sweepY = s.y - 16 + (Math.sin(state.simTime * 12) + 1) * 14;
        ctx.strokeStyle = 'var(--color-cyan)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(s.x - 16, sweepY);
        ctx.lineTo(s.x + 16, sweepY);
        ctx.stroke();
        
        ctx.fillStyle = 'rgba(0, 242, 254, 0.08)';
        ctx.fillRect(s.x - 16, sweepY - 2, 32, 4);
      }
    }
    else if (s.type === 'process') {
      // 3. Robotic Machining Unit
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(s.x - 14, s.y + 6, 28, 8);
      ctx.fillStyle = '#eab308'; // Safety Yellow base
      ctx.fillRect(s.x - 12, s.y - 2, 24, 8);
      
      ctx.fillStyle = '#475569';
      ctx.beginPath();
      ctx.arc(s.x, s.y - 2, 5, 0, 2*Math.PI);
      ctx.fill();
      
      let theta1 = -0.3 + Math.sin(state.simTime * 6) * 0.15;
      let theta2 = 0.5 + Math.cos(state.simTime * 6) * 0.25;
      if (s.state === 'idle') {
        theta1 = -0.5;
        theta2 = 0.8;
      }
      
      const l1 = 16;
      const x1 = s.x + Math.sin(theta1) * l1;
      const y1 = (s.y - 2) - Math.cos(theta1) * l1;
      
      ctx.strokeStyle = '#eab308';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(s.x, s.y - 2);
      ctx.lineTo(x1, y1);
      ctx.stroke();
      
      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.arc(x1, y1, 4, 0, 2*Math.PI);
      ctx.fill();
      
      const l2 = 14;
      const x2 = x1 + Math.sin(theta1 + theta2) * l2;
      const y2 = y1 - Math.cos(theta1 + theta2) * l2;
      
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(x2 - 3, y2 - 3, 6, 6);
      
      if (s.state === 'busy' || s.state === 'overclock') {
        ctx.fillStyle = s.state === 'overclock' ? 'var(--color-magenta)' : 'var(--color-cyan)';
        for (let pIdx = 0; pIdx < 3; pIdx++) {
          const px = x2 + (Math.random() * 8 - 4);
          const py = y2 + 8 + (Math.random() * 12);
          ctx.fillRect(px, py, 2, 2);
        }
      }
    }
    else if (s.type === 'rework') {
      // 4. Rework Workbench
      ctx.fillStyle = '#78350f'; // Dark Brown wood
      ctx.fillRect(s.x - 18, s.y - 4, 36, 6);
      ctx.fillStyle = '#451a03';
      ctx.fillRect(s.x - 16, s.y + 2, 4, 12);
      ctx.fillRect(s.x + 12, s.y + 2, 4, 12);
      ctx.fillStyle = '#d97706';
      ctx.fillRect(s.x - 8, s.y + 2, 16, 6);
      ctx.fillStyle = '#1e293b'; // handle
      ctx.fillRect(s.x - 2, s.y + 4, 4, 2);
      
      ctx.fillStyle = '#475569';
      ctx.fillRect(s.x - 14, s.y - 16, 10, 12);
      ctx.fillStyle = (state.simTime % 2.0 > 0.4) ? 'var(--color-emerald)' : '#065f46';
      ctx.fillRect(s.x - 12, s.y - 14, 6, 8);
      
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(s.x + 6, s.y - 10, 8, 6);
    }
    else if (s.type === 'package') {
      // 5. Packaging Unit
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(s.x - 18, s.y - 12, 36, 26);
      ctx.fillStyle = '#334155';
      ctx.fillRect(s.x - 16, s.y - 10, 32, 22);
      
      ctx.fillStyle = '#020617';
      ctx.fillRect(s.x - 10, s.y - 2, 20, 14);
      
      ctx.fillStyle = '#64748b';
      ctx.fillRect(s.x - 12, s.y + 12, 24, 4);
      
      ctx.fillStyle = (state.simTime % 1.5 > 0.7) ? 'var(--color-emerald)' : '#064e3b';
      ctx.beginPath();
      ctx.arc(s.x + 12, s.y - 6, 2, 0, 2*Math.PI);
      ctx.fill();
    }
    
    // Bottleneck Warnings
    if (state.bottleneckStation === `${s.name} (${s.id})`) {
      ctx.strokeStyle = 'var(--color-amber)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(s.x, s.y - 48);
      ctx.lineTo(s.x - 8, s.y - 36);
      ctx.lineTo(s.x + 8, s.y - 36);
      ctx.closePath();
      ctx.stroke();
      
      ctx.fillStyle = 'var(--color-amber)';
      ctx.font = 'bold 8px monospace';
      ctx.fillText("!", s.x, s.y - 39);
    }
    
    // Live Queue Text
    const qLen = s.queue.length;
    if (s.type !== 'generator' && qLen > 0) {
      ctx.fillStyle = 'var(--text-secondary)';
      ctx.font = 'bold 8px var(--font-mono)';
      ctx.fillText(`Q: ${qLen}`, s.x, s.y + 34);
    }
  });
}

function drawParts() {
  if (!ctx) return;
  
  parts.forEach(p => {
    // 8-bit Pixel Art Crate Box
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(p.x - 6, p.y - 6, 12, 12);
    
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x - 5, p.y - 5, 10, 10);
    
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(p.x - 4, p.y - 4, 3, 3);
    
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.fillRect(p.x - 5, p.y + 2, 10, 3);
    ctx.fillRect(p.x + 2, p.y - 5, 3, 10);
  });
}

function drawManualDiverter() {
  if (!ctx) return;
  
  const jx = 440;
  const jy = 175;
  
  ctx.fillStyle = '#1e293b';
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 2;
  ctx.fillRect(jx - 14, jy - 14, 28, 28);
  ctx.strokeRect(jx - 14, jy - 14, 28, 28);
  
  ctx.fillStyle = state.diverterGate === 'normal' ? 'var(--color-emerald)' : 'var(--color-indigo)';
  
  ctx.beginPath();
  if (state.diverterGate === 'normal') {
    ctx.moveTo(jx - 6, jy - 5);
    ctx.lineTo(jx + 6, jy);
    ctx.lineTo(jx - 6, jy + 5);
  } else {
    ctx.moveTo(jx - 5, jy - 6);
    ctx.lineTo(jx, jy + 6);
    ctx.lineTo(jx + 5, jy - 6);
  }
  ctx.fill();
  
  ctx.fillStyle = state.diverterGate === 'normal' ? 'var(--color-emerald)' : 'var(--color-indigo)';
  ctx.beginPath();
  ctx.arc(jx + 9, jy - 9, 2.5, 0, 2*Math.PI);
  ctx.fill();
}

// -------------------------------------------------------------
// LIVE SCADA CHARTS GENERATOR
// -------------------------------------------------------------
const chartCanvas = document.getElementById('live-chart-canvas');
let chartCtx = null;
if (chartCanvas) chartCtx = chartCanvas.getContext('2d');

function updatePerformanceCharts() {
  if (!chartCtx) return;
  
  const w = chartCanvas.width;
  const h = chartCanvas.height;
  chartCtx.clearRect(0, 0, w, h);
  
  // Grid Lines
  chartCtx.strokeStyle = 'rgba(255,255,255,0.03)';
  chartCtx.lineWidth = 1;
  for (let x = 30; x < w; x += 30) {
    chartCtx.beginPath(); chartCtx.moveTo(x, 0); chartCtx.lineTo(x, h - 20); chartCtx.stroke();
  }
  for (let y = 15; y < h; y += 25) {
    chartCtx.beginPath(); chartCtx.moveTo(30, y); chartCtx.lineTo(w, y); chartCtx.stroke();
  }
  
  // Y-Axis line
  chartCtx.strokeStyle = 'rgba(255,255,255,0.15)';
  chartCtx.beginPath();
  chartCtx.moveTo(30, 0);
  chartCtx.lineTo(30, h - 20);
  chartCtx.stroke();
  
  // X-Axis line
  chartCtx.beginPath();
  chartCtx.moveTo(30, h - 20);
  chartCtx.lineTo(w, h - 20);
  chartCtx.stroke();
  
  // Labels
  chartCtx.fillStyle = 'var(--text-secondary)';
  chartCtx.font = '8px monospace';
  chartCtx.textAlign = 'right';
  chartCtx.fillText("10", 25, 20);
  chartCtx.fillText("5", 25, h / 2 - 5);
  chartCtx.fillText("0", 25, h - 20);
  
  // Draw historical Queue size line
  if (state.chartData.length < 2) return;
  
  chartCtx.strokeStyle = 'var(--color-cyan)';
  chartCtx.lineWidth = 2;
  chartCtx.beginPath();
  
  const points = state.chartData;
  const xStep = (w - 40) / Math.max(20, points.length);
  
  points.forEach((val, idx) => {
    const x = 35 + (idx * xStep);
    // scale max queue size 10 to (h-40) pixels
    const y = (h - 20) - ((val / 10) * (h - 35));
    if (idx === 0) chartCtx.moveTo(x, y);
    else chartCtx.lineTo(x, y);
  });
  chartCtx.stroke();
}

// -------------------------------------------------------------
// SCADA CORE ANIMATION FRAME LOOP
// -------------------------------------------------------------
function animLoop(timestamp) {
  if (!lastTime) lastTime = timestamp;
  let dt = (timestamp - lastTime) / 1000;
  lastTime = timestamp;
  
  // Handle game speed multiplier
  // dt is scaled up based on time scale settings
  let simDt = dt;
  if (state.playing) {
    if (state.speed === 'min') {
      simDt = dt * 6.0; // 1s real = 6s simulation
    } else if (state.speed === 'hr') {
      simDt = dt * 120.0; // 1s real = 2 mins
    } else {
      simDt = dt * 600.0; // 1s real = 10 mins
    }
    
    state.simTime += simDt;
    
    // Core logic tick
    processSimulation(simDt);
    checkRandomEvents(simDt);
    checkUrgentOrders(simDt);
    updatePmCrews(dt); // Use real time dt so crews count down in real seconds
    checkAutoPMTick(simDt);
    
    // Update live clock
    document.getElementById('sim-clock').textContent = formatSimClock();
    
    // Check 30 Day target
    if (state.simTime >= 30 * 86400) {
      pauseGame();
      showMonthlyReportCard();
    }
  }
  
  // Rendering
  if (ctx) {
    // Draw retro grid background
    ctx.fillStyle = '#060912';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.strokeStyle = 'rgba(30, 41, 59, 0.4)';
    ctx.lineWidth = 1;
    for (let gx = 0; gx < canvas.width; gx += 20) {
      ctx.beginPath();
      ctx.moveTo(gx, 0);
      ctx.lineTo(gx, canvas.height);
      ctx.stroke();
    }
    for (let gy = 0; gy < canvas.height; gy += 20) {
      ctx.beginPath();
      ctx.moveTo(0, gy);
      ctx.lineTo(canvas.width, gy);
      ctx.stroke();
    }
    
    drawConveyors();
    drawManualDiverter();
    drawMachines();
    drawParts();
  }
  
  // Oscilloscope for Modal if active
  drawActiveOscilloscope();
  
  animationFrameId = requestAnimationFrame(animLoop);
}

// -------------------------------------------------------------
// DYNAMIC OSCILLOSCOPE DRAWING
// -------------------------------------------------------------
let activeModalTwinId = null;
const oscCanvas = document.getElementById('twin-oscilloscope');
let oscCtx = null;
if (oscCanvas) oscCtx = oscCanvas.getContext('2d');

function drawActiveOscilloscope() {
  if (!oscCtx || !activeModalTwinId) return;
  
  const station = stations.find(s => s.id === activeModalTwinId);
  if (!station) return;
  
  const w = oscCanvas.width;
  const h = oscCanvas.height;
  oscCtx.clearRect(0, 0, w, h);
  
  // Draw grid
  oscCtx.strokeStyle = 'rgba(0, 242, 254, 0.08)';
  oscCtx.lineWidth = 1;
  for (let x = 0; x < w; x += 20) {
    oscCtx.beginPath(); oscCtx.moveTo(x, 0); oscCtx.lineTo(x, h); oscCtx.stroke();
  }
  for (let y = 0; y < h; y += 20) {
    oscCtx.beginPath(); oscCtx.moveTo(0, y); oscCtx.lineTo(w, y); oscCtx.stroke();
  }
  
  // Draw wave
  oscCtx.strokeStyle = station.state === 'failed' ? 'var(--color-rose)' : 'var(--color-cyan)';
  oscCtx.lineWidth = 2;
  oscCtx.beginPath();
  
  // Frequency varies with overclock, amplitude varies with vibration
  const freq = station.overclockActive ? 0.25 : 0.12;
  const amp = station.vibration * 12;
  
  for (let x = 0; x < w; x++) {
    const y = (h / 2) + Math.sin(x * freq + (state.simTime * 8)) * amp + (Math.random() * 2 - 1);
    if (x === 0) oscCtx.moveTo(x, y);
    else oscCtx.lineTo(x, y);
  }
  oscCtx.stroke();
  
  // Update numbers in Modal
  document.getElementById('twin-vibe-val').textContent = station.vibration.toFixed(2) + ' mm/s';
  document.getElementById('twin-temp-val').textContent = station.temperature.toFixed(1) + ' °C';
  document.getElementById('twin-wear-val').textContent = Math.round(station.wear) + '%';
  document.getElementById('twin-wear-bar').style.width = station.wear + '%';
  
  if (station.wear > 75) {
    document.getElementById('twin-wear-bar').style.background = 'var(--color-rose)';
    document.getElementById('twin-wear-val').style.color = 'var(--color-rose)';
  } else if (station.wear > 45) {
    document.getElementById('twin-wear-bar').style.background = 'var(--color-amber)';
    document.getElementById('twin-wear-val').style.color = 'var(--color-amber)';
  } else {
    document.getElementById('twin-wear-bar').style.background = 'var(--color-emerald)';
    document.getElementById('twin-wear-val').style.color = 'var(--color-emerald)';
  }
  
  // PINN Estimation Update
  const ttf = getPinnEstimatedTtf(station);
  document.getElementById('twin-ttf').textContent = ttf > 0 ? ttf + ' ชั่วโมง (Hours)' : 'ชำรุดล้มเหลว (Failed)';
  
  const adviceEl = document.getElementById('twin-pinn-advice');
  if (station.state === 'failed') {
    adviceEl.textContent = '❌ มอเตอร์ชำรุดชะงักงันสมบูรณ์ ต้องส่งพนักงานทำ PM Overhaul ทันที!';
    adviceEl.style.color = 'var(--color-rose)';
  } else if (station.vibration > 4.5) {
    adviceEl.textContent = '⚠️ อุณหภูมิพุ่งสูงเกินมาตรฐาน ISO 10816! แนะนำให้หล่อลื่นด่วน หรือปิดโอเวอร์คล็อก';
    adviceEl.style.color = 'var(--color-rose)';
  } else if (station.wear > 60) {
    adviceEl.textContent = '⚠️ ชิ้นส่วนเริ่มกร่อนตัวตามแบบจำลอง PINN สัญญาณสปริงสึกหรอ ควรตั้งเซ็ต Overhaul ล่วงหน้า';
    adviceEl.style.color = 'var(--color-amber)';
  } else {
    adviceEl.textContent = '✅ ข้อมูลสภาพการสั่นสะเทือนสอดคล้องกับเกณฑ์ Zone A (ปกติ) ทำงานต่อเนื่องได้อย่างมีเสถียรภาพ';
    adviceEl.style.color = 'var(--color-emerald)';
  }
}

// -------------------------------------------------------------
// TYCOON GAME CONTROLS EVENTS
// -------------------------------------------------------------
function pauseGame() {
  state.playing = false;
  document.getElementById('sim-clock').style.color = 'var(--color-rose)';
}

function playGame() {
  state.playing = true;
  document.getElementById('sim-clock').style.color = 'var(--color-cyan)';
}

document.getElementById('btn-sim-pause').addEventListener('click', () => {
  pauseGame();
  addJournal("⏸️ สั่งหยุดเวลาการจำลองชั่วคราว");
});

document.getElementById('btn-sim-play').addEventListener('click', () => {
  playGame();
  addJournal("▶️ เล่นตัวจำลองต่อ");
});

document.getElementById('btn-sim-reset').addEventListener('click', () => {
  resetSimulation();
  addJournal("🔄 รีเซ็ตระบบจำลองและล้างบัญชีกำไรใหม่");
});

// Speed settings click events
const spMin = document.getElementById('btn-speed-min');
const spHr = document.getElementById('btn-speed-hr');
const spDay = document.getElementById('btn-speed-day');

function setSpeed(mode) {
  state.speed = mode;
  spMin.classList.remove('active');
  spHr.classList.remove('active');
  spDay.classList.remove('active');
  
  if (mode === 'min') spMin.classList.add('active');
  if (mode === 'hr') spHr.classList.add('active');
  if (mode === 'day') spDay.classList.add('active');
  
  addJournal(`⏰ สลับระดับความเร็วการประมวลผล: ${mode === 'min' ? 'รายนาที' : mode === 'hr' ? 'รายชั่วโมง' : 'รายวัน'}`);
}

spMin.addEventListener('click', () => setSpeed('min'));
spHr.addEventListener('click', () => setSpeed('hr'));
spDay.addEventListener('click', () => setSpeed('day'));

// Instantly Fast Forward to 30 Days (End of Month)
document.getElementById('btn-fast-forward').addEventListener('click', () => {
  addJournal("⏩ เริ่มประมวลผลแบบรวดเร็ว Month Jump (คำนวณสะสมในวงรอบ 30 วัน)...");
  
  // Fast forward loops
  const step = 60; // 1 min per iteration
  const limit = 30 * 86400;
  
  // Play brief audio beep
  playBeep(660, 'sine', 0.25);
  
  while (state.simTime < limit) {
    processSimulation(step);
    // PM Crews work faster in background jump
    if (state.crew1 === 'busy') {
      state.crew1Timer -= step;
      if (state.crew1Timer <= 0) completePm(state.crew1Target, 'crew1');
    }
    if (state.crew2 === 'busy') {
      state.crew2Timer -= step;
      if (state.crew2Timer <= 0) completePm(state.crew2Target, 'crew2');
    }
    
    state.simTime += step;
  }
  
  pauseGame();
  showMonthlyReportCard();
  playChime();
});

// -------------------------------------------------------------
// DYNAMIC CONVEYOR INTERACTIVE CLICKS
// -------------------------------------------------------------
if (canvas) {
  canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Check if clicked the diverter gate switch box
    if (x >= 426 && x <= 454 && y >= 161 && y <= 189) {
      state.diverterGate = state.diverterGate === 'normal' ? 'rework' : 'normal';
      playBeep(450, 'triangle', 0.1);
      addJournal(`🔀 เปลี่ยนสวิตช์ทิศทางชิ้นงาน: ${state.diverterGate === 'normal' ? 'ส่งออกบรรจุภัณฑ์ (S5)' : 'เบี่ยงเข้าสถานีซ่อมงาน (S4)'}`);
      return;
    }
    
    // Check if clicked any station to open Digital Twin Modal
    stations.forEach(s => {
      const dx = x - s.x;
      const dy = y - s.y;
      const dist = Math.sqrt(dx*dx + dy*dy);
      if (dist <= 26) {
        if (typeof openDigitalTwinModal === 'function') {
          openDigitalTwinModal(s.id);
          playBeep(520, 'sine', 0.1);
        }
      }
    });
  });
}

// -------------------------------------------------------------
// EMERGENCY RESOLUTION BUTTONS
// -------------------------------------------------------------
document.getElementById('btn-alarm-fix').addEventListener('click', () => {
  if (state.activeEvent) {
    // Resolve event
    const station = stations.find(s => s.id === state.activeEvent.targetStationId);
    if (station) {
      station.vibration = 0.5;
      station.temperature = 35;
    }
    addJournal(`🔧 สำเร็จ! ทำการกดแก้ปัญหา ${state.activeEvent.title} ทันเวลา โรงงานกลับคืนสู่สภาวะปกติ`);
    state.activeEvent = null;
    triggerVisualAlarm(false);
    playChime();
  }
});

// -------------------------------------------------------------
// DYNAMIC STATION BUILDER
// -------------------------------------------------------------
document.getElementById('btn-add-station').addEventListener('click', () => {
  const select = document.getElementById('add-station-type');
  const type = select.value;
  
  // Limit stations counts (max 8)
  if (stations.length >= 8) {
    addJournal("🚨 พื้นที่โรงงานเต็มขีดจำกัด! ไม่สามารถเพิ่มเครื่องยนต์ตัวใหม่ได้");
    playBeep(150, 'sine', 0.3);
    return;
  }
  
  const id = 'S' + (stations.length + 1);
  let name = 'หุ่นยนต์ตัดงานใหม่';
  if (type === 'inspect') name = 'สแกนคัดแยกใหม่';
  if (type === 'rework') name = 'แท่นแก้สีใหม่';
  
  // Arrange coordinates dynamically
  const count = stations.length;
  const x = 120 + (count * 70);
  const y = 200 + (Math.sin(count) * 45);
  
  const newStation = new Station(id, name, type, x, y, 4.0, 5);
  stations.push(newStation);
  
  // Re-map conveyors sequence dynamically based on IDs order
  remapConveyorsSequence();
  
  renderConfigTable();
  addJournal(`➕ เพิ่มสถานีผลิตใหม่สำเร็จ: ${name} (ID: ${id})`);
  playChime();
});

function remapConveyorsSequence() {
  // Simple re-routing logic for dynamic chain layout
  // S1 -> S2 -> ... S(last-1) -> S(last)
  for (let i = 1; i < stations.length - 1; i++) {
    const fromId = stations[i].id;
    const toId = stations[i+1].id;
    conveyors[`C${fromId}_to_${toId}`] = {
      from: fromId,
      to: toId,
      path: [[stations[i].x, stations[i].y], [stations[i+1].x, stations[i+1].y]]
    };
  }
}

// -------------------------------------------------------------
// MONTHLY REPORT SCENE AND SCORECARD
// -------------------------------------------------------------
function showMonthlyReportCard() {
  const modal = document.getElementById('scorecard-modal');
  if (!modal) return;
  
  // Calculate stats
  const totalProduced = state.partsProduced.A + state.partsProduced.B + state.partsProduced.C;
  const yieldRate = state.partsPassed + state.partsRejected > 0
    ? Math.round((state.partsPassed / (state.partsPassed + state.partsRejected)) * 100)
    : 100;
  
  // Uptime calculation (percentage of stations not in failed/breakdown state)
  const failedCount = stations.filter(s => s.state === 'failed').length;
  const uptime = Math.round((1 - (failedCount / stations.length)) * 100);
  
  // Grade algorithm
  let grade = 'F';
  let title = 'ล้มละลายหรือคอขวดสะสม!';
  let desc = 'โรงงานประสบภาวะขาดทุนเนื่องจากค่าปรับเครื่องชำรุดและการจัดดิวไม่ดี กรุณาจัดสรรตารางการ PM และความจุเพื่อแก้ตัวใหม่';
  
  if (state.netProfit > 25000 && yieldRate > 95 && uptime > 90) {
    grade = 'A';
    title = 'สุดยอดปรมาจารย์วิศวกรโรงงาน!';
    desc = 'การบริหารรอบเวลาการทำงาน บัญชีการบำรุงรักษาเชิงคาดการณ์ (PM Overhaul) ทำได้อย่างไร้ที่ติ ยอดกำไรสุทธิเป็นประวัติการณ์!';
  } else if (state.netProfit > 12000 && yieldRate > 85) {
    grade = 'B';
    title = 'ผลงานระดับดีเยี่ยม!';
    desc = 'คุณบริหารระบบแฝดดิจิทัลได้มีประสิทธิภาพดี แนะนำให้ใช้ข้อมูลการรัน DOE เพื่อปรับเครื่องจักรให้สั่นสะเทือนต่ำสุดเพิ่มเติม';
  } else if (state.netProfit > 5000) {
    grade = 'C';
    title = 'ผลงานระดับปานกลาง';
    desc = 'โรงงานมีกำไรเล็กน้อยแต่เครื่องจักรเสียหายบ่อยมาก ควรส่งทีมช่างไปตรวจสอบอุณหภูมิสม่ำเสมอเพื่อประหยัดเงินค่าซ่อมใหญ่';
  } else if (state.netProfit > 0) {
    grade = 'D';
    title = 'เกือบไม่รอด!';
    desc = 'เกือบเท่าทุน คอขวดสะสมและแรงสั่นสะเทือนสูงจัดในชิ้นส่วนหมุนบ่อยครั้ง แนะนำให้ศึกษา Cheat sheet เรื่อง OEE และ Six Sigma';
  }
  
  // Update HTML Modal
  document.getElementById('score-grade').textContent = grade;
  document.getElementById('score-title').textContent = title;
  document.getElementById('score-desc').textContent = desc;
  document.getElementById('score-net').textContent = `$${state.netProfit}`;
  document.getElementById('score-balance').textContent = `${uptime - 5}%`; // mock line balance index
  document.getElementById('score-uptime').textContent = `${uptime}%`;
  document.getElementById('score-yield').textContent = `${yieldRate}%`;
  
  modal.classList.add('active');
}

// -------------------------------------------------------------
// SAVE & LOAD STATE STRING CODE
// -------------------------------------------------------------
document.getElementById('btn-save-code').addEventListener('click', () => {
  const saveData = {
    revenue: state.revenue,
    netProfit: state.netProfit,
    stations: stations.map(s => ({
      id: s.id,
      cycleTime: s.cycleTime,
      queueCap: s.queueCapacity,
      resCount: s.resourceCount,
      disc: s.queueDiscipline
    }))
  };
  
  const code = btoa(JSON.stringify(saveData));
  const input = document.getElementById('input-state-code');
  if (input) {
    input.value = code;
    input.select();
    document.execCommand('copy');
    addJournal("💾 บันทึกสเตตรหัสโรงงานเรียบร้อยและคัดลอกลง Clipboard อัตโนมัติ!");
    playChime();
  }
});

document.getElementById('btn-load-code').addEventListener('click', () => {
  const input = document.getElementById('input-state-code');
  if (!input || !input.value) {
    addJournal("🚨 กรุณาวางรหัสเซฟโรงงานก่อนกดยืนยันโหลด");
    return;
  }
  
  try {
    const raw = atob(input.value);
    const data = JSON.parse(raw);
    
    state.revenue = data.revenue;
    state.netProfit = data.netProfit;
    
    data.stations.forEach(src => {
      const s = stations.find(station => station.id === src.id);
      if (s) {
        s.cycleTime = src.cycleTime;
        s.queueCapacity = src.queueCap;
        s.resourceCount = src.resCount;
        s.queueDiscipline = src.disc;
      }
    });
    
    renderConfigTable();
    updateFinancialsUI();
    addJournal("📥 โหลดแผนผังโครงสร้างโรงงานเดิมกลับมาทำงานเรียบร้อย!");
    playChime();
  } catch (err) {
    addJournal("❌ โค้ดบันทึกชำรุดชำรุด ไม่สามารถถอดรหัสได้");
    playBeep(200, 'sawtooth', 0.3);
  }
});

// -------------------------------------------------------------
// HOMEWORK REPORTER AND GUIDE SYSTEM
// -------------------------------------------------------------
document.getElementById('btn-export-homework').addEventListener('click', () => {
  const yieldRate = state.partsPassed + state.partsRejected > 0
    ? Math.round((state.partsPassed / (state.partsPassed + state.partsRejected)) * 100)
    : 100;
  
  const report = `IE SCADA SIMULATOR - STUDENT HOMEWORK REPORT\n` +
    `---------------------------------------------\n` +
    `เวลาจำลองสิ้นสุด: ${formatSimClock()}\n` +
    `กำไรสุทธิสะสม (Net Profit): $${state.netProfit}\n` +
    `ชิ้นงานผลิตสำเร็จ: A:${state.partsProduced.A} | B:${state.partsProduced.B} | C:${state.partsProduced.C}\n` +
    `อัตราผ่านด่าน QA (Yield Rate): ${yieldRate}%\n` +
    `ค่าปรับ Downtime เสียหาย: $${state.downtimeCost}\n` +
    `สรุปผลวิเคราะห์: การจัดสมดุลสายการผลิตผ่านเกณฑ์อุตสาหกรรม\n`;
  
  const tempInput = document.createElement('textarea');
  tempInput.value = report;
  document.body.appendChild(tempInput);
  tempInput.select();
  document.execCommand('copy');
  document.body.removeChild(tempInput);
  
  alert("📝 คัดลอกรายงานผลการเรียนการบ้านสำเร็จ! คุณสามารถนำข้อความนี้ไปวางส่งอาจารย์ได้ทันที");
  addJournal("📝 สร้างและคัดลอกรายงานส่งการบ้านสำเร็จ!");
  playChime();
});

// Guide Manual Toggle
const guideBtn = document.getElementById('btn-guide-toggle');
const guideClose = document.getElementById('btn-close-guide');
const guideManual = document.getElementById('guide-manual');

guideBtn.addEventListener('click', () => guideManual.classList.add('active'));
guideClose.addEventListener('click', () => guideManual.classList.remove('active'));

// -------------------------------------------------------------
// DIGITAL TWIN MODAL LOGIC EVENTS
// -------------------------------------------------------------
const twinModal = document.getElementById('twin-modal');
const closeTwinBtn = document.getElementById('btn-close-twin');

window.openDigitalTwinModal = function(id) {
  activeModalTwinId = id;
  const s = stations.find(station => station.id === id);
  if (s && twinModal) {
    document.getElementById('twin-machine-title').textContent = `🤖 ห้องควบคุมแฝดดิจิทัล: ${s.name} (${s.id})`;
    
    // Setup local oscilloscope context
    const twinCanvas = document.getElementById('twin-oscilloscope');
    if (twinCanvas) {
      oscCtx = twinCanvas.getContext('2d');
    }
    
    // Render local DOE details if they were previously generated
    if (s.localDoeTested) {
      const effectA = ((s.doeTrialsVibe[1] + s.doeTrialsVibe[3]) - (s.doeTrialsVibe[0] + s.doeTrialsVibe[2])) / 2.0;
      const effectB = ((s.doeTrialsVibe[2] + s.doeTrialsVibe[3]) - (s.doeTrialsVibe[0] + s.doeTrialsVibe[1])) / 2.0;
      renderModalDoeTable(s, effectA, effectB);
      const applyBtn = document.getElementById('btn-doe-apply-local');
      if (applyBtn) applyBtn.disabled = false;
    } else {
      // Clear values
      document.getElementById('doe-t1-v').textContent = '-';
      document.getElementById('doe-t2-v').textContent = '-';
      document.getElementById('doe-t3-v').textContent = '-';
      document.getElementById('doe-t4-v').textContent = '-';
      document.getElementById('doe-t1-c').textContent = '-';
      document.getElementById('doe-t2-c').textContent = '-';
      document.getElementById('doe-t3-c').textContent = '-';
      document.getElementById('doe-t4-c').textContent = '-';
      document.getElementById('doe-effect-a').style.width = '0%';
      document.getElementById('doe-effect-b').style.width = '0%';
      document.getElementById('doe-effect-a-val').textContent = '0.0';
      document.getElementById('doe-effect-b-val').textContent = '0.0';
      document.getElementById('btn-doe-apply-local').disabled = true;
    }
    
    twinModal.classList.add('active');
    playBeep(500, 'sine', 0.1);
  }
};

closeTwinBtn.addEventListener('click', () => {
  activeModalTwinId = null;
  if (twinModal) twinModal.classList.remove('active');
});

// Local PM Buttons
document.getElementById('btn-pm-lube').addEventListener('click', () => {
  if (activeModalTwinId) {
    dispatchPm(activeModalTwinId, 'lube');
  }
});
document.getElementById('btn-pm-calib').addEventListener('click', () => {
  if (activeModalTwinId) {
    dispatchPm(activeModalTwinId, 'calib');
  }
});
document.getElementById('btn-pm-overhaul').addEventListener('click', () => {
  if (activeModalTwinId) {
    dispatchPm(activeModalTwinId, 'overhaul');
  }
});

// Local DOE Buttons
document.getElementById('btn-doe-run-local').addEventListener('click', () => {
  if (activeModalTwinId) {
    // Costs $200
    if (state.netProfit < 200) {
      addJournal("🚨 เงินสะสมไม่พอสำหรับรันการทดลองทางสถิติ ($200)");
      return;
    }
    state.pmCost += 200;
    state.netProfit -= 200;
    runStationDoe(activeModalTwinId);
    updateFinancialsUI();
  }
});

document.getElementById('btn-doe-apply-local').addEventListener('click', () => {
  if (activeModalTwinId) {
    const s = stations.find(station => station.id === activeModalTwinId);
    if (s && s.localDoeTested) {
      s.localDoeOptimalApplied = true;
      addJournal(`📥 บันทึกค่าระดับตั้งตั้งปัจจัยที่เหมาะสมที่สุดจากผล DOE ลงในเครื่อง ${s.name} เรียบร้อย!`);
      playChime();
    }
  }
});

// Close Scorecard modal
const scorecardModal = document.getElementById('scorecard-modal');
document.getElementById('btn-close-scorecard').addEventListener('click', () => {
  scorecardModal.classList.remove('active');
});
document.getElementById('btn-score-restart').addEventListener('click', () => {
  scorecardModal.classList.remove('active');
  resetSimulation();
});

// -------------------------------------------------------------
// RESET AND INITIALIZATION
// -------------------------------------------------------------
function resetSimulation() {
  state.simTime = 0;
  state.playing = true;
  state.revenue = 0;
  state.opsCost = 0;
  state.pmCost = 0;
  state.reworkCost = 0;
  state.downtimeCost = 0;
  state.netProfit = 0;
  state.partsProduced = { A: 0, B: 0, C: 0 };
  state.partsPassed = 0;
  state.partsRejected = 0;
  state.totalWIP = 0;
  state.activeEvent = null;
  state.urgentOrder = null;
  state.diverterGate = 'normal';
  state.chartData = [];
  state.journalLogs = [];
  state.prodMix = { A: 40, B: 35, C: 25 };
  state.autoPm = { S2: 60, S3: 60, S4: 60 };
  
  // Reset planner inputs in UI
  const alphaIn = document.getElementById('mix-alpha');
  const betaIn = document.getElementById('mix-beta');
  const gammaIn = document.getElementById('mix-gamma');
  if (alphaIn) alphaIn.value = 40;
  if (betaIn) betaIn.value = 35;
  if (gammaIn) gammaIn.value = 25;
  
  const alphaLbl = document.getElementById('mix-alpha-lbl');
  const betaLbl = document.getElementById('mix-beta-lbl');
  const gammaLbl = document.getElementById('mix-gamma-lbl');
  if (alphaLbl) alphaLbl.textContent = '40%';
  if (betaLbl) betaLbl.textContent = '35%';
  if (gammaLbl) gammaLbl.textContent = '25%';
  
  const s2Pm = document.getElementById('autopm-s2');
  const s3Pm = document.getElementById('autopm-s3');
  const s4Pm = document.getElementById('autopm-s4');
  if (s2Pm) s2Pm.value = '60';
  if (s3Pm) s3Pm.value = '60';
  if (s4Pm) s4Pm.value = '60';
  
  triggerVisualAlarm(false);
  updateUrgentOrderUI();
  
  parts = [];
  stations = [
    new Station('S1', 'คลังวัตถุดิบ (Source)', 'generator', 60, 150, 4, 999),
    new Station('S2', 'แขนกลขัดสี (Robot Paint)', 'process', 240, 150, 3, 5),
    new Station('S3', 'ระบบสแกนตรวจสอบ (QA Scan)', 'inspect', 440, 150, 2.5, 4),
    new Station('S4', 'แท่นซ่อมชิ้นงาน (Rework)', 'rework', 340, 310, 5, 5),
    new Station('S5', 'บรรจุภัณฑ์ & ส่งออก (Pack)', 'package', 640, 150, 2, 4)
  ];
  
  conveyors.C2.to = 'S3';
  
  renderConfigTable();
  updateFinancialsUI();
  addJournal("🚀 โรงงานใหม่ตั้งต้นสภาวะการผลิตเรียบร้อย!");
}

// Tick chart data history every second
setInterval(() => {
  if (state.playing) {
    // Average queue length across S2, S3, S4, S5
    const activeQueues = stations.filter(s => s.type !== 'generator');
    const avgQ = activeQueues.reduce((acc, s) => acc + s.queue.length, 0);
    state.chartData.push(avgQ);
    if (state.chartData.length > 30) state.chartData.shift();
    updatePerformanceCharts();
    
    // Dynamic KPI updates
    const wipEl = document.getElementById('kpi-wip');
    const thrEl = document.getElementById('kpi-throughput');
    const botEl = document.getElementById('kpi-bottleneck');
    const yldEl = document.getElementById('kpi-yield');
    
    if (wipEl) wipEl.textContent = `${state.totalWIP} ชิ้น`;
    if (thrEl) {
      const tot = state.partsProduced.A + state.partsProduced.B + state.partsProduced.C;
      thrEl.textContent = `${tot} ชิ้น`;
    }
    
    // Find bottleneck station (one with longest queue)
    let maxQ = 0;
    let bStation = 'ไม่มี';
    stations.forEach(s => {
      if (s.type !== 'generator' && s.queue.length > maxQ) {
        maxQ = s.queue.length;
        bStation = `${s.name} (${s.id})`;
      }
    });
    state.bottleneckStation = bStation;
    if (botEl) botEl.textContent = bStation;
    
    // Yield rate update
    const totalChecks = state.partsPassed + state.partsRejected;
    const yieldRate = totalChecks > 0 ? Math.round((state.partsPassed / totalChecks) * 100) : 100;
    if (yldEl) {
      yldEl.textContent = `${yieldRate}%`;
      yldEl.className = yieldRate > 90 ? 'profit-text' : 'loss-text';
    }
    
    // Highlight bottleneck station in the table
    renderConfigTable();
  }
}, 1000);

// Init call
resetSimulation();
animationFrameId = requestAnimationFrame(animLoop);


// -------------------------------------------------------------
// STEP-BY-STEP ONBOARDING TUTORIAL TOUR
// -------------------------------------------------------------
let currentTourStep = 1;
const tourSteps = [
  {
    title: "🏭 ผังโรงงานจำลอง (Factory Floor)",
    desc: "ผังจำลองแสดงการทำงานเรียลไทม์ ชิ้นงานประเภทต่างๆ (Alpha-ฟ้า, Beta-ชมพู, Gamma-เหลือง) จะถูกป้อนจากคลังวัตถุดิบ (S1) ผ่านหุ่นยนต์ขัดสี (S2) ระบบคัดแยกตรวจสอบคุณภาพ (S3) เพื่อไปแพ็กเกจจิ้ง (S5) หรือส่งเข้าสถานีซ่อมงาน (S4)",
    highlightId: "simulation-canvas"
  },
  {
    title: "⚙️ ตารางปรับแต่งและควบคุมสถานี (Station Config)",
    desc: "คุณสามารถแก้ไขรอบการผลิต (Cycle Time) หรือขนาดแถวคอยสูงสุด (Max Queue) ปรับประเภทการตักคิว (FIFO / LIFO / Priority / SPT) และเร่งพลังผลิตเครื่องยนต์ (Overclock) ได้จากแผงตารางด้านล่างนี้",
    highlightId: "table-stations"
  },
  {
    title: "💰 บัญชีการเงินและคอขวดสะสม (LED KPIs & Financials)",
    desc: "ตรวจบัญชีกำไร-ขาดทุน และปริมาณคอขวด (Bottleneck) ที่แผงขวามือ เครื่องจักรคอขวดจะมีการสะสมคิวยาวล้น และขึ้นสัญลักษณ์เตือนเพื่อเปิด digital twin หรือจัดแผนงานช่างซ่อมบำรุงต่อไป",
    highlightId: "led-revenue"
  },
  {
    title: "📡 ห้องควบคุมแฝดดิจิทัล (Digital Twin Dashboard)",
    desc: "คลิกตรงบนสัญรูปเครื่องจักรในผังโรงงานจำลอง เพื่อแสดงหน้าจอแฝดดิจิทัล IoT มีการวาดคลื่นสั่นไหวและใช้ตัวทำนายฟิสิกส์ PINN คำนวณเวลาที่พร้อมทำงานก่อนจะชำรุด (TTF) เพื่อสั่ง PM แผนซ่อมบำรุง",
    highlightId: "simulation-canvas"
  },
  {
    title: "🔬 แบบจำลองการออกแบบการทดลองประจำสถานี (Factorial DOE Lab)",
    desc: "ในห้องควบคุมแฝดดิจิทัล กดรันการทดลองทางสถิติ 2² (DOE) เพื่อหาระดับปัจจัยความเร็วและการหล่อลื่นที่เหมาะสมที่สุดในการลดแรงสั่นสะเทือน แล้วกดยืนยันบันทึกค่า (Apply Optimal) เพื่อความสมดุลสูงสุด!",
    highlightId: "simulation-canvas"
  }
];

function updateTourUI() {
  const step = tourSteps[currentTourStep - 1];
  const stepNumEl = document.getElementById('tour-step-num');
  const titleEl = document.getElementById('tour-step-title');
  const descEl = document.getElementById('tour-step-desc');
  
  if (stepNumEl) stepNumEl.textContent = currentTourStep;
  if (titleEl) titleEl.textContent = step.title;
  if (descEl) descEl.textContent = step.desc;
  
  // Clear previous highlights
  document.querySelectorAll('.tour-highlight').forEach(el => el.classList.remove('tour-highlight'));
  
  // Highlight target
  const targetId = step.highlightId;
  if (targetId === "led-revenue") {
    const el = document.getElementById('led-revenue');
    if (el) {
      const card = el.closest('.card');
      if (card) card.classList.add('tour-highlight');
    }
  } else {
    const el = document.getElementById(targetId);
    if (el) {
      el.classList.add('tour-highlight');
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }
  
  const nextBtn = document.getElementById('btn-tour-next');
  if (nextBtn) {
    nextBtn.textContent = currentTourStep === tourSteps.length ? "เสร็จสิ้น 🏁" : "ถัดไป ➔";
  }
}

window.startTour = function() {
  currentTourStep = 1;
  const banner = document.getElementById('tutorial-banner');
  if (banner) banner.style.display = 'flex';
  updateTourUI();
  playBeep(587.33, 'sine', 0.15);
};

window.nextTourStep = function() {
  if (currentTourStep < tourSteps.length) {
    currentTourStep++;
    updateTourUI();
    playBeep(659.25, 'sine', 0.1);
  } else {
    window.endTour();
  }
};

window.endTour = function() {
  const banner = document.getElementById('tutorial-banner');
  if (banner) banner.style.display = 'none';
  document.querySelectorAll('.tour-highlight').forEach(el => el.classList.remove('tour-highlight'));
  addJournal("🎓 สิ้นสุดบทเรียนแนะนำการใช้งานโรงงานดิจิทัลเรียบร้อย!");
  playChime();
};

// Event Bindings for Tour
document.getElementById('btn-tour-next').addEventListener('click', window.nextTourStep);
document.getElementById('btn-tour-skip').addEventListener('click', window.endTour);
document.getElementById('btn-tour-start').addEventListener('click', window.startTour);

// Auto-trigger tour on page load
setTimeout(() => {
  window.startTour();
}, 800);


// -------------------------------------------------------------
// PRODUCT MIX AND AUTO-PM PLANNING ENGINE
// -------------------------------------------------------------
window.adjustProdMix = function(changedType) {
  const alphaIn = document.getElementById('mix-alpha');
  const betaIn = document.getElementById('mix-beta');
  const gammaIn = document.getElementById('mix-gamma');
  if (!alphaIn || !betaIn || !gammaIn) return;
  
  const a = parseInt(alphaIn.value) || 0;
  const b = parseInt(betaIn.value) || 0;
  const c = parseInt(gammaIn.value) || 0;
  
  const total = a + b + c;
  if (total === 0) {
    state.prodMix.A = 33;
    state.prodMix.B = 33;
    state.prodMix.C = 34;
  } else {
    state.prodMix.A = Math.round((a / total) * 100);
    state.prodMix.B = Math.round((b / total) * 100);
    state.prodMix.C = 100 - state.prodMix.A - state.prodMix.B;
  }
  
  const alphaLbl = document.getElementById('mix-alpha-lbl');
  const betaLbl = document.getElementById('mix-beta-lbl');
  const gammaLbl = document.getElementById('mix-gamma-lbl');
  if (alphaLbl) alphaLbl.textContent = state.prodMix.A + '%';
  if (betaLbl) betaLbl.textContent = state.prodMix.B + '%';
  if (gammaLbl) gammaLbl.textContent = state.prodMix.C + '%';
};

window.updateAutoPmSettings = function() {
  const s2Pm = document.getElementById('autopm-s2');
  const s3Pm = document.getElementById('autopm-s3');
  const s4Pm = document.getElementById('autopm-s4');
  if (!s2Pm || !s3Pm || !s4Pm) return;
  
  state.autoPm.S2 = s2Pm.value === 'off' ? 'off' : parseInt(s2Pm.value);
  state.autoPm.S3 = s3Pm.value === 'off' ? 'off' : parseInt(s3Pm.value);
  state.autoPm.S4 = s4Pm.value === 'off' ? 'off' : parseInt(s4Pm.value);
};

function checkAutoPMTick(dt) {
  ['S2', 'S3', 'S4'].forEach(id => {
    const threshold = state.autoPm[id];
    if (threshold === 'off') return;
    
    const s = stations.find(station => station.id === id);
    if (s && s.wear >= threshold && s.state !== 'maintenance' && s.state !== 'failed') {
      const crewFree = (state.crew1 === 'free' || state.crew2 === 'free');
      if (crewFree) {
        // Auto dispatch appropriate PM
        let pmType = 'lube';
        if (s.wear >= 85) {
          pmType = 'overhaul'; // overhaul if critical wear
        } else if (s.type === 'inspect') {
          pmType = 'calib'; // calibration for inspection arch
        }
        
        // Dispatch only if we have sufficient money for it
        let cost = pmType === 'lube' ? 50 : pmType === 'calib' ? 150 : 500;
        if (state.netProfit >= cost) {
          dispatchPm(s.id, pmType);
        }
      }
    }
  });
}


// -------------------------------------------------------------
// METAHEURISTICS OPTIMIZATION ENGINE (SA & GA)
// -------------------------------------------------------------
let optHistory = [];
let optBestConfig = null;
let optRunning = false;

window.initOptTab = function() {
  drawOptConvergenceChart();
};

function drawOptConvergenceChart() {
  const canvas = document.getElementById('opt-chart-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  
  ctx.clearRect(0, 0, w, h);
  
  // Draw grid background
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1;
  for (let gx = 0; gx < w; gx += 30) {
    ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, h); ctx.stroke();
  }
  for (let gy = 0; gy < h; gy += 20) {
    ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(w, gy); ctx.stroke();
  }
  
  if (optHistory.length < 2) {
    ctx.fillStyle = '#64748b';
    ctx.font = '9px monospace';
    ctx.textAlign = 'center';
    ctx.fillText("กด Run เพื่อพลอตกราฟลู่เข้าของคำตอบ", w / 2, h / 2 + 3);
    return;
  }
  
  // Find min and max
  let minF = Math.min(...optHistory);
  let maxF = Math.max(...optHistory);
  if (maxF === minF) {
    maxF += 10;
    minF -= 10;
  }
  
  // Plot line
  ctx.strokeStyle = 'var(--color-cyan)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  
  for (let i = 0; i < optHistory.length; i++) {
    const x = (i / (optHistory.length - 1)) * (w - 30) + 15;
    const y = h - ((optHistory[i] - minF) / (maxF - minF)) * (h - 20) - 10;
    
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
  
  // Label best value
  ctx.fillStyle = '#fff';
  ctx.font = '8px monospace';
  ctx.textAlign = 'right';
  ctx.fillText(maxF.toFixed(0), w - 5, 12);
  ctx.fillText(minF.toFixed(0), w - 5, h - 4);
}

function evaluateConfig(cfg, objective) {
  // cfg is: [S2_cycle, S2_cap, S3_cycle, S3_cap, S4_cycle, S4_cap]
  const s2_c = cfg[0], s2_q = cfg[1];
  const s3_c = cfg[2], s3_q = cfg[3];
  const s4_c = cfg[4], s4_q = cfg[5];
  
  const capacity = Math.min(1/s2_c, 1/s3_c);
  
  let efficiency = 0.95;
  const avgCycle = (s2_c + s3_c + s4_c) / 3;
  const balanceVariance = ((s2_c-avgCycle)**2 + (s3_c-avgCycle)**2 + (s4_c-avgCycle)**2)/3;
  
  efficiency -= Math.min(0.35, balanceVariance * 0.08);
  const totalCap = s2_q + s3_q + s4_q;
  if (totalCap < 9) {
    efficiency -= (9 - totalCap) * 0.05;
  }
  
  const totalTime = 30 * 24 * 3600;
  const throughput = capacity * totalTime * Math.max(0.35, efficiency);
  const energyCost = (1/s2_c + 1/s3_c + 1/s4_c) * 11.5 * (totalTime / 3600);
  const pmExpense = (s2_q * 10 + s3_q * 10 + s4_q * 10) * 14.5;
  const rejectRate = 0.15;
  const reworkCost = throughput * rejectRate * 30;
  const downtimeCost = Math.max(0, (15 - totalCap) * 320);
  
  const profit = (throughput * 155) - (throughput * 42) - energyCost - pmExpense - reworkCost - downtimeCost;
  const wip = (s2_q + s3_q + s4_q) * 1.4 + (balanceVariance * 2.5);
  
  if (objective === 'profit') {
    return profit;
  } else {
    // WIP minimization (fitness is negative WIP so we maximize it)
    return -wip;
  }
}

// 1. Simulated Annealing (SA) Implementation
function runSimulatedAnnealing(objective, callbackFinished) {
  let currentCfg = [3.0, 5, 2.5, 4, 5.0, 5]; // initial configurations S2, S3, S4
  let currentScore = evaluateConfig(currentCfg, objective);
  
  optBestConfig = [...currentCfg];
  let bestScore = currentScore;
  
  optHistory = [currentScore];
  
  let temp = 100.0;
  const coolingRate = 0.90;
  const maxIterations = 35;
  let iter = 0;
  
  const interval = setInterval(() => {
    if (temp <= 0.5 || iter >= maxIterations) {
      clearInterval(interval);
      callbackFinished();
      return;
    }
    
    // Perturb config slightly
    let nextCfg = [...currentCfg];
    // Randomly select one parameter to modify
    const paramIdx = Math.floor(Math.random() * 6);
    if (paramIdx % 2 === 0) {
      // Cycle time (float parameter, bounds 1.0 - 6.0)
      nextCfg[paramIdx] = Math.min(6.0, Math.max(1.0, nextCfg[paramIdx] + (Math.random() * 1.5 - 0.75)));
    } else {
      // Queue capacity (int parameter, bounds 1 - 10)
      nextCfg[paramIdx] = Math.min(10, Math.max(1, nextCfg[paramIdx] + (Math.random() > 0.5 ? 1 : -1)));
    }
    
    const nextScore = evaluateConfig(nextCfg, objective);
    const deltaE = nextScore - currentScore;
    
    // Accept criteria
    if (deltaE > 0 || Math.random() < Math.exp(deltaE / temp)) {
      currentCfg = nextCfg;
      currentScore = nextScore;
      
      if (currentScore > bestScore) {
        bestScore = currentScore;
        optBestConfig = [...currentCfg];
      }
    }
    
    optHistory.push(bestScore);
    drawOptConvergenceChart();
    
    document.getElementById('opt-progress-lbl').textContent = 
      `SA Temp: ${temp.toFixed(1)}°C | Iter: ${iter + 1}/${maxIterations} | Best: ${objective === 'profit' ? '$' + bestScore.toFixed(0) : (-bestScore).toFixed(1) + ' WIP'}`;
    
    temp *= coolingRate;
    iter++;
  }, 75);
}

// 2. Genetic Algorithm (GA) Implementation
function runGeneticAlgorithm(objective, callbackFinished) {
  // Generate random initial population (12 individuals)
  let population = [];
  for (let i = 0; i < 12; i++) {
    population.push([
      1.0 + Math.random() * 5.0, // S2 Cycle
      Math.floor(Math.random() * 10) + 1, // S2 Cap
      1.0 + Math.random() * 5.0, // S3 Cycle
      Math.floor(Math.random() * 10) + 1, // S3 Cap
      1.0 + Math.random() * 5.0, // S4 Cycle
      Math.floor(Math.random() * 10) + 1  // S4 Cap
    ]);
  }
  
  optHistory = [];
  let bestScore = -999999;
  const maxGenerations = 20;
  let gen = 0;
  
  const interval = setInterval(() => {
    if (gen >= maxGenerations) {
      clearInterval(interval);
      callbackFinished();
      return;
    }
    
    // Evaluate fitness
    let fitnessScores = population.map(ind => evaluateConfig(ind, objective));
    
    // Find best
    let genBestIdx = 0;
    let genBestScore = -999999;
    for (let i = 0; i < fitnessScores.length; i++) {
      if (fitnessScores[i] > genBestScore) {
        genBestScore = fitnessScores[i];
        genBestIdx = i;
      }
    }
    
    if (genBestScore > bestScore) {
      bestScore = genBestScore;
      optBestConfig = [...population[genBestIdx]];
    }
    
    optHistory.push(bestScore);
    drawOptConvergenceChart();
    
    document.getElementById('opt-progress-lbl').textContent = 
      `GA Generation: ${gen + 1}/${maxGenerations} | Best Fitness: ${objective === 'profit' ? '$' + bestScore.toFixed(0) : (-bestScore).toFixed(1) + ' WIP'}`;
    
    // Selection, Crossover & Mutation for next generation
    let nextGen = [];
    
    // Elitism: carry best 2 forward
    nextGen.push([...population[genBestIdx]]);
    // Sort indices by score desc
    let indices = [...Array(12).keys()].sort((a,b) => fitnessScores[b] - fitnessScores[a]);
    nextGen.push([...population[indices[1]]]);
    
    // Breed remaining 10
    while (nextGen.length < 12) {
      // Tournament selection
      const parent1 = population[indices[Math.floor(Math.random() * 4)]];
      const parent2 = population[indices[Math.floor(Math.random() * 4)]];
      
      // Blend Crossover
      let child = [];
      for (let p = 0; p < 6; p++) {
        if (p % 2 === 0) {
          // average float cycle
          child.push(Math.min(6.0, Math.max(1.0, (parent1[p] + parent2[p]) / 2.0)));
        } else {
          // select randomly from parents
          child.push(Math.random() > 0.5 ? parent1[p] : parent2[p]);
        }
      }
      
      // Mutation (15% rate)
      if (Math.random() < 0.15) {
        const mutIdx = Math.floor(Math.random() * 6);
        if (mutIdx % 2 === 0) {
          child[mutIdx] = Math.min(6.0, Math.max(1.0, child[mutIdx] + (Math.random() * 1.0 - 0.5)));
        } else {
          child[mutIdx] = Math.min(10, Math.max(1, child[mutIdx] + (Math.random() > 0.5 ? 1 : -1)));
        }
      }
      
      nextGen.push(child);
    }
    
    population = nextGen;
    gen++;
  }, 100);
}

// Event Bindings
document.getElementById('btn-opt-run').addEventListener('click', () => {
  if (optRunning) return;
  
  optRunning = true;
  document.getElementById('btn-opt-run').disabled = true;
  document.getElementById('opt-results-box').style.display = 'none';
  document.getElementById('opt-progress-lbl').textContent = "กำลังเริ่มกระบวนการค้นหา...";
  
  const algo = document.getElementById('opt-algo').value;
  const obj = document.getElementById('opt-obj').value;
  
  playBeep(440, 'sine', 0.1);
  
  const onFinished = () => {
    optRunning = false;
    document.getElementById('btn-opt-run').disabled = false;
    
    // Display results
    document.getElementById('res-s2-c').textContent = optBestConfig[0].toFixed(1) + ' วินาที';
    document.getElementById('res-s2-q').textContent = optBestConfig[1] + ' ชิ้น';
    document.getElementById('res-s3-c').textContent = optBestConfig[2].toFixed(1) + ' วินาที';
    document.getElementById('res-s3-q').textContent = optBestConfig[3] + ' ชิ้น';
    document.getElementById('res-s4-c').textContent = optBestConfig[4].toFixed(1) + ' วินาที';
    document.getElementById('res-s4-q').textContent = optBestConfig[5] + ' ชิ้น';
    
    document.getElementById('opt-results-box').style.display = 'block';
    document.getElementById('opt-progress-lbl').textContent = "ประมวลผลคำตอบสำเร็จ!";
    playChime();
  };
  
  if (algo === 'sa') {
    runSimulatedAnnealing(obj, onFinished);
  } else {
    runGeneticAlgorithm(obj, onFinished);
  }
});

document.getElementById('btn-opt-apply').addEventListener('click', () => {
  if (!optBestConfig) return;
  
  // S2
  const s2 = stations.find(s => s.id === 'S2');
  if (s2) {
    s2.cycleTime = parseFloat(optBestConfig[0].toFixed(1));
    s2.queueCapacity = optBestConfig[1];
  }
  // S3
  const s3 = stations.find(s => s.id === 'S3');
  if (s3) {
    s3.cycleTime = parseFloat(optBestConfig[2].toFixed(1));
    s3.queueCapacity = optBestConfig[3];
  }
  // S4
  const s4 = stations.find(s => s.id === 'S4');
  if (s4) {
    s4.cycleTime = parseFloat(optBestConfig[4].toFixed(1));
    s4.queueCapacity = optBestConfig[5];
  }
  
  renderConfigTable();
  addJournal("🧠 โหลดและตั้งพารามิเตอร์เครื่องจักรตามคำตอบออปติมอลจาก AI อัตโนมัติ!");
  playChime();
});


// -------------------------------------------------------------
// RAW SIMULATION DATA EXPORT ENGINE (CSV)
// -------------------------------------------------------------
window.exportSimulationCsv = function() {
  let csvContent = "data:text/csv;charset=utf-8,";
  csvContent += "IE Digital Twin Tycoon - Simulation Performance Report\n";
  csvContent += "Date," + new Date().toISOString() + "\n";
  csvContent += "Simulation Time," + state.simTime + " seconds (30 Days)\n";
  csvContent += "Net Profit,$" + state.netProfit + "\n";
  csvContent += "Revenue,$" + state.revenue + "\n";
  csvContent += "Material Cost,$" + state.opsCost + "\n";
  csvContent += "PM Crew Expenses,$" + state.pmCost + "\n";
  csvContent += "Rework Cost,$" + state.reworkCost + "\n";
  csvContent += "Scrap Loss,$" + state.scrapLoss + "\n";
  csvContent += "Downtime Penalties,$" + state.downtimeCost + "\n";
  csvContent += "\n";
  
  csvContent += "Station Configuration and Performance:\n";
  csvContent += "Station ID,Name,Type,Cycle Time (s),Queue Capacity,Queue Discipline,Current Wear (%),Total Failed Count\n";
  stations.forEach(s => {
    csvContent += `${s.id},${s.name},${s.type},${s.cycleTime},${s.queueCapacity},${s.queueDiscipline},${s.wear.toFixed(1)},${s.failedCount || 0}\n`;
  });
  csvContent += "\n";
  
  csvContent += "Parts Stats:\n";
  csvContent += "Part Type,ProducedCount,RevenuePerUnit,MaterialCostPerUnit\n";
  csvContent += `Alpha,${state.partsProduced.A},100,25\n`;
  csvContent += `Beta,${state.partsProduced.B},150,45\n`;
  csvContent += `Gamma,${state.partsProduced.C},250,70\n`;
  csvContent += `Total QA Passed,${state.partsPassed}\n`;
  csvContent += `Total QA Rejected,${state.partsRejected}\n`;
  
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `IE_Factory_Report_${Date.now()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  addJournal("📥 ส่งออกไฟล์รายงานสรุปผลงานวิศวกรรมการจำลองเป็น CSV เรียบร้อย!");
};
