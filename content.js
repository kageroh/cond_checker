var div = document.createElement('div');
div.style.whiteSpace = 'pre-wrap';
div.style.position = 'absolute';
div.style.top = '75px'; // NaviBar 39px + margin 20px + spacer 16px
div.style.left = '822px';
document.body.appendChild(div);
div.innerHTML = "<h2>艦これ余所見プレイ支援</h2>";

document.getElementById('area-game').style.textAlign = 'left';
document.getElementById('game_frame').width = '820px';

var style = document.createElement('style');
style.textContent = "ul.markdown {list-style:disc inside;}" // 箇条書き頭文字円盤.
	+ "table.markdown {border-collapse:collapse; border:1px; white-space:nowrap;}" // テーブル枠線なし. 行折り返しなし.
	+ "table.markdown tr td {padding:0px 0.5em; vertical-align:top;}" // table cellpadding 上下0px, 左右0.5文字, 上揃え.
	;
document.getElementsByTagName('head')[0].appendChild(style);

chrome.runtime.onMessage.addListener(function (req) {
	if (req instanceof Array) {
		div.innerHTML = parse_markdown(req);
	} else {
		div.innerHTML += parse_markdown(req.toString().split('\n'));
	}
});

function insert_string(str, index, add) {
	return str.substring(0, index) + add + str.substring(index);
}

function toggle_button(id) {
	var e = document.getElementById(id);
	var d_show = (e && e.style.display == 'block') ? 'none': 'inline';
	var d_hide = (e && e.style.display == 'block') ? 'inline': 'none';
	var s = '  <input id="ID_show" style="display:DISP_show; font-size:70%;" type="button" value="＋" onclick="document.getElementById(\'ID\').style.display = \'block\';'
			+ 'document.getElementById(\'ID_show\').style.display = \'none\';'
			+ 'document.getElementById(\'ID_hide\').style.display = \'inline\';">'
			+ '<input id="ID_hide" style="display:DISP_hide; font-size:70%;" type="button" value="－" onclick="document.getElementById(\'ID\').style.display = \'none\';'
			+ 'document.getElementById(\'ID_show\').style.display = \'inline\';'
			+ 'document.getElementById(\'ID_hide\').style.display = \'none\';">'
	s = s.replace(/\bDISP_show/g, d_show);
	s = s.replace(/\bDISP_hide/g, d_hide);
	return s.replace(/\bID/g, id);
}
function toggle_div(id) {
	var e = document.getElementById(id);
	var d = (e && e.style.display == 'block') ? 'block': 'none';
	var s = '<div id="ID" style="display:' + d +'">';
	return s.replace(/ID/g, id);
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
				html += toggle_button(id);
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
		// markdown書式を変換する.
		if      (/^--+/.test(s))	t = "<hr>";
		else if (/^#### /.test(s))	t = s.replace(/^#+ (.+)/, "<h5>$1</h5>");
		else if (/^### /.test(s))	t = s.replace(/^#+ (.+)/, "<h4>$1</h4>");
		else if (/^## /.test(s))	t = s.replace(/^#+ (.+)/, "<h3>$1</h3>");
		else if (/^# /.test(s))		t = s.replace(/^#+ (.+)/, "<h2>$1</h2>");
		else if (/^\* /.test(s))	{ t = s.replace(/^. (.+)/, "<li>$1</li>"); li_count++; }
		else if (/^\t/.test(s))		{ t = "<tr>" + s.replace(/\t/g, "<td>") + "</tr>"; tr_count++;
									  t = t.replace(/<td>\|/, '<td style="white-space:normal;">'); // "\t|" は折り返し有のセルに入れる.
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

