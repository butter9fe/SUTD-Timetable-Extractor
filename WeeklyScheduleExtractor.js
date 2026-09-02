/**
 * Simple timetable extractor from MyPortal!
 * Last Updated: 02/09/26
 * For problems/feedback, feel free to contact me on tele @butter9fe
 */
(async () => {
// #region Configurations
const nameOfFile = "schedule";
const isMonthDayYearFormat = false; // Whether your browser formats your dates as m/d/y. If false, will default to d/m/y
const keepModuleCode = false; // Whether you want to keep the module code in the name
const keepModuleType = true; // Whether you want to keep module type in the name (eg: Lecture/Cohort Based Learning)
const monthsToScrape = 4; // Scrape the displayed week and subsequent weeks for this many calendar months
// #endregion

// #region Mappings
const MODULE_TYPE_MAPPING = {
    "CBL": "Cohort Class",
    "Cohort Based Learning": "Cohort Class",
    "LEC": "Lecture",
    "Lecture": "Lecture",
    "LAB": "Lab",
    "Lab": "Lab",
    "TUT": "Tutorial",
    "Tutorial": "Tutorial",
    "REC": "Recitation",
    "Recitation": "Recitation",
    "TES": "Test"
}

const MODULE_NAME_MISSPELLINGS = {
    "Global Humanities:Lit\\,Philo\\,Et": "Global Humanities",
    "Global Humanities:Lit,Philo,Et": "Global Humanities",
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
    // Account for both 12-hour and 24-hour display options.
    const match = timeStr.trim().toUpperCase().replace(/\s+/g, '').match(/^(\d{1,2}):(\d{2})(AM|PM)?$/);
    if (!match)
        throw new Error(`Unable to parse time: ${timeStr}`);

    let [, hours, minutes, modifier] = match;
    hours = parseInt(hours, 10);

    if (modifier) {
        if (hours === 12) hours = 0;
        if (modifier === 'PM') hours += 12;
    }

    return `${String(hours).padStart(2, '0')}${minutes}`;
}

function getElementLines(element) {
    // textContent does not add separators for <br>, which is how the weekly
    // calendar separates course details. Walk the node tree and add them.
    let text = "";
    const appendText = node => {
        if (node.nodeType === 3) {
            text += node.nodeValue;
        } else if (node.nodeName === 'BR') {
            text += '\n';
        } else {
            for (const child of node.childNodes)
                appendText(child);
        }
    };
    appendText(element);

    return text
        .replace(/\u00a0/g, ' ')
        .split(/\r?\n/)
        .map(line => line.replace(/\s+/g, ' ').trim())
        .filter(Boolean);
}

function parseDateValue(value) {
    const match = value.match(/(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
    if (!match)
        return null;

    let [, first, second, year] = match.map(Number);
    if (isMonthDayYearFormat)
        [first, second] = [second, first];

    return new Date(Date.UTC(year, second - 1, first));
}

function formatClassName(moduleCode, moduleName) {
    const unescapedName = moduleName.replace(/\\,/g, ',');
    let className = MODULE_NAME_MISSPELLINGS[moduleName]
        ?? MODULE_NAME_MISSPELLINGS[unescapedName]
        ?? moduleName;
    if (keepModuleCode)
        className = `${moduleCode.replace(/\s+/g, '').replace(/-.*/, '')} ${className}`;
    return className;
}

function splitClassHeader(header) {
    const match = header.match(/^(.*?)\s+-\s+([^\s]+)\s*$/);
    if (!match)
        return { moduleCode: header, section: "" };

    return {
        moduleCode: match[1].trim(),
        section: match[2].trim(),
    };
}

const MODULE_TYPE_NAMES = new Set([
    ...Object.keys(MODULE_TYPE_MAPPING),
    ...Object.values(MODULE_TYPE_MAPPING),
    "Cohort Based Learning",
]);

function isModuleType(value) {
    return MODULE_TYPE_NAMES.has(value.trim());
}

function parseClasses(classTable) {
    let rows = Array.from(classTable.getElementsByTagName('tr'));
    rows.shift(); // Remove first header row
    
    // ignore row if time is missing or TBA due to credit transfer
    rows = rows.filter(row => {
        const schedule = row.querySelector('[id^="MTG_SCHED"]');
        const t = schedule ? schedule.textContent.trim() : "";
        return !/^TBA/i.test(t) && t.includes(':');
    });

    const resultRows = [];

    let currModuleType = "";
    for (const row of rows) {
        // Update module type, if any
        const typeElement = row.querySelector('[id^="MTG_COMP"]');
        const rowType = typeElement ? typeElement.textContent.trim() : "";
        if (rowType.length > 0)
            currModuleType = rowType;

        // Get time
        const rowTime = row.querySelector('[id^="MTG_SCHED"]').textContent.split(" "); // [Day, StartTime, - , EndTime]
        const timeStart = timeStrTo24h(rowTime[1]);
        const timeEnd = timeStrTo24h(rowTime[3]);

        const weekdayMap = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']; 
        const weekday = rowTime[0];
        
        // Get location
        let location = row.querySelector('[id^="MTG_LOC"]')?.textContent.trim() ?? "";
        // Sometimes, the location is too long (eg: Albert Hong), which leads to the closing bracket being cut off
        if (location && !location.endsWith(")"))
            location += ")";

        // Get date
        // Dates are formatted as "Date - Date" but it's always the same date so we just need to take the first one
        let dateRow = row.querySelector('[id^="MTG_DATES"]')?.textContent.trim().split(/\s+/) ?? [];
        let startDate = dateRow[0];
        let endDate = dateRow[2];

        if (!startDate || !endDate)
            continue;

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
            let curDate = new Date(Date.UTC(year, month-1, day));
            let endDate = new Date(Date.UTC(endYear, endMonth-1, endDay));
            let i = 0;
            while (curDate.getTime() <= endDate.getTime() && i < 10000) {
                if (weekdayMap[curDate.getUTCDay()] === weekday)
                    resultRows.push({
                        moduleType: currModuleType,
                        timeStart,
                        timeEnd,
                        location,
                        date: {
                            day: curDate.getUTCDate(),
                            month: curDate.getUTCMonth()+1,
                            year: curDate.getUTCFullYear(),
                        },
                    });
                curDate.setUTCDate(curDate.getUTCDate() + 1);
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

function getWeekStart(scheduleDocument) {
    const startInput = scheduleDocument.querySelector('#DERIVED_CLASS_S_START_DT');
    if (startInput?.value) {
        const date = parseDateValue(startInput.value);
        if (date)
            return date;
    }

    const weekLabel = Array.from(scheduleDocument.querySelectorAll('.PSGROUPBOXLABEL'))
        .map(element => element.textContent.trim())
        .find(text => /^Week of\b/i.test(text));
    const date = weekLabel ? parseDateValue(weekLabel) : null;
    if (date)
        return date;

    throw new Error("Unable to find the start date for the displayed week.");
}

function dateForHeader(header, weekStart, dayOffset) {
    const headerText = getElementLines(header).join(' ');
    const match = headerText.match(/(\d{1,2})\s+([A-Za-z]{3,9})/);
    if (!match)
        return new Date(weekStart.getTime() + dayOffset * 86400000);

    const month = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"]
        .indexOf(match[2].slice(0, 3).toLowerCase());
    if (month < 0)
        return new Date(weekStart.getTime() + dayOffset * 86400000);

    const expected = weekStart.getTime() + dayOffset * 86400000;
    const candidates = [-1, 0, 1].map(yearOffset =>
        new Date(Date.UTC(weekStart.getUTCFullYear() + yearOffset, month, Number(match[1])))
    );
    return candidates.reduce((closest, candidate) =>
        Math.abs(candidate.getTime() - expected) < Math.abs(closest.getTime() - expected) ? candidate : closest
    );
}

function parseWeeklyClasses(scheduleTable, scheduleDocument) {
    const rows = Array.from(scheduleTable.rows);
    if (rows.length < 2)
        return [];

    const headerCells = Array.from(rows[0].cells);
    const weekStart = getWeekStart(scheduleDocument);
    const dates = headerCells.slice(1).map((header, index) => dateForHeader(header, weekStart, index));
    const grid = [];
    const seenCells = new Set();
    const resultRows = [];

    // Reconstruct the visual grid because occupied cells use rowspan to cover
    // their duration, so later HTML rows do not contain all seven day cells.
    rows.slice(1).forEach((row, rowIndex) => {
        const gridRow = rowIndex + 1;
        if (!grid[gridRow]) grid[gridRow] = [];

        let column = 0;
        for (const cell of Array.from(row.cells)) {
            while (grid[gridRow][column]) column++;

            const rowSpan = Number(cell.getAttribute('rowspan') || 1);
            const colSpan = Number(cell.getAttribute('colspan') || 1);
            for (let r = gridRow; r < gridRow + rowSpan; r++) {
                if (!grid[r]) grid[r] = [];
                for (let c = column; c < column + colSpan; c++)
                    grid[r][c] = cell;
            }

            // Column zero is the time axis. Every other non-empty cell is a
            // course event, and its text contains the exact start/end times.
            if (column > 0 && !seenCells.has(cell)) {
                const lines = getElementLines(cell);
                const timeIndex = lines.findIndex(line =>
                    /^\d{1,2}:\d{2}\s*(?:AM|PM)?\s*-\s*\d{1,2}:\d{2}\s*(?:AM|PM)?$/i.test(line)
                );

                if (timeIndex >= 0 && dates[column - 1]) {
                    const header = splitClassHeader(lines[0]);
                    const metadata = lines.slice(1, timeIndex);
                    const moduleType = metadata.find(isModuleType) ?? metadata[metadata.length - 1] ?? "";
                    const moduleName = metadata.find(line => line !== moduleType) ?? header.moduleCode;
                    const timeMatch = lines[timeIndex].match(/^(.*?)\s*-\s*(.*?)$/);
                    const location = lines[timeIndex + 1] && !/^Instructors?:/i.test(lines[timeIndex + 1])
                        ? lines[timeIndex + 1]
                        : "";

                    if (timeMatch && header.moduleCode) {
                        resultRows.push({
                            className: formatClassName(header.moduleCode, moduleName),
                            moduleType,
                            timeStart: timeStrTo24h(timeMatch[1]),
                            timeEnd: timeStrTo24h(timeMatch[2]),
                            location,
                            date: {
                                day: dates[column - 1].getUTCDate(),
                                month: dates[column - 1].getUTCMonth() + 1,
                                year: dates[column - 1].getUTCFullYear(),
                            },
                        });
                    }
                }
                seenCells.add(cell);
            }

            column += colSpan;
        }
    });

    return resultRows;
}

function addMonths(date, months) {
    // Preserve calendar-month semantics instead of assuming every month has
    // the same number of days.
    const day = date.getUTCDate();
    const result = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1));
    const lastDay = new Date(Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0)).getUTCDate();
    result.setUTCDate(Math.min(day, lastDay));
    return result;
}

function dateFromClass(classObj) {
    return new Date(Date.UTC(classObj.date.year, classObj.date.month - 1, classObj.date.day));
}

function formatDateForFileName(date) {
    return [
        date.getUTCFullYear(),
        String(date.getUTCMonth() + 1).padStart(2, '0'),
        String(date.getUTCDate()).padStart(2, '0'),
    ].join('');
}

function getCalendarFileName(classes) {
    const dates = classes.map(dateFromClass);
    const startDate = new Date(Math.min(...dates));
    const endDate = new Date(Math.max(...dates));
    return `${nameOfFile}_${formatDateForFileName(startDate)}-${formatDateForFileName(endDate)}.ics`;
}

function getScheduleDocument() {
    const iframe = document.getElementById('ptifrmtgtframe');
    return iframe?.contentDocument ?? document;
}

function warnAboutMissingDisplayOptions() {
    const scheduleDocument = getScheduleDocument();
    const selectors = [
        '#DERIVED_CLASS_S_SSR_DISP_TITLE, #DERIVED_CLASS_S_DISP_TITLE, [id^="DERIVED_CLASS_S_SSR_DISP_TITLE"]',
        '#DERIVED_CLASS_S_SHOW_INSTR, [id^="DERIVED_CLASS_S_SHOW_INSTR"]',
    ];

    const missingOptions = selectors
        .map(selector => scheduleDocument.querySelector(selector))
        .filter(checkbox => checkbox && !checkbox.checked);

    if (missingOptions.length > 0)
        console.warn('Show Class Title and/or Show Instructors is not selected. The extractor will continue, but event details may be incomplete. To cancel, refresh the webpage');
}

function waitForNextWeek(previousWeekStart) {
    const timeoutMilliseconds = 20000;
    const pollMilliseconds = 250;
    const deadline = Date.now() + timeoutMilliseconds;

    return new Promise((resolve, reject) => {
        const check = () => {
            const currentDocument = getScheduleDocument();
            const currentTable = currentDocument.querySelector('#WEEKLY_SCHED_HTMLAREA');

            if (currentTable) {
                try {
                    const currentWeekStart = getWeekStart(currentDocument);
                    if (currentWeekStart.getTime() > previousWeekStart.getTime()) {
                        resolve(currentWeekStart);
                        return;
                    }
                } catch (_) {
                    // The iframe may be between documents while it reloads.
                }
            }

            if (Date.now() >= deadline) {
                reject(new Error("The schedule did not load after clicking Next Week."));
                return;
            }
            setTimeout(check, pollMilliseconds);
        };
        check();
    });
}

async function scrapeWeeklySchedule() {
    const firstDocument = getScheduleDocument();
    const firstTable = firstDocument.querySelector('#WEEKLY_SCHED_HTMLAREA');
    if (!firstTable)
        return [];

    const firstWeekStart = getWeekStart(firstDocument);
    const cutoffDate = addMonths(firstWeekStart, monthsToScrape);
    const allClasses = [];
    let currentWeekStart = firstWeekStart;

    while (currentWeekStart.getTime() <= cutoffDate.getTime()) {
        const currentDocument = getScheduleDocument();
        const currentTable = currentDocument.querySelector('#WEEKLY_SCHED_HTMLAREA');
        if (!currentTable)
            throw new Error("The weekly schedule table disappeared while loading the next week.");

        const loadedWeekStart = getWeekStart(currentDocument);
        if (loadedWeekStart.getTime() !== currentWeekStart.getTime())
            currentWeekStart = loadedWeekStart;

        const weekClasses = parseWeeklyClasses(currentTable, currentDocument);
        allClasses.push(...weekClasses);
        console.log(`Week of ${currentWeekStart.toISOString().slice(0, 10)}: found ${weekClasses.length} class(es)`);

        const nextWeekStart = new Date(currentWeekStart.getTime());
        nextWeekStart.setUTCDate(nextWeekStart.getUTCDate() + 7);
        if (nextWeekStart.getTime() > cutoffDate.getTime())
            break;

        const nextWeekButton = currentDocument.querySelector('#DERIVED_CLASS_S_SSR_NEXT_WEEK');
        if (!nextWeekButton)
            throw new Error("Could not find the Next Week button.");

        nextWeekButton.click();
        currentWeekStart = await waitForNextWeek(currentWeekStart);
    }

    // The final displayed week can extend beyond the four-month cutoff.
    return allClasses.filter(classObj => dateFromClass(classObj).getTime() <= cutoffDate.getTime());
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

const scheduleDocument = getScheduleDocument();
const weeklySchedule = scheduleDocument.querySelector('#WEEKLY_SCHED_HTMLAREA');
let classes;

if (weeklySchedule) {
    // Weekly Calendar View: course details are embedded in the occupied cells.
    warnAboutMissingDisplayOptions();
    classes = await scrapeWeeklySchedule();
} else {
    // Printer-friendly List View fallback for older saved pages.
    const classTables = Array.from(scheduleDocument.querySelectorAll('.PABACKGROUNDINVISIBLEWBO'))
        .filter(element => element.id !== 'STDNT_ENRL_SSV2$scroll$0')
        .filter(element => element.querySelector('[id^="CLASS_MTG_VW"] .PSLEVEL2GRID > tbody'));

    classes = classTables.flatMap(table => {
        const titleElement = table.querySelector('.PAGROUPDIVIDER');
        const scheduleBody = table.querySelector('[id^="CLASS_MTG_VW"] .PSLEVEL2GRID > tbody');
        if (!titleElement || !scheduleBody)
            return [];

        const [moduleCode, ...moduleNameParts] = titleElement.textContent.trim().split(' - ');
        const moduleName = moduleNameParts.join(' - ').trim();
        const className = formatClassName(moduleCode, moduleName);
        const classSchedules = parseClasses(scheduleBody);
        console.log(`Found ${classSchedules.length} class(es) for ${className}`);
        return classSchedules.map(schedule => ({ className, ...schedule }));
    });
}

if (classes.length === 0)
    throw new Error("No scheduled classes were found. Make sure the weekly schedule has loaded.");

console.log(`Found ${classes.length} scheduled class(es) across the displayed period`);

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
${classes.map(classToEvent).join('\r\n')}
END:VCALENDAR`;

let file = new Blob([icsContent], { type: 'text/calendar' });
const a = document.createElement("a");
const url = URL.createObjectURL(file);
a.href = url;
a.download = getCalendarFileName(classes);
document.body.appendChild(a);
a.click();
setTimeout(function() {
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}, 0);


console.log(".ics downloaded!");

})();
