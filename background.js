chrome.webRequest.onCompleted.addListener(function (details) {
	console.log(details);
}, {
	urls: ["http://*/kcsapi/api_get_member/ship2"],
	types: ["object"]
});

