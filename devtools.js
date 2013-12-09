var $ship_list = localStorage['ship_list']
$ship_list = ($ship_list) ? JSON.parse($ship_list) : {};

chrome.devtools.network.onRequestFinished.addListener(function (request) {
	if (!/^http:\/\/[^\/]+\/kcsapi\/api_get_member\/ship[23]$/.test(request.request.url)) return;
	var ship2 = /ship2$/.test(request.request.url);
	var ship3 = /ship3$/.test(request.request.url);
	request.getContent(function (content) {
		if (!content) return;

		var req = [];
		var json = JSON.parse(content.replace(/^[^=]+=/, ''));
		var data_list = ship2 ? json.api_data      : ship3 ? json.api_data.api_ship_data : null;
		var deck_list = ship2 ? json.api_data_deck : ship3 ? json.api_data.api_deck_data : null;
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
			var mission_info = deck.api_mission;
			if(mission_info[2]) {
				var rest_time = new Date(mission_info[2] - (new Date).getTime());
				req.push('遠征中 あと ' + rest_time.getHours() + ':' + rest_time.getMinutes() + ':' + rest_time.getSeconds());
			}
			var id_list = deck.api_ship;
			for (var j = 0, id; id = id_list[j]; j++) {
				if (id === -1) break;
				var ship = $ship_list[id.toString(10)];
				var cond = ship.c_cond;
				var diff = cond - ship.p_cond;
				diff = ((diff > 0) ? '+' : '') + diff.toString(10);
				req.push((j + 1).toString(10) + '. ' + cond.toString(10) + ' (' + diff + ')');
			}
		}
		chrome.extension.sendRequest(req);
	});
});

chrome.devtools.network.onRequestFinished.addListener(function (request) {
	if (!/^http:\/\/[^\/]+\/kcsapi\/api_req_map\/(?:start|next)$/.test(request.request.url)) return;
	request.getContent(function (content) {
		if (!content) return;
		var json = JSON.parse(content.replace(/^[^=]+=/, ''));
		if (!json) return;
		if (json.api_data.api_enemy) {
			var enemy_id = json.api_data.api_enemy.api_enemy_id;
			chrome.extension.sendRequest(enemy_id);
		} else if(json.api_data.api_itemget) {
			var item_type_id = json.api_data.api_itemget.api_id;
			var item_amount = json.api_data.api_itemget.api_getcount;
			chrome.extension.sendRequest({
				item_type: item_type_id,
				item_amount: item_amount
			});
		}
	});
});

