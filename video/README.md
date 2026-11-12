# How the demo film was made

The 2:41 demo film is a recording of the live site at https://imprimatur-delta.vercel.app. Nothing in it is mocked. This folder holds the scripts that produced it.

## The idea

A normal screen recording stutters whenever the page is slow, and its timing drifts from the narration. This film is built the other way round:

1. The narration is generated first, with the time of every spoken word.
2. Each scene is then captured **frame by frame** from the real page. For every frame the script sets the scroll position, the cursor and the spotlight, takes a real screenshot, and moves on. The result is smooth at 30 frames a second however long a screenshot takes.
3. Scene lengths and every on-screen move are derived from the word timings, so the picture follows the voice.

Real clicks are real: the exam in the film is an actual sitting started on the live site, and the cases that appear were graded while it was being recorded. That one scene plays faster than life, because a screenshot takes longer than a thirtieth of a second.

## Files

| File | What it does |
|---|---|
| `scenes.json` | The narration, one entry per scene |
| `voice.py` | Generates one clip per scene and the word timings, with a Microsoft neural voice through `edge-tts` |
| `durations.mjs` | Measures each clip |
| `cards.html` | The animated intro and outro cards, drawn per frame from a time value |
| `capture.mjs` | Drives Chrome through the site with Playwright and captures every frame. Holds the cursor, spotlight, click ripple and chapter labels |
| `compose.mjs` | Edits the scenes together with ffmpeg: cross fades and slides, timed captions, the voice track, loudness normalising. Also writes the transcript and the caption file |
| `sheet.mjs` | Tiles six frames of a scene into one image for a quick visual check |

## Run it

```bash
npm install
```

```bash
pip install edge-tts
```

```bash
python voice.py scenes.json audio
```

```bash
node durations.mjs
```

```bash
node capture.mjs
```

```bash
node compose.mjs
```

The film is written to `demo/imprimatur-demo.mp4`, with `demo/transcript.md` and `demo/imprimatur-demo.srt` beside it. `node capture.mjs s04-licence` re-records one scene.

Capture needs Google Chrome installed. The exam scene starts a real sitting, which uses a little SERV credit and counts toward the site's daily limit.

## Honest notes

- The voice is synthetic.
- The spotlight, cursor and chapter labels are an overlay drawn on top of the real page at capture time. They never change what the page shows.
- The film is 1920 by 1080 at 30 frames a second, H.264 with AAC audio.
