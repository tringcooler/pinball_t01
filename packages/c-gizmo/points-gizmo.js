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
	
	_add_line (node, p1 = cc.Vec2.ZERO, p2 = cc.Vec2.ZERO) {
		let line_comb = node.group();
		let line_draw = line_comb.line(p1.x, p1.y, p2.x, p2.y)
			.style("stroke-width", 1);
		let line_check = line_comb.line(p1.x, p1.y, p2.x, p2.y)
			.style("stroke-width", 8)
			.style("stroke-opacity", 0);
		return line_comb;
	}
	
	_add_point (node) {
		let circle_comb = node.group();
		let circle_draw = circle_comb.circle()
			.radius(2);
		let circle_check = circle_comb.circle()
			.radius(4)
			.style("fill-opacity", 0);;
		return circle_comb;
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
	
	onCreateRoot () {
		let tool = this._root.group();
		
		let shape = this._tool.polygon()
			.fill({color: this._colors.shape})
			.stroke('none')
			.style('pointer-events', 'fill')
		tool._shape = shape;
		
		let lines = this._tool.group()
			.stroke({color: this._colors.lines}),
			.style('pointer-events', 'stroke')
			.style('cursor', 'copy')
			.hide();
		tool._lines = lines;
		
		let points = this._tool.group()
			.fill({color: this._colors.shape})
			.stroke('none')
			.style('pointer-events', 'bounding-box')
			.style('cursor', 'pointer')
			.hide();
		tool._points = points;
		
		tool.on('mousemove', (ev) => {
			var cutting = e.ctrlKey || e.metaKey;
			if(cutting != this._cutting_mode) {
				this._cutting_mode = cutting;
				if(this._cutting_mode) {
					this.enter_cutting();
				} else {
					this.leave_cutting();
				}
			}
		});
		
		this._tool = tool;
	}
	
	onUpdate () {
		this._tool.plot();
	}
	
	hide () {
		super();
		this.target.editing = false;
		this.target.editing = false;
	}
	
	visible () {
		let v = super();
		return (this._editing_mode || v);
	}
	
	dirty () {
		let dirty = super();
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