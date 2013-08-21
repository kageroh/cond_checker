chrome.devtools.network.onRequestFinished.addListener(function (request) {
	if (!/^http:\/\/[^\/]+\/kcsapi\/api_get_member\/ship2$/.test(request.request.url)) return;
	var date = new Date();
	var req = [];
	req.push(date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds());
	request.getContent(function (content) {
		var json = JSON.parse(content.replace(/^[^=]+=/, ''));
		var data_list = json.api_data;
		var deck_list = json.api_data_deck;
		for (var i = 0, deck; deck = deck_list[i]; i++) {
			req.push(deck.api_name);
			var ship_list = deck.api_ship;
			for (var j = 0, ship; ship = ship_list[j]; j++) {
				for (var k = 0, data; data = data_list[k]; k++) {
					if (data.api_id === ship) req.push((j + 1).toString(10) + ': ' + data.api_cond.toString(10));
				}
			}
		}
		chrome.extension.sendRequest(req);
	});
});

