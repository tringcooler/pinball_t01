var util = require('util');
var ruler = require('ruler');

cc.Class({
    extends: cc.Component,

    properties: {
        // foo: {
        //    default: null,      // The default value will be used only when the component attaching
        //                           to a node for the first time
        //    url: cc.Texture2D,  // optional, default is typeof default
        //    serializable: true, // optional, default is true
        //    visible: true,      // optional, default is true
        //    displayName: 'Foo', // optional
        //    readonly: false,    // optional, default is false
        // },
        // ...
        
        bypass: false,
    },
    
    statics: {
        rule_priority: 0,
        rule_tags: ['a'],
    },
    
    get_rel_pos: function (dst_field, loc_pos = cc.Vec2.ZERO) {
        var world_pos = this.node.convertToWorldSpaceAR(loc_pos);
        var rel_pos = dst_field.node.convertToNodeSpaceAR(world_pos);
        return rel_pos;
    },
    
    get_loc_pos: function (src_field, rel_pos = cc.Vec2.ZERO) {
        var world_pos = src_field.node.convertToWorldSpaceAR(rel_pos);
        var loc_pos = this.node.convertToNodeSpaceAR(world_pos);
        return loc_pos;
    },
    
    get_prop: function (key) {
        return this[key];
    },
    
    get_sprop: function (key) {
        return this.constructor[key];
    },
    
    get_rule_prop: function (key) {
        if(['name'].indexOf(key) == -1) {
            if(this.hasOwnProperty(key)) {
                return this[key];
            }
            key = 'rule_' + key;
        }
        return this.get_sprop(key);
    },
    
    has_tags: function (tags) {
        if(!tags) {
            return false;
        }
        if(!(tags instanceof Array)) {
            tags = [tags];
        }
        var self_tags = this.get_rule_prop('tags');
        var array_intersect = require('util').array_intersect;
        return array_intersect(self_tags, tags);
    },
    
    get_rule: function (name) {
        var d_rule = this.node.getComponent(name);
        if(d_rule && d_rule.is_inited()) {
            return d_rule;
        } else {
            return undefined;
        }
    },
    
    get_rules: function (name) {
        var d_rules = this.node.getComponents(name);
        for(var i = d_rules.length - 1; i > -1; i --) {
            if(!d_rules[i].is_inited()) {
                d_rules.splice(i, 1);
            }
        }
        return d_rules;
    },
    
    is_inited: function () {
        if(typeof this._inited == 'undefined') {
            return false;
        } else {
            return this._inited;
        }
    },
    
    set_n2p_affine: function (af) {
        var skscrt = util.affine.affine2skscrt(af);
        var ONE_DEGREE = Math.PI / 180;
        this.node.skewX = Math.atan(skscrt[0]) / ONE_DEGREE;
        this.node.skewY = Math.atan(skscrt[1]) / ONE_DEGREE;
        this.node.scaleX = skscrt[2];
        this.node.scaleY = skscrt[3];
        this.node.rotation = skscrt[4] / ONE_DEGREE;
        this.node.x = skscrt[5];
        this.node.y = skscrt[6];
        this.node.setNodeDirty();
    },
    
    set_n2w_affine: function (af) {
        var prt_ta = this.node.parent.getNodeToWorldTransformAR();
        var prt_af = util.affine.dot(cc.affineTransformInvert(prt_ta), af);
        return this.set_n2p_affine(prt_af);
    },
    
    apply_loc_affine: function (af) {
        // not already updated after other rule's change
        // this return the status of update routing began after render
        var cur = this.node.getNodeToWorldTransformAR();
        var aft = util.affine.dot(cur, af);
        return this.set_n2w_affine(aft);
    },
    
    apply_world_affine: function (af) {
        // not already updated after other rule's change
        // this return the status of update routing began after render
        var cur = this.node.getNodeToWorldTransformAR();
        var aft = util.affine.dot(af, cur);
        return this.set_n2w_affine(aft);
    },
    
    get_global: function (key) {
        var pool = this.ruler.get_global(this);
        return pool[key];
    },
    
    set_global: function (key, val) {
        var pool = this.ruler.get_global(this);
        pool[key] = val;
    },
    
    init_rule: function () {
        this._inited = true;
    },
    
    update_rule: function (dt) {
        if(!this.is_inited()) {
            throw 'rule uninited';
        }
    },

    // use this for initialization
    onLoad: function () {
        var ruler_cp = null;
        var ruler_nd = cc.find('ruler');
        if(!ruler_nd) {
            var root = cc.director.getScene();
            ruler_nd = new cc.Node('ruler');
            ruler_cp = ruler_nd.addComponent(ruler);
            root.addChild(ruler_nd);
        } else {
            ruler_cp = ruler_nd.getComponent(ruler);
        }
        this.ruler_node = ruler_nd;
        this.ruler = ruler_cp;
        ruler_cp.push(this);
    },
    
    onDestroy: function () {
        this.ruler.remove(this);
    },

    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },
});
