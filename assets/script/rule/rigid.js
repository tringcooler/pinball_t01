/*jshint maxerr: 10000 */
var util = require('util');
var basefieldrule = require('basefieldrule');

cc.Class({
    extends: basefieldrule,

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
        
        rect_field: false,
        
    },
    
    statics: {
        rule_priority: 15,
        rule_interacts: ['rigid'],
    },
    
    _calc_rev_trans: function () {
        var cur_trans = this.get_world(this).transform;
        if(!cur_trans) return;
        this.rev_factors.trans = cc.affineTransformConcat(
            this.rev_factors.pre_trans,
            cc.affineTransformInvert(cur_trans));
        //this.rev_factors.trans = util.affine.dot(
        //    cc.affineTransformInvert(cur_trans),
        //    this.rev_factors.pre_trans);
        this.rev_factors.pre_trans = cc.affineTransformClone(cur_trans);
    },
    
    _calc_rev_factors: function () {
        this._calc_rev_trans();
        var rsrt = util.affine.affine2rsrt(this.rev_factors.trans);
        this.rev_factors.r1sr1 = rsrt.slice(0, 3);
        this.rev_factors.r2 = rsrt[0] + rsrt[3];
        this.rev_factors.tx = rsrt[4];
        this.rev_factors.ty = rsrt[5];
    },
    
    _calc_rev_factors_rect: function () {
        var self_word = this.get_world(this);
        var rev_tx = self_word.preAabb.x - self_word.aabb.x;
        var rev_ty = self_word.preAabb.y - self_word.aabb.y;
        this.rev_factors.trans = cc.affineTransformMake(
            1, 0, 0, 1,
            rev_tx, rev_ty);
        this.rev_factors.tx = rev_tx;
        this.rev_factors.ty = rev_ty;
    },
    
    calc_rev_factors: function () {
        if(this.get_rule_prop('rect_field')) {
            return this._calc_rev_factors_rect();
        } else {
            return this._calc_rev_factors();
        }
    },
    
    rev_trans: function (dt, mask = 0xf) {
        dt = Math.max(Math.min(dt, 1), 0);
        var a = cc.affineTransformMakeIdentity();
        if(this.get_rule_prop('rect_field')) {
            mask &= 0xc0;
        }
        if(mask & 0x1) {
            var rsr = this.rev_factors.r1sr1;
            var r1 = util.affine.rotate(rsr[0]);
            var sc = util.affine.scale(1 + (rsr[1] - 1) * dt, 1 + (rsr[2] - 1) * dt)
            var r1i = util.affine.rotate(-rsr[0]);
            a = util.affine.dot(util.affine.dot(r1i, util.affine.dot(sc, r1)), a);
        }
        if(mask & 0x2) {
            a = util.affine.dot(util.affine.rotate(this.rev_factors.r2 * dt), a);
        }
        if(mask & 0xc) {
            a = util.affine.dot(
                    util.affine.translate(
                        this.rev_factors.tx * dt, this.rev_factors.ty * dt),
                    a);
        } else if(mask & 0x4) {
            a = util.affine.dot(
                    util.affine.translate(this.rev_factors.tx * dt, 0),
                    a);
        } else if(mask & 0x8) {
            a = util.affine.dot(
                    util.affine.translate(0, this.rev_factors.ty * dt),
                    a);
        }
        return a;
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
    },
    
    set_n2w_affine: function (af) {
        var prt_ta = this.node.parent.getNodeToWorldTransformAR();
        var prt_af = util.affine.dot(cc.affineTransformInvert(prt_ta), af);
        return this.set_n2p_affine(prt_af);
    },
    
    apply_affine: function (af) {
        //var cur = this.node.getNodeToParentTransformAR();
        var cur = this.node.getNodeToWorldTransformAR();
        var aft = util.affine.dot(cur, af);
        //console.log(af.tx, af.ty, aft.tx, aft.ty);
        return this.set_n2w_affine(aft);
    },
    
    _dichotomy_tree_rev_dt: function () {
        return [
            0.5, [
                0.2, [0.1, 0.1, 0.2], [0.3, 0.3, [0.4, 0.4, 0.5]]
            ], [
                0.7, [0.6, 0.6, 0.7], [0.8, 0.8, [0.9, 0.9, 1.0]]
            ]
        ];
    },
    
    _get_collision_moment: function () {
        var dichotomy = util.dichotomy;
        var _chk_collision = (function (dt) {
            var rev_trans = this.rev_trans(dt);
            var chk = this.foreach_interact('rigid', function (field) {
                if(this.field_field(field, rev_trans)) {
                    return false;
                }
            });
            return (chk === false);
        }).bind(this);
        return dichotomy(this._dichotomy_tree_rev_dt, _chk_collision);
    },
    
    init_rule: function () {
        this._super();
        this.rev_factors = {
            pre_trans: cc.affineTransformMakeIdentity(),
            trans: cc.affineTransformMakeIdentity(),
            r1sr1: [0, 1, 1],
            r2: 0,
            tx: 0,
            ty: 0,
        };
    },
    
    update_rule: function (dt) {
        this._super();
        this.calc_rev_factors();
        if(!this.has_interact('rigid')) {
            return;
        }
        var rev_dt = this._get_collision_moment();
    },

    // use this for initialization
    // onLoad: function () {

    // },

    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },
});
