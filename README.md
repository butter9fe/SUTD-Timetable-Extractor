# SUTD Timetable Extractor
Converts SUTD's MyPortal Weekly Schedule webpage to an `.ics` file that can be imported in various calendar apps like Outlook & Google calendar.

This is a fork from https://pastebin.com/wSiP2Ljm, where the original was broken (as of 2025). I simply fixed it, as well as added some additional features & customization options. The file is commented as well for ease of editing if you want to change things :)

I am mostly a beginner self-taught JS programmer so feel free to reach out to me for ways to make this script better! For any suggestions, go ahead and create issues or PRs :D

# How to Use:
1. Go to `My Portal > My Record > My Weekly Schedule`
2. Under Display Options:
	- Check all 7 days of the week
	- Check Show Class Title
	- Uncheck Show AM/PM & Show Instructors
	- Press "Refresh Calendar"
 - Your final display options should look like this:
![image](https://github.com/user-attachments/assets/e4bc7413-398a-446d-b8b8-7ab2f9a0b411)

3. Go to the 1st week of your Term
4. Press `Ctrl + Shift + J (Windows)`/`Cmd + Options + J (Mac)`, go to the Console tab, paste in [CalendarExtractor.js](https://github.com/butter9fe/SUTD-Timetable-Extractor/blob/main/CalendarExtractor.js "`CalendarExtractor.js`") code (just click on the little Copy button next to Raw), and press `Enter`
5. After it's done, the `.ics` file would be downloaded and you can import it to your calendar app
 
This code interacts with the page, so please don't touch the page until the file has been downloaded.

You can monitor its progress in the console!

# Customizations
At the top of the file, you can modify the following to tweak the events to your liking:
- **Name** of the file
- **Number of Weeks** to fetch
- **Course Code** in event name `(eg: 10.016)`
- **Course Type** in event name `(eg: Lecture/Cohort Based Learning)`
- **Replacement Room Names** `(eg: Auditorium/Cohort Classroom 8)`
- **Course Name Misspelling Fixes** `(For long course names that got cut off)`

# Samples
![image](https://github.com/user-attachments/assets/51af2a5c-3ee8-412c-b779-dfd7748cb9cb)
<sup>Course Code & Course Type [Off]</sup>

![image](https://github.com/user-attachments/assets/cf2e49a4-58df-4b45-9b0c-2510fda11e53)
<sup>Course Code & Course Type [On]</sup>
