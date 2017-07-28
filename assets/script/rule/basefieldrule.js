/*jshint maxerr: 10000 */
var _g_debug = true;

var baserule = require('baserule');

cc.Class({
    extends: baserule,

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
    },
    
    statics: {
        rule_interacts: [],
        rule_rect_field: false,
    },
    
    get_world: function (field = null) {
        if(field === null) {
            field = this;
        }
        var col = field.node.getComponent(cc.Collider);
        if(!col) {
            throw 'no collider found';
        }
        return col.world;
    },
    
    update_world: function (field = null) {
        if(field === null) {
            field = this;
        }
        var cm = cc.director.getCollisionManager();
        var col = field.node.getComponent(cc.Collider);
        cm.updateCollider(col);
    },
    
    point_in_field: function(loc_pos) {
        var world_pos = this.node.convertToWorldSpaceAR(loc_pos);
        var self_world = this.get_world(this);
        var rslt = cc.rectContainsPoint(self_world.aabb, world_pos);
        if( rslt && ! this.get_rule_prop('rect_field') ) {
            rslt = cc.Intersection.pointInPolygon(world_pos, self_world.points);
        }
        return rslt;
    },
    
    points_apply_affine_transform: function (trans, points = null) {
        if(points === null) {
            points = this.get_world(this).points;
        }
        var r = [];
        for(var i = 0; i < points.length; i ++) {
            var p = points[i];
            p = cc.pointApplyAffineTransform(p, trans);
            r.push(p);
        }
        return r;
    },
    
    field_field: function(other, self_trans = null, other_trans = null) {
        var self_world = this.get_world(this);
        var other_world = this.get_world(other);
        var self_aabb = self_world.aabb;
        if(self_trans) {
            self_aabb = cc.rectApplyAffineTransform(self_aabb, self_trans);
        }
        var other_aabb = other_world.aabb;
        if(other_trans) {
            other_aabb = cc.rectApplyAffineTransform(other_aabb, other_trans);
        }
        var rslt = cc.Intersection.rectRect(self_aabb, other_aabb);
        if( rslt && ! (this.get_rule_prop('rect_field')
            && other.get_rule_prop('rect_field')) ) {
            var self_points = self_world.points;
            console.log('ff1', this.name, self_points[0], self_points[1], self_points[2], self_points[3]);
            if(self_trans) {
                self_points = this.points_apply_affine_transform(
                    self_trans, self_points);
            }
            console.log('ff2', self_points[0], self_points[1], self_points[2], self_points[3]);
            var other_points = other_world.points;
            if(other_trans) {
                other_points = this.points_apply_affine_transform(
                    other_trans, other_points);
            }
            rslt = cc.Intersection.polygonPolygon(self_points, other_points);
            console.log('ff3', rslt, other_points[0], other_points[1], other_points[2], other_points[3]);
        }
        return rslt;
    },
    
    _get_global_field: function (fld) {
        //var nd_name = 'ruler/' + fld;
        var nd_name = fld;
        var fld_nd = cc.find(nd_name);
        if(!fld_nd) {
            return undefined;
        }
        var fld_cp = fld_nd.getComponent(fld);
        if(!fld_cp) {
            return undefined;
        }
        return fld_cp;
    },
    
    _chk_global_field: function (fld) {
        if(fld.slice(0, 3) == 'gf_') {
            var fld_cp = this._get_global_field(fld);
            if(fld_cp) {
                return fld_cp;
            }
            var md_name = fld.slice(3);
            var fld_md;
            try {
                fld_md = require(md_name);
            } catch (ex) {
                if (ex instanceof Error && ex.code == "MODULE_NOT_FOUND") {
                    fld_md = undefined;
                } else {
                    throw ex;
                }
            }
            if(!fld_md) {
                return undefined;
            }
            var fld_nd = new cc.Node(fld);
            fld_cp = fld_nd.addComponent(fld_md);
            //this.ruler_node.addChild(fld_nd);
            cc.director.getScene().addChild(fld_nd);
            return fld_cp;
        } else {
            return undefined;
        }
    },
    
    set_interact: function (interact, enable = true) {
        if(!(interact in this.interact_pool)) {
            var _info = {
                enable: enable,
                global: false,
                pool: [],
            };
            var glb_fld = this._chk_global_field(interact);
            if(glb_fld) {
                _info.global = true;
                _info.pool = [glb_fld];
            }
            this.interact_pool[interact] = _info;
        } else {
            this.interact_pool[interact].enable = enable;
        }
    },
    
    remove_interact: function (interact) {
        if(interact in this.interact_pool) {
            delete this.interact_pool[interact];
        }
    },
    
    enable_interact: function (interact) {
        if(!(interact in this.interact_pool)) {
            throw 'unknown interact field';
        }
        this.set_interact(interact, true);
    },
    
    disable_interact: function (interact) {
        if(!(interact in this.interact_pool)) {
            throw 'unknown interact field';
        }
        this.set_interact(interact, false);
    },
    
    push_interact: function (interact, field) {
        if(!(interact in this.interact_pool)) {
            throw 'unknown interact field';
        }
        if(this.interact_pool[interact].pool.indexOf(field) == -1) {
            this.interact_pool[interact].pool.push(field);
        }
    },
    
    peek_interact: function (interact, field = null) {
        if(!(interact in this.interact_pool)) {
            throw 'unknown interact field';
        }
        if(this.interact_pool[interact].pool.length <= 0) {
            return undefined;
        }
        if(field === null) {
            return this.interact_pool[interact].pool.pop();
        } else {
            var _idx = this.interact_pool[interact].pool.indexOf(field);
            if(_idx == -1) {
                return undefined;
            } else {
                var peek = this.interact_pool[interact].pool.splice(_idx, 1)[0];
                if(peek != field) {
                    throw 'peek interact invalid';
                }
                return peek;
            }
        }
    },
    
    foreach_interact: function (interact, cb, args = []) {
        if(!(interact in this.interact_pool)) {
            throw 'unknown interact field';
        }
        var fields = this.interact_pool[interact].pool;
        var glb = this.interact_pool[interact].global;
        var en = this.interact_pool[interact].enable;
        if(!en) return;
        for(var i = 0; i < fields.length; i ++) {
            if(cb.apply(this, [fields[i], interact, glb].concat(args)) === false) {
                //break;
                return false;
            }
        }
    },
    
    foreach_interacts: function (cb, args = []) {
        for(var ia in this.interact_pool) {
            if(this.foreach_interact(ia, cb, args) === false) {
                return false;
            }
        }
    },
    
    _has_interact: function (interact) {
        if(!(interact in this.interact_pool)) {
            throw 'unknown interact field';
        }
        var fields = this.interact_pool[interact].pool;
        var en = this.interact_pool[interact].enable;
        if(!en) return false;
        return (fields.length > 0);
    },
    
    has_interact: function (interact = null) {
        if(interact === null) {
            for(var ia in this.interact_pool) {
                if(this._has_interact(ia)) {
                    return true;
                }
            }
            return false;
        } else {
            return this._has_interact(interact);
        }
    },
    
    onCollisionEnter: function (other, self) {
        for(var interact in this.interact_pool) {
            var d_fields = other.node.getComponents(interact);
            for(var i = 0; i < d_fields.length; i ++) {
                if(_g_debug) {
                    cc.log('onCollisionEnter',
                        this.get_rel_pos(d_fields[i]),
                        this.get_loc_pos(d_fields[i]));
                }
                this.push_interact(interact, d_fields[i]);
            }
        }
    },
    
    onCollisionExit: function (other, self) {
        for(var interact in this.interact_pool) {
            if(this.interact_pool[interact].global) {
                continue;
            }
            var d_fields = other.node.getComponents(interact);
            for(var i = 0; i < d_fields.length; i ++) {
                if(_g_debug) {
                    cc.log('onCollisionExit',
                        this.get_rel_pos(d_fields[i]),
                        this.get_loc_pos(d_fields[i]));
                }
                this.peek_interact(interact, d_fields[i]);
            }
        }
    },

    // use this for initialization
    onLoad: function () {
        this.interact_pool = {};
        var interacts = this.get_rule_prop('interacts');
        for(var i = 0; i < interacts.length; i ++) {
            this.set_interact(interacts[i], true);
        }
        var cm = cc.director.getCollisionManager();
        if(!cm.enabled) {
            cm.enabled = true;
        }
        if(_g_debug) {
            if(!cm.enabledDebugDraw) {
                cm.enabledDebugDraw = true;
                //cm.enabledDrawBoundingBox = true;
            }
        } else {
            if(cm.enabledDebugDraw) {
                cm.enabledDebugDraw = false;
                //cm.enabledDrawBoundingBox = false;
            }
        }
        this._super(); // init_rule is called at the end of here
    },

    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },
});
