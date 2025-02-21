# youtube-playlist-exporter

This is a JavaScriptlet which allows you to download any youtube playlist as a text file.

It first existed as script to be run inside of TamperMonkey which was then broken when a recent Chrome update changed how third party scripts could run (or not run).

Currently, it must be copy pasted into your browser console in order to run.

# Version History

### 0.12
- Results are now downloaded as a text file.

### 0.11
- Encapsulate function into a dedicated object.
- Will now detect when there are unavailable videos and prompt user to unhide them. It will then run again automatically and compares the differences which includes videos that are unavailable but don't appear as "[Deleted video]" or "[Private video]".

### 0.10
- Add count of videos to output; Ignore recommended section of playlists.

### 0.9
- Added checkboxes for copy/pasting into dropbox paper
