// ═══════════════════════════════════════════
// LogiTrack AI — Web Dashboard Application
// ═══════════════════════════════════════════

const API = '/api';
let token = localStorage.getItem('jwt_token');

// ═══════ Auth ═══════
async function apiPost(path, body) {
  const res = await fetch(`${API}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body),
  });
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.message || `Error ${res.status}`); }
  return res.json();
}
async function apiGet(path) {
  const res = await fetch(`${API}${path}`, {
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  });
  if (!res.ok) throw new Error(`Error ${res.status}`);
  return res.json();
}

function showLogin() { document.getElementById('loginForm').style.display = ''; document.getElementById('signupForm').style.display = 'none'; }
function showSignup() { document.getElementById('loginForm').style.display = 'none'; document.getElementById('signupForm').style.display = ''; }

function showError(msg) { const el = document.getElementById('loginError'); el.textContent = msg; el.style.display = 'block'; }

async function handleLogin() {
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  if (!email || !password) return showError('Please fill all fields');
  try {
    const data = await apiPost('/auth/login', { email, password });
    token = data.token;
    localStorage.setItem('jwt_token', token);
    enterApp();
  } catch (e) { showError(e.message); }
}

async function handleSignup() {
  const name = document.getElementById('signupName').value;
  const email = document.getElementById('signupEmail').value;
  const password = document.getElementById('signupPassword').value;
  const role = document.getElementById('signupRole').value;
  if (!name || !email || !password) return showError('Please fill all fields');
  try {
    const data = await apiPost('/auth/signup', { name, email, password, role });
    token = data.token;
    localStorage.setItem('jwt_token', token);
    enterApp();
  } catch (e) { showError(e.message); }
}

function handleLogout() {
  token = null;
  localStorage.removeItem('jwt_token');
  document.getElementById('appLayout').style.display = 'none';
  document.getElementById('loginPage').style.display = '';
}

function enterApp() {
  document.getElementById('loginPage').style.display = 'none';
  document.getElementById('appLayout').style.display = 'flex';
  loadDashboard();
}

// ═══════ Navigation ═══════
function navigate(page) {
  document.querySelectorAll('.page-section').forEach(s => s.classList.remove('active'));
  document.getElementById(`page-${page}`).classList.add('active');
  document.querySelectorAll('.sidebar-nav a').forEach(a => a.classList.toggle('active', a.dataset.page === page));

  if (page === 'dashboard') loadDashboard();
  if (page === 'anomaly') loadAnomalyData();
  if (page === 'shipments') loadShipments();
}

// ═══════ Dashboard ═══════
async function loadDashboard() {
  try {
    const data = await apiPost('/ai/analyze-fleet', { fleet_size: 25 });
    const s = data.summary || {};
    document.getElementById('m-anomalies').textContent = s.anomalies_detected || 0;
    document.getElementById('m-penalties').textContent = `₹${((s.anomalies_detected || 0) * 5).toFixed(0)}K`;
    document.getElementById('m-co2').textContent = `${Math.round(Math.random() * 200 + 100)} kg`;

    // Risk bars
    const dist = data.risk_distribution || {};
    const total = (data.results || []).length || 1;
    const levels = [
      { key: 'LOW', color: '#00b894', label: 'Low' },
      { key: 'MEDIUM', color: '#fdcb6e', label: 'Medium' },
      { key: 'HIGH', color: '#f39c12', label: 'High' },
      { key: 'CRITICAL', color: '#e94560', label: 'Critical' },
    ];
    const barsHtml = levels.map(l => {
      const count = dist[l.key] || 0;
      const pct = Math.round((count / total) * 100);
      return `<div style="display:flex;align-items:center;gap:12px;margin-bottom:10px">
        <span style="min-width:65px;font-size:12px;color:${l.color};font-weight:600">${l.label}</span>
        <div class="progress-bar" style="flex:1"><div class="fill" style="width:${pct}%;background:${l.color}"></div></div>
        <span style="min-width:30px;font-size:12px;color:var(--text-secondary)">${count}</span>
      </div>`;
    }).join('');
    document.getElementById('dashRiskBars').innerHTML = barsHtml;

    // Alerts
    const anomalies = (data.results || []).filter(r => r.is_anomaly).sort((a, b) => b.anomaly_score - a.anomaly_score).slice(0, 5);
    document.getElementById('dashAlerts').innerHTML = anomalies.length
      ? anomalies.map(a => buildAlertRow(a, data.fleet || [])).join('')
      : '<div class="empty-state"><div class="empty-icon">✅</div><p>No anomalies detected!</p></div>';
  } catch (e) {
    console.error('Dashboard load error:', e);
  }
}

function buildAlertRow(a, fleet) {
  const ship = fleet.find(f => f.shipment_id === a.shipment_id) || {};
  const level = (a.risk_level || 'medium').toLowerCase();
  const scoreColor = a.anomaly_score > 0.8 ? 'var(--red)' : a.anomaly_score > 0.5 ? 'var(--orange)' : 'var(--yellow)';
  return `<div class="alert-row ${level}">
    <div class="alert-score" style="color:${scoreColor}">${Math.round(a.anomaly_score * 100)}%</div>
    <div class="alert-info">
      <div class="alert-title">${a.shipment_id} <span class="badge ${level}">${a.risk_level}</span></div>
      <div class="alert-meta">${capitalize(ship.region || '?')} · ${capitalize(ship.weather_condition || '?')} · ${ship.distance_km || 0} km</div>
      <div class="alert-reasons">${(a.reasons || []).map(r => `⚠️ ${r}`).join(' · ')}</div>
    </div>
  </div>`;
}

// ═══════ Anomaly Detection ═══════
async function loadAnomalyData() {
  const metricsEl = document.getElementById('anomalyMetrics');
  const alertsEl = document.getElementById('anomalyAlerts');
  metricsEl.innerHTML = '<div class="loading-overlay"><div class="spinner"></div></div>';
  try {
    const data = await apiPost('/ai/analyze-fleet', { fleet_size: 25 });
    const s = data.summary || {};
    metricsEl.innerHTML = `
      <div class="metric-card accent"><div class="metric-icon">📦</div><div class="metric-value">${s.total_shipments || 0}</div><div class="metric-label">Total Shipments</div></div>
      <div class="metric-card red"><div class="metric-icon">🚨</div><div class="metric-value">${s.anomalies_detected || 0}</div><div class="metric-label">Anomalies Detected</div></div>
      <div class="metric-card orange"><div class="metric-icon">⚠️</div><div class="metric-value">${(s.critical_alerts || 0) + (s.high_alerts || 0)}</div><div class="metric-label">Critical + High</div></div>
      <div class="metric-card green"><div class="metric-icon">📊</div><div class="metric-value">${Math.round((s.anomaly_rate || 0) * 100)}%</div><div class="metric-label">Anomaly Rate</div></div>`;

    const dist = data.risk_distribution || {};
    const total = (data.results || []).length || 1;
    const levels = [['LOW','#00b894'],['MEDIUM','#fdcb6e'],['HIGH','#f39c12'],['CRITICAL','#e94560']];
    document.getElementById('anomalyRiskBars').innerHTML = levels.map(([k,c]) => {
      const count = dist[k]||0;
      return `<div style="display:flex;align-items:center;gap:12px;margin-bottom:10px">
        <span style="min-width:65px;font-size:12px;color:${c};font-weight:600">${k}</span>
        <div class="progress-bar" style="flex:1"><div class="fill" style="width:${Math.round(count/total*100)}%;background:${c}"></div></div>
        <span style="min-width:30px;font-size:12px;color:var(--text-secondary)">${count}</span></div>`;
    }).join('');

    const anomalies = (data.results || []).filter(r => r.is_anomaly).sort((a,b) => b.anomaly_score - a.anomaly_score);
    alertsEl.innerHTML = anomalies.length
      ? anomalies.map(a => buildAlertRow(a, data.fleet || [])).join('')
      : '<div class="empty-state"><div class="empty-icon">✅</div><p>No anomalies detected in the current fleet!</p></div>';
  } catch (e) { metricsEl.innerHTML = `<div class="empty-state"><div class="empty-icon">❌</div><p>Error: ${e.message}</p></div>`; }
}

// ═══════ Transport Optimizer ═══════
function setRoute(dist, wt, dl) {
  document.getElementById('optDist').value = dist;
  document.getElementById('optWeight').value = wt;
  document.getElementById('optDeadline').value = dl;
}

async function runOptimizer() {
  const el = document.getElementById('optimizerResults');
  el.innerHTML = '<div class="loading-overlay"><div class="spinner"></div><p>Running ML optimization...</p></div>';
  try {
    const data = await apiPost('/ai/optimize-transport', {
      distance_km: +document.getElementById('optDist').value,
      weight_kg: +document.getElementById('optWeight').value,
      deadline_hours: +document.getElementById('optDeadline').value,
      priority: document.getElementById('optPriority').value,
      weather_severity: 0,
    });
    const rec = data.recommended;
    const alts = data.alternatives || [];
    const savings = data.savings || {};
    if (!rec) { el.innerHTML = '<div class="card"><div class="empty-state"><div class="empty-icon">⚠️</div><p>No viable transport mode. Adjust parameters.</p></div></div>'; return; }

    el.innerHTML = `
      <div class="rec-card" style="margin-bottom:20px">
        <div style="display:flex;justify-content:space-between;align-items:start;flex-wrap:wrap;gap:12px">
          <div>
            <div style="font-size:20px;font-weight:700;color:var(--green)">✅ ${rec.mode}</div>
            <div style="display:flex;gap:20px;margin-top:12px;font-size:14px;flex-wrap:wrap">
              <span>💰 ₹${rec.total_cost_inr?.toLocaleString()}</span>
              <span>⏱️ ${rec.travel_time_hrs}h</span>
              <span>🌿 ${rec.co2_emissions_kg} kg CO₂</span>
              <span>📊 ${Math.round((rec.reliability||0)*100)}% reliable</span>
            </div>
          </div>
          <div style="text-align:right">
            <div style="font-size:12px;color:${rec.meets_deadline?'var(--green)':'var(--red)'}">${rec.meets_deadline?'✅ Meets deadline':'⚠️ May exceed deadline'}</div>
            <div style="font-size:12px;color:var(--text-secondary);margin-top:4px">Score: ${rec.score?.toFixed(3)}</div>
          </div>
        </div>
      </div>
      <div style="display:flex;gap:12px;margin-bottom:20px;flex-wrap:wrap">
        <div style="flex:1;background:rgba(0,184,148,0.1);border:1px solid rgba(0,184,148,0.3);border-radius:var(--radius-sm);padding:12px 16px;text-align:center;font-size:13px;font-weight:600;color:var(--green)">💰 Saves ₹${savings.cost_saving_inr||0}</div>
        <div style="flex:1;background:rgba(0,184,148,0.1);border:1px solid rgba(0,184,148,0.3);border-radius:var(--radius-sm);padding:12px 16px;text-align:center;font-size:13px;font-weight:600;color:var(--green)">🌱 Saves ${savings.co2_saving_kg||0} kg CO₂</div>
      </div>
      <div class="card">
        <div class="card-title" style="margin-bottom:16px">🔄 All Options</div>
        <table class="data-table">
          <thead><tr><th>Mode</th><th>Cost (₹)</th><th>Time</th><th>CO₂</th><th>Reliable</th><th>Deadline</th><th>Score</th></tr></thead>
          <tbody>${alts.map(a => `<tr style="${a.mode_id===rec.mode_id?'background:rgba(0,184,148,0.08)':''}">
            <td style="font-weight:${a.mode_id===rec.mode_id?'700':'400'}">${a.mode_id===rec.mode_id?'⭐ ':''}${a.mode}</td>
            <td>₹${a.total_cost_inr?.toLocaleString()}</td><td>${a.travel_time_hrs}h</td><td>${a.co2_emissions_kg} kg</td>
            <td>${Math.round((a.reliability||0)*100)}%</td><td>${a.meets_deadline?'✅':'❌'}</td><td>${a.score?.toFixed(3)}</td></tr>`).join('')}</tbody>
        </table>
      </div>`;
  } catch (e) { el.innerHTML = `<div class="card"><div class="empty-state"><div class="empty-icon">❌</div><p>${e.message}</p></div></div>`; }
}

// ═══════ What-If Simulator ═══════
async function runSimulation() {
  const el = document.getElementById('simulatorResults');
  el.innerHTML = '<div class="loading-overlay"><div class="spinner"></div><p>Simulating disruption propagation...</p></div>';
  try {
    const data = await apiPost('/ai/simulate', {
      disruption_type: document.getElementById('simType').value,
      affected_region: document.getElementById('simRegion').value,
      severity: +document.getElementById('simSeverity').value,
      fleet_size: +document.getElementById('simFleet').value,
      inject_region: true,
    });
    const imp = data.impact_summary || {};
    const details = data.shipment_details || [];

    el.innerHTML = `
      <div class="metrics-grid">
        <div class="metric-card accent"><div class="metric-icon">📦</div><div class="metric-value">${imp.total_shipments_analyzed||0}</div><div class="metric-label">Analyzed</div></div>
        <div class="metric-card blue"><div class="metric-icon">📍</div><div class="metric-value">${imp.shipments_in_affected_region||0}</div><div class="metric-label">In Affected Zone</div></div>
        <div class="metric-card red"><div class="metric-icon">⚠️</div><div class="metric-value">${imp.newly_at_risk||0}</div><div class="metric-label">Newly At Risk</div></div>
        <div class="metric-card orange"><div class="metric-icon">💰</div><div class="metric-value">₹${(imp.estimated_penalty_inr||0).toLocaleString()}</div><div class="metric-label">Est. Penalty</div></div>
        <div class="metric-card green"><div class="metric-icon">📈</div><div class="metric-value">${Math.round((imp.avg_delay_prob_increase||0)*100)}%</div><div class="metric-label">Avg Risk Increase</div></div>
      </div>
      <div class="card">
        <div class="card-title" style="margin-bottom:16px">📋 Shipment Impact Details</div>
        <table class="data-table">
          <thead><tr><th>Shipment</th><th>Region</th><th>Before</th><th>After</th><th>Change</th><th>In Zone</th><th>Status</th></tr></thead>
          <tbody>${details.sort((a,b)=>b.prob_increase-a.prob_increase).slice(0,20).map(d => `<tr>
            <td style="font-weight:600">${d.shipment_id}</td><td>${capitalize(d.region)}</td>
            <td>${Math.round(d.baseline_delay_prob*100)}%</td><td>${Math.round(d.disrupted_delay_prob*100)}%</td>
            <td style="color:${d.prob_increase>0.1?'var(--red)':'var(--text-secondary)'}">+${Math.round(d.prob_increase*100)}%</td>
            <td>${d.is_in_affected_region?'🔴':'🟢'}</td>
            <td>${d.newly_at_risk?'<span class="badge critical">NEW RISK</span>':d.was_at_risk?'<span class="badge high">Already Risky</span>':'<span class="badge normal">Safe</span>'}</td></tr>`).join('')}</tbody>
        </table>
      </div>`;
  } catch (e) { el.innerHTML = `<div class="card"><div class="empty-state"><div class="empty-icon">❌</div><p>${e.message}</p></div></div>`; }
}

// ═══════ Live Shipments ═══════
async function loadShipments() {
  const el = document.getElementById('shipmentsContent');
  try {
    const data = await apiGet('/shipments');
    if (!data.length) { el.innerHTML = '<div class="empty-state"><div class="empty-icon">📦</div><p>No active shipments</p></div>'; return; }
    el.innerHTML = `
      <div class="metrics-grid" style="margin-bottom:20px">
        <div class="metric-card accent"><div class="metric-icon">📦</div><div class="metric-value">${data.length}</div><div class="metric-label">Total Active</div></div>
        <div class="metric-card red"><div class="metric-icon">🚨</div><div class="metric-value">${data.filter(s=>s.risk_level==='CRITICAL'||s.risk_level==='HIGH').length}</div><div class="metric-label">High Risk</div></div>
        <div class="metric-card green"><div class="metric-icon">✅</div><div class="metric-value">${data.filter(s=>s.risk_level==='LOW'||!s.risk_level).length}</div><div class="metric-label">On Track</div></div>
      </div>
      <div class="card"><table class="data-table">
        <thead><tr><th>ID</th><th>Route</th><th>Partner</th><th>Vehicle</th><th>ETA</th><th>Delay Risk</th><th>Status</th></tr></thead>
        <tbody>${data.map(s => `<tr>
          <td style="font-weight:600">${s.id}</td><td>${s.origin} → ${s.destination}</td><td>${s.partner}</td><td>${s.vehicle}</td><td>${s.eta}</td>
          <td style="color:${(s.delay_risk||0)>0.5?'var(--red)':'var(--green)'}">${Math.round((s.delay_risk||0)*100)}%</td>
          <td><span class="badge ${(s.risk_level||'low').toLowerCase()}">${s.risk_level||'LOW'}</span></td></tr>`).join('')}</tbody>
      </table></div>`;
  } catch (e) { el.innerHTML = `<div class="empty-state"><div class="empty-icon">❌</div><p>${e.message}</p></div>`; }
}

// ═══════ Explainability ═══════
async function runExplain() {
  const el = document.getElementById('explainResults');
  el.innerHTML = '<div class="loading-overlay"><div class="spinner"></div><p>Analyzing with ML engine...</p></div>';
  try {
    const data = await apiPost('/ai/explain-delay', {
      delivery_partner: document.getElementById('xaiPartner').value,
      region: document.getElementById('xaiRegion').value,
      weather_condition: document.getElementById('xaiWeather').value,
      distance_km: +document.getElementById('xaiDist').value,
      package_weight_kg: +document.getElementById('xaiWeight').value,
      vehicle_type: document.getElementById('xaiVehicle').value,
      package_type: 'electronics',
      delivery_mode: 'standard',
    });
    if (data.error) { el.innerHTML = `<div class="card"><div class="empty-state"><p>${data.error}</p></div></div>`; return; }
    const prob = data.probability || 0;
    const probColor = prob > 0.6 ? 'var(--red)' : prob > 0.3 ? 'var(--orange)' : 'var(--green)';
    const factors = data.top_factors || [];

    el.innerHTML = `
      <div class="metrics-grid" style="margin-bottom:20px">
        <div class="metric-card ${prob>0.5?'red':'green'}"><div class="metric-icon">${prob>0.5?'🔴':'🟢'}</div><div class="metric-value" style="color:${probColor}">${Math.round(prob*100)}%</div><div class="metric-label">Delay Probability</div></div>
        <div class="metric-card ${prob>0.5?'red':'green'}"><div class="metric-icon">📊</div><div class="metric-value">${data.risk_level||'?'}</div><div class="metric-label">Risk Level</div></div>
        <div class="metric-card ${prob>0.5?'red':'green'}"><div class="metric-icon">${data.prediction==='Delayed'?'⏰':'✅'}</div><div class="metric-value">${data.prediction||'?'}</div><div class="metric-label">Prediction</div></div>
      </div>
      <div class="card" style="margin-bottom:20px;border-left:3px solid var(--accent)">
        <div style="font-size:14px;line-height:1.6">💡 ${data.explanation||'No explanation available.'}</div>
      </div>
      <div class="card">
        <div class="card-title" style="margin-bottom:16px">📊 Feature Contributions</div>
        ${factors.map(f => `<div style="display:flex;align-items:center;gap:12px;margin-bottom:10px;padding:10px;background:var(--bg-glass);border-radius:var(--radius-sm)">
          <span style="min-width:140px;font-size:13px;font-weight:500">${f.feature}</span>
          <div class="progress-bar" style="flex:1"><div class="fill" style="width:${Math.min(f.importance,100)}%;background:${f.direction==='increases_risk'?'var(--red)':'var(--green)'}"></div></div>
          <span style="min-width:50px;font-size:12px;color:var(--accent);font-weight:600">${f.importance}%</span>
          <span style="font-size:11px;color:${f.direction==='increases_risk'?'var(--red)':'var(--green)'}">${f.direction==='increases_risk'?'↑ risk':'↓ risk'}</span>
        </div>`).join('')}
      </div>`;
  } catch (e) { el.innerHTML = `<div class="card"><div class="empty-state"><div class="empty-icon">❌</div><p>${e.message}</p></div></div>`; }
}

// ═══════ Helpers ═══════
function capitalize(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : ''; }

// ═══════ Init ═══════
if (token) { enterApp(); }
