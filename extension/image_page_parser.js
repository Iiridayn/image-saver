(function(exports) {
// TODO: should trigger site bookmarker if logged in and not bookmarked!
// TODO: source should be artist gallery link, _not_ artist homepage link! - IB done
// TODO: _also_ want artist's homepage(s)
// TODO: add new urls to sources for old urls
// TODO: track anti leaching sites
// TODO: map their rating where exists to a range of our ratings

/*
TODO: smugmug, flickr, imgur, tumblr, photobucket, facebook, pinterest, shutterstock, vcl, art-3000.com, instagram, behance.net, twitter, artstation.com, te2.tewi.us, paintberri.com, ello.co?, twitch(?), cgsociety, dribble.com(?), newgrounds (has art), patreon, https://www.furiffic.com/, http://www.epilogue.net/?, side7.com, https://fanart.lionking.org/, conceptart.org
TODO: test url set for all supported sites

https://fanart.lionking.org/picture/327009/TheLionessAndTheDragon.jpg - huh, jpg in url
https://ourartcorner.com/artwork/71311/OC-Halloween-Costumes-2018-Angeloe
https://ourartcorner.com/artwork/70178/Aerial-Tag
https://www.paigeeworld.com/post/5c49edbe5fed7df00f4f89ec/glorywof-featureme-shoutout-feedback-pwgallery-drawing-by-constelliarts
https://www.facebook.com/NewMastersAcademy/photos/a.453163394751170/2142302639170562/?type=3&eid=ARD9TPrM8y-mpB5tzfPC0422i-Z3tGVftwoehTZlWc-GQwkVn-q4TQHAMnDeFVznHk9_CgLE7lTKZ1_W&__xts__%5B0%5D=68.ARB0r2pgDp3jwRoF-YhpqJhp2euzbxIlC_tsQr_YLti6ZDZK-U_jYTzhBNTYy-aCnmGg3cZrP6JxyHY2llpbs5vpoKhm34cwWBW_EFvOsYu38jsSwWgWvqO5K16TfzaXnJZ0p3D7nrZCzx7axd7cI5vyqSLEZHIizPExrdXmQ5JKvXqCOk_vfqUfD18b155ksk8XqRvDth31mTOd5zaMaH5tnTxCDE8Wc9Dcnb8po7Zsx9GVnmLOGATelQuvbVnN-PqLxzo07mH5zThUM_t_9iYEcIiFJHjmw7Pp39lvH31C0gbnfpxujhbT2jhm390Jp7rjZT7EruTunVisWtIryRVivjpQGwzx_aYY5zS3qGJrNTKK39sZoApSrgeJhbp7Ks2dh5pj3tQ4pO_ONOkkeWWW8UhawzBQkEPZSYwpH14d28LLopPyN76JeJyJpN6HVVH0X4NivOLpgOC0PNQvor0Lfh1lSFeo3gIyXc77jDdumPWtS919Ow&__tn__=EEHH-R
*/

// TODO: plumb DA category for some tags
function handleDA({ qs, qsa }) {
	if (qs('#filter-warning.antisocial'))
		return 'login';

	const data = {};

	const download = qs('a.dev-page-download');
	if (download)
		data.download = download.href;
	else
		data.download = qs('.dev-content-full').src;

	const artist = qs('.dev-title-container .author a.username');
	if (artist) {
		data.sources = [ artist.href ];
		data.artist = artist.innerText;
	}

	data.title = qs('.dev-title-container h1 a').innerText;
	data.desc = qs('.dev-description').innerText;

	data.tags = [...qsa('.dev-about-tags-cc .discoverytag')]
		.map(a => a.dataset.canonicalTag);

	return data;
}

function handleFA({ qs, qsa }) {
	if (qs('p.link-override'))
		return 'login';

	const data = {};

	data.download = 'https:' + qs('#submissionImg').dataset.fullviewSrc;

	const artist = qs('#page-submission table table table tr:first-child a');
	// TODO: make sure both full view and normal view link are in the list
	data.sources = [ artist.href ];

	data.artist = artist.innerText;
	data.title = qs('#page-submission th.cat').innerText;
	// GAHHH I HATE YOU TABLE USER! table table table!
	data.desc = qs('#page-submission table table table tr + tr td').innerText.trim();

	// stats - or, why it's even worth the bother "table table table" :P
	data.tags = [];

	const stats = qs('#page-submission .stats-container').innerText;

	const species = stats.match(/Species:(.*)/)[1].trim();
	if (species !== 'Unspecified / Any') {
		data.tags.push('species:' + species.toLowerCase().replace(/ /g, '_'));
	}

	const gender = stats.match(/Gender:(.*)/)[1].trim();
	if (gender !== 'Any') {
		data.tags.push(gender.toLowerCase().replace(/ /g, '_'));
	}

	const keywords = qsa('#keywords a');
	for (let i = 0, l = keywords.length; i < l; i++)
		data.tags.push(keywords[i].innerText.trim());

	// rating
	const rating = qs('#keywords ~ div img').alt;
	if (rating.match(/general/i))
		data.rating = 's';
	else if (rating.match(/mature/i))
		data.rating = 'q';
	else if (rating.match(/adult/i))
		data.rating = 'e';

	return data;
}

function handleSF({ qs, qsa }) {
	const data = {};

	//data.download = qs('#sfDownload').href - only if logged in, and force dls as {artist}-{title}
	data.download = qs('#sfContentImage a').href; // equivalent
	data.sources = [ qs('#sf-userinfo-outer').href ];

	data.artist = qs('#sf-userinfo-outer .sf-username').innerText;
	data.title = qs('#sfContentTitle').innerText;
	data.desc = qs('#sfContentBody').innerText;

	data.tags = [...qsa('#submission_tags .sf-tag')].map(a => a.innerText);

	return data;
}

function handleE9or6({ qs, qsa }) {
	const data = {};

	data.download = qs('.content h4 a:first-child').href;
	data.sources = [...qsa('.sourcelink-url a')].map(a => a.href);

	const artists = [...qsa('.tag-type-artist a + a')];
	data.artist = artists.map(a => a.innerText);

	const desc = qs('.collapse-container .collapse-body');
	if (desc)
		data.desc = desc.innerText;

	function tagToTag(prefix) {
		const prepend = prefix ? prefix + ':' : '';
		return a => prepend + a.innerText.replace(/ /g, '_');
	}
	data.tags = [].concat(
		artists.map(tagToTag('artist')),
		[...qsa('.tag-type-character a + a')].map(tagToTag('character')),
		[...qsa('.tag-type-species a + a')].map(tagToTag('species')),
		[...qsa('.tag-type-general a + a')].map(tagToTag()),
	);

	return data;
}

function handleDerpi({ qs, qsa }) {
	const data = {};

	// sigh.
	data.download = 'https:' + qs(
		'#content .stretched-mobile-links + .stretched-mobile-links + ' +
		'.stretched-mobile-links + .stretched-mobile-links a + a'
	).href;
	data.sources = [ qs('#content .js-source-link').href ];

	data.desc = qs('.image-description blockquote').innerText;

	const tags = [...qsa('.tag-list > span.tag')];
	data.tags = tags.map(tag => {
		switch (tag.dataset.tagCategory) {
			case 'origin':
				if (!data.artist)
					data.artist = [];
				data.artist.push(tag.dataset.tagName.split(':')[1]);
				return tag.dataset.tagName;
			case 'rating':
				// TODO: map these
				data.rating = tag.dataset.tagName
				return;
			case 'charater':
				return 'charater:' + tag.dataset.tagName.replace(/ /g, '_');
			default:
				return tag.dataset.tagName.replace(/ /g, '_');
		}
	});

	return data;
}

function handlePixiv({ qs, qsa }) {
	const data = {};

	const artist = qs('.titlearea .userdata .name a');
	if (artist) {
		// doesn't give best resolution unless logged in :/
		data.download = qs('.img-container img').src; // not logged in

		data.sources = [ 'https://www.pixiv.net/' + artist.href ];

		data.artist = artist.innerText;
		data.title = qs('.titlearea .userdata h1.title').innerText;

		const id = qs('.cool-work-main .caption_read_more').dataset.id;
		// Starts with a number, behaves weird, simplest common solution
		data.desc = qs('[id="' + id + '_caption_long"]').innerText;

		data.tags = [...qsa('.tags-container .tag a:first-child')]
			.map(a => a.innerText);
	} else {
		// we're logged in - page is extremely different
		data.download = qs('figure [role=presentation] [role=presentation] a').href;
		data.sources = [ 'https://www.pixiv.net' + qs('aside section h2 > div > a:first-child').href ];

		data.artist = qs('aside section h2 > div > div > a:first-child').innerText;
		data.title = qs('figure figcaption h1').innerText;
		data.desc = qs('figure figcaption p#expandable-paragraph-2').innerText;

		// TODO: tag translations - except they might claim we're stealing their db…
		data.tags = [...qsa('figure figcaption footer li + [class] span:first-child a')]
			.map(a => a.innerText);
	}

	return data;
}

function handleIB({ qs, qsa }) {
	const data = {};

	data.download = qs('#magicbox').parentElement.href;

	data.sources = [ 'https://inkbunny.net' + qs('.magicboxParent + div .content table tr td + td a').href ];

	data.artist = qs('.magicboxParent + div .content table tr td:first-child a + a').innerText;
	data.title = qs('#pictop tr td + td table tr + tr td').innerText;
	data.desc = qs('.magicboxParent + div + div + div + div .content > div:first-child > span').innerText;

	data.tags = [...qsa('#kw_scroll + div a span')].map(s => s.innerText);

	return data;
}

function handleWeasyl({ qs, qsa }) {
	const data = {};

	data.download = qs('#detail-art a').href;

	const artist = qs('#detail-title .username');
	data.sources = [ 'https://www.weasyl.com' + artist.href ];

	data.artist = artist.innerText;
	data.title = qs('#detail-title').childNodes[0].textContent.trim();
	data.desc = qs('#detail-description .formatted-content').innerText;

	data.tags = [...qsa('#detail-info .di-tags .tags a')].map(a => a.innerText.trim());

	// TODO: map ratings
	data.rating = qs('#detail-info #di-info dl dd ~ dd ~ dd ~ dd').innerText;

	return data;
}

function handleFNru({ qs, qsa }) {
	const data = {};

	data.download = qs('.b_mainpane_container > div:first-of-type a').href;
	data.sources = [ qs('.jbutton + .jbutton a').href ];

	data.artist = qs('.b_header_container .b_mainpane_header_subtitle').innerText.split(': ')[1];
	data.title = qs('.b_header_container .b_mainpane_header_title').innerText;
	// site doesn't appear to support descriptions, tags, or ratings (at all :/ )

	return data;
}

function handleTLK({ qs, qsa }) {
	const data = {};

	data.download = qs('#thepicture').src;

	const artist = qs('.artistname a');
	data.sources = [ artist.href ];

	data.artist = artist.innerText;
	data.title = qs('.picture.standalone > a:first-child').innerText;
	data.desc = qs('.picturecaption').innerText;

	return data;
}

// Doesn't work as well on the server since img doesn't always declare dimensions
// doesn't work for http://skittledeediddle.tumblr.com/image/19234061487 - picture tag instead of img.src
function justFindTheBiggestImg({ qs, qsa }) {
	const biggest = [...document.querySelectorAll('img')]
		.map(i => [i, i.width * i.height])
		.sort((a, b) => b[1] - a[1])[0][0];
	return {
		download: biggest.src,
		sources: [ biggest.src ],
		title: img.title || img.alt || document.title,
	};
}

const siteMap = new Map([
	[/.deviantart.com/i, handleDA],
	[/.furaffinity.net/i, handleFA],
	[/.sofurry.com/i, handleSF],
	[/(?<!\.)e926.net|e621.net/i, handleE9or6],
	[/derpibooru.org/i, handleDerpi],
	[/pixiv.net/i, handlePixiv],
	[/inkbunny.net/i, handleIB],
	[/weasyl.com/i, handleWeasyl],
	[/.furnation.ru/i, handleFNru],
	[/fanart.lionking.org/i, handleTLK],
])

// for browsers, qs = document.querySelector, qsa = document.querySelectorAll
exports.parse = function(url, qs, qsa) {
	for (const [k, v] of siteMap) {
		if (url.match(k)) {
			return v({ url, qs, qsa });
		}
	}
	//return justFindTheBiggestImg({ url, qs, qsa });
}
})(typeof exports === 'undefined' ? this['imagesaverext']={} : exports);
