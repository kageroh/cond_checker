var div = document.createElement('div');
div.style.whiteSpace = 'pre-wrap';
div.style.position = 'absolute';
div.style.top = '7em';
div.style.left = '50%';
div.style.marginLeft = '402px';
document.body.appendChild(div);

chrome.runtime.onMessage.addListener(function (req) {
	if (req instanceof Array) {
		div.innerHTML = parse_markdown(req.join('\n'));
	} else {
		div.innerHTML += parse_markdown(req.toString());
	}
});

function parse_markdown(s) {
	// エスケープを行う.
	s = s.replace(/\&/g, "&amp;");
	s = s.replace(/\</g, "&lt;");
	s = s.replace(/\>/g, "&gt;");
	// markdown書式をhtmlに変換する.
	s = s.replace(/^([#\*\-])/, "\n$1"); // 行頭がmarkdown書式なら、センチネルとして改行を付ける.
	s = s.replace(/\n#### ([^\n]+)/g, "<h5>$1</h5>");
	s = s.replace(/\n### ([^\n]+)/g, "<h4>$1</h4>");
	s = s.replace(/\n## ([^\n]+)/g, "<h3>$1</h3>");
	s = s.replace(/\n# ([^\n]+)/g, "<h2>$1</h2>");
	s = s.replace(/\n\* ([^\n]+)/g, "<li>$1</li>"); // <ul>で括るのが正しいが、手抜きする.
	s = s.replace(/\n--+/g, "<hr>");
	// 余分な改行を削除する.
	s = s.replace(/>\n+/g, ">");
	s = s.replace(/\n+</g, "<");
	// 色付け.
	s = s.replace(/撃沈---/g, '<span style="color:steelblue">$&</span>');
	s = s.replace(/大破!!!/g, '<span style="color:red">$&</span>');
	return s;
}
