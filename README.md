# SUTD Timetable Extractor
Converts SUTD's MyPortal Weekly Schedule webpage to an `.ics` file that can be imported in various calendar apps like Outlook & Google calendar.

This is a fork from https://pastebin.com/wSiP2Ljm, where the original was broken (as of 2025). I simply fixed it, as well as added some additional features & customization options. The file is commented as well for ease of editing if you want to change things :)

I am mostly a beginner self-taught JS programmer so feel free to reach out to me and give me feedback for problems or ways to make this script better!

### Customizations
At the top of the file, you can modify the following to tweak the events to your liking:
- **Name** of the file
- **Number of Weeks** to fetch
- **Course Code** in event name `(eg: 10.016)`
- **Course Type** in event name `(eg: Lecture/Cohort Based Learning)`
- **Replacement Room Names**
- **Course Name Misspelling Fixes**

 #How to Use:
1. Go to `My Portal > My Record > My Weekly Schedule`
2. Under Display Options:
	- Check all 7 days of the week
	- Check Show Class Title
	- Uncheck Show AM/PM & Show Instructors
	- Press "Refresh Calendar"
3. Go to the 1st week of your Term
4. Press `Ctrl + Shift + I`, go to the Console tab, paste in the `CalendarExtractor.js` code (just press the Raw button and `Ctrl + A` & `Ctrl + V`), and press `Enter`
5. After it's done, the `.ics` file would be downloaded and you can import it to your calendar app
 
This code interacts with the page, so please don't touch the page until the file has been downloaded.
You can monitor its progress in the console!
