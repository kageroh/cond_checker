var div = document.createElement('div');
div.style.whiteSpace = 'pre-wrap';
div.style.position = 'absolute';
div.style.top = '75px'; // NaviBar 39px + margin 20px + spacer 16px
div.style.left = '822px';
div.innerHTML = "<h2>艦これ余所見プレイ支援</h2>"
	+ "<h3>ロード中...</h3>"
	+ "ゲームスタート後に「ロード完了」が表示されない場合は[デベロッパー ツール]を起動し、画面をリロードしてゲームスタートからやり直してください\n"
	+ "※ デベロッパーツールは、Opt+Cmd+I(Mac), Ctrl+Shift+I, F12 キーで起動できます\n";

var style = document.createElement('style');
style.textContent = "ul.markdown {list-style:disc inside;}" // 箇条書き頭文字円盤.
	+ "table.markdown {border-collapse:collapse; border:0px; white-space:nowrap;}" // テーブル枠線なし. 行折り返しなし.
	+ "table.markdown tr td {padding:0px 0.5em; vertical-align:top;}" // table cellpadding 上下0px, 左右0.5文字, 上揃え.
	+ "table.markdown tr th {padding:0px 0.5em; font-size:70%; }" // table cellpadding 上下0px, 左右0.5文字. 文字サイズ70%.
	+ "h3.markdown { margin:1em 0px 0.3em 0px;}"
	+ "h4.markdown { margin:0px 1em;}"
	+ "h5.markdown { margin:0px 1em;}"
	;

document.getElementById('area-game').style.textAlign = 'left';
document.getElementById('game_frame').width = '820px';
document.getElementsByTagName('head')[0].appendChild(style);
document.body.appendChild(div);

var $style_display = {};

function style_display(id) {
	var e = document.getElementById(id);
	if (e && e.style.display)
		$style_display[id] = e.style.display; // ページ内にidがあればそのdisplay値を記録する.
	else if (!$style_display[id])
		$style_display[id] = 'none'; // display値の記録がなければ初期値 none を記録する.

	return $style_display[id]; // 最後に記録されたdisplay値を返す.
}

chrome.runtime.onMessage.addListener(function (req) {
	if (req instanceof Array) {
		for (var id in $style_display) { style_display(id); } // ページ変更前に、全idのdisplay値記録を更新する.
		div.innerHTML = parse_markdown(req);
	} else {
		div.innerHTML += parse_markdown(req.toString().split('\n'));
	}
});

function insert_string(str, index, add) {
	return str.substring(0, index) + add + str.substring(index);
}

function toggle_button(id) {
	var d_show = (style_display(id) == 'block') ? 'none': 'inline';
	var d_hide = (style_display(id) == 'block') ? 'inline': 'none';
	var s = '  <input id="<ID>_show" style="display:<DISP_SHOW>; font-size:70%; padding:0px;" type="button" value="＋" onclick="document.getElementById(\'<ID>\').style.display = \'block\';'
			+ 'document.getElementById(\'<ID>_show\').style.display = \'none\';'
			+ 'document.getElementById(\'<ID>_hide\').style.display = \'inline\';">'
			+ '<input id="<ID>_hide" style="display:<DISP_HIDE>; font-size:70%; padding:0px;" type="button" value="－" onclick="document.getElementById(\'<ID>\').style.display = \'none\';'
			+ 'document.getElementById(\'<ID>_show\').style.display = \'inline\';'
			+ 'document.getElementById(\'<ID>_hide\').style.display = \'none\';">'
	s = s.replace(/<DISP_SHOW>/g, d_show);
	s = s.replace(/<DISP_HIDE>/g, d_hide);
	return s.replace(/<ID>/g, id);
}
function toggle_div(id) {
	var d = (style_display(id) == 'block') ? 'block': 'none';
	var s = '<div id="<ID>" style="display:<DISP_SHOW>;">';
	s = s.replace(/<DISP_SHOW>/g, d);
	return s.replace(/<ID>/g, id);
}

function parse_markdown(a) {
	var html = "";
	var li_count = 0;
	var tr_count = 0;
	for (var i = 0; i < a.length; ++i) {
		var s = a[i];
		var t = null;
		if (s instanceof Array) {	// 入れ子ブロック. [id, line1, line2, line3...]
			var id = s.shift();
			var end_tag = html.match(/<\/\w+>$/);
			if (end_tag != null)
				html = insert_string(html, html.length - end_tag[0].length, toggle_button(id)); // 直前の終了タグの内側にトグルボタンを入れる.
			else
				html = html.replace(/\n$/, "") + toggle_button(id) + "\n";
			html += toggle_div(id);
			html += parse_markdown(s);
			html += '</div>';
			continue;
		}
		// エスケープを行う.
		s = s.replace(/\&/g, "&amp;");
		s = s.replace(/\</g, "&lt;");
		s = s.replace(/\>/g, "&gt;");
		// 色付け.
		s = s.replace(/撃沈---/g, '<span style="color:steelblue">$&</span>');
		s = s.replace(/大破!!!/g, '<span style="color:red">$&</span>');
		s = s.replace(/@!!(.+)!!@/g, '<span style="color:red">$1</span>');
		// markdown書式を変換する.
		if      (/^--+/.test(s))	t = "<hr>";
		else if (/^#### /.test(s))	t = s.replace(/^#+ (.+)/, '<h5 class="markdown">$1</h5>');
		else if (/^### /.test(s))	t = s.replace(/^#+ (.+)/, '<h4 class="markdown">$1</h4>');
		else if (/^## /.test(s))	t = s.replace(/^#+ (.+)/, '<h3 class="markdown">$1</h3>');
		else if (/^# /.test(s))		t = s.replace(/^#+ (.+)/, '<h2 class="markdown">$1</h2>');
		else if (/^\* /.test(s))	{ t = s.replace(/^. (.+)/, "<li>$1</li>"); li_count++; }
		else if (/^\t/.test(s))		{ t = "<tr>" + s.replace(/\t/g, "<td>") + "</tr>"; tr_count++;
									  t = t.replace(/<td>\|/g, '<td style="white-space:normal;">'); // "\t|" は折り返し有のセルに入れる.
									  t = t.replace(/<td>==/g, '<th>'); // "\t==" はヘッダセル.
									}
		// リストを<ul>で括る.
		if (li_count == 1) html += '<ul class="markdown">';
		if (li_count > 0 && !/^<li>/.test(t)) { li_count = 0; html += "</ul>"; } 
		// テーブルを<table>で括る.
		if (tr_count == 1) html += '<table class="markdown">';
		if (tr_count > 0 && !/^<tr>/.test(t)) { tr_count = 0; html += "</table>"; } 
		// 変換結果をhtmlに格納する.
		if (t) html += t;
		else   html += s + "\n";
	}
	// リスト、テーブルの括り漏れに対処する.
	if (li_count > 0) { html += "</ul>"; } 
	if (tr_count > 0) { html += "</table>"; } 
	return html;
}

