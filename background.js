var $time_stamp;

chrome.webRequest.onCompleted.addListener(function (details) {
	$time_stamp = new Date(details.timeStamp);
}, {
	urls: [
		"http://*/kcsapi/api_get_member/ship2",
		"http://*/kcsapi/api_get_member/ship3",
		"http://*/kcsapi/api_port/port",
	],
	types: ["object"]
});

chrome.extension.onRequest.addListener(function (req) {
	chrome.windows.getCurrent(function (win) {
		chrome.tabs.getSelected(win.id, function (tab) {
			if (req instanceof Array) {
				req.unshift($time_stamp.toLocaleString());
			}
			chrome.tabs.sendMessage(tab.id, req);
		});
	});
});

