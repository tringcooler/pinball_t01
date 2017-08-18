"use strict";
function _classCallCheck(t, e) {
	if (!(t instanceof e))
		throw new TypeError("Cannot call a class as a function")
}
function _possibleConstructorReturn(t, e) {
	if (!t)
		throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
	return !e || "object" != typeof e && "function" != typeof e ? t : e
}
function _inherits(t, e) {
	if ("function" != typeof e && null !== e)
		throw new TypeError("Super expression must either be null or a function, not " + typeof e);
	t.prototype = Object.create(e && e.prototype, {
			constructor: {
				value: t,
				enumerable: !1,
				writable: !0,
				configurable: !0
			}
		}),
	e && (Object.setPrototypeOf ? Object.setPrototypeOf(t, e) : t.__proto__ = e)
}
var _createClass = function () {
	function t(t, e) {
		for (var i = 0; i < e.length; i++) {
			var r = e[i];
			r.enumerable = r.enumerable || !1,
			r.configurable = !0,
			"value" in r && (r.writable = !0),
			Object.defineProperty(t, r.key, r)
		}
	}
	return function (e, i, r) {
		return i && t(e.prototype, i),
		r && t(e, r),
		e
	}
}
(), ColliderGizmo = function (t) {
	function e() {
		return _classCallCheck(this, e),
		_possibleConstructorReturn(this, (e.__proto__ || Object.getPrototypeOf(e)).apply(this, arguments))
	}
	return _inherits(e, t),
	_createClass(e, [{
				key: "hide",
				value: function () {
					Editor.Gizmo.prototype.hide.call(this),
					this.target.editing = !1
				}
			}, {
				key: "visible",
				value: function () {
					return !0
				}
			}, {
				key: "rectHitTest",
				value: function (t, e) {
					var i = this._root.tbox(),
					r = _Scene.NodeUtils.getWorldPosition(this.node);
					return !!e && t.containsRect(cc.rect(r.x - i.width / 2, r.y - i.height / 2, i.width, i.height))
				}
			}, {
				key: "createMoveCallbacks",
				value: function (t) {
					var e = Editor.Gizmo.prototype.createMoveCallbacks.call(this, t),
					i = (this._root, this);
					return {
						start: function () {
							i.target.editing && e.start.apply(i, arguments)
						},
						update: function () {
							i.target.editing && e.update.apply(i, arguments)
						},
						end: function () {
							i.target.editing && e.end.apply(i, arguments)
						}
					}
				}
			}, {
				key: "dirty",
				value: function i() {
					var i = Editor.Gizmo.prototype.dirty.call(this);
					return this.target.editing ? this._targetEditing || (this._targetEditing = !0, this.enterEditing(), i = !0) : this._targetEditing && (this._targetEditing = !1, this.leaveEditing(), i = !0),
					i
				}
			}
		]),
	e
}
(Editor.Gizmo);
module.exports = ColliderGizmo;
