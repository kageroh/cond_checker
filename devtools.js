var $ship_list = localStorage['ship_list']
$ship_list = ($ship_list) ? JSON.parse($ship_list) : {};

chrome.devtools.network.onRequestFinished.addListener(function (request) {
	if (!/^http:\/\/[^\/]+\/kcsapi\/api_get_member\/ship2$/.test(request.request.url)) return;
	var date = new Date();
	var req = [];
	request.getContent(function (content) {
		var json = JSON.parse(content.replace(/^[^=]+=/, ''));
		var data_list = json.api_data;
		var deck_list = json.api_data_deck;

		for (var i = 0, data; data = data_list[i]; i++) {
			var ship = $ship_list[data.api_id];
			$ship_list[data.api_id.toString(10)] = {
				p_cond: (ship) ? ship.c_cond : 49,
				c_cond: data.api_cond
			};
		}
		localStorage['ship_list'] = JSON.stringify($ship_list);

		for (var i = 0, deck; deck = deck_list[i]; i++) {
			req.push(deck.api_name);
			var id_list = deck.api_ship;
			for (var j = 0, id; id = id_list[j]; j++) {
				if (id === -1) break;
				var ship = $ship_list[id.toString(10)];
				var cond = ship.c_cond;
				var diff = cond - ship.p_cond;
				diff = ((diff > 0) ? '+' : '') + diff.toString(10); 
				req.push((j + 1).toString(10) + ': ' + cond.toString(10) + ' (' + diff + ')');
			}
		}
		chrome.extension.sendRequest(req);
	});
});

