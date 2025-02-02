/**
 * Simple timetable extractor from MyPortal!
 * By Li Lian SC08 2025 :)
 * For problems/feedback, feel free to contact me on tele @butter9fe
 
 * Modified from: https://pastebin.com/wSiP2Ljm
 */
const nameOfFile = "schedule";
(async function (doc) {
	//#region Customizable Stuff
	const numWksToGet = 14; // Starts from the week you have opened on
	const keepCourseCode = false; // Whether you want to keep the course code in the name
	const keepCourseType = true; // Whether you want to keep course type in the name (eg: Lecture/Cohort Based Learning)

	const roomNames = {
        "1.314": "Cohort Class 1",
        "1.315": "Cohort Class 2",
        "1.413": "Cohort Class 3",
        "1.414": "Cohort Class 4",
        "1.513": "Cohort Class 5",
        "1.514": "Cohort Class 6",
        "1.608": "Cohort Class 7",
		"1.609": "Cohort Class 8",
		"2.307": "Cohort Class 9",
		"2.308": "Cohort Class 10",
		"2.405": "Cohort Class 11",
		"2.406": "Cohort Class 12",
		"2.506": "Cohort Class 13",
		"2.507": "Cohort Class 14",
		"2.606": "Cohort Class 15",
		"2.607": "Cohort Class 16",
		"2.101": "Auditorium",
		"1.102": "Albert Hong Lecture Theatre"
	}; // So that we can replace things like "ECC Building 1", feel free to add more!

	const courseMisspellings = {
		"Global Humanities:Lit\\,Philo\\,Et": "Global Humanities",
		"Professional Practice Programm": "Professional Practice Programme",
		"Freshmore Communication Prog": "Freshmore Communication Programme",
		"Computational Thinking For Des": "Computational Thinking For Design",
		"Science for a Sustainable Worl": "Science for a Sustainable World",
		"Sci and Tech for Healthcare": "Science and Technology for Healthcare",
		"Digital Worlds\\, Space and Spat": "Digital Worlds, Space and Spatialities",
		"Introduction to Digital Humani": "Introduction to Digital Humanities"
	} // For module names that have been cut off (credit to https://github.com/MarkHershey/sutd-calendar-fixer/blob/master/src/calendarFixer.py)!
	//#endregion

	let classes = [];
    const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
	for (let i = 0; i < numWksToGet; i++) {
		const day_from_x = {};
		const days = Array.from(doc.querySelectorAll('#WEEKLY_SCHED_HTMLAREA th'))
			.slice(1)
			.map((e, i) => {
				let [month, day] = e.textContent.split('\n')[1].split(' ');
				const x = Math.round(e.getBoundingClientRect().x);
				day_from_x[x] = i;
				return {
					day: parseInt(day),
					month: MONTHS.indexOf(month) + 1,
				};
			});

		const removeExtraSpaces = s => s.split(' ').filter(s => s.length > 0).join(' ');

		const c = Array.from(doc.querySelectorAll('#WEEKLY_SCHED_HTMLAREA td > span'))
			.map(e => e.parentNode)
			.filter(e => day_from_x[Math.round(e.getBoundingClientRect().x)] !== undefined)
			.map(e => {
				/**
				 * The span contains the following:
				 * 0: Course Code - Class (eg: 10 .016 - SC08) [yes there's weirdly a space in-between]
				 * 1: break
				 * 2: Course Name (eg: Science for a Sustainable World)
				 * 3: break
				 * 4: Course Type (eg: Lecture/Cohort Based Learning)
				 * 5: break
				 * 6: Time of Course (eg: 09:00 - 11:00)
				 * 7: break
				 * 8: Place (eg: ECC Building 1 1.609)
				 */
				const span = e.childNodes[0].childNodes;
				const day = days[day_from_x[Math.round(e.getBoundingClientRect().x)]];

				// Formatting the name
				const formatCourseCode = s => {
					const words = removeExtraSpaces(s).split(' ');
					return words[0] + words.slice(1).join(' ');
				}
				let courseName = span[2].textContent;
				if (courseName in courseMisspellings) // Replace misspelled module names
					courseName = courseMisspellings[courseName];
				if (keepCourseCode)
					courseName = formatCourseCode(span[0].textContent) + courseName;
				if (keepCourseType)
					courseName += ` - ${span[4].textContent}`;

				// Formatting the place
				let place = removeExtraSpaces(span[8].textContent).split(' '); // Name (can be multiple words) Code
				const placeCode = place.pop();
				if (placeCode in roomNames) // If we have specified a room name, we want to replace it, otherwise we keep the default one
					place = roomNames[placeCode];
                else
                    place = place.join(' ');

				return {
					name: removeExtraSpaces(courseName),
					day,
					time: span[6].textContent.split(' - ').map(s => s.split(':').join('')), // [0900, 1100]
					place: `${place} (${placeCode})` // Will become Auditorium (2.101), feel free to change this formatting if you want!
				}
			});

		console.log(`Found ${c.length} classes for Week ${i + 1}`);
		classes.push(...c);

		doc.getElementById('DERIVED_CLASS_S_SSR_NEXT_WEEK').click();
		await new Promise(res => setTimeout(res, 2000));
	}
	return classes;
})(document.getElementById('ptifrmtgtframe').contentDocument).then(classes => {
    const pad = (num, length) => ("0000" + num).slice(-length);
	const now = new Date();
    const currYear = now.getUTCFullYear();
    const createdTime = `${currYear}${pad(now.getUTCMonth() + 1, 2)}${pad(now.getUTCDate(), 2)}T${pad(now.getUTCHours(), 2)}${pad(now.getUTCMinutes(), 2)}${pad(now.getUTCSeconds(), 2)}Z`;

    const classToEvent = c => `BEGIN:VEVENT
DTSTAMP:${createdTime}
UID:${Math.random().toString(16).slice(2)}@calendar.sutd.edu.sg
DTSTART;TZID=Asia/Singapore:${currYear}${pad(c.day.month, 2)}${pad(c.day.day, 2)}T${pad(c.time[0], 4)}00
DTEND;TZID=Asia/Singapore:${currYear}${pad(c.day.month, 2)}${pad(c.day.day, 2)}T${pad(c.time[1], 4)}00
SUMMARY:${c.name}
LOCATION:${c.place}
END:VEVENT`;

    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:Academic Calendar ${currYear}
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
	a.download = `${nameOfFile}.ics`;
	document.body.appendChild(a);
	a.click();
	setTimeout(function() {
		document.body.removeChild(a);
		window.URL.revokeObjectURL(url);
	}, 0);
});
