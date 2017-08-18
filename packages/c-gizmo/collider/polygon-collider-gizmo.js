"use strict";
function _classCallCheck(e, o) {
	if (!(e instanceof o))
		throw new TypeError("Cannot call a class as a function")
}
function _possibleConstructorReturn(e, o) {
	if (!e)
		throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
	return !o || "object" != typeof o && "function" != typeof o ? e : o
}
function _inherits(e, o) {
	if ("function" != typeof o && null !== o)
		throw new TypeError("Super expression must either be null or a function, not " + typeof o);
	e.prototype = Object.create(o && o.prototype, {
			constructor: {
				value: e,
				enumerable: !1,
				writable: !0,
				configurable: !0
			}
		}),
	o && (Object.setPrototypeOf ? Object.setPrototypeOf(e, o) : e.__proto__ = o)
}
var _createClass = function () {
	function e(e, o) {
		for (var t = 0; t < o.length; t++) {
			var r = o[t];
			r.enumerable = r.enumerable || !1,
			r.configurable = !0,
			"value" in r && (r.writable = !0),
			Object.defineProperty(e, r.key, r)
		}
	}
	return function (o, t, r) {
		return t && e(o.prototype, t),
		r && e(o, r),
		o
	}
}
(), ColliderGizmo = require("./collider-gizmo"), Tools = require("../tools"), ToolType = {
	None: 0,
	Point: 1,
	Line: 2,
	Center: 3
}, PolygonColliderGizmo = function (e) {
	function o() {
		return _classCallCheck(this, o),
		_possibleConstructorReturn(this, (o.__proto__ || Object.getPrototypeOf(o)).apply(this, arguments))
	}
	return _inherits(o, e),
	_createClass(o, [{
				key: "onCreateMoveCallbacks",
				value: function () {
					var e = this,
					o = void 0,
					t = void 0,
					r = void 0;
					return {
						start: function n(i, l, a, s) {
							if (s === ToolType.Point) {
								var c = a.currentTarget.instance;
								r = c.point.origin,
								o = r.clone();
								var f = a.ctrlKey || a.metaKey;
								if (f) {
									e.recordChanges();
									var u = e.target.points;
									u.splice(u.indexOf(r), 1),
									e.commitChanges()
								}
							} else if (s === ToolType.Center)
								t = e.target.offset;
							else if (s === ToolType.Line) {
								e.recordChanges();
								var p = e.node.convertToNodeSpaceAR(cc.v2(i, l)).sub(e.target.offset),
								y = a.currentTarget.instance,
								n = y.startSvgPoint.point.origin,
								v = y.endSvgPoint.point.origin,
								d = e.target.points,
								g = d.indexOf(n) + 1,
								h = n.x - v.x,
								T = n.y - v.y,
								C = (p.x - n.x) * (n.x - v.x) + (p.y - n.y) * (n.y - v.y);
								C /= h * h + T * T,
								p.x = n.x + C * h,
								p.y = n.y + C * T,
								e.adjustValue(p),
								e.target.points.splice(g, 0, p),
								e.commitChanges()
							}
						},
						update: function (n, i, l, a) {
							var s = e.node,
							c = cc.affineTransformClone(s.getWorldToNodeTransform());
							if (c.tx = c.ty = 0, a === ToolType.Point) {
								var f = l.ctrlKey || l.metaKey;
								if (f)
									return;
								var u = cc.v2(cc.pointApplyAffineTransform(n, i, c)).add(o);
								e.adjustValue(u),
								r.x = u.x,
								r.y = u.y
							} else if (a === ToolType.Center) {
								var p = cc.v2(cc.pointApplyAffineTransform(n, i, c)).add(t);
								e.adjustValue(p),
								e.target.offset = p
							}
							e._view.repaintHost()
						}
					}
				}
			}, {
				key: "onCreateRoot",
				value: function () {
					var e = this,
					o = this._root,
					t = o.dragArea = o.polygon().fill({
							color: "rgba(0,128,255,0.2)"
						}).stroke("none").style("pointer-events", "fill");
					this.registerMoveSvg(t, ToolType.Center);
					var r = o.linesGroup = o.group(),
					n = [];
					r.style("pointer-events", "stroke").style("cursor", "copy").hide();
					var i = function () {
						return Tools.lineTool(r, cc.v2(0, 0), cc.v2(0, 0), "#7fc97a", null, e.createMoveCallbacks(ToolType.Line))
					},
					l = o.pointsGroup = o.group(),
					a = [];
					l.hide();
					var s = function () {
						var o = Tools.circleTool(l, 5, {
								color: "#7fc97a"
							}, null, "pointer", e.createMoveCallbacks(ToolType.Point));
						return o.on("mouseover", function (e) {
							var t = e.ctrlKey || e.metaKey;
							t && (o.fill({
									color: "#f00"
								}), o.l1.stroke({
									color: "#f00"
								}), o.l2.stroke({
									color: "#f00"
								}))
						}),
						o.on("mouseout", function (e) {
							o.fill({
								color: "#7fc97a"
							}),
							o.l1.stroke({
								color: "#7fc97a"
							}),
							o.l2.stroke({
								color: "#7fc97a"
							})
						}),
						o
					};
					o.plot = function (o) {
						for (var r = [], l = 0, c = o.length; l < c; l++) {
							var f = l === c - 1 ? 0 : l + 1,
							u = o[l];
							if (r.push([u.x, u.y]), e.target.editing) {
								var p = a[l];
								p || (p = a[l] = s()),
								p.point = u,
								p.show(),
								p.center(u.x, u.y);
								var y = a[f];
								y || (y = a[f] = s());
								var v = n[l];
								v || (v = n[l] = i());
								var d = u,
								g = o[f];
								v.show(),
								v.plot(d.x, d.y, g.x, g.y),
								v.startSvgPoint = p,
								v.endSvgPoint = y,
								p.l1 = v,
								y.l2 = v
							}
						}
						t.plot(r);
						for (var h = o.length, T = a.length; h < T; h++)
							a[h].hide(), n[h].hide()
					}
				}
			}, {
				key: "onUpdate",
				value: function () {
					for (var e = this.target.points, o = this.target.offset, t = this.node, r = cc.affineTransformClone(t.getNodeToWorldTransformAR()), n = [], i = 0, l = e.length; i < l; i++) {
						var a = e[i].add(o),
						s = cc.pointApplyAffineTransform(a, r);
						s = this.worldToPixel(s),
						s.origin = e[i],
						n.push(s)
					}
					this._root.plot(n)
				}
			}, {
				key: "enterEditing",
				value: function () {
					var e = this._root;
					e.pointsGroup.show(),
					e.dragArea.style("cursor", "move"),
					e.linesGroup.show()
				}
			}, {
				key: "leaveEditing",
				value: function () {
					var e = this._root;
					e.pointsGroup.hide(),
					e.linesGroup.hide(),
					e.dragArea.style("cursor", null)
				}
			}
		]),
	o
}
(ColliderGizmo);
module.exports = PolygonColliderGizmo;
