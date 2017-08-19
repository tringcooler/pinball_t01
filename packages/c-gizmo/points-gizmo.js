"use strict";

/* globals Editor */

class points_gizmo extends Editor.Gizmo {
	init () {
		this._editing_mode = false;
		this._appending_mode = false;
	}
	
	onCreateRoot () {
		let tool = this._root.group();
		
		let shape = this._tool.polygon()
			.fill({color: "rgba(0,128,255,0.2)"})
			.stroke("none")
			.style("pointer-events", "fill");
		tool._shape = shape;
		
		let lines = this._tool.group()
			.style("pointer-events", "stroke")
			.style("cursor", "copy");
		tool._lines = lines;
		
		let points = this._tool.group();
		tool._points = points;
		
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
		if(this._editing_mode && this.target.appending != this._appending_mode) {
			dirty = true;
			this._appending_mode = this.target.appending;
			if(this._appending_mode) {
				this.enter_appending();
			} else {
				this.leave_appending();
			}
		}
		return dirty;
	}
	
	enter_editing () {

	}
	
	leave_editing () {

	}
	
	enter_appending () {

	}
	
	leave_appending () {

	}
}