"use strict";

/* globals Editor, cc */

const chroma = require('chroma-js');

class points_gizmo extends Editor.Gizmo {
	init () {
		this._editing_mode = false;
		this._cutting_mode = false;
		this._colors = {
			shape: 'rgba(0,128,255,0.2)',
			lines: '#7fc97a',
			points: '#7fc97a',
		};
	}
	
	_brighter_color (color) {
		return chroma(color).brighter().brighter().hex();
	}
	
	_set_paint_hndl (node, color, paint_type) {
		node[paint_type]({color: color});
		node.on('mouseover', (ev) => {
			// when use mouseenter ?
			node[paint_type]({color: this._brighter_color(color)});
		});
		node.on('mouseout', (ev) => {
			// when use mouseleave without stopPropagation ?
			//ev.stopPropagation();
			node[paint_type]({color: color});
		});
	}
	
	_get_elm_from_pool (node, idx) {
		let pool = node._pool;
		while(idx >= pool.length) {
			pool.push(node._new_elm(node));
		}
		return pool[idx];
	}
	
	_hide_elms_from_pool (node, start) {
		let pool = node._pool;
		for(let i = start; i < pool.length; i ++) {
			pool[i].hide();
		}
	}
	
	onCreateRoot () {
		let tool = this._root.group();
		
		let shape = tool.polygon()
			.fill({color: this._colors.shape})
			.stroke('none')
			.style('pointer-events', 'fill');
		this.registerMoveSvg(shape, 'tt_shape');
		tool._shape = shape;
		
		let lines = tool.group()
			.style('pointer-events', 'stroke')
			.hide();
		lines._pool = [];
		// as non-method function with this: gizmo
		lines._new_elm = (node) => {
			let line_comb = node.group()
				.style('cursor', 'copy');
			let line_draw = line_comb.line()
				.style("stroke-width", 1);
			let line_check = line_comb.line()
				.style("stroke-width", 8)
				.style("stroke-opacity", 0);
			line_comb.plot = (...args) => {
				line_draw.plot.apply(line_draw, args);
				line_check.plot.apply(line_check, args);
			};
			this._set_paint_hndl(line_comb, this._colors.lines, 'stroke');
			this.registerMoveSvg(line_comb, 'tt_line');
			return line_comb;
		};
		tool._lines = lines;
		
		let points = tool.group()
			.stroke('none')
			.hide();
		points._pool = [];
		// as non-method function with this: gizmo
		points._new_elm = (node) => {
			let circle_comb = node.group()
				.style('pointer-events', 'bounding-box')
				.style('cursor', 'pointer');
			let circle_draw = circle_comb.circle()
				.radius(3);
			let circle_check = circle_comb.circle()
				.radius(4)
				.style("fill-opacity", 0);
			this._set_paint_hndl(circle_comb, this._colors.points, 'fill');
			this.registerMoveSvg(circle_comb, 'tt_points');
			return circle_comb;
		};
		tool._points = points;
		
		tool.on('mousemove', (ev) => {
			let cutting = ev.ctrlKey || ev.metaKey;
			if(cutting != this._cutting_mode) {
				this._cutting_mode = cutting;
				if(this._cutting_mode) {
					this.enter_cutting();
				} else {
					this.leave_cutting();
				}
			}
		});
		
		// as method, don't use arrow function
		//tool.plot = function (ps) {}
		// as non-method function with this: gizmo
		tool.plot = (ps) => {
			for(let i = 0; i < ps.length; i ++) {
				let ii = (i + 1) % ps.length;
				let c_point = ps[i];
				let n_point = ps[ii];
				let line_elm = this._get_elm_from_pool(lines, i);
				let point_elm = this._get_elm_from_pool(points, i);
				line_elm.plot([c_point, n_point]);
				point_elm.move(c_point[0], c_point[1]);
				line_elm.show();
				point_elm.show();
			}
			this._hide_elms_from_pool(lines);
			this._hide_elms_from_pool(points);
			shape.plot(ps);
		};
		
		this._tool = tool;
	}
	
	onUpdate () {
		let s_ps = this.target.points;
		let s_pos = this.target.offset;
		let s_node = this.target.node;
		let d_ps = [];
		for(let i = 0; i < s_ps.length; i ++) {
			let s_p = s_ps[i].add(s_pos);
			let d_p = s_node.convertToWorldSpaceAR(s_p);
			d_p = this.worldToPixel(d_p);
			d_p = Editor.GizmosUtils.snapPixelWihVec2(d_p);
			d_ps.push([d_p.x, d_p.y]);
		}
		this._tool.plot(d_ps);
	}
	
	hide () {
		super.hide();
		this.target.editing = false;
		this.target.editing = false;
	}
	
	visible () {
		let v = super.visible();
		return (this._editing_mode || v);
	}
	
	dirty () {
		let dirty = super.dirty();
		if(this.target.editing != this._editing_mode) {
			dirty = true;
			this._editing_mode = this.target.editing;
			if(this._editing_mode) {
				this.enter_editing();
			} else {
				this.leave_editing();
			}
		}
		return dirty;
	}
	
	enter_editing () {
		this._tool._shape.style("cursor", "move");
		this._tool._lines.show();
		this._tool._points.show();
	}
	
	leave_editing () {
		this._tool._shape.style("cursor", null);
		this._tool._lines.hide();
		this._tool._points.hide();
	}
	
	enter_cutting () {
		this._tool._lines.style('cursor', 'pointer');
	}
	
	leave_cutting () {
		this._tool._lines.style('cursor', 'copy');
	}
}

module.exports = points_gizmo;
