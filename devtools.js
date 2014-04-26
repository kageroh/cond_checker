var $ship_list = localStorage['ship_list'];
$ship_list = ($ship_list) ? JSON.parse($ship_list) : {};

chrome.devtools.network.onRequestFinished.addListener(function (request) {
	if (!/^http:\/\/[^\/]+\/kcsapi\/api_(?:get_member\/ship[23]|port\/port)$/.test(request.request.url)) return;

	var ship2 = /ship2$/.test(request.request.url);
	var ship3 = /ship3$/.test(request.request.url);
	var port  = /port$/ .test(request.request.url);

	if (ship3) {
		var params = request.request.postData.params;
		for (var i = 0, param; param = params[i]; i++) {
			if (param.name === 'api%5Fshipid') return;
		}
	}

	request.getContent(function (content) {
		if (!content) return;

		var req = [];
		var json = JSON.parse(content.replace(/^[^=]+=/, ''));
		var data_list = ship2 ? json.api_data               :
		                ship3 ? json.api_data.api_ship_data :
		                port  ? json.api_data.api_ship      : null;
		var deck_list = ship2 ? json.api_data_deck          :
		                ship3 ? json.api_data.api_deck_data :
		                port  ? json.api_data.api_deck_port : null;
		if (!data_list || !deck_list) return;

		var ship_list = {};
		for (var i = 0, data; data = data_list[i]; i++) {
			var ship = $ship_list[data.api_id];
			ship_list[data.api_id.toString(10)] = {
				p_cond: (ship) ? ship.c_cond : 49,
				c_cond: data.api_cond
			};
		}
		$ship_list = ship_list;
		localStorage['ship_list'] = JSON.stringify($ship_list);

		for (var i = 0, deck; deck = deck_list[i]; i++) {
			req.push(deck.api_name);
			var mission_end = deck.api_mission[2];
			if (mission_end > 0) {
				var d = new Date(mission_end);
				req.push(d.toLocaleString());
			}
			var id_list = deck.api_ship;
			for (var j = 0, id; id = id_list[j]; j++) {
				if (id === -1) break;
				var ship = $ship_list[id.toString(10)];
				var cond = ship.c_cond;
				var diff = cond - ship.p_cond;
				diff = ((diff > 0) ? '+' : '') + diff.toString(10);
				var kirakira = (cond >= 50) ? '* ' : '. ';
				req.push((j + 1).toString(10) + kirakira + cond.toString(10) + ' (' + diff + ')');
			}
		}
		req.push('TotalShips:' + Object.keys(ship_list).length);
		chrome.extension.sendRequest(req);
	});
});

chrome.devtools.network.onRequestFinished.addListener(function (request) {
	if (!/^http:\/\/[^\/]+\/kcsapi\/api_req_map\/(?:start|next)$/.test(request.request.url)) return;
	request.getContent(function (content) {
		if (!content) return;
		var json = JSON.parse(content.replace(/^[^=]+=/, ''));
		if (!json || !json.api_data.api_enemy) return;
		var enemy_id = json.api_data.api_enemy.api_enemy_id;
		chrome.extension.sendRequest(enemy_id);
	});
});

