chrome.runtime.onMessage.addListener(function (req) {
	chrome.tabs.query({url:'http://www.dmm.com/netgame/social/-/gadgets/=/app_id=854854/'}, function (tab) {
		chrome.tabs.sendMessage(tab[0].id, req);
	});
});
