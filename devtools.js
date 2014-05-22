// -*- coding: utf-8 -*-
var $ship_list = localStorage['ship_list'];
$ship_list = ($ship_list) ? JSON.parse($ship_list) : {};

var $mst_ship = localStorage['mst_ship'];
$mst_ship = ($mst_ship) ? JSON.parse($mst_ship) : {};

var $weekly = localStorage['weekly'];
$weekly = ($weekly) ? JSON.parse($weekly) : null;

var $slotitem_list = {};
var $max_ship = 0;
var $max_slotitem = 0;
var $fdeck_list = {}
var $next_enemy = null;
var $is_boss = false;
var $unlock_ship = 0;
var $unlock_slotitem = 0;

function get_weekly() {
	var wn = Date.now() - Date.UTC(2013, 4-1, 22, 5-9, 0); // 2013-4-22 05:00 JST からの経過ミリ秒数.
	wn = Math.floor(wn / (7*24*60*60*1000)); // 経過週数に変換する.
	if ($weekly == null || $weekly.week != wn) {
		$weekly = {
			sortie    : 0,
			boss_cell : 0,
			win_boss  : 0,
			win_S     : 0,
			week      : wn
		};
	}
	return $weekly;
}

function save_weekly() {
	localStorage['weekly'] = JSON.stringify($weekly);
}

function weekly_name() {
	var w = get_weekly();
	return '週間出撃:' + w.sortie + '/36, '
		+ 'ボス到達:' + w.boss_cell + '/24, '
		+ 'ボス勝利:' + w.win_boss  + '/12, '
		+ 'S勝利:' + w.win_S + '/6';
}

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

function formation_name(id) {
	switch (id) {
		case 1: return '単縦';
		case 2: return '複縦';
		case 3: return '輪形';
		case 4: return '梯形';
		case 5: return '単横';
		default: return id.toString();
	}
}

function match_name(id) {
	switch (id) {
		case 1: return '同航';
		case 2: return '反航';
		case 3: return 'Ｔ字有利';
		case 4: return 'Ｔ字不利';
		default: return id.toString();
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

function count_if(ary, value) {
	return ary.reduce(function(count, x) { return count + (x == value); }, 0);
}

function count_unless(ary, value) {
	return ary.reduce(function(count, x) { return count + (x != value); }, 0);
}

function slotitem_count(slot, item_id) {
	if (!slot) return 0;
	var count = 0;
	for (var i = 0; i < slot.length; ++i) {
		if ($slotitem_list[slot[i]] == item_id) ++count;
	}
	return count;
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
		$unlock_ship = 0;
		$unlock_slotitem = 0;
		for (var i = 0, data; data = data_list[i]; i++) {
			var ship = $ship_list[data.api_id];
			ship_list[data.api_id] = {
				p_cond: (ship) ? ship.c_cond : 49,
				c_cond: data.api_cond,
				maxhp: data.api_maxhp,
				nowhp: data.api_nowhp,
				repair: slotitem_count(data.api_slot, 42),	// 修理要員(ダメコン).
				megami: slotitem_count(data.api_slot, 43),	// 修理女神.
				lv:    data.api_lv,
				ship_id: data.api_ship_id
			};
			if (!data.api_locked) {
				$unlock_ship++;
				$unlock_slotitem += count_unless(data.api_slot, -1);
			}
		}
		$ship_list = ship_list;
		localStorage['ship_list'] = JSON.stringify($ship_list);

		var basic = json.api_data.api_basic;
		if (basic) {
			$max_ship     = basic.api_max_chara;
			$max_slotitem = basic.api_max_slotitem + 3;
		}
		req.push('艦娘保有数:' + Object.keys($ship_list).length + '/' + $max_ship + '(' + $unlock_ship + ')');
		req.push('装備保有数:' + Object.keys($slotitem_list).length + '/' + $max_slotitem + '(' + $unlock_slotitem + ')');
		req.push(weekly_name());
		$fdeck_list = {};
		for (var i = 0, deck; deck = deck_list[i]; i++) {
			$fdeck_list[deck.api_id] = deck;
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
		chrome.extension.sendRequest(req);
	});
});

function on_next_cell(json) {
	var d = json.api_data;
	var e = json.api_data.api_enemy;
	var g = json.api_data.api_itemget;
	var area = d.api_maparea_id + '-' + d.api_mapinfo_no + '-' + d.api_no;
	if (e) {
		var msg = e.api_enemy_id.toString(10);
		if (d.api_event_id == 5) {
			msg += '(boss)';
			$is_boss = true;
		}
		$next_enemy = area + ': ' + msg;
		chrome.extension.sendRequest('next enemy\n' + area + ': ' + msg);
	}
	if (g) {
		var msg = item_name(g.api_id) + 'x' + g.api_getcount;
		chrome.extension.sendRequest('next item\n' + area + ': ' + msg);
	}
}

function on_battle_result(json) {
	var d = json.api_data;
	var e = json.api_data.api_enemy_info;
	var g = json.api_data.api_get_ship;
	var msg = d.api_win_rank + ':';
	if (e) {
		msg += e.api_deck_name;
		if (d.api_ship_id) {
			var total = count_unless(d.api_ship_id, -1);
			msg += '(' + d.api_dests + '/' + total + ')';
		}
	}
	if (g) {
		msg += '\n\ndrop ship\n';
		msg += g.api_ship_type + ':' + g.api_ship_name;
	}
	chrome.extension.sendRequest('battle result\n' + msg);
}

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

function on_battle(json) {
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
	var fdeck = $fdeck_list[d.api_dock_id];
	if (!fdeck) fdeck = $fdeck_list[d.api_deck_id]; // for */api_req_practice/midnight_battle
	if (d.api_formation) {
		$next_enemy += '\n'
			+ formation_name(d.api_formation[0]) + '/'
			+ match_name(d.api_formation[2]) + '/'
			+ formation_name(d.api_formation[1]);
	}
	var req = [];
	req.push('battle')
	req.push($next_enemy);
	req.push('\nfriend damage');
	req.push(fdeck.api_name);
	for (var i = 1; i <= 6; ++i) {
		if (maxhps[i] == -1) continue;
		var name = '?';
		var ship = $ship_list[fdeck.api_ship[i-1]];
		if (ship) {
			name = ship_name(ship.ship_id) + 'Lv' + ship.lv;
			if (ship.repair) name += '+修理要員x' + ship.repair;
			if (ship.megami) name += '+修理女神x' + ship.megami;
		}
		req.push(i + '(' + name + '). ' + hp_status(nowhps[i], maxhps[i]));
	}
	req.push('\nenemy damage');
	for (var i = 1; i <= 6; ++i) {
		var ke = d.api_ship_ke[i];
		if (ke == -1) continue;
		var name = ship_name(ke) + 'Lv' + d.api_ship_lv[i];
		req.push(i + '(' + name + '). ' + hp_status(nowhps[i+6], maxhps[i+6]));
	}
	chrome.extension.sendRequest(req);
}

function add_slotitem_list(a) {
	if (!a) return;
	if (a instanceof Array) {
		for (var i = 0, data; data = a[i]; ++i) {
			add_slotitem_list(data);
		}
	}
	else if (a.api_slotitem_id) {
		var data = a;
		$slotitem_list[data.api_id] = data.api_slotitem_id;
	}
}

chrome.devtools.network.onRequestFinished.addListener(function (request) {
	var func = null;
	var api_name = request.request.url.replace(/^http:\/\/[^\/]+\/kcsapi\//, '/');
	if (api_name == request.request.url) {
		// 置換失敗. api以外なので早抜けする.
		return;
	}
	else if (api_name == 'api_start2') {
		// ゲーム開始時点.
		func = function(json) { //　艦種表を取り込む.
			var list = json.api_data.api_mst_ship;
			if (list) {
				$mst_ship = {};
				for (var i = 0, data; data = list[i]; ++i) {
					$mst_ship[data.api_id] = data;
				}
				localStorage['mst_ship'] = JSON.stringify($mst_ship);
			}
		};
	}
	else if (api_name == '/api_get_member/slot_item') {
		// 保有装備一覧表.
		func = function(json) { // 保有する装備配列をリストに記録する.
			$slotitem_list = {};
			add_slotitem_list(json.api_data);
		};
	}
	else if (api_name == '/api_req_kousyou/createitem') {
		// 装備開発.
		func = function(json) { // 開発した装備を、リストに加える.
			if (json.api_data.api_create_flag)
				add_slotitem_list(json.api_data.api_slot_item);
		};
	}
	else if (api_name == '/api_req_kousyou/getship') {
		// 新艦建造成功.
		func = function(json) { // 建造艦が持つ初期装備配列を、リストに加える.
			add_slotitem_list(json.api_data.api_slotitem);
		};
	}
	else if (api_name == '/api_req_member/get_practice_enemyinfo') {
		// 演習相手の情報.
		func = function(json) { // 演習相手の提督名を記憶する.
			$next_enemy = '演習: ' + json.api_data.api_nickname;
		};
	}
	else if (api_name == '/api_req_map/start') {
		// 海域初回選択.
		var w = get_weekly()
		w.sortie++;
		$is_boss = false;
		func = on_next_cell;
	}
	else if (api_name == '/api_req_map/next') {
		// 海域次選択.
		func = on_next_cell;
	}
	else if (api_name == '/api_req_sortie/battle') {
		// 昼戦開始.
		func = on_battle;
	}
	else if (api_name == '/api_req_battle_midnight/battle') {
		// 夜戦継続.
		func = on_battle;
	}
	else if (api_name == '/api_req_battle_midnight/sp_midnight') {
		// 夜戦開始.
		func = on_battle;
	}
	else if (api_name == '/api_req_sortie/night_to_day') {
		// 昼戦継続.
		func = on_battle;
	}
	else if (api_name == '/api_req_practice/battle') {
		// 演習開始.
		func = on_battle;
	}
	else if (api_name == '/api_req_practice/midnight_battle') {
		// 夜演習継続.
		func = on_battle;
	}
	else if (api_name == '/api_req_sortie/battleresult') {
		// 戦闘結果.
		func = function(json) {
			on_battle_result(json);
			var w = get_weekly();
			var r = json.api_data.api_win_rank;
			if (r == 'S') w.win_S++;
			if($is_boss) {
				w.boss_cell++;
				if (r == 'S' || r == 'A' || r == 'B') w.win_boss++;
			}
			save_weekly();
		};
	}
	else if (api_name == '/api_req_practice/battle_result') {
		// 演習結果.
		func = on_battle_result;
	}
	if (!func) return;
	request.getContent(function (content) {
		if (!content) return;
		var json = JSON.parse(content.replace(/^[^=]+=/, ''));
		if (!json || !json.api_data) return;
		func(json);
	});
});
