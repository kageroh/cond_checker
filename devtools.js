chrome.devtools.network.onRequestFinished.addListener(function (request) {
	if (!/http:\/\/[^\/]+\/kcsapi\/api_get_member\/ship2/.test(request.request.url)) return;
	console.log(new Date());
	request.getContent(function (content, encoding) {
		var json = JSON.parse(content.replace(/^[^=]+=/, ''));
		var data_list = json.api_data;
		var deck_list = json.api_data_deck;
		for (var i = 0, deck; deck = deck_list[i]; i++) {
			console.log(deck.api_name);
			var ship_list = deck.api_ship;
			for (var j = 0, ship; ship = ship_list[j]; j++) {
				for (var k = 0, data; data = data_list[k]; k++) {
					if (data.api_id === ship) console.log(j + 1, data.api_cond);
				}
			}
		}
	});
});

