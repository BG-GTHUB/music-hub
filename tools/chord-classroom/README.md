# Chord Classroom Player

Puts chords and lyrics on the classroom screen and plays along with a backing track. Bill started it in ChatGPT and carried on with Claude in a Chat tab conversation ("Lyrics-to-audio sync tool"). These notes come from that chat's handover.

- `chord-converter.html`: the whole player in one file (HTML, CSS, JavaScript, no libraries, no network requests). The site publishes it at https://bg-gthub.github.io/music-hub/tools/chord-classroom/. It also works by double-clicking the file.
- `ios/`: an Xcode project (`ChordClassroom.xcodeproj`) that shows the same HTML in a `WKWebView`, so it runs as an iPad or iPhone app. `ChordClassroom/ContentView.swift` is the wrapper; the icon is in `Assets.xcassets`.

## Privacy and copyright

Songs, audio and lyric sync are saved only in the browser (or the app) on the device that saved them. Nothing is uploaded, so pasting a published song's chords is fine. Never commit a published song's lyrics or a commercial recording to this repo.

## Test status

- Chord detection, transposing and line grouping were tested in Node with sample songs. The script passes a syntax check.
- Not yet tried on a real device: audio, scrolling, saving (IndexedDB), tap-to-sync and the iOS build. The Swift has never been compiled.

## What it does

- **Convert:** paste an Ultimate Guitar style chord sheet (chord lines above lyric lines). Each chord is coloured by its root note. `[Verse]` style headings are grey.
- **Audio:** load a local audio file. Play/Pause, Restart, -10s, seek bar, time, tempo 60 to 100% (a drop-down).
- **Auto-scroll:** Start/Stop at a steady speed, optional "with audio" link. The speed buttons were removed in November 2026 because lyric sync now does the scrolling; a song saved with a speed still uses it.
- **Transpose:** +/- a semitone; Reset appears once the key is changed. Colours follow the new chord.
- **Font size** slider, **Fullscreen** (hidden where the device can't do it).
- **Saved songs:** saves the text, audio, lyric sync, key, tempo and font size.
- **Tap-to-sync:** play the song once and tap Space as each line starts. After that the current line is highlighted and scrolled into place, and clicking a line jumps the audio there. "Clear lyric sync" is in Song setup.
- **Keys:** Space play/pause (or scroll if no audio), S scroll, Left/Right 5 seconds, F fullscreen. While syncing: Space/Enter tap, Backspace undo, Esc finish.

## Decisions

- **Colours:** C red, D orange, E yellow, F green, G teal, A purple, B magenta, from the original version. A was lightened from `#6600ff` to `#8a4dff` so it reads on black; change it back in the `.a` CSS rule if wanted.
- **Storage:** `localStorage` key `song_<name>` holds the pasted text (the original format, so old saved songs still load). `songmeta_<name>` holds `{transpose, tempo, scroll, fontSize, sync}`. Audio is in IndexedDB (database `chordClassroom`, store `audio`, key = song name) because it is too big for `localStorage`.
- **Transpose** uses flats if the original song has more flat roots than sharp ones. Chords keep their column where they fit.
- **Scroll** uses `requestAnimationFrame`; 100% is 33 pixels a second.
- **Lyric sync:** tap-to-sync was chosen over automatic alignment (unreliable with a band, can't run in one file) and `.lrc` import (lines rarely match the chord sheet). A cue is a lyric line plus the chord line above it, or a chord-only line. Times are in audio time, so they hold at any tempo. The highlight runs 0.3 seconds early (`FOLLOW_LEAD`). A synced song doesn't start the speed scroll on Play.
- **iOS app:** loads the HTML with `loadHTMLString` and base URL `https://chord-classroom.invalid/` so saved songs persist; nothing is fetched. If saved songs or audio don't persist on the device, look here first (other route: `WKURLSchemeHandler`). A `WKUIDelegate` handles `confirm()`, otherwise Delete and Clear Sync silently do nothing. Audio plays with the silent switch on, and the screen stays awake.

## Getting audio from YouTube (Mac only)

The player can fetch a song's audio itself, using the same `yt-dlp` command Bill used to run in Terminal. A web page can't run `yt-dlp`, so a small helper (`helper/song-helper.js`) does it on the Mac:

1. The helper starts by itself when Bill logs in to the Mac (see "Starting at login" below). Without that, double-click `helper/Start song helper.command` and leave its window open.
2. In the player, open Song setup. A **Get audio** box appears while the helper is running.
3. Paste a YouTube link, or just type the song title (the top YouTube result is used), and press Get audio. If the box is empty, the Song name is used.
4. The audio loads into the player. Press Save Song to keep it with the song.

Every download is also kept in iCloud Drive, in **Chord Player Songs**, so it shows in the Files app on the iPad too.

- The helper listens only on this Mac (`127.0.0.1:8765`) and only answers the live site and the player opened as a file. It only accepts YouTube links or search text.
- Chrome may ask once whether the site can "access other apps and services on this device". Allow it.
- Needs `yt-dlp`, `ffmpeg` and `deno` (all installed with Homebrew). If downloads start failing, update yt-dlp: `brew upgrade yt-dlp`.
- On the iPad (and in the iPad app) the box never shows; use Load audio with a file from Chord Player Songs.
- Status: working. Bill's first real download (from a YouTube link) worked on 18 November 2026.

### Starting at login

`helper/com.musichub.songhelper.plist` is a macOS login item (a LaunchAgent). It starts the helper at login, in the background, and restarts it if it stops. macOS doesn't let login items read the Desktop, so it runs a **copy** of the helper kept in `~/Library/Application Support/Chord Player Song Helper/`. Its log is `~/Library/Logs/chord-song-helper.log`.

- **After changing `song-helper.js`**, copy it there again and restart the helper:
  `cp tools/chord-classroom/helper/song-helper.js tools/chord-classroom/helper/"Start song helper.command" ~/Library/Application\ Support/Chord\ Player\ Song\ Helper/ && launchctl kickstart -k gui/$(id -u)/com.musichub.songhelper`
- **To turn it off:** `launchctl bootout gui/$(id -u)/com.musichub.songhelper && rm ~/Library/LaunchAgents/com.musichub.songhelper.plist`
- **To turn it back on:** copy the plist to `~/Library/LaunchAgents/`, then `launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.musichub.songhelper.plist`

## Building the iPad or iPhone app

The Xcode project is ready in `ios/`. It uses `chord-converter.html` straight from this folder, so any change to the player goes into the app on the next build.

1. Open `ios/ChordClassroom.xcodeproj` in Xcode.
2. Plug in the iPad or iPhone and pick it at the top of the Xcode window.
3. The first time only: click the ChordClassroom project, then the target, then Signing & Capabilities, and pick your Apple ID under Team. If Xcode says the bundle identifier is taken, change `com.musichub.ChordClassroom` to something of your own.
4. Press Run (the ▶ button).

The app appears on the home screen as "Chord Player", with the seven chord colours as its icon. Builds with a free Apple ID stop working after 7 days. Audio must be an MP3 or M4A in the Files app (not Apple Music or Spotify). Songs saved in the browser don't carry into the app, and deleting the app deletes its songs.

## Code map (`chord-converter.html`)

- **Chord logic** (pure, above `// ---- UI ----`, testable in Node): `CHORD_RE`, `FILLER_RE`, `parseChord`, `isChordLine`, `shiftNote`, `renderChordLine`, `songPrefersFlats`, `buildSong`.
- **Display:** `convert`, `convertAndHide`, `changeTranspose`, `changeFontSize`, `toggleFullscreen`.
- **Scrolling:** `setScrollSpeed`, `scrollFrame`, `startScroll`, `stopScroll`, `toggleScroll`.
- **Lyric sync:** `hasSync`, `updateSyncInfo`, `scrollToLine`, `highlight`, `cueAt`, `updateFollow`, `followFrame`, `startSync`, `tapSync`, `rewindSyncTo`, `undoSync`, `finishSync`, `clearSync`, click handler on `#output`.
- **Audio:** `setAudio`, `clearAudio`, `setPlaybackSpeed`, `togglePlay`, `restartAudio`, `seekBy`.
- **Storage:** `openDatabase`, `audioStore`, `persistMeta`, `saveSong`, `openSong`, `deleteSong`, `loadSongs`.

## Still to do

- Try it in a browser and on an iPad; fix what the first real test shows.
- Pasting a new song over a synced one keeps the old sync times until Clear Sync or another song is loaded.
- No backup or export of saved songs between devices.
- No section looping, count-in or capo display.
