var $time_stamp;

chrome.webRequest.onCompleted.addListener(function (details) {
	$time_stamp = new Date(details.timeStamp);
}, {
	urls: ["http://*/kcsapi/api_get_member/ship2"],
	types: ["object"]
});

chrome.extension.onRequest.addListener(function (req) {
	chrome.windows.getCurrent(function (win) {
		chrome.tabs.getSelected(win.id, function (tab) {
			if (req instanceof Array) {
				req.unshift([
					('0' + $time_stamp.getHours()).slice(-2),
					('0' + $time_stamp.getMinutes()).slice(-2),
					('0' + $time_stamp.getSeconds()).slice(-2)
				].join(':'));
			}
			chrome.tabs.sendMessage(tab.id, req);
		});
	});
});

