var div = document.createElement('div');
div.style.whiteSpace = 'pre';
div.style.position = 'absolute';
div.style.top = '7em';
div.style.right = '.5em';
document.body.appendChild(div);

chrome.runtime.onMessage.addListener(function (req) {
	if (req instanceof Array) {
		div.textContent = req.join('\n');
	} else {
		div.textContent += '\n\nnext enemy\n' + req.toString(10);
	}
});

