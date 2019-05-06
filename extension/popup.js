function fillPopup(data) {
	if (data.download) {
		document.getElementById('url').value = data.download;

		if (data.xhr) {
			const ajax = new XMLHttpRequest();
			ajax.open('HEAD', data.xhr, true);
			ajax.onreadystatechange = function() {
				if (ajax.readyState !== 4)
					return;
				document.getElementById('url').value = ajax.responseURL;
				document.getElementById('sources').value += ajax.responseURL + "\n";
			};
			ajax.send();
		}
	}

	if (data.tags)
		document.getElementById('tags').value = data.tags.join();
	if (data.artist)
		document.getElementById('tags').value = 'artist:' + data.artist.replace(" ", "_") + ' ' +
			document.getElementById('tags').value;

	if (data.sources)
		document.getElementById('sources').value += data.sources.join("\n") + "\n";

	if (data.title)
		document.getElementById('title').value = data.title.trim();

	if (data.desc)
		document.getElementById('desc').value = data.desc.trim();

	if (data.rating)
		document.getElementById('rating_' + data.rating).checked = true;
}

document.addEventListener('DOMContentLoaded', function() {
	// request means I'm running in a tab, not a popup
	chrome.runtime.onMessage.addListener(function(request/*, sender, callback*/) {
		if (request.download) {
			//document.getElementById('sample').src = request.download;
			// the src site (CDN) _must_ be in the permissions manifest!
			// TODO: use this BLOB to upload - also from popup; unify code
			// TODO: work with the XHR link too
			fetch(request.download).then(response => response.blob()).then(file => {
				const img = document.getElementById('sample');
				img.src = URL.createObjectURL(file);
				img.onload = function() { URL.revokeObjectURL(this.download); };
			}).catch(console.error);
		}
		fillPopup(request);
	});

	chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
		if (!tabs[0].url)
			return; // I'm running in a tab, not a popup

		document.getElementById('sources').value += tabs[0].url + "\n";

		chrome.tabs.executeScript({ file: 'image_page_parser.js' }, function () {
			chrome.tabs.executeScript({ file: 'content.js' }, function() {
				chrome.tabs.sendMessage(tabs[0].id, '', function(response) {
					if (!response)
						return console.warn("No response from content script!");
					fillPopup(response);
				});
			});
		});
	});

	document.getElementById('uploader').addEventListener('submit', function(event) {
		event.preventDefault();
		const url = document.getElementById('url').value;
		const parts = new URL(url);
		chrome.downloads.download({
			url, filename: parts.hostname + parts.pathname,
			// note - if user has "Ask where to save each file before downloading" on, they still get a prompt
			saveAs: false, conflictAction: 'prompt',
		});
	});
});
