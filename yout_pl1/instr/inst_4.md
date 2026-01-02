## Check: JS paths in yout_pl1.html

In `yout_pl1.html` the page loads these local JS files:

```html
<script src="./yout_pl1/yu1_global_var.js"></script>
<script src="./yout_pl1/youtube_transcript_store.js"></script>
<script src="./yout_pl1/youtube_ref_videos_store.js"></script>
```

Status: OK
- The folder `./yout_pl1/` exists and contains the store modules.
- The modules inside `./yout_pl1/` are already configured to use Firebase paths under `../db_youtube1/...`.

Important note

- If you keep store modules only in `./yout_pl1/`, then edits must be made there for the YouTube page.