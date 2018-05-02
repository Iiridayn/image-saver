(function() {
	if (window.hasRun)
		return;
	window.hasRun = true;

	function imagesBySize() {
		return Array.prototype.slice.call(
			document.querySelectorAll('img'), 0
		).sort(function(a, b) {
			return b.width * b.height - a.width * a.height;
		});
	}
	// If the top two are within 10% of each other, probably not relevant
	function getCandidateImage() {
		const images = imagesBySize();
		if (images[0].width * images[0].height * 0.9 > images[1].width * images[1].height)
			return images[0];
	}

	function getImageFromSrc(src) {
		let node;
		node = document.querySelector('img[src="' + src + '"]');
		if (node) return node;
		node = document.querySelector('a[href="' + src + '"] img');
		if (node) return node;

		// check relative url too
		src = src.substring(src.indexOf('/', 8)); // safe enough; https:// to ftp://ab
		node = document.querySelector('img[src="' + src + '"]');
		if (node) return node;
		node = document.querySelector('a[href="' + src + '"] img');
		if (node) return node;
	}

	// TODO: clever enough to be irritating
	function guessAtTitle(image) {
		if (image.title)
			return image.title;

		const h1 = document.querySelector('h1');
		if (h1)
			return h1.innerText;

		if (image.alt)
			return image.alt;

		return document.title;

		// just grab the filename portion of the url, excluding extension
		//return image.src.match(/\/([^\/]+)\.[^.]+$/)[1];
	}

	const data = {
		desc: window.getSelection().toString().trim(),
	};

	const url = document.URL;
	if (url.match(/.deviantart.com/i)) {
		const download = document.querySelector('a.dev-page-download');
		if (download)
			data.xhr = download.href;

		data.title = document.querySelector('.dev-title-container h1 a').innerText;
		data.desc = document.querySelector('.dev-description').innerText;

		data.tags = [...document.querySelectorAll('.dev-about-tags-cc .discoverytag')]
			.map(a => a.dataset.canonicalTag);

		const artist = document.querySelector('.dev-title-container a.username');
		if (artist) {
			data.sources = [ artist.href ];
			data.artist = artist.innerText;
		}
	} else if (url.match(/.furaffinity.net/i)) {
		data.src = 'https:' + document.querySelector('#submissionImg').dataset.fullviewSrc;

		data.title = document.querySelector('#page-submission th.cat').innerText;
		// GAHHH I HATE YOU TABLE USER! table table table!
		data.desc = document.querySelector('#page-submission table table table tr:nth-child(2)').innerText.trim();

		const artist = document.querySelector('#page-submission table table table tr:nth-child(1) a');
		data.sources = [ artist.href ];
		data.artist = artist.innerText;

		// stats - or, why it's even worth the bother "table table table" :P
		data.tags = [];

		// species
		data.tags.push(document.querySelector(
			'#page-submission .stats-container b:nth-of-type(5)'
		).nextSibling.nodeValue.trim());
		// gender
		data.tags.push(document.querySelector(
			'#page-submission .stats-container b:nth-of-type(6)'
		).nextSibling.nodeValue.trim());

		const keywords = document.querySelectorAll('#keywords a');
		for (let i = 0, l = keywords.length; i < l; i++)
			data.tags.push(keywords[i].innerText.trim());

		// rating
		const rating = document.querySelector('#keywords ~ div img').alt;
		if (rating.match(/general/i))
			data.rating = 's';
		else if (rating.match(/mature/i))
			data.rating = 'q';
		else if (rating.match(/adult/i))
			data.rating = 'e';
	} else if (url.match(/.elfwood.com/i)) {
		// just use candidate image, accurate enough for now

		data.title = document.querySelector("h1").innerText;
		data.desc = document.querySelector("p.plot").innerText;

		const artist = document.querySelector("h2.artist a");
		if (artist) {
			data.sources = [ artist.href ];
			data.artist = artist.innerText;
		}
	} else if (url.match(/.inkbunny.net/i)) {
		console.log('TODO');
	} else if (url.match(/.sofurry.com/i)) {
		// TODO: broken
		// TODO: just scrape.
		/*
		const sofurryURI = 'https://api2.sofurry.com/std/getSubmissionDetails?id=';
		const ajax = new XMLHttpRequest();
		ajax.onload = function() {
			if (ajax.status < 200 || ajax.status >= 400)
				return console.error("Sofurry broke - please email me the page url");
			console.log(ajax);
			console.log(JSON.parse(ajax.responseText));
		};
		console.log("ajax", sofurryURI + url.match(/\/([^\/]+)$/)[1]);
		ajax.open('GET', sofurryURI + url.match(/\/([^\/]+)$/)[1], true);
		data.src = false;
		data.title = false;
		*/
	}

	chrome.runtime.onMessage.addListener(function(request, sender, callback) {
		// Fall back to the largest image on the page - unless we have a context menu image
		let image;
		if (!('src' in data) && !(request && request.src)) {
			image = getCandidateImage();
			if (image)
				data.src = image.src;
		}
		if (!('title' in data) && image)
			data.title = guessAtTitle(image);

		if (request) {
			// Add current page to sources, unless sources disabled
			if (!('sources' in data))
				data.sources = [];
			if ('sources' in data)
				data.sources.push(url);

			// use context menu image as a better fallback than the largest on page
			// since it's potentially an href to the image file, and not on page
			if (!('src' in data) && request.src) {
				data.src = request.src;
				const image = getImageFromSrc(request.src);
				if (!('title' in data) && image)
					data.title = guessAtTitle(image);
			}
			console.log("I'm running via context:", request);
			chrome.runtime.sendMessage(data, function() {});
		} else {
			console.log("I'm running via popup");
			callback(data);
		}
	});

	console.log('injected, ready');
})();
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
