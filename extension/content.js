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

		return image.title || image.alt || document.title;

		// just grab the filename portion of the url, excluding extension
		//return image.src.match(/\/([^\/]+)\.[^.]+$/)[1];
	}

	const imagePageParser = imagesaverext;

	const url = document.URL;
	const data = imagePageParser.parse(url,
		document.querySelector.bind(document),
		document.querySelectorAll.bind(document)
	);
	console.log('data', data);

	// prefer user selection
	// TODO: Broken atm
	if (window.getSelection().toString())
		data.desc = window.getSelection().toString().trim();

	chrome.runtime.onMessage.addListener(function(request, sender, callback) {
		// Fall back to the largest image on the page - unless we have a context menu image
		let image;
		if (!('download' in data) && !(request && request.src)) {
			image = getCandidateImage();
			if (image)
				data.download = image.src;
		}
		if (!('title' in data) && image)
			data.title = guessAtTitle(image);

		if (request) {
			// Add current page to sources, unless sources disabled
			if (!('sources' in data))
				data.sources = [];
			if ('sources' in data)
				data.sources.unshift(url);

			// use context menu image as a better fallback than the largest on page
			// since it's potentially an href to the image file, and not on page
			if (!('download' in data) && request.src) {
				data.download = request.src;
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
