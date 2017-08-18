"use strict";
var Chroma = require("chroma-js"), addMoveHandles = require("./utils").addMoveHandles, Tools = {};
module.exports = Tools, Tools.scaleSlider = function (o, t, e, r) {
	var l = o.group(),
	n = l.line(0, 0, t, 0).stroke({
			width: 1,
			color: e
		}),
	c = l.polygon([[t, 5], [t, -5], [t + 10, -5], [t + 10, 5]]).fill({
			color: e
		}).stroke({
			width: 1,
			color: e
		}),
	a = !1;
	return l.style("pointer-events", "bounding-box"),
	l.resize = function (o) {
		n.plot(0, 0, o, 0),
		c.plot([[o, 5], [o, -5], [o + 10, -5], [o + 10, 5]])
	},
	l.on("mouseover", function (o) {
		var t = Chroma(e).brighter().hex();
		n.stroke({
			color: t
		}),
		c.fill({
			color: t
		}).stroke({
			width: 1,
			color: t
		})
	}),
	l.on("mouseout", function (o) {
		o.stopPropagation(),
		a || (n.stroke({
				color: e
			}), c.fill({
				color: e
			}).stroke({
				width: 1,
				color: e
			}))
	}),
	addMoveHandles(l, {
		start: function (o, t, e) {
			a = !0,
			n.stroke({
				color: "#ff0"
			}),
			c.fill({
				color: "#ff0"
			}).stroke({
				width: 1,
				color: "#ff0"
			}),
			r.start && r.start.call(l, o, t, e)
		},
		update: function (o, t, e) {
			r.update && r.update.call(l, o, t, e)
		},
		end: function (o) {
			a = !1,
			n.stroke({
				color: e
			}),
			c.fill({
				color: e
			}).stroke({
				width: 1,
				color: e
			}),
			r.end && r.end.call(l, o)
		}
	}),
	l
}, Tools.freemoveTool = function (o, t, e, r) {
	var l = !1,
	n = o.circle(t, t).move(.5 * -t, .5 * -t).fill({
			color: e,
			opacity: .6
		}).stroke({
			width: 2,
			color: e
		});
	return n.on("mouseover", function (o) {
		var t = Chroma(e).brighter().hex();
		this.fill({
			color: t
		}).stroke({
			color: t
		})
	}),
	n.on("mouseout", function (o) {
		o.stopPropagation(),
		l || this.fill({
			color: e
		}).stroke({
			color: e
		})
	}),
	addMoveHandles(n, {
		start: function (o, t, e) {
			l = !0,
			this.fill({
				color: "#cc5"
			}).stroke({
				color: "#cc5"
			}),
			r.start && r.start.call(n, o, t, e)
		},
		update: function (o, t, e) {
			r.update && r.update.call(n, o, t, e)
		},
		end: function (o) {
			l = !1,
			this.fill({
				color: e
			}).stroke({
				color: e
			}),
			r.end && r.end.call(n, o)
		}
	}),
	n
}, Tools.arrowTool = function (o, t, e, r) {
	var l = o.group(),
	n = l.line(0, 0, t, 0).stroke({
			width: 1,
			color: e
		}),
	c = l.polygon([[t, 5], [t, -5], [t + 15, 0]]).fill({
			color: e
		}).stroke({
			width: 1,
			color: e
		}),
	a = !1;
	return l.style("pointer-events", "bounding-box"),
	l.on("mouseover", function (o) {
		var t = Chroma(e).brighter().hex();
		n.stroke({
			color: t
		}),
		c.fill({
			color: t
		}).stroke({
			width: 1,
			color: t
		})
	}),
	l.on("mouseout", function (o) {
		o.stopPropagation(),
		a || (n.stroke({
				color: e
			}), c.fill({
				color: e
			}).stroke({
				width: 1,
				color: e
			}))
	}),
	addMoveHandles(l, {
		start: function (o, t, e) {
			a = !0,
			n.stroke({
				color: "#ff0"
			}),
			c.fill({
				color: "#ff0"
			}).stroke({
				width: 1,
				color: "#ff0"
			}),
			r.start && r.start.call(l, o, t, e)
		},
		update: function (o, t, e) {
			r.update && r.update.call(l, o, t, e)
		},
		end: function (o) {
			a = !1,
			n.stroke({
				color: e
			}),
			c.fill({
				color: e
			}).stroke({
				width: 1,
				color: e
			}),
			r.end && r.end.call(l, o)
		}
	}),
	l
}, Tools.positionTool = function (o, t) {
	var e,
	r,
	l,
	n = o.group();
	n.position = cc.v2(0, 0),
	n.rotation = 0,
	e = Tools.arrowTool(o, 80, "#f00", {
			start: function (o, e, r) {
				t.start && t.start.call(n, o, e, r)
			},
			update: function (o, e, r) {
				var l = Editor.Math.deg2rad(n.rotation),
				c = Math.cos(l),
				a = Math.sin(l),
				i = Math.sqrt(o * o + e * e),
				s = Math.atan2(a, c) - Math.atan2(e, o);
				i *= Math.cos(s),
				t.update && t.update.call(n, c * i, a * i, r)
			},
			end: function (o) {
				t.end && t.end.call(n, o)
			}
		}),
	e.translate(20, 0),
	n.add(e),
	r = Tools.arrowTool(o, 80, "#5c5", {
			start: function (o, e, r) {
				t.start && t.start.call(n, o, e, r)
			},
			update: function (o, e, r) {
				var l = Editor.Math.deg2rad(n.rotation + 90),
				c = Math.cos(l),
				a = Math.sin(l),
				i = Math.sqrt(o * o + e * e),
				s = Math.atan2(a, c) - Math.atan2(e, o);
				i *= Math.cos(s),
				t.update && t.update.call(n, c * i, a * i, r)
			},
			end: function (o) {
				t.end && t.end.call(n, o)
			}
		}),
	r.translate(0, -20),
	r.rotate(-90, 0, 0),
	n.add(r);
	var c = "#05f",
	a = !1;
	return l = n.rect(20, 20).move(0, -20).fill({
			color: c,
			opacity: .4
		}).stroke({
			width: 1,
			color: c
		}),
	l.on("mouseover", function (o) {
		var t = Chroma(c).brighter().hex();
		this.fill({
			color: t
		}).stroke({
			color: t
		})
	}),
	l.on("mouseout", function (o) {
		o.stopPropagation(),
		a || this.fill({
			color: c
		}).stroke({
			color: c
		})
	}),
	addMoveHandles(l, {
		start: function (o, e, r) {
			a = !0,
			this.fill({
				color: "#cc5"
			}).stroke({
				color: "#cc5"
			}),
			t.start && t.start.call(n, o, e, r)
		},
		update: function (o, e, r) {
			t.update && t.update.call(n, o, e, r)
		},
		end: function (o) {
			a = !1,
			this.fill({
				color: c
			}).stroke({
				color: c
			}),
			t.end && t.end.call(n, o)
		}
	}),
	n
}, Tools.rotationTool = function (o, t) {
	var e,
	r,
	l,
	n,
	c,
	a = o.group(),
	i = !1,
	s = "#f00";
	a.position = new cc.Vec2(0, 0),
	a.rotation = 0,
	e = a.path("M50,-10 A50,50, 0 1,0 50,10").fill("none").stroke({
			width: 2,
			color: s
		}),
	n = a.path().fill({
			color: s,
			opacity: .4
		}).stroke({
			width: 1,
			color: s
		}),
	n.hide();
	var u = 50;
	r = a.line(0, 0, u, 0).stroke({
			width: 1,
			color: s
		}),
	l = a.polygon([[u, 5], [u, -5], [u + 15, 0]]).fill({
			color: s
		}).stroke({
			width: 1,
			color: s
		}),
	c = a.text("0").plain("").fill({
			color: "white"
		}).font({
			anchor: "middle"
		}).hide().translate(30, 0),
	a.style("pointer-events", "visibleFill"),
	a.on("mouseover", function (o) {
		var t = Chroma(s).brighter().hex();
		e.fill({
			color: t,
			opacity: .1
		}).stroke({
			color: t
		}),
		r.stroke({
			color: t
		}),
		l.fill({
			color: t
		}).stroke({
			width: 1,
			color: t
		})
	}),
	a.on("mouseout", function (o) {
		o.stopPropagation(),
		i || (e.fill({
				color: "none"
			}).stroke({
				color: s
			}), r.stroke({
				color: s
			}), l.fill({
				color: s
			}).stroke({
				width: 1,
				color: s
			}))
	});
	var d,
	h;
	return addMoveHandles(a, {
		start: function (o, s, u) {
			i = !0,
			e.fill({
				color: "none"
			}).stroke({
				color: "#cc5"
			}),
			r.stroke({
				color: "#cc5"
			}),
			l.fill({
				color: "#cc5"
			}).stroke({
				width: 1,
				color: "#cc5"
			}),
			n.show(),
			n.plot("M40,0 A40,40, 0 0,1 40,0 L0,0 Z"),
			c.plain("0°"),
			c.rotate(0, -30, 0),
			c.show(),
			d = o - a.position.x,
			h = s - a.position.y,
			t.start && t.start.call(a, o, s, u)
		},
		update: function (o, e, r) {
			var l = new cc.Vec2(d, h),
			i = new cc.Vec2(d + o, h + e),
			s = l.magSqr(),
			u = i.magSqr();
			if (s > 0 && u > 0) {
				var f = l.dot(i),
				p = l.cross(i),
				y = Math.sign(p) * Math.acos(f / Math.sqrt(s * u)),
				v = Math.cos(y),
				T = Math.sin(y),
				x = Editor.Math.rad2deg(y);
				c.rotate(x, -30, 0),
				y = -y,
				x = -x,
				y > 0 ? (n.plot("M40,0 A40,40, 0 0,0 " + 40 * v + "," + 40 * T + " L0,0"), c.plain("+" + x.toFixed(0) + "°")) : (n.plot("M40,0 A40,40, 0 0,1 " + 40 * v + "," + 40 * T + " L0,0"), c.plain(x.toFixed(0) + "°"))
			}
			var k = Math.atan2(l.y, l.x) - Math.atan2(i.y, i.x);
			t.update && t.update.call(a, Editor.Math.rad2deg(k), r)
		},
		end: function (o) {
			i = !1,
			e.stroke({
				color: s
			}),
			r.stroke({
				color: s
			}),
			l.fill({
				color: s
			}).stroke({
				width: 1,
				color: s
			}),
			n.hide(),
			c.hide(),
			t.end && t.end.call(a, o)
		}
	}),
	a
}, Tools.scaleTool = function (o, t) {
	var e,
	r,
	l,
	n = o.group();
	n.position = new cc.Vec2(0, 0),
	n.rotation = 0,
	e = Tools.scaleSlider(o, 100, "#f00", {
			start: function (o, e, r) {
				t.start && t.start.call(n, o, e, r)
			},
			update: function (o, r, l) {
				var c = n.rotation * Math.PI / 180,
				a = Math.cos(c),
				i = Math.sin(c),
				s = Math.sqrt(o * o + r * r),
				u = Math.atan2(i, a) - Math.atan2(r, o);
				s *= Math.cos(u),
				e.resize(s + 100),
				t.update && t.update.call(n, s / 100, 0, l)
			},
			end: function (o) {
				e.resize(100),
				t.end && t.end.call(n, o)
			}
		}),
	n.add(e),
	r = Tools.scaleSlider(o, 100, "#5c5", {
			start: function (o, e, r) {
				t.start && t.start.call(n, o, e, r)
			},
			update: function (o, e, l) {
				var c = (n.rotation + 90) * Math.PI / 180,
				a = Math.cos(c),
				i = Math.sin(c),
				s = Math.sqrt(o * o + e * e),
				u = Math.atan2(i, a) - Math.atan2(e, o);
				s *= Math.cos(u),
				r.resize(-1 * s + 100),
				t.update && t.update.call(n, 0, s / 100, l)
			},
			end: function (o) {
				r.resize(100),
				t.end && t.end.call(n, o)
			}
		}),
	r.rotate(-90, 0, 0),
	n.add(r);
	var c = "#aaa",
	a = !1;
	return l = n.rect(20, 20).move(-10, -10).fill({
			color: c,
			opacity: .4
		}).stroke({
			width: 1,
			color: c
		}),
	l.on("mouseover", function (o) {
		var t = Chroma(c).brighter().hex();
		this.fill({
			color: t
		}).stroke({
			color: t
		})
	}),
	l.on("mouseout", function (o) {
		o.stopPropagation(),
		a || this.fill({
			color: c
		}).stroke({
			color: c
		})
	}),
	addMoveHandles(l, {
		start: function (o, e, r) {
			a = !0,
			this.fill({
				color: "#cc5"
			}).stroke({
				color: "#cc5"
			}),
			t.start && t.start.call(n, o, e, r)
		},
		update: function (o, l, c) {
			var a = 1,
			i = -1,
			s = Math.sqrt(o * o + l * l),
			u = Math.atan2(i, a) - Math.atan2(l, o);
			s *= Math.cos(u),
			e.resize(s + 100),
			r.resize(s + 100),
			t.update && t.update.call(n, a * s / 100, i * s / 100, c)
		},
		end: function (o) {
			a = !1,
			this.fill({
				color: c
			}).stroke({
				color: c
			}),
			e.resize(100),
			r.resize(100),
			t.end && t.end.call(n, o)
		}
	}),
	n
}, Tools.circleTool = function (o, t, e, r, l, n) {
	"string" != typeof l && (n = l, l = "default");
	var c = o.group().style("cursor", l).fill(e ? e : "none").stroke(r ? r : "none"),
	a = c.circle().radius(t / 2),
	i = void 0;
	r && (i = c.circle().stroke({
				width: 8
			}).fill("none").style("stroke-opacity", 0).radius(t / 2));
	var s = !1;
	return c.style("pointer-events", "bounding-box"),
	c.on("mouseover", function () {
		if (e) {
			var o = Chroma(e.color).brighter().hex();
			c.fill({
				color: o
			})
		}
		if (r) {
			var t = Chroma(r.color).brighter().hex();
			c.stroke({
				color: t
			})
		}
	}),
	c.on("mouseout", function (o) {
		o.stopPropagation(),
		s || (e && c.fill(e), r && c.stroke(r))
	}),
	addMoveHandles(c, {
		cursor: l
	}, {
		start: function (o, t, l) {
			if (s = !0, e) {
				var a = Chroma(e.color).brighter().brighter().hex();
				c.fill({
					color: a
				})
			}
			if (r) {
				var i = Chroma(r.color).brighter().brighter().hex();
				c.stroke({
					color: i
				})
			}
			n.start && n.start(o, t, l)
		},
		update: function (o, t, e) {
			n.update && n.update(o, t, e)
		},
		end: function (o) {
			s = !1,
			e && c.fill(e),
			r && c.stroke(r),
			n.end && n.end(o)
		}
	}),
	c.radius = function (o) {
		return a.radius(o),
		i && i.radius(o),
		this
	},
	c.cx = function (o) {
		return this.x(o)
	},
	c.cy = function (o) {
		return this.y(o)
	},
	c
}, Tools.lineTool = function (o, t, e, r, l, n) {
	var c = o.group().style("cursor", l).stroke({
			color: r
		}),
	a = c.line(t.x, t.y, e.x, e.y).style("stroke-width", 1),
	i = c.line(t.x, t.y, e.x, e.y).style("stroke-width", 8).style("stroke-opacity", 0),
	s = !1;
	return c.on("mouseover", function (o) {
		var t = Chroma(r).brighter().hex();
		c.stroke({
			color: t
		})
	}),
	c.on("mouseout", function (o) {
		o.stopPropagation(),
		s || c.stroke({
			color: r
		})
	}),
	addMoveHandles(c, {
		cursor: l
	}, {
		start: function (o, t, e) {
			s = !0;
			var l = Chroma(r).brighter().brighter().hex();
			c.stroke({
				color: l
			}),
			n.start && n.start(o, t, e)
		},
		update: function (o, t, e) {
			n.update && n.update(o, t, e)
		},
		end: function (o) {
			s = !1,
			c.stroke({
				color: r
			}),
			n.end && n.end(o)
		}
	}),
	c.plot = function () {
		return a.plot.apply(a, arguments),
		i.plot.apply(i, arguments),
		this
	},
	c
}, Tools.positionLineTool = function (o, t, e, r, l, n) {
	var c = o.group(),
	a = c.line(t.x, e.y, e.x, e.y).stroke({
			width: 1,
			color: l
		}),
	i = c.line(e.x, t.y, e.x, e.y).stroke({
			width: 1,
			color: l
		}),
	s = c.text("" + r.x).fill(n),
	u = c.text("" + r.y).fill(n),
	d = function (o) {
		var t = o.offset(0, 0)["in"](o.sourceAlpha).gaussianBlur(1);
		o.blend(o.source, t)
	};
	return s.filter(d),
	u.filter(d),
	c.style("stroke-dasharray", "5 5"),
	c.style("stroke-opacity", .8),
	c.plot = function (o, t, e) {
		return a.plot.call(i, o.x, t.y, t.x, t.y),
		i.plot.call(a, t.x, o.y, t.x, t.y),
		s.text("" + Math.floor(e.x)).move(o.x + (t.x - o.x) / 2, t.y),
		u.text("" + Math.floor(e.y)).move(t.x, o.y + (t.y - o.y) / 2),
		this
	},
	c
};
var RectToolType = {
	None: 0,
	LeftBottom: 1,
	LeftTop: 2,
	RightTop: 3,
	RightBottom: 4,
	Left: 5,
	Right: 6,
	Top: 7,
	Bottom: 8,
	Center: 9,
	Anchor: 10
};
Tools.rectTool = function (o, t) {
	function e(o) {
		return {
			start: function (e, r, l) {
				g.type = o,
				t.start && t.start.call(g, e, r, l, o)
			},
			update: function (e, r, l) {
				t.update && t.update.call(g, e, r, l, o)
			},
			end: function (e) {
				g.type = RectToolType.None,
				t.end && t.end.call(g, e, o)
			}
		}
	}
	function r(o, t) {
		return Tools.lineTool(M, cc.v2(0, 0), cc.v2(0, 0), "#8c8c8c", t, e(o))
	}
	function l(o, t) {
		return Tools.circleTool(M, w, {
			color: "#0e6dde"
		}, null, t, e(o)).style("cursor", t)
	}
	var n,
	c,
	a,
	i,
	s,
	u,
	d,
	h,
	f,
	p,
	y,
	v,
	T,
	x,
	k,
	g = o.group(),
	M = g.group();
	g.type = RectToolType.None,
	f = g.polygon("0,0,0,0,0,0").fill("none").stroke("none"),
	f.style("pointer-events", "fill"),
	f.ignoreMouseMove = !0,
	addMoveHandles(f, {
		ignoreWhenHoverOther: !0
	}, e(RectToolType.Center));
	var m = 20;
	k = Tools.circleTool(g, m, {
			color: "#eee",
			opacity: .3
		}, {
			color: "#eee",
			opacity: .5,
			width: 2
		}, e(RectToolType.Center)),
	s = r(RectToolType.Left, "col-resize"),
	u = r(RectToolType.Top, "row-resize"),
	d = r(RectToolType.Right, "col-resize"),
	h = r(RectToolType.Bottom, "row-resize");
	var w = 8;
	n = l(RectToolType.LeftBottom, "nwse-resize"),
	c = l(RectToolType.LeftTop, "nesw-resize"),
	a = l(RectToolType.RightTop, "nwse-resize"),
	i = l(RectToolType.RightBottom, "nesw-resize"),
	y = Tools.positionLineTool(g, cc.v2(0, 0), cc.v2(0, 0), cc.v2(0, 0), "#8c8c8c", "#eee");
	var b = 10;
	p = Tools.circleTool(g, b, null, {
			width: 3,
			color: "#0e6dde"
		}, e(RectToolType.Anchor)).style("cursor", "pointer"),
	v = g.group(),
	T = v.text("0").fill("#eee"),
	x = v.text("0").fill("#eee");
	var R = function (o) {
		var t = o.offset(0, 0)["in"](o.sourceAlpha).gaussianBlur(1);
		o.blend(o.source, t)
	};
	return T.filter(R),
	x.filter(R),
	g.setBounds = function (o) {
		Math.abs(o[2].x - o[0].x) < 10 && Math.abs(o[2].y - o[0].y) < 10 ? (M.hide(), p.hide(), k.show(), k.center(o[0].x + (o[2].x - o[0].x) / 2, o[0].y + (o[2].y - o[0].y) / 2)) : (M.show(), k.hide(), f.plot([[o[0].x, o[0].y], [o[1].x, o[1].y], [o[2].x, o[2].y], [o[3].x, o[3].y]]), s.plot(o[0].x, o[0].y, o[1].x, o[1].y), u.plot(o[1].x, o[1].y, o[2].x, o[2].y), d.plot(o[2].x, o[2].y, o[3].x, o[3].y), h.plot(o[3].x, o[3].y, o[0].x, o[0].y), n.center(o[0].x, o[0].y), c.center(o[1].x, o[1].y), a.center(o[2].x, o[2].y), i.center(o[3].x, o[3].y), o.anchor ? (p.show(), p.center(o.anchor.x, o.anchor.y)) : p.hide()),
		!o.origin || g.type !== RectToolType.Center && g.type !== RectToolType.Anchor ? y.hide() : (y.show(), y.plot(o.origin, o.anchor, o.localPosition)),
		o.localSize && g.type >= RectToolType.LeftBottom && g.type <= RectToolType.Bottom ? (v.show(), T.text("" + Math.floor(o.localSize.width)), x.text("" + Math.floor(o.localSize.height)), T.center(o[1].x + (o[2].x - o[1].x) / 2, o[1].y + (o[2].y - o[1].y) / 2 + 5), x.center(o[2].x + (o[3].x - o[2].x) / 2 + 15, o[2].y + (o[3].y - o[2].y) / 2)) : v.hide()
	},
	g
}, Tools.rectTool.Type = RectToolType, Tools.icon = function (o, t, e, r) {
	var l = o.image(t).move(.5 * -e, .5 * -r).size(e, r);
	return l.on("mouseover", function (o) {
		o.stopPropagation()
	}),
	l
}, Tools.dashLength = function (o) {
	var t = _Scene.view.scale;
	return t < 1 && (t = 1),
	"number" == typeof o ? o * t : Array.isArray(o) ? o.map(function (o) {
		return o * t
	}) : 3 * t
};
