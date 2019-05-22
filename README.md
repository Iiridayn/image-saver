Basically a lightweight personal booru, with a strong emphasis on intelligent source detection and correlation.

Client (browser extension) - API Server (go or Java) personal image bookmarker w/tags. Also should probably have a built in HTTP website server on the API server. Go chosen as 1) designed for writing servers, 2) cross platform (esp windows), and 3) reasonably small binary distribution size. The same thing runs on the user's desktop as on beefy remote backup and aggregation/search/sharing servers.

[Design docs](DESIGN.md).

Can backup/retrieve db on remote server w/un/pw.

Might expand to include other media (ie, videos, music playlists by tag search, etc). Give me unlimited time. :P. The media page would be similar (hero media, comments, tags, search box, header/footer, and related content), but the index/search results pages would be fairly different. Further, video and music would need to work w/`youtube-dl` in some cases (for streaming audio), which is another dependency to manage, either for us or the user. Finally, text - articles and stories. _Most_ don't need custom formatting… - see https://www.fimfiction.net/story/182859/14/its-a-dangerous-business-going-out-your-door/chapter-14 for an exception. Song lyrics (ie, filk) are another odd one - sometimes have audio, typically lyrics, very occasionally sheet music - how to express a work's transformations? Ah, child works.

TODO: user/pw authentication

Handle URL normalization - ie, archive.org https://web.archive.org/web/20160428205039/http://cadie.googlecode.com:80/svn/trunk/INTERCAL-style-guide.html
