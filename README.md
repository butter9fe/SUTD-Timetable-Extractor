# SUTD Timetable Extractor
Converts SUTD's MyPortal Weekly Schedule webpage to an `.ics` file that can be imported in various calendar apps like Outlook & Google calendar.
Feel free to reach out if you have any issues/ways to make this script better! :D

# How to Use:
1. Go to `My Portal > My Record > My Weekly Schedule`

2. Under `Select Display Option`, switch to List View
     - <img width="727" height="113" alt="image" src="https://github.com/user-attachments/assets/43b15e1b-5ec0-443c-9e62-bc663183392b" />

  
3. Scroll all the way to the bottom and click `Printer Friendly Page`
   - <img width="373" height="158" alt="image" src="https://github.com/user-attachments/assets/0010978f-d7ad-4bf6-807b-cd177b2fee9c" />

4. Copy the [CalendarExtractor.js](https://github.com/butter9fe/SUTD-Timetable-Extractor/blob/main/CalendarExtractor.js "`CalendarExtractor.js`") code (just click on the little Copy button next to Raw)

5. Check if your page formats dates as `month/day/year`. If so, paste the code into an IDE/notepad first and change `isMonthDayYearFormat` to `true`! Then copy it again.
   - Note that the formatting isn't the same as your browser's configuration! It's assigned under 'My Preferences', but the default state of this seems to be random :(

| <img width="537" height="132" alt="image" src="https://github.com/user-attachments/assets/ac01a975-a8f9-4bc3-8749-f72fe8a91398" /> 	| <img width="512" height="127" alt="image" src="https://github.com/user-attachments/assets/b400af68-0ff8-4922-a808-9c8477c9395a" /> 	|
|---	|---	|
| Month/Day/Year 	| Day/Month/Year 	|
<img width="1216" height="160" alt="image" src="https://github.com/user-attachments/assets/6c9dcfb6-f761-435b-9ce9-e9b7bba071ba" />

6. Press `Ctrl + Shift + J (Windows)`/`Cmd + Options + J (Mac)`, go to the Console tab, paste in your code, and press `Enter`

7. After it's done, the `.ics` file would be downloaded and you can import it to your calendar app!

# Customizations
At the top of the file, you can modify the following to tweak the events to your liking:
- **Name** of the file
- **Course Code** in event name `(eg: 10.016)`
- **Course Type** in event name `(eg: Lecture/Cohort Based Learning)`
- **Course Name Misspelling Fixes** `(For long course names that got cut off)`

# Samples
![image](https://github.com/user-attachments/assets/51af2a5c-3ee8-412c-b779-dfd7748cb9cb)
<sup>Course Code & Course Type [Off]</sup>

![image](https://github.com/user-attachments/assets/cf2e49a4-58df-4b45-9b0c-2510fda11e53)
<sup>Course Code & Course Type [On]</sup>
