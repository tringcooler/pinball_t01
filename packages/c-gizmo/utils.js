"use strict";
var GizmosUtils = {};
module.exports = GizmosUtils, GizmosUtils.addMoveHandles = function (e, n, t) {
	var o,
	i;
	2 === arguments.length && (t = n, n = {});
	var r = n.cursor || "default",
	l = n.ignoreWhenHoverOther || !1,
	s = function (n) {
		if (n.stopPropagation(), "undefined" == typeof _Scene || cc.director.getRunningScene()) {
			var r = n.clientX - o,
			l = n.clientY - i;
			t.update && t.update.call(e, r, l, n)
		}
	}
	.bind(e),
	c = function (n) {
		document.removeEventListener("mousemove", s),
		document.removeEventListener("mouseup", c),
		Editor.UI.removeDragGhost(),
		window.getSelection().removeAllRanges(),
		t.end && t.end.call(e, n),
		n.stopPropagation()
	}
	.bind(e);
	e.on("mousedown", function (n) {
		if (l) {
			var d = Editor.Selection.curSelection("node"),
			u = Editor.Selection.hovering("node"),
			a = d.indexOf(u);
			if (a === -1)
				return
		}
		1 === n.which && (o = n.clientX, i = n.clientY, Editor.UI.addDragGhost(r), document.addEventListener("mousemove", s), document.addEventListener("mouseup", c), t.start && t.start.call(e, n.offsetX, n.offsetY, n)),
		n.stopPropagation()
	})
}, GizmosUtils.snapPixel = function (e) {
	return Math.floor(e) + .5
}, GizmosUtils.snapPixelWihVec2 = function (e) {
	return e.x = GizmosUtils.snapPixel(e.x),
	e.y = GizmosUtils.snapPixel(e.y),
	e
}, GizmosUtils.getCenter = function (e) {
	for (var n = null, t = null, o = null, i = null, r = 0; r < e.length; ++r) {
		for (var l, s = e[r], c = _Scene.NodeUtils.getWorldOrientedBounds(s), d = 0; d < c.length; ++d)
			l = c[d], (null === n || l.x < n) && (n = l.x), (null === o || l.x > o) && (o = l.x), (null === t || l.y < t) && (t = l.y), (null === i || l.y > i) && (i = l.y);
		l = _Scene.NodeUtils.getWorldPosition(s),
		(!n || l.x < n) && (n = l.x),
		(!o || l.x > o) && (o = l.x),
		(!t || l.y < t) && (t = l.y),
		(!i || l.y > i) && (i = l.y)
	}
	var u = .5 * (n + o),
	a = .5 * (t + i),
	m = cc.director.getScene(),
	v = m.convertToNodeSpaceAR(cc.v2(u, a));
	return v
};
