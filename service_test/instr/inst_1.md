## Can we create an HTML page with a YouTube video + our own custom buttons + transcription?

Yes — it’s possible, but there are 2 different approaches.

---

## Option A (YouTube inside your page): YouTube IFrame Player API
Use the official YouTube IFrame Player API to embed the video and control it from JavaScript.

What you can do:
- Custom buttons: Play / Pause / Seek forward/back / Volume / Playback speed
- Track current time (poll `getCurrentTime()` or use events)
- Show your own “transcription” panel (text you already have)
- Highlight the current phrase by comparing current time to your transcript timestamps

Important limitations:
- YouTube does not directly give you a complete transcript from the player API.
	- If you need transcription, you must already have it (SRT/VTT/JSON), or get it from an external service.
- Some videos cannot be embedded (owner restrictions).

Typical structure:
- HTML: a `<div id="player"></div>` + your buttons + transcript panel
- JS:
	- Load `https://www.youtube.com/iframe_api`
	- Create `new YT.Player(...)`
	- Bind your button clicks to `player.playVideo()`, `player.pauseVideo()`, `player.seekTo(...)`

---

## YouTube-only implementation for this video
Video URL:
- https://youtu.be/maKy1pRdcDw?si=gT4k5AcX2vBz-VZY

VideoId (needed for the API):
- `maKy1pRdcDw`

### 1) Minimal HTML page (custom buttons)
Create a page like `youtube_player.html` (or add to any existing HTML) and include:

```html
<!doctype html>
<html lang="en">
<head>
	<meta charset="utf-8" />
	<meta name="viewport" content="width=device-width, initial-scale=1" />
	<title>YouTube Player Test</title>
	<style>
		.row { display:flex; gap:10px; flex-wrap:wrap; margin:12px 0; }
		button { padding:10px 12px; min-height:44px; }
		#playerWrap { max-width: 960px; }
		#player { aspect-ratio: 16 / 9; width: 100%; }
	</style>
</head>
<body>
	<h1>YouTube Player</h1>

	<div id="playerWrap">
		<div id="player"></div>
	</div>

	<div class="row">
		<button id="btnPlay">Play</button>
		<button id="btnPause">Pause</button>
		<button id="btnBack">-5s</button>
		<button id="btnFwd">+5s</button>
	</div>

	<div>Time: <span id="t">0.00</span>s</div>

	<script>
		// 1) Load YouTube IFrame API
		const tag = document.createElement('script');
		tag.src = 'https://www.youtube.com/iframe_api';
		document.head.appendChild(tag);

		const VIDEO_ID = 'maKy1pRdcDw';
		let player = null;

		// 2) YouTube calls this global when API is ready
		window.onYouTubeIframeAPIReady = function () {
			player = new YT.Player('player', {
				videoId: VIDEO_ID,
				playerVars: {
					rel: 0,
					modestbranding: 1
				},
				events: {
					onReady: () => {
						// wire buttons
						document.getElementById('btnPlay').onclick = () => player.playVideo();
						document.getElementById('btnPause').onclick = () => player.pauseVideo();
						document.getElementById('btnBack').onclick = () => player.seekTo(Math.max(0, player.getCurrentTime() - 5), true);
						document.getElementById('btnFwd').onclick = () => player.seekTo(player.getCurrentTime() + 5, true);

						// update time UI
						setInterval(() => {
							try {
								document.getElementById('t').textContent = player.getCurrentTime().toFixed(2);
							} catch {}
						}, 250);
					}
				}
			});
		};
	</script>
</body>
</html>
```

Notes:
- This gives you full custom Play/Pause/Seek buttons.
- You can add your own transcription panel (text area or list) and highlight based on `player.getCurrentTime()`.

---

## “Connect to my account” — what it means for YouTube
There are two cases:

### Case 1: Just play public YouTube videos
No account connection is required. The IFrame player works without OAuth.
The user can still be logged into YouTube in the iframe (YouTube handles that login itself).

### Case 2: Access your account data (private videos, playlists, subscriptions)
For this you must use **YouTube Data API v3** + **OAuth 2.0**.

High-level steps:
1) Create a Google Cloud project
2) Enable **YouTube Data API v3**
3) Create **OAuth Client ID** (Web application)
4) Configure:
	 - Authorized JavaScript origins (your site)
		 - Local dev: `http://127.0.0.1:8080`
		 - GitHub Pages: `https://nirsukrnet.github.io`
	 - Authorized redirect URIs (a page in your site that handles auth)
5) In the frontend, use Google Identity Services to request an access token, then call YouTube Data API endpoints

Important notes for static sites (GitHub Pages):
- Do NOT put any client secret into the frontend.
- If you need long-lived access (refresh tokens), you typically need a backend.

---

## Next step (choose what you want)
Tell me which “account connection” goal you need:
- (A) Only play a specific public video with custom buttons
- (B) Also list your playlists / load videos from your account

If you choose (B), I will write a concrete minimal OAuth + “list my playlists” example for this project.

---

## Page with transcription toggle + navigation (yout_pl1.html)
Created page:
- `yout_pl1.html`

What it includes:
- YouTube IFrame player for videoId `maKy1pRdcDw`
- Custom buttons: Play, Pause, -5s, +5s
- **Transcription** button that shows/hides the transcript panel
- Transcript navigation buttons: **Prev** / **Next**
- Click any transcript line to seek the video to that timestamp
- When transcript is visible, it auto-highlights the current line based on `player.getCurrentTime()`

How to run locally:
```powershell
cd C:\Python\AuTr\html
py -m http.server 8080 --bind 127.0.0.1
```
Open:
- `http://127.0.0.1:8080/yout_pl1.html`

How to edit transcript:
- In `yout_pl1.html` find the `const transcript = [...]` array and replace items with your real timestamps + text.

---

## Manual transcript paste (modal) + save to Firebase
`yout_pl1.html` includes a **Paste transcript** button.

### Paste format
Paste alternating timestamp + text lines like:
```text
0:01
[Music]
0:04
Hi everyone. Welcome back to High
0:06
English Channel. We're so happy you're
0:09
here again with us. I'm Emily
0:11
and I'm Paul.
```

Rules:
- Timestamp lines can be `m:ss`, `mm:ss`, or `h:mm:ss`.
- All text lines after a timestamp belong to that timestamp until the next timestamp.

### What happens when you click “Save to Firebase”
- The page parses the pasted text into items: `{ t: seconds, text }`.
- It stores them in Firebase for that **specific videoId**.

### Firebase integration (used in the page)
The page loads:
- `assets/js/global_var.js` (auth + request helper)
- `assets/js/youtube_transcript_store.js` (small helper for saving/loading the transcript)

Current storage path:
- `db_youtube1/youtube_transcripts/{videoId}`

Saved object shape:
```json
{
	"videoId": "maKy1pRdcDw",
	"source": "manual",
	"updatedAt": "2025-12-31T...Z",
	"items": [
		{ "t": 4, "text": "Hi everyone..." }
	],
	"rawText": "(your pasted text)"
}
```

