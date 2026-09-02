# SUTD Timetable Extractor
Converts SUTD's MyPortal Weekly Schedule webpage to an `.ics` file that can be imported in various calendar apps like Outlook & Google calendar.
Feel free to reach out if you have any issues/ways to make this script better! :D

# How to Use:
1. Go to `My Portal > My Record > My Weekly Schedule`

2. Copy the [WeeklyScheduleExtractor.js](https://github.com/butter9fe/SUTD-Timetable-Extractor/blob/main/WeeklyScheduleExtractor.js "`WeeklyScheduleExtractor.js`") code (just click on the little Copy button next to Raw)

3. Press `Fn + F12`, ensure you're in the Console tab, paste in your code, and press `Enter`. You may need to type `allow pasting`.

4. You will be prompted for a couple of [configurations](#customizations) for you to tweak. One of which is to check if your page formats dates as `month/day/year`.
   - Note that the formatting isn't the same as your browser's configuration! It's assigned under 'My Preferences', but the default state of this seems to be random :(

| <img width="537" height="132" alt="image" src="https://github.com/user-attachments/assets/ac01a975-a8f9-4bc3-8749-f72fe8a91398" /> 	| <img width="512" height="127" alt="image" src="https://github.com/user-attachments/assets/b400af68-0ff8-4922-a808-9c8477c9395a" /> 	|
|---	|---	|
| Month/Day/Year 	| Day/Month/Year 	|

5. After it's done, the `.ics` file would be downloaded and you can import it to your calendar app!

# Customizations
At the top of the file, you can modify the following to tweak the events to your liking:
- **Name** of the file (start and end date are dynamically appended)
- **Course Code** in event name `(eg: 10.016)`
- **Course Type** in event name `(eg: Lecture/Cohort Based Learning)`
- **Course Name Misspelling Fixes** `(For long course names that got cut off)`

# Bookmarklet (eh need to double check this ah)
You can add this script as a bookmark so you can run this script with a click of a button! 
With this, you no longer need to constantly open this repo and manually copy and paste.
1. Create a bookmark (usually Ctrl + D)
2. **Name** your bookmark (eg: `Timetable Extractor`)
3. Paste this under **URL**:
```
javascript:(function(){let code = document.createElement('script');code.src = 'https://cdn.jsdelivr.net/gh/butter9fe/SUTD-Timetable-Extractor@prompt-config/CalendarExtractor.js';code.onerror = () => alert('Script failed to load');document.body.appendChild(code);}())
```
4. Now, when you're at the `Printer Friendly Page` (step 3 under [How to Use](#how-to-use)), just click your bookmark to run the script

# Samples
![image](https://github.com/user-attachments/assets/51af2a5c-3ee8-412c-b779-dfd7748cb9cb)
<sup>Course Code & Course Type [Off]</sup>

![image](https://github.com/user-attachments/assets/cf2e49a4-58df-4b45-9b0c-2510fda11e53)
<sup>Course Code & Course Type [On]</sup>
