# CMPStats

**CMPStats** is a web application for tracking FIRST Robotics Competition (FRC) district championship qualifications. It provides real-time data on team standings, event schedules, and qualification probabilities for district championships (DCMP) and the world championship (WCMP).

![CMPStats Logo](logo.png)

## Features

- **14 FRC Districts**: Track qualifications for all active FRC districts
- **Real-time Data**: Live data from [The Blue Alliance](https://www.thebluealliance.com) API
- **DCMP & WCMP Tracking**: Separate pages for District Championship and World Championship qualification
- **Color-coded Status**:
  - 🟢 **Green**: Locked (mathematically qualified or award winner)
  - 🟡 **Yellow**: In contention (can still qualify)
  - 🔴 **Red**: Eliminated (cannot mathematically qualify)
- **Freeze Logic**: Pages stop updating when events are complete, with a "✓ FROZEN" indicator
- **Award Detection**: Teams qualifying via Chairman's Award, Engineering Inspiration, or Rookie All-Star are marked as locked
- **Responsive Design**: Works on desktop and mobile devices

## Supported Districts

| District | Code | DCMP Slots |
|----------|------|------------|
| California | ca | 60 |
| Chesapeake | chs | 50 |
| Indiana | in | 32 |
| Israel | isr | 45 |
| Michigan | fim | 160 |
| Mid-Atlantic | fma | 60 |
| New England | ne | 80 |
| North Carolina | fnc | 35 |
| Ontario | ont | 60 |
| Pacific Northwest | pnw | 65 |
| Peachtree | pch | 45 |
| South Carolina | fsc | 40 |
| Texas | tx | 48 |
| Wisconsin | win | 45 |

## Project Structure

```
cmpstats.github.io/
├── index.html          # Homepage with district selection
├── logo.png            # Site favicon/logo
├── LICENSE             # License file
├── README.md           # This file
├── ca/                 # California district
│   ├── index.html      # District landing page
│   ├── dcmp/           # DCMP qualification page
│   └── wcmp/           # WCMP qualification page
├── chs/                # Chesapeake district
├── fim/                # Michigan district
├── fma/                # Mid-Atlantic district
├── fnc/                # North Carolina district
├── in/                 # Indiana district
├── isr/                # Israel district
├── ne/                 # New England district
├── ont/                # Ontario district
├── pch/                # Peachtree district
├── pnw/                # Pacific Northwest district
├── sc/                 # South Carolina district
├── tx/                 # Texas district
└── wi/                 # Wisconsin district
```

## Usage

1. Open `index.html` in a web browser
2. Click on a district to view its qualification status
3. Select either **DCMP** (District Championship) or **WCMP** (World Championship)
4. View team rankings, event schedules, and qualification probabilities

## Technology Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **API**: [The Blue Alliance API v3](https://www.thebluealliance.com/apidocs)
- **Styling**: Custom CSS with CSS Variables for theming
- **Responsive**: Mobile-first design with media queries

## API Key

The application uses a TBA API key for fetching data. The key is embedded in the JavaScript files:

```javascript
const TBA_API_KEY = 'z8FSCVQr1QXVxRFn6GgWOfmVrTtQQ1GUxvs78aCgrigr6JqQaZZRdET6AIZ9Gm80';
```

## Calculation Methodology

### DCMP Qualification
- Teams ranked within the district's DCMP slot count are considered
- **Locked**: Gap to cutoff > remaining points OR qualified via award
- **In Contention**: Within mathematical reach of qualification
- **Eliminated**: Cannot reach cutoff even with maximum remaining points

### WCMP Qualification
- Top teams from DCMP advance to World Championship
- Approximately 1/3 of DCMP slots advance to Worlds
- Same color-coding logic applies

### Freeze Logic
- **DCMP Page**: Stops updating when all non-DCMP district events are complete
- **WCMP Page**: Stops updating when the DCMP event is complete
- Prevents outdated calculations after events conclude

## Browser Compatibility

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Credits

- **Author**: Sanchit Phadke
- **Team**: FRC 9317 (current), FRC 5827 (former), FLL 52060
- **Data Source**: [The Blue Alliance](https://www.thebluealliance.com)
- **Inspiration**: [frclocks.com](https://frclocks.com)

## License

See [LICENSE](LICENSE) file for details.

## Links

- **Live Site**: [cmpstats.github.io](https://cmpstats.github.io)
- **GitHub**: [github.com/cmpstats/cmpstats.github.io](https://github.com/cmpstats/cmpstats.github.io)
- **The Blue Alliance**: [thebluealliance.com](https://www.thebluealliance.com)
