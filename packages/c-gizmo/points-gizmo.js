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
			let elm = node._new_elm(node, pool.length);
			pool.push(elm);
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
		this.registerMoveSvg(shape, {type:'tt_shape'});
		tool._shape = shape;
		
		let lines = tool.group()
			.style('pointer-events', 'stroke')
			.hide();
		lines._pool = [];
		// as non-method function with this: gizmo
		lines._new_elm = (node, arg) => {
			let line_comb = node.group()
				.style('cursor', 'cell');
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
			this.registerMoveSvg(line_comb, {type: 'tt_lines', arg: arg});
			return line_comb;
		};
		tool._lines = lines;
		
		let points = tool.group()
			.stroke('none')
			.hide();
		points._pool = [];
		// as non-method function with this: gizmo
		points._new_elm = (node, arg) => {
			let circle_comb = node.group()
				.style('pointer-events', 'bounding-box')
				.style('cursor', 'pointer');
			let circle_draw = circle_comb.circle()
				.radius(2.5);
			let circle_check = circle_comb.circle()
				.radius(4)
				.style("fill-opacity", 0);
			this._set_paint_hndl(circle_comb, this._colors.points, 'fill');
			this.registerMoveSvg(circle_comb, {type:'tt_points', arg: arg});
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
			this._hide_elms_from_pool(lines, ps.length);
			this._hide_elms_from_pool(points, ps.length);
			shape.plot(ps);
		};
		
		this._tool = tool;
	}
	
	onCreateMoveCallbacks () {
		let start_pos, first_update;
		let pidx_shift;
		let vproj = (vs, vb) => vb.mul(vb.dot(vs) / vb.dot(vb));
		let vprojp = (vs, vb) => vs.sub(vproj(vs, vb));
		let vproja = (vs, vb) => {let t = vproj(vs, vb); return [t. vs.sub(t)];};
		return {
			start: (x, y, ev, args) => {
				if(!this._editing_mode) return;
				let s_ps = this.target.points;
				if(args.type == 'tt_shape') {
					start_pos = this.target.offset.clone();
				} else if(args.type == 'tt_points') {
					let idx = args.arg;
					if(this._cutting_mode) {
						this.recordChanges();
						s_ps.splice(idx, 1);
						this.commitChanges();
					} else {
						start_pos = s_ps[idx].clone();
					}
				} else if(args.type == 'tt_lines') {
					let idx1 = args.arg;
					let idx2 = (idx1 + 1) % s_ps.length;
					let s_node = this.target.node;
					let s_p1 = s_ps[idx1];
					let s_p2 = s_ps[idx2];
					if(this._cutting_mode) {
						let loc_pos = s_node.convertToNodeSpaceAR(cc.v2(x, y)).sub(this.target.offset);
						let vline = s_p2.sub(s_p1);
						let vsel = loc_pos.sub(s_p1);
						let d_p = vproj(vsel, vline).add(s_p1);
						this.adjustValue(d_p);
						this.recordChanges();
						s_ps.splice(idx2, 0, d_p);
						this.commitChanges();
					} else {
						start_pos = [s_p1.clone(), s_p2.clone()];
						pidx_shift = 0;
					}
				}
				first_update = true;
			},
			update: (dx, dy, ev, args) => {
				if(!this._editing_mode) return;
				let s_ps = this.target.points;
				let s_node = this.target.node;
				let loc_d = s_node.convertToNodeSpaceAR(cc.v2(dx, dy)).sub(s_node.convertToNodeSpaceAR(cc.Vec2.ZERO));
				if(args.type == 'tt_shape') {
					this.adjustValue(loc_d);
					this.target.offset = start_pos.add(loc_d);
				} else if(args.type == 'tt_points') {
					let idx = args.arg;
					if(!this._cutting_mode) {
						this.adjustValue(loc_d);
						s_ps[idx] = start_pos.add(loc_d);
					}
				} else if(args.type == 'tt_lines') {
					if(!this._cutting_mode) {
						let pmod = (v, l) => {let t = v % l; return t < 0 ? t + l : t;};
						let idx = (i) => pmod(args.arg + pidx_shift + i, s_ps.length);
						let s_p = (i) => s_ps[idx(i)];
						let vline = (i) => s_p(i+1).sub(s_p(i));
						let v_d = vprojp(loc_d, vline(0));
						if(v_d.mag() <= 0.0001) {
							// without clean first_update flag
							return;
						}
						let par = (i) => vprojp(v_d, vline(i)).mag() / v_d.mag() < 0.005;
						let extend_line = (di, si) => {
							// float for the same index value, actually they always are the same.
							let [pi, npi] = si > di ? [si, si + 1 + 0.2] : [di, di + 0.8];
							let d_p = start_pos[pi].add(v_d);
							this.adjustValue(d_p);
							let pidx, cr;
							if( (!first_update) || par(di)) {
								pidx = idx(pi);
								cr = false;
							} else {
								pidx = idx(npi);
								cr = true;
							}
							return [d_p, pidx, cr];
						};
						let hndl_points = (hs) => {
							let crtbl = {};
							for(let i = 0; i < hs.length; i++) {
								let [d_p, pidx, cr] = hs[i];
								if(!cr) {
									s_ps[pidx] = d_p;
								} else {
									crtbl[pidx] = d_p;
								}
							}
							// I don't know why .map(parseInt) get something like [1, NaN, NaN]
							let pidxs = Object.keys(crtbl).map((v)=>parseFloat(v)).sort((a, b)=>b-a);
							for(let i = 0; i < pidxs.length; i++) {
								let _pidx = pidxs[i];
								// 1.5 for 1 plus and 1 pass
								if(_pidx <= idx(1.5)) {
									pidx_shift ++;
								}
								s_ps.splice(parseInt(_pidx), 0, crtbl[_pidx]);
							}
						};
						hndl_points([extend_line(-1, 0), extend_line(1, 0)]);
					}
				}
				first_update = false;
			},
			// end: (updated, ev, args) => {
			// },
		};
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
		this._tool._lines.each((i, elms) => {
			elms[i].style('cursor', 'copy');
		});
		this._tool._points.each((i, elms) => {
			elms[i].style('cursor', 'alias');
		});
	}
	
	leave_cutting () {
		this._tool._lines.each((i, elms) => {
			elms[i].style('cursor', 'cell');
		});
		this._tool._points.each((i, elms) => {
			elms[i].style('cursor', 'pointer');
		});
	}
}

module.exports = points_gizmo;
