TODO: proper blob upload - w/XHR support
TODO: modular scripts w/regex key matching; document types (no `if` chains)

TODO: server to receive this; put it on localhost (configure endpoint) for now, with FS permissions. Use node; also JS, and familiar

TODO: allow setting the default content rating
TODO: content rating for blood/gore as well, as DA has... though _almost_ never used for that... - maybe "squeamishness"? Ie, pimple popping videos :P.

TODO: add note crediting icon from feathericons.com in repository
TODO: check if file already downloaded locally - search?

TODO: config screen - set server. On server, maybe use file:///... urls for display?? Default to that w/a fallback to leeching, then to linking?

TODO: site support: should have a flag for sites which have a general content warning to prevent deep-linking bypassing that.

/**
 * FIXME: generic handler needs to be able to change which image, for subsequent calls!!
 *
 * TODO: support sites:
 * generic
 *  - http://www.featherdust.com/fantasy/amomentaryperch.html - Web Album Creator @ http://www.ornj.net/
 *  - http://www.dreslough.com/main/dimar/thumbgal1.htm - custom, tables
 * vcl (generic works?)
 *  - http://us.vclart.net/vcl/Artists/Frisket17/index01-by-date.html
 * yerf
 *  - http://yerf.metafur.org/gilemega
 *
 * tumblr
 * pixiv
 * unicorn.wereanimal.net
 * - http://unicorn.wereanimal.net/Kandor/Artists/B/Black_UniGryphon/BW/001_010/Page001.htm
 *
 * elfwood
 * - http://www.elfwood.com/u/andersson2/image/366e0f20-2710-11e4-9ecf-d547aae57bd2/fly-fairy-working-hazard
 * deviantart - no api for data from id - needs UUID, not on page.
 *  - http://zombiesaurian.deviantart.com/art/The-Rite-of-Spring-422758382
 *  - http://franz-josef73.deviantart.com/art/Morrison-mayhem-Allosaurus-and-Stegosaurus-405550719
 * furaffinity
 *  - https://www.furaffinity.net/view/19900971/
 * inkbunny - API requires un/pw; or guest which may have less permissions than the user. Easier to just scrape
 * - https://inkbunny.net/submissionview.php?id=1058021
 * - https://inkbunny.net/submissionview.php?id=1015048
 *
 * API?
 * sofurry
 * Weasyl
 * derpibooru
 */
