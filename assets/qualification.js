const TBA_API_KEY = 'z8FSCVQr1QXVxRFn6GgWOfmVrTtQQ1GUxvs78aCgrigr6JqQaZZRdET6AIZ9Gm80';
const EVENT_TYPE_NAMES = {0:'Regional',1:'District',2:'DCMP',3:'Champs',4:'Finals',5:'Qualifier',6:'Offseason'};

function safe(val) {
  return (val === null || val === undefined || Number.isNaN(val)) ? '-' : val;
}

function safeNum(val) {
  return (val === null || val === undefined || Number.isNaN(val)) ? 0 : Number(val);
}

async function fetchTBA(endpoint) {
  try {
    const res = await fetch(`https://www.thebluealliance.com/api/v3${endpoint}`, {
      headers: {'X-TBA-Auth-Key': TBA_API_KEY}
    });
    if (!res.ok) throw new Error(`TBA API ${res.status}`);
    return await res.json();
  } catch (error) {
    console.error(error);
    return [];
  }
}

async function fetchTeamAwards(teamKey, year) {
  try {
    const res = await fetch(`https://www.thebluealliance.com/api/v3/team/${teamKey}/awards/${year}`, {
      headers: {'X-TBA-Auth-Key': TBA_API_KEY}
    });
    if (!res.ok) return [];
    return await res.json();
  } catch (error) {
    console.error(error);
    return [];
  }
}

function getWeekLabel(startDate, year) {
  if (!startDate) return '-';
  const date = new Date(startDate);
  const seasonStart = new Date(year, 2, 1);
  const weekNum = Math.floor((date - seasonStart) / (7 * 24 * 60 * 60 * 1000)) + 1;
  return weekNum > 0 ? `W${weekNum}` : '-';
}

function isEventComplete(event, now) {
  return event && event.end_date && now > new Date(event.end_date);
}

function isEventActive(event, now) {
  return event && event.start_date && now >= new Date(event.start_date) && now <= new Date(event.end_date);
}

function hasQualifyingAward(awards, awardNames) {
  if (!Array.isArray(awards)) return false;
  return awards.some(a => awardNames.includes(a.name));
}

function getStatusClass(status) {
  if (status === 'locked') return 'status-locked';
  if (status === 'contention') return 'status-contention';
  return 'status-eliminated';
}

function getStatusText(status) {
  if (status === 'locked') return '✓ Locked';
  if (status === 'contention') return 'In Contention';
  return 'Eliminated';
}

function getEventPointsRemaining(event, now) {
  if (!event || !event.event_type) return 0;
  if (event.event_type !== PAGE_CONFIG.DCMP_EVENT_TYPE && [1, 5].includes(event.event_type)) {
    if (isEventComplete(event, now)) return 0;
    return isEventActive(event, now) ? 110 : 220;
  }
  return 0;
}

function renderEventsTable(events, bodyId, includeType = false, pointsColumn = false) {
  const body = document.getElementById(bodyId);
  if (!body) return;
  if (!events.length) {
    body.innerHTML = `<tr><td colspan="${includeType ? 5 : 4}" class="loading">No events available</td></tr>`;
    return;
  }

  body.innerHTML = events.map(event => {
    const now = new Date();
    const start = event.start_date ? new Date(event.start_date) : null;
    const end = event.end_date ? new Date(event.end_date) : null;
    let status = 'Upcoming';
    let points = '-';

    if (end && now > end) {
      status = 'Done';
      points = pointsColumn ? 0 : '-';
    } else if (start && now >= start) {
      status = 'Active';
      points = pointsColumn ? 110 : '-';
    } else {
      points = pointsColumn ? 220 : '-';
    }

    return `<tr>
      <td><a href="https://www.thebluealliance.com/event/${event.key}" target="_blank" rel="noreferrer">${event.name}</a></td>
      <td>${getWeekLabel(event.start_date, PAGE_CONFIG.YEAR)}</td>
      <td>${status}</td>
      ${includeType ? `<td>${EVENT_TYPE_NAMES[event.event_type] || '-'}</td>` : ''}
      ${pointsColumn ? `<td>${points}</td>` : ''}
    </tr>`;
  }).join('');
}

function estimateChance(status, behind, gap, isInSlot) {
  if (status === 'locked') return 100;
  if (status === 'eliminated') return 0;
  if (isInSlot) {
    return Math.max(50, Math.min(95, 70 - behind * 2));
  }
  return Math.max(5, Math.min(45, 30 - gap * 2));
}

function renderRankings(rows, bodyId, showChance = true) {
  const body = document.getElementById(bodyId);
  if (!body) return;
  if (!rows.length) {
    body.innerHTML = '<tr><td colspan="7" class="loading">No rankings available</td></tr>';
    return;
  }
  body.innerHTML = rows.map(row => {
    const chanceText = showChance ? (row.status === 'locked' ? '100%' : row.status === 'contention' ? `~${Math.round(row.chance)}%` : '0%') : '';
    const statusLabel = getStatusText(row.status) + (showChance ? ` (${chanceText})` : '');
    return `<tr>
      <td>${row.rank}</td>
      <td><a href="https://www.thebluealliance.com/team/${row.team_key?.slice(3)}" target="_blank" rel="noreferrer">${row.team_key?.slice(3) || '-'}</a></td>
      <td>${row.e1}</td>
      <td>${row.e2}</td>
      <td>${row.bonus ?? '-'}</td>
      <td>${row.total}</td>
      <td class="${getStatusClass(row.status)}">${statusLabel}</td>
    </tr>`;
  }).join('');
}

function filterTeamRows(rows) {
  const searchTerm = document.getElementById('teamSearch')?.value.toLowerCase() || '';
  const simplified = document.getElementById('simplifiedView')?.checked;
  return rows.filter(row => {
    const teamNumber = row.team_key?.slice(3) || '';
    const matchesSearch = teamNumber.includes(searchTerm) || row.team_key?.toLowerCase().includes(searchTerm);
    if (simplified) {
      return matchesSearch && (row.status === 'locked' || row.hasAward);
    }
    return matchesSearch;
  });
}

async function loadDCMP() {
  const [rankings, events] = await Promise.all([
    fetchTBA(`/district/${PAGE_CONFIG.YEAR}${PAGE_CONFIG.DISTRICT}/rankings`),
    fetchTBA(`/district/${PAGE_CONFIG.YEAR}${PAGE_CONFIG.DISTRICT}/events`)
  ]);

  const now = new Date();
  const nonDcmpEvents = events.filter(event => event.event_type !== PAGE_CONFIG.DCMP_EVENT_TYPE);
  const allEventsDone = nonDcmpEvents.length > 0 && nonDcmpEvents.every(event => isEventComplete(event, now));
  if (allEventsDone) {
    document.getElementById('frozenBadge')?.classList.remove('hidden');
    document.getElementById('frozenBadge').style.display = 'inline-block';
  }

  const pointsRemaining = nonDcmpEvents.reduce((sum, event) => sum + getEventPointsRemaining(event, now), 0);
  document.getElementById('ptsRemaining').textContent = safe(pointsRemaining);
  document.getElementById('dcmpSlots').textContent = PAGE_CONFIG.SLOTS;

  renderEventsTable(nonDcmpEvents, 'eventsBody', true, true);

  if (!rankings.length) {
    document.getElementById('ranksBody').innerHTML = '<tr><td colspan="7" class="error">No rankings available</td></tr>';
    return;
  }

  const sorted = [...rankings].sort((a, b) => safeNum(b.point_total) - safeNum(a.point_total));
  const topTeams = sorted.slice(0, Math.min(sorted.length, PAGE_CONFIG.SLOTS + 30));

  const awardMap = {};
  await Promise.all(topTeams.map(async team => {
    const awards = await fetchTeamAwards(team.team_key, PAGE_CONFIG.YEAR);
    awardMap[team.team_key] = hasQualifyingAward(awards, PAGE_CONFIG.QUALIFYING_AWARDS);
  }));

  const teamRows = sorted.map((team, index) => {
    const rank = index + 1;
    const cutoffIn = safeNum(sorted[PAGE_CONFIG.SLOTS - 1]?.point_total);
    const cutoffOut = safeNum(sorted[PAGE_CONFIG.SLOTS]?.point_total);
    const points = safeNum(team.point_total);
    const gap = points - cutoffOut;
    const behind = cutoffIn - points;
    const hasAward = awardMap[team.team_key];
    let status = 'eliminated';

    if (hasAward || (rank <= PAGE_CONFIG.SLOTS && gap > pointsRemaining)) {
      status = 'locked';
    } else if (hasAward || behind <= pointsRemaining || gap >= 0) {
      status = 'contention';
    }

    if (hasAward) {
      status = 'locked';
    }

    return {
      ...team,
      rank,
      status,
      chance: estimateChance(status, behind, gap, rank <= PAGE_CONFIG.SLOTS),
      hasAward,
      e1: safe(team.event_points?.[0]?.total),
      e2: safe(team.event_points?.[1]?.total),
      bonus: safe(team.rookie_bonus),
      total: safe(team.point_total)
    };
  });

  function refreshTeams() {
    const filtered = filterTeamRows(teamRows);
    renderRankings(filtered, 'ranksBody');
  }

  document.getElementById('teamSearch')?.addEventListener('input', refreshTeams);
  document.getElementById('simplifiedView')?.addEventListener('change', refreshTeams);
  refreshTeams();
}

async function loadWCMP() {
  const [rankings, events] = await Promise.all([
    fetchTBA(`/district/${PAGE_CONFIG.YEAR}${PAGE_CONFIG.DISTRICT}/rankings`),
    fetchTBA(`/district/${PAGE_CONFIG.YEAR}${PAGE_CONFIG.DISTRICT}/events`)
  ]);

  const now = new Date();
  const dcmpEvents = events.filter(event => event.event_type === PAGE_CONFIG.DCMP_EVENT_TYPE);
  const dcmpDone = dcmpEvents.length > 0 && dcmpEvents.every(event => isEventComplete(event, now));
  if (dcmpDone) {
    document.getElementById('frozenBadge')?.classList.remove('hidden');
    document.getElementById('frozenBadge').style.display = 'inline-block';
  }

  document.getElementById('dcmpSlots').textContent = PAGE_CONFIG.SLOTS;
  const worldsSlots = PAGE_CONFIG.WORLDS_SLOTS || Math.min(15, Math.floor(PAGE_CONFIG.SLOTS / 3));
  document.getElementById('worldsSlots').textContent = worldsSlots;
  renderEventsTable(dcmpEvents, 'eventsBody', false, false);

  if (!rankings.length) {
    document.getElementById('ranksBody').innerHTML = '<tr><td colspan="7" class="error">No rankings available</td></tr>';
    return;
  }

  const awardMap = {};
  const allTeams = [...rankings].slice(0, Math.min(rankings.length, PAGE_CONFIG.SLOTS + 40));
  await Promise.all(allTeams.map(async team => {
    const awards = await fetchTeamAwards(team.team_key, PAGE_CONFIG.YEAR);
    awardMap[team.team_key] = hasQualifyingAward(awards, PAGE_CONFIG.QUALIFYING_AWARDS);
  }));

  const qualifiers = rankings
    .filter(team => safeNum(team.dcmp_points?.total) > 0 || awardMap[team.team_key])
    .sort((a, b) => safeNum(b.dcmp_points?.total) - safeNum(a.dcmp_points?.total) || safeNum(b.point_total) - safeNum(a.point_total));

  const teamRows = qualifiers.map((team, index) => {
    const rank = index + 1;
    const points = safeNum(team.dcmp_points?.total) || safeNum(team.point_total);
    const cutoffIn = safeNum(qualifiers[worldsSlots - 1]?.dcmp_points?.total || qualifiers[worldsSlots - 1]?.point_total);
    const cutoffOut = safeNum(qualifiers[worldsSlots]?.dcmp_points?.total || qualifiers[worldsSlots]?.point_total);
    const gap = points - cutoffOut;
    const behind = cutoffIn - points;
    const hasAward = awardMap[team.team_key];
    let status = 'eliminated';

    if (rank <= worldsSlots) {
      if (hasAward || gap > 0) status = 'locked';
      else status = 'contention';
    } else if (hasAward || behind <= 0) {
      status = 'contention';
    }

    if (hasAward) {
      status = 'locked';
    }

    return {
      ...team,
      rank,
      status,
      chance: estimateChance(status, behind, gap, rank <= worldsSlots),
      hasAward,
      e1: safe(team.event_points?.[0]?.total),
      e2: safe(team.event_points?.[1]?.total),
      bonus: '-',
      total: safe(team.point_total)
    };
  });

  renderRankings(teamRows, 'ranksBody', false);
}

function initQualificationPage() {
  if (!window.PAGE_CONFIG) {
    console.error('PAGE_CONFIG is required for qualification.js');
    return;
  }
  if (PAGE_CONFIG.PAGE_TYPE === 'dcmp') {
    loadDCMP();
  } else if (PAGE_CONFIG.PAGE_TYPE === 'wcmp') {
    loadWCMP();
  } else {
    console.error('Unknown PAGE_TYPE', PAGE_CONFIG.PAGE_TYPE);
  }
}

document.addEventListener('DOMContentLoaded', initQualificationPage);
