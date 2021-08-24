import { browser } from '$app/env';

export function getCaretPosition(el) {
	var caretOffset = 0,
		sel;
	if (
		browser &&
		typeof window.getSelection !== 'undefined' &&
		window.getSelection().rangeCount > 0
	) {
		var range = window.getSelection().getRangeAt(0);
		var selected = range.toString().length;
		var preCaretRange = range.cloneRange();
		preCaretRange.selectNodeContents(el);
		preCaretRange.setEnd(range.endContainer, range.endOffset);
		caretOffset = preCaretRange.toString().length - selected;
	}
	return caretOffset;
}
export function getCaretEndPosition(el) {
	var caretOffset = 0,
		sel;
	if (
		browser &&
		typeof window.getSelection !== 'undefined' &&
		window.getSelection().rangeCount > 0
	) {
		var range = window.getSelection().getRangeAt(0);
		var selected = range.toString().length;
		var preCaretRange = range.cloneRange();
		preCaretRange.selectNodeContents(el);
		preCaretRange.setEnd(range.endContainer, range.endOffset);
		caretOffset = preCaretRange.toString().length;
	}
	return caretOffset;
}
function getAllTextnodes(el) {
	var n,
		a = [],
		walk = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null, false);
	while ((n = walk.nextNode())) a.push(n);
	return a;
}
export function getCaretData(el, position) {
	var node;
	let nodes = getAllTextnodes(el);
	for (var n = 0; n < nodes.length; n++) {
		if (position > nodes[n].nodeValue.length && nodes[n + 1]) {
			// remove amount from the position, go to next node
			position -= nodes[n].nodeValue.length;
		} else {
			node = nodes[n];
			break;
		}
	}
	// you'll need the node and the position (offset) to set the caret
	return { node: node, position: position };
}
// setting the caret with this info  is also standard
export function setCaretPosition(d) {
	if (d.node) {
		var sel = window.getSelection(),
			range = document.createRange();
		range.setStart(d.node, d.position);
		range.collapse(true);
		sel.removeAllRanges();
		sel.addRange(range);
	} else console.log('Not a node');
}
export function setCaretPositionSE(d, e) {
	if (d.node) {
		var sel = window.getSelection(),
			range = document.createRange();
		range.setStart(d.node, d.position);
		range.setEnd(e.node, e.position);
		sel.removeAllRanges();
		sel.addRange(range);
	} else console.log('Not a node');
}
