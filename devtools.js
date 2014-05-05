// -*- coding: utf-8 -*-
var $ship_list = localStorage['ship_list'];
$ship_list = ($ship_list) ? JSON.parse($ship_list) : {};

var $mst_ship = localStorage['mst_ship'];
$mst_ship = ($mst_ship) ? JSON.parse($mst_ship) : {};

function item_name(id) {
	switch (id) {
		case 1: return '燃料';
		case 2: return '弾薬';
		case 3: return '鋼材';
		case 4: return 'ボーキ';
		case 5: return '建造材';
		case 6: return '修復材';
		case 7: return '開発資材';
		case 10: return '家具箱小';
		case 11: return '家具箱中';
		case 12: return '家具箱大';
		default: return 'id(' + id + ')';
	}
}

function ship_name(id) {
	var ship = $mst_ship[id];
	if (ship) {
		id = ship.api_name;
		if (ship.api_sortno == 0 && ship.api_yomi.length > 1) {
			id += ship.api_yomi; // 'elite', 'flag ship' ...
		}
	}
	return id.toString();
}

function hp_status(nowhp, maxhp) {
	if (nowhp < 0) nowhp = 0;
	var r = nowhp / maxhp;
	var msg = (r == 0) ? '撃沈---'
		: (r <= 0.25) ? '大破!!!'
		: (r <= 0.50) ? '中破'
		: (r <= 0.75) ? '小破'
		: (r <= 0.85) ? '..'	// 軽微2.
		: (r <  1.00) ? '.'		// 軽微1.
		: '*';					// 無傷.
	return nowhp + '/' + maxhp + ':' + msg;
}

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
			var msg = item_name(g.api_id) + 'x' + g.api_getcount;
			chrome.extension.sendRequest('next item\n' + area + ': ' + msg);
		}
	});
});

chrome.devtools.network.onRequestFinished.addListener(function (request) {
	if (!/^http:\/\/[^\/]+\/kcsapi\/api_req_(?:sortie\/battleresult|practice\/battle_result)$/.test(request.request.url)) return;
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

function calc_damage(hp, battle) {
	// hp ::= [-1, friend1...6, enemy1...6]
	if (!battle) return;
	if (battle.api_df_list && battle.api_damage) {
		var df = battle.api_df_list;
		for (var i = 1; i < df.length; ++i) {
			for (var j = 0; j < df[i].length; ++j) {
				var target = df[i][j];
				hp[target] -= Math.floor(battle.api_damage[i][j]);
			}
		}
	}
	if (battle.api_fdam) {
		for (var i = 1; i <= 6; ++i) {
			hp[i] -= Math.floor(battle.api_fdam[i]);
		}
	}
	if (battle.api_edam) {
		for (var i = 1; i <= 6; ++i) {
			hp[i+6] -= Math.floor(battle.api_edam[i]);
		}
	}
}

chrome.devtools.network.onRequestFinished.addListener(function (request) {
	if (!/^http:\/\/[^\/]+\/kcsapi\/api_req_(?:sortie\/battle|battle_midnight\/battle|battle_midnight\/sp_midnight|sortie\/night_to_day|practice\/battle|practice\/midnight_battle)$/.test(request.request.url)) return;
	request.getContent(function (content) {
		if (!content) return;
		var json = JSON.parse(content.replace(/^[^=]+=/, ''));
		if (!json || !json.api_data) return;
		var d = json.api_data;
		if (!d.api_maxhps || !d.api_nowhps) return;
		var maxhps = d.api_maxhps;
		var nowhps = d.api_nowhps.concat();	// make a copy
		if (d.api_kouku) calc_damage(nowhps, d.api_kouku.api_stage3);
		calc_damage(nowhps, d.api_opening_atack);
		calc_damage(nowhps, d.api_hougeki);	// midnight
		calc_damage(nowhps, d.api_hougeki1);
		calc_damage(nowhps, d.api_hougeki2);
		calc_damage(nowhps, d.api_hougeki3);
		calc_damage(nowhps, d.api_raigeki);
		if (d.api_support_flag) {
			///@todo
		}
		var req = [];
		req.push('friend damage');
		for (var i = 1; i <= 6; ++i) {
			if (maxhps[i] != -1) req.push(i + '. ' + hp_status(nowhps[i], maxhps[i]));
		}
		req.push('\nenemy damage');
		for (var i = 1; i <= 6; ++i) {
			var ke = d.api_ship_ke[i];
			var name = ship_name(ke) + ' lv' + d.api_ship_lv[i];
			if (ke != -1) req.push(i + '(' + name + '). ' + hp_status(nowhps[i+6], maxhps[i+6]));
		}
		chrome.extension.sendRequest(req);
	});
});

chrome.devtools.network.onRequestFinished.addListener(function (request) {
	if (!/^http:\/\/[^\/]+\/kcsapi\/api_start2$/.test(request.request.url)) return;
	request.getContent(function (content) {
		if (!content) return;
		var json = JSON.parse(content.replace(/^[^=]+=/, ''));
		if (!json || !json.api_data) return;
		var d = json.api_data;
		if (d.api_mst_ship) {
			var mst_ship = {};
			for (var i = 0, data; data = d.api_mst_ship[i]; ++i) {
				mst_ship[data.api_id] = data;
			}
			$mst_ship = mst_ship;
			localStorage['mst_ship'] = JSON.stringify($mst_ship);
		}
	});
});
