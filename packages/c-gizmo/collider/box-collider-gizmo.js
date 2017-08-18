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
(), ColliderGizmo = require("./collider-gizmo"), Tools = require("../tools"), RectToolType = Tools.rectTool.Type, BoxColliderGizmo = function (e) {
	function o() {
		return _classCallCheck(this, o),
		_possibleConstructorReturn(this, (o.__proto__ || Object.getPrototypeOf(o)).apply(this, arguments))
	}
	return _inherits(o, e),
	_createClass(o, [{
				key: "onCreateMoveCallbacks",
				value: function () {
					function e(e) {
						var o = l.node,
						t = cc.affineTransformClone(o.getWorldToNodeTransform());
						t.tx = t.ty = 0;
						var r = cc.v2(cc.pointApplyAffineTransform(e.x, e.y, t)).add(n);
						l.target.offset = r
					}
					function o(e, o, t, r) {
						e === RectToolType.LeftBottom ? t.x *= -1 : e === RectToolType.LeftTop ? (t.x *= -1, t.y *= -1) : e === RectToolType.RightTop ? t.y *= -1 : e === RectToolType.Left ? (t.x *= -1, r || (o.y = t.y = 0)) : e === RectToolType.Right ? r || (o.y = t.y = 0) : e === RectToolType.Top ? (t.y *= -1, r || (o.x = t.x = 0)) : e === RectToolType.Bottom && (r || (o.x = t.x = 0))
					}
					function t(e, o, t, r, i) {
						return e === RectToolType.Right || e === RectToolType.RightTop || e === RectToolType.RightBottom ? (i && (r.x /= 1 - o.x), t.x = r.x * o.x) : (i && (r.x /= o.x), t.x = r.x * (1 - o.x)),
						e === RectToolType.LeftBottom || e === RectToolType.Bottom || e === RectToolType.RightBottom ? (i && (r.y /= 1 - o.y), t.y = r.y * o.y) : (i && (r.y /= o.y), t.y = r.y * (1 - o.y)),
						t
					}
					function r(e, r, i, s) {
						var a = r.clone(),
						y = l.node,
						p = l.target,
						f = cc.affineTransformClone(y.getWorldToNodeTransform());
						f.tx = f.ty = 0;
						var T = cc.pointApplyAffineTransform(r, f),
						u = cc.pointApplyAffineTransform(a, f),
						h = cc.v2(.5, .5);
						t(e, h, T, u, s),
						o(e, T, u, i),
						i && (u.y = u.x * (c.height / c.width));
						var d = cc.size(c.width + u.x, c.height + u.y);
						s || (d.width < 0 && (T.x -= d.width / 2), d.height < 0 && (T.y -= d.height / 2), T = n.add(T), p.offset = T),
						d.width < 0 && (d.width = 0),
						d.height < 0 && (d.height = 0),
						p.size = d
					}
					var i = this,
					n = void 0,
					c = void 0,
					l = this;
					return {
						start: function () {
							n = i.target.offset.clone(),
							c = i.target.size.clone()
						},
						update: function (o, t, i, n) {
							var c = new cc.Vec2(o, t);
							if (n === RectToolType.Center)
								e(c.clone());
							else {
								var l = !!i && i.shiftKey,
								s = !!i && i.altKey;
								r(n, c.clone(), l, s)
							}
						},
						end: function (e, o, t) {
							if (e) {
								var r = l.target;
								t === RectToolType.Center ? i.adjustValue(r, ["offset"]) : i.adjustValue(r, ["offset", "size"])
							}
						}
					}
				}
			}, {
				key: "onCreateRoot",
				value: function () {
					var e = this,
					o = this._root,
					t = o.sideGroup = o.group().style("pointer-events", "none"),
					r = void 0,
					i = void 0,
					n = void 0,
					c = void 0,
					l = void 0,
					s = void 0,
					a = void 0,
					y = void 0,
					p = void 0,
					f = void 0;
					o.dragArea = f = o.polygon("0,0,0,0,0,0").fill({
							color: "rgba(0,128,255,0.2)"
						}).stroke("none").style("pointer-events", "fill"),
					this.registerMoveSvg(f, RectToolType.Center);
					var T = function (o, r) {
						return Tools.lineTool(t, cc.v2(0, 0), cc.v2(0, 0), "#7fc97a", r, e.createMoveCallbacks(o)).style("cursor", r)
					};
					i = T(RectToolType.Left, "col-resize"),
					n = T(RectToolType.Top, "row-resize"),
					c = T(RectToolType.Right, "col-resize"),
					l = T(RectToolType.Bottom, "row-resize"),
					r = o.sidePointGroup = o.group(),
					r.hide();
					var u = function (o, t, r) {
						return Tools.circleTool(t, 5, {
							color: "#7fc97a"
						}, null, e.createMoveCallbacks(o)).style("cursor", r)
					};
					s = u(RectToolType.LeftBottom, r, "nwse-resize"),
					a = u(RectToolType.LeftTop, r, "nesw-resize"),
					y = u(RectToolType.RightTop, r, "nwse-resize"),
					p = u(RectToolType.RightBottom, r, "nesw-resize"),
					o.plot = function (o) {
						f.plot([[o[0].x, o[0].y], [o[1].x, o[1].y], [o[2].x, o[2].y], [o[3].x, o[3].y]]),
						i.plot(o[0].x, o[0].y, o[1].x, o[1].y),
						n.plot(o[1].x, o[1].y, o[2].x, o[2].y),
						c.plot(o[2].x, o[2].y, o[3].x, o[3].y),
						l.plot(o[3].x, o[3].y, o[0].x, o[0].y),
						e._targetEditing && (s.center(o[0].x, o[0].y), a.center(o[1].x, o[1].y), y.center(o[2].x, o[2].y), p.center(o[3].x, o[3].y))
					}
				}
			}, {
				key: "onUpdate",
				value: function () {
					var e = this.target,
					o = e.size,
					t = e.offset,
					r = cc.rect(t.x - o.width / 2, t.y - o.height / 2, o.width, o.height),
					i = this.node,
					n = i.getNodeToWorldTransformAR(),
					c = new cc.Vec2,
					l = new cc.Vec2,
					s = new cc.Vec2,
					a = new cc.Vec2;
					cc.engine.obbApplyAffineTransform(n, r, c, l, s, a),
					c = this.worldToPixel(c),
					l = this.worldToPixel(l),
					s = this.worldToPixel(s),
					a = this.worldToPixel(a),
					this._root.plot([c, l, s, a])
				}
			}, {
				key: "enterEditing",
				value: function () {
					var e = this._root;
					e.sideGroup.style("pointer-events", "stroke"),
					e.dragArea.style("cursor", "move"),
					e.sidePointGroup.show()
				}
			}, {
				key: "leaveEditing",
				value: function () {
					var e = this._root;
					e.sideGroup.style("pointer-events", "none"),
					e.dragArea.style("cursor", null),
					e.sidePointGroup.hide()
				}
			}
		]),
	o
}
(ColliderGizmo);
module.exports = BoxColliderGizmo;
