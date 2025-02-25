# youtube-playlist-exporter

Version: 0.14

This is a JavaScriptlet which allows you to download any youtube playlist as a text file.

It first existed as script to be run inside of TamperMonkey which was then broken when a recent Chrome update changed how third party scripts could run (or not run).

Currently, it must be copy pasted into your browser console in order to run.

# Features

- [ ] Export playlists as a text file
- [ ] Export playlist data as a JSON object file

## Planned features

- [ ] UI with options
- [ ] Able to be used with TamperMonkey
- [ ] Chrome Plugin

# Version History

### 0.15 (Planned)
- Make script work for playlists the user doesn't own
- Detect when run for the first time when there are unavailable videos and prompt for reload and re-run

### 0.14
- Playlist metadata is now collected and exported in the JSON export file. Metadata includes:
  - Playlist title and url
  - Author name and url
  - Count of videos (total, hidden, unavailable)
  - Visibility, type, description
- Code changes:
  - Page data is now stored in one location alongside metadata for simplicity so it doesn't have to be passed everywhere
  - Added test mode which prevents file downloading and just console logs the data that would be downloaded.
  - Reorganized method order and did code cleanup.
  - No longer need unavailable video indicies; just the count.

### 0.13
- Data is now stored in JSON format to allow for easier formatting. Formatting happens on export.
- 2 files are now downloaded:
  1. The JSON object file
  2. The markdown formatted file
- Now shows the channel name even for unavailable videos (but won't have a link to the channel)

### 0.12
- Results are now downloaded as a text file.

### 0.11
- Encapsulate function into a dedicated object.
- Will now detect when there are unavailable videos and prompt user to unhide them. It will then run again automatically and compares the differences which includes videos that are unavailable but don't appear as "[Deleted video]" or "[Private video]".

### 0.10
- Add count of videos to output; Ignore recommended section of playlists.

### 0.9
- Added checkboxes for copy/pasting into dropbox paper
