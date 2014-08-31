var div = document.createElement('div');
div.style.whiteSpace = 'pre-wrap';
div.style.position = 'absolute';
div.style.top = '75px'; // NaviBar 39px + margin 20px + spacer 16px
div.style.left = '50%';
div.style.marginLeft = '402px';
document.body.appendChild(div);

chrome.runtime.onMessage.addListener(function (req) {
	if (req instanceof Array) {
		div.innerHTML = parse_markdown(req);
	} else {
		div.innerHTML += parse_markdown(req.toString().split('\n'));
	}
});

function parse_markdown(a) {
	var html = "";
	var li_count = 0;
	for (var i = 0; i < a.length; ++i) {
		var s = a[i];
		var t = null;
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
		// リストを<ul>で括る.
		if (li_count == 1) html += "<ul>";
		if (li_count > 0 && !/^<li>/.test(t)) { li_count = 0; html += "</ul>"; } 
		// 変換結果をhtmlに格納する.
		if (t) html += t;
		else   html += s + "\n";
	}
	return html;
}

