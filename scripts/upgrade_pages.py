import json
import re
from pathlib import Path

root = Path(__file__).resolve().parent.parent
paths = sorted(root.glob('*/dcmp/index.html')) + sorted(root.glob('*/wcmp/index.html'))
for path in paths:
    text = path.read_text()
    title_match = re.search(r'<title>(.*?)</title>', text, re.S)
    title = title_match.group(1).strip() if title_match else ''
    config_match = re.search(r"const YEAR\s*=\s*(\d+),\s*DISTRICT\s*=\s*'([^']+)',\s*SLOTS\s*=\s*(\d+),\s*DCMP_EVENT_TYPE\s*=\s*(\d+);", text)
    if not config_match:
        print('SKIP no config', path)
        continue
    year, district, slots, dcmp_event_type = config_match.groups()
    page_type = 'dcmp' if '/dcmp/' in str(path).replace('\\', '/') else 'wcmp'
    subtitle = 'District Championship Qualification' if page_type == 'dcmp' else 'World Championship Qualification'
    heading = ''
    h1match = re.search(r'<h1>(.*?)</h1>', text, re.S)
    if h1match:
        heading_raw = h1match.group(1).strip()
        heading = re.sub(r'<span.*?</span>', '', heading_raw, flags=re.S).strip()
    if not heading:
        heading = title.replace('CMPStats - ', '')
    awards = [
        "Chairman's Award",
        "Engineering Inspiration Award",
        "Rookie All Star Award"
    ]
    if page_type == 'wcmp':
        awards += ["District Championship Chairman's Award", "District Championship Engineering Inspiration Award"]
    awards_list = ', '.join([json.dumps(a) for a in awards])
    if page_type == 'dcmp':
        body = f'''<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{title}</title>
  <link rel="icon" href="../../logo.png" type="image/png">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="../../assets/styles.css">
</head>
<body>
  <div class="container">
    <a href="../" class="back-btn">← back to district</a>
    <h1>{heading} <span id="frozenBadge" style="display:none;" class="frozen-badge">✓ FROZEN</span></h1>
    <p class="subtitle">{subtitle}</p>
    <div class="stats">
      <div class="stat-card"><div class="stat-label">Points Remaining</div><div class="stat-value" id="ptsRemaining">-</div></div>
      <div class="stat-card"><div class="stat-label">DCMP Slots</div><div class="stat-value" id="dcmpSlots">-</div></div>
    </div>
    <h2>Events (Excluding DCMP)</h2>
    <div class="page-actions">
      <input type="text" id="eventSearch" placeholder="Search events...">
    </div>
    <table class="events-table">
      <thead><tr><th>Event</th><th>Week</th><th>Status</th><th>Type</th><th>Pts</th></tr></thead>
      <tbody id="eventsBody"><tr><td colspan="5" class="loading">Loading...</td></tr></tbody>
    </table>
    <h2>Team Rankings</h2>
    <div class="page-actions">
      <input type="text" id="teamSearch" placeholder="Search team number...">
      <label><input type="checkbox" id="simplifiedView"> Show qualified only</label>
    </div>
    <div class="legend">
      <div class="legend-item"><div class="legend-dot dot-locked"></div><span>Locked (qualified)</span></div>
      <div class="legend-item"><div class="legend-dot dot-contention"></div><span>In contention</span></div>
      <div class="legend-item"><div class="legend-dot dot-eliminated"></div><span>Eliminated</span></div>
    </div>
    <table class="ranks-table">
      <thead><tr><th>Rank</th><th>Team</th><th>E1</th><th>E2</th><th>Bonus</th><th>Total</th><th>Status</th></tr></thead>
      <tbody id="ranksBody"><tr><td colspan="7" class="loading">Loading...</td></tr></tbody>
    </table>
  </div>
<script>
const PAGE_CONFIG = {{
  YEAR: {year},
  DISTRICT: '{district}',
  SLOTS: {slots},
  DCMP_EVENT_TYPE: {dcmp_event_type},
  PAGE_TYPE: 'dcmp',
  WORLDS_SLOTS: null,
  QUALIFYING_AWARDS: [{awards_list}]
}};
</script>
<script src="../../assets/qualification.js"></script>
</body>
</html>'''
    else:
        body = f'''<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{title}</title>
  <link rel="icon" href="../../logo.png" type="image/png">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="../../assets/styles.css">
</head>
<body>
  <div class="container">
    <a href="../" class="back-btn">← back to district</a>
    <h1>{heading} <span id="frozenBadge" style="display:none;" class="frozen-badge">✓ FROZEN</span></h1>
    <p class="subtitle">{subtitle}</p>
    <div class="stats">
      <div class="stat-card"><div class="stat-label">DCMP Slots</div><div class="stat-value" id="dcmpSlots">-</div></div>
      <div class="stat-card"><div class="stat-label">Worlds Slots</div><div class="stat-value" id="worldsSlots">-</div></div>
    </div>
    <h2>DCMP Event</h2>
    <table class="events-table">
      <thead><tr><th>Event</th><th>Week</th><th>Status</th><th>Pts Available</th></tr></thead>
      <tbody id="eventsBody"><tr><td colspan="4" class="loading">Loading...</td></tr></tbody>
    </table>
    <h2>Team Rankings (Worlds Qualification)</h2>
    <div class="legend">
      <div class="legend-item"><div class="legend-dot dot-locked"></div><span>Locked (qualified)</span></div>
      <div class="legend-item"><div class="legend-dot dot-contention"></div><span>In contention</span></div>
      <div class="legend-item"><div class="legend-dot dot-eliminated"></div><span>Eliminated</span></div>
    </div>
    <table class="ranks-table">
      <thead><tr><th>Rank</th><th>Team</th><th>E1</th><th>E2</th><th>DCMP</th><th>Total</th><th>Status</th></tr></thead>
      <tbody id="ranksBody"><tr><td colspan="7" class="loading">Loading...</td></tr></tbody>
    </table>
  </div>
<script>
const PAGE_CONFIG = {{
  YEAR: {year},
  DISTRICT: '{district}',
  SLOTS: {slots},
  DCMP_EVENT_TYPE: {dcmp_event_type},
  PAGE_TYPE: 'wcmp',
  WORLDS_SLOTS: null,
  QUALIFYING_AWARDS: [{awards_list}]
}};
</script>
<script src="../../assets/qualification.js"></script>
</body>
</html>'''
    path.write_text(body)
    print('UPDATED', path)
