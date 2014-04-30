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
				var diff_str = (diff > 0) ? ' (+' + diff.toString(10) + ')' : // with plus sign
							   (diff < 0) ? ' ('  + diff.toString(10) + ')' : // with minus sign
							   /* diff==0 */ '';	// blank
				var kira_str = (cond >  49) ? '* ' : // kirakira
				               (cond == 49) ? '. ' : // normal
							   /* cond < 49 */ '> '; // recovering
				req.push((j + 1).toString(10) + kira_str + cond.toString(10) + diff_str);
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
		if (!json || !json.api_data) return;
		var d = json.api_data;
		var e = json.api_data.api_enemy;
		var g = json.api_data.api_itemget;
		var area = d.api_maparea_id + '-' + d.api_mapinfo_no + '-' + d.api_no;
		if (e) {
			var msg = e.api_enemy_id.toString(10);
			if (d.api_event_id == 5) msg += '(boss)';
			chrome.extension.sendRequest('next enemy\n' + area + ': ' + msg);
		}
		if (g) {
			var msg;
			switch (g.api_id) {
				case 1: msg = '1(fuel)='; break;
				case 2: msg = '2(ammo)='; break;
				case 3: msg = '3(steel)='; break;
				case 4: msg = '4(bauxite)='; break;
				case 5: msg = '5(burner)='; break;
				case 6: msg = '6(bucket)='; break;
				case 7: msg = '7(develop)='; break;
				case 10: msg = '10(coinbox-S)='; break;
				case 11: msg = '11(coinbox-M)='; break;
				case 12: msg = '12(coinbox-L)='; break;
				default: msg = g.api_id + '(???)='; break; // coin?? ...
			}
			msg += g.api_getcount;
			chrome.extension.sendRequest('next item\n' + area + ': ' + msg);
		}
	});
});

chrome.devtools.network.onRequestFinished.addListener(function (request) {
	if (!/^http:\/\/[^\/]+\/kcsapi\/api_req_sortie\/battleresult$/.test(request.request.url)) return;
	request.getContent(function (content) {
		if (!content) return;
		var json = JSON.parse(content.replace(/^[^=]+=/, ''));
		if (!json || !json.api_data) return;
		var d = json.api_data;
		var e = json.api_data.api_enemy_info;
		var g = json.api_data.api_get_ship;
		var msg = d.api_win_rank + ':';
		if (e) {
			msg += e.api_deck_name;
			if (d.api_ship_id) {
				var total = d.api_ship_id.reduce(function(count, x) { return count + (x != -1); }, 0);
				msg += '(' + d.api_dests + '/' + total + ')';
			}
		}
		if (g) {
			msg += '\n\ndrop ship\n';
			msg += g.api_ship_type + ':' + g.api_ship_name;
		}
		chrome.extension.sendRequest('battle result\n' + msg);
	});
});
