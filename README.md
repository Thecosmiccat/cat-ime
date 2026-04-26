# 🐾Cat-ime

#WARNING: none of the sources are working so please wait untill they come back online as I have no control over this.

A cat-themed anime streaming app — fully standalone, no backend, no build step. 

If you like this project, please consider giving this a star🌟!

Just go to: https://thecosmiccat.github.io/cat-ime/

## Features

- **Trending & Search** — pulls live data from the AniList GraphQL API including titles, episode counts, and banner artwork
- **Dual Player Support** — stream via Videasy or Vidnest with persistent source preference
- **Sub / Dub Toggle** — switch audio track per-session, preference saved across refreshes
- **Auto Next Episode** — automatically advances to the next episode when one finishes
- **Continue Watching** — resumes from where you left off using local storage
- **My List** — track anime with Watching, Paused, and Dropped statuses
- **Follow & Notifications** — follow shows and get notified when new episodes drop

## things used

- Vanilla HTML/CSS/JS — single file, zero dependencies
- [AniList GraphQL API](https://anilist.gitbook.io/anilist-apiv2-docs/) for anime metadata
- [Jikan API](https://jikan.moe/) for episode titles
- [Videasy](https://videasy.net/) and [Vidnest](https://vidnest.fun/) for streaming
