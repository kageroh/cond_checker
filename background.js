chrome.extension.onRequest.addListener(function (req) {
	chrome.windows.getCurrent(function (win) {
		chrome.tabs.getSelected(win.id, function (tab) {
			chrome.tabs.sendMessage(tab.id, req);
		});
	});
});

