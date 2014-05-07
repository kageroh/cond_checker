var div = document.createElement('div');
div.style.whiteSpace = 'pre-wrap';
div.style.position = 'absolute';
div.style.top = '7em';
div.style.left = '50%';
div.style.marginLeft = '402px';
document.body.appendChild(div);

chrome.runtime.onMessage.addListener(function (req) {
	if (req instanceof Array) {
		div.textContent = req.join('\n');
	} else {
		div.textContent += '\n\n' + req.toString();
	}
});

