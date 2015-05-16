var $time_stamp = new Date();

chrome.webRequest.onCompleted.addListener(function (details) {
	$time_stamp = new Date(details.timeStamp);
}, {
	urls: [
		"http://*/kcsapi/api_get_member/ship2",
		"http://*/kcsapi/api_get_member/ship3",
		"http://*/kcsapi/*/battle",
		"http://*/kcsapi/*/sp_midnight",
		"http://*/kcsapi/*/night_to_day",
		"http://*/kcsapi/*/midnight_battle",
		"http://*/kcsapi/api_port/port"
	]
});

chrome.extension.onRequest.addListener(function (req) {
	chrome.tabs.query({url:'http://www.dmm.com/netgame/social/-/gadgets/=/app_id=854854/'}, function (tab) {
		if (req instanceof Array) {
			req.unshift($time_stamp.toLocaleString());
		}
		chrome.tabs.sendMessage(tab[0].id, req);
	});
});

