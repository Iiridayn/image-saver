chrome.contextMenus.create({
	title: "Download/share image",
	contexts: ['link', 'image', 'selection'], // TODO: selection; put more thought in
	onclick(info, tab) {
		const msg = {};
		if (info.linkUrl)
			msg.src = info.linkUrl;
		else if (info.srcUrl)
			msg.src = info.srcUrl;

		/*
		// I don't actually use this, the content script picks up on the selection
		if (info.selectionText)
			msg.desc = info.selectionText;
			*/

		chrome.tabs.executeScript({ file: 'content.js' }, function() {
			chrome.tabs.create({
				url: '/popup.html',
			}, function() {
				chrome.tabs.sendMessage(tab.id, msg, function() {});
			});
		});
	},
});
