Let's make a few changes and fixes
- There's a test that's failing ('should show Start button initially'); review it and make the necessary fix
- In terms of the UI, the tabs should take up all the available space in their container
- Add milliseconds to the timer and stopwatch
- Create a Readme.md file for the project following software engineering standards, but give it a casual touch and use emojis.
- When manually entering time into the stopwatch, you must validate that it does not contain characters, is not empty, and is not negative, as well as ensuring it is consistent with the time displayed (also add tests to cover these cases):
 - If it’s seconds and minutes, it must be a number between 0 and 59
 - If it’s hours, it must be a number between 0 and 23
- The label must be HH MM and SS in the stopwatch
- In the “Time up!” popup, replace the “Dismiss” label with “Ok!”
Mobile UI
- You must leave a reasonable amount of space on all sides of the screen
- Elements must always appear centered on the screen
- On the stopwatch, the circle that wraps around the seconds must completely encircle the number