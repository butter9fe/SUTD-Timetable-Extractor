/**
 * Simple timetable extractor from MyPortal!
 * Last Updated: 25/01/26
 * For problems/feedback, feel free to contact me on tele @butter9fe
 */
(() => {
// #region Configurations
const nameOfFile = "schedule";
const isMonthDayYearFormat = false; // Whether your browser formats your dates as m/d/y. If false, will default to d/m/y
const keepModuleCode = false; // Whether you want to keep the module code in the name
const keepModuleType = true; // Whether you want to keep module type in the name (eg: Lecture/Cohort Based Learning)
// #endregion

// #region Mappings
const MODULE_TYPE_MAPPING = {
    "CBL": "Cohort Class",
    "LEC": "Lecture",
    "LAB": "Lab",
    "TUT": "Tutorial",
    "REC": "Recitation",
    "TES": "Test"
}

const MODULE_NAME_MISSPELLINGS = {
    "Global Humanities:Lit\\,Philo\\,Et": "Global Humanities",
    "Professional Practice Programm": "Professional Practice Programme",
    "Freshmore Communication Prog": "Freshmore Communication Programme",
    "Computational Thinking For Des": "Computational Thinking For Design",
    "Science for a Sustainable Worl": "Science for a Sustainable World",
    "Sci and Tech for Healthcare": "Science and Technology for Healthcare",
    "Digital Worlds\\, Space and Spat": "Digital Worlds, Space and Spatialities",
    "Introduction to Digital Humani": "Introduction to Digital Humanities"
} // For module names that have been cut off (credit to https://github.com/MarkHershey/sutd-calendar-fixer/blob/master/src/calendarFixer.py)
//#endregion

// #region Helper Functions
function timeStrTo24h(timeStr) {
    // Account for different browsers displaying time as 12h vs 24h
    const is12H = timeStr.endsWith("AM") || timeStr.endsWith("PM");

    // If already 24h format, just need to remove :
    if (!is12H) 
        return timeStr.replace(":", "");

    // Else, convert from 12h to 24h format
    let [time, modifier] = [timeStr.slice(0, -2), timeStr.slice(-2)];
    let [hours, minutes] = time.split(':');

    // Convert hours to 24h
    if (hours === '12') hours = '00';
    if (modifier === 'PM') hours = parseInt(hours, 10) + 12;

    // Pad hours/minutes with leading zero and combine
    return `${String(hours).padStart(2, '0')}${minutes}`;
}

function parseClasses(classTable) {
    let rows = Array.from(classTable.getElementsByTagName('tr'));
    rows.shift(); // Remove first header row
    
    // ignore row if time is missing or TBA due to credit transfer
    rows = rows.filter(row => {
        const t = row.querySelector('[id^="MTG_SCHED"]').textContent.trim();
        return !/^TBA/i.test(t) && t.includes(':');
    });

    const resultRows = [];

    let currModuleType = "";
    for (const row of rows) {
        // Update module type, if any
        const rowType = row.querySelector('[id^="MTG_COMP"]').textContent.trim();
        if (rowType.length > 0)
            currModuleType = rowType;

        // Get time
        const rowTime = row.querySelector('[id^="MTG_SCHED"]').textContent.split(" "); // [Day, StartTime, - , EndTime]
        const timeStart = timeStrTo24h(rowTime[1]);
        const timeEnd = timeStrTo24h(rowTime[3]);

        const weekdayMap = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']; 
        const weekday = rowTime[0];
        
        // Get location
        let location = row.querySelector('[id^="MTG_LOC"]').textContent;
        // Sometimes, the location is too long (eg: Albert Hong), which leads to the closing bracket being cut off
        if (!location.endsWith(")"))
            location += ")";

        // Get date
        // Dates are formatted as "Date - Date" but it's always the same date so we just need to take the first one
        let dateRow = row.querySelector('[id^="MTG_DATES"]').textContent.split(" ");
        let startDate = dateRow[0];
        let endDate = dateRow[2];

        let [ day, month, year ] = startDate.split('/');
        let [ endDay, endMonth, endYear ] = endDate.split('/');
        
        // Sometimes the date is formatted as month/day/year instead, so check if that's the case. If so, swap accordingly
        if (isMonthDayYearFormat)
            [day, month, endDay, endMonth] = [month, day, endMonth, endDay];

        if (startDate === endDate) {
            resultRows.push({
                moduleType: currModuleType,
                timeStart,
                timeEnd,
                location,
                date: { day, month, year },
            });
        } else {
            let curDate = new Date(year, month-1, day);
            let endDate = new Date(endYear, endMonth-1, endDay);
            let i = 0;
            while (curDate.getTime() < endDate.getTime() && i < 10000) {
                if (weekdayMap[curDate.getDay()] === weekday)
                    resultRows.push({
                        moduleType: currModuleType,
                        timeStart,
                        timeEnd,
                        location,
                        date: {
                            day: curDate.getDate(),
                            month: curDate.getMonth()+1,
                            year: curDate.getFullYear(),
                        },
                    });
                curDate.setDate(curDate.getDate() + 1);
                i++;
            }

            // max iterations in case loop does not end
            if (i >= 10000) {
                alert('date parsing logic failed; check isMonthDayYearFormat');
                return [];
            }
        }
    }
    return resultRows;
}

const pad = (num, length) => ("0000" + num).slice(-length);
const now = new Date();
const currTime = `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1, 2)}${pad(now.getUTCDate(), 2)}T${pad(now.getUTCHours(), 2)}${pad(now.getUTCMinutes(), 2)}${pad(now.getUTCSeconds(), 2)}Z`;

function classToEvent(classObj) {
    let name = classObj.className;
    if (keepModuleType) // Add (Module Type) to end of class name
        name += ` (${MODULE_TYPE_MAPPING[classObj.moduleType] ?? classObj.moduleType})`;

    return `BEGIN:VEVENT
DTSTAMP:${currTime}
UID:${Math.random().toString(16).slice(2)}@calendar.sutd.edu.sg
DTSTART;TZID=Asia/Singapore:${classObj.date.year}${pad(classObj.date.month, 2)}${pad(classObj.date.day, 2)}T${classObj.timeStart}00
DTEND;TZID=Asia/Singapore:${classObj.date.year}${pad(classObj.date.month, 2)}${pad(classObj.date.day, 2)}T${classObj.timeEnd}00
SUMMARY:${name}
LOCATION:${classObj.location}
END:VEVENT`
    }
// #endregion

const iframe = document.getElementById('ptifrmtgtframe');

// #region Validity Checks
// Check for list view
var weeklyRadioBtn = iframe.contentDocument.querySelector("[id='DERIVED_REGFRM1_SSR_SCHED_FORMAT$259$']");
if (weeklyRadioBtn !== null && weeklyRadioBtn.checked)
    throw new Error("Please switch to List view!");

if (iframe.contentDocument.querySelector("[name^='DERIVED_REGFRM1_SSR_SCHED_FORMAT']") !== null)
    throw new Error("Scroll to the bottom and click 'Printer Friendly Page' first!");
// #endregion

// Get all class tables
const classTables = Array.from(iframe.contentDocument.querySelectorAll('.PABACKGROUNDINVISIBLEWBO'))
    .filter(e => e.id !== 'STDNT_ENRL_SSV2$scroll$0'); // Exclude header with student's names

// Loop through all classes and append to schedule
const classes = classTables.map(table => {
    // (1) Get class name
    let className = table.querySelector('.PAGROUPDIVIDER').textContent;

    // Format class name
    var [ moduleCode, moduleName ] = className.split(' - ');
    className = moduleName; // Start with just the module name
    if (moduleName in MODULE_NAME_MISSPELLINGS) // Replace misspelled module names
        className = MODULE_NAME_MISSPELLINGS[moduleName];
    if (keepModuleCode) // Add in module code, but remove any weird spacings (eg: 02 .005 => 02.005)
        className = `${moduleCode.replace(/\s+/g, '').replace(/-.*/, '')} ${className}`

    // (2) Get class schedule
    let classSchedules = table.querySelector('[id^="CLASS_MTG_VW"] .PSLEVEL2GRID > tbody')
    classSchedules = parseClasses(classSchedules);

    // Log progress
    console.log(`Found ${classSchedules.length} class(es) for ${className}`)

    // (3) Return object with class name and schedules
    return classSchedules.map(c => ({className, ...c}));
});

// Making ics
const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:Academic Calendar ${now.getUTCFullYear()}
CALSCALE:GREGORIAN
BEGIN:VTIMEZONE
TZID:Asia/Singapore
TZURL:https://www.tzurl.org/zoneinfo-outlook/Asia/Singapore
X-LIC-LOCATION:Asia/Singapore
BEGIN:STANDARD
TZNAME:+08
TZOFFSETFROM:+0800
TZOFFSETTO:+0800
DTSTART:19700101T000000
END:STANDARD
END:VTIMEZONE
${classes.flat().map(classToEvent).join('\r\n')}
END:VCALENDAR`;

let file = new Blob([icsContent], { type: 'text/calendar' });
const a = document.createElement("a");
const url = URL.createObjectURL(file);
a.href = url;
a.download = `${nameOfFile}.ics`;
document.body.appendChild(a);
a.click();
setTimeout(function() {
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}, 0);


console.log(".ics downloaded!");

})();
