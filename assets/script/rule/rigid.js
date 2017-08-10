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
        movable: true,
        slidable: true,
    },
    
    statics: {
        rule_priority: [1, 101],
        rule_interacts: ['rigid'],
    },
    
    calc_rev_factors: function () {
        var cur_trans = this.get_world(this).transform;
        this.rev_factors.tracer.calc(cur_trans, this.rev_factors.pre_trans);
        this.rev_factors.pre_trans = cc.affineTransformClone(cur_trans);
    },
    
    rev_trans: function (dt, mask = 0xf) {
        var threshold = 0.5;
        if(this.rev_factors.next_tracer.dirty) {
            if(dt <= threshold) {
                dt = dt / threshold;
                return this.rev_factors.tracer.trace(dt, mask);
            } else {
                dt = (dt - threshold) / (1 - threshold);
                var trans = this.rev_factors.tracer.trans;
                var slide_trans = this.rev_factors.next_tracer.trace(dt, mask);
                //console.log('rev_slide', dt, trans.tx, trans.ty, slide_trans.tx, slide_trans.ty);
                return util.affine.dot(slide_trans, trans);
            }
        } else {
            return this.rev_factors.tracer.trace(dt, mask);
        }
    },
    
    prev_coll_rev_trans: function (dt, dt_prec) {
        var threshold = 0.5;
        if( this.rev_factors.next_tracer.dirty && dt > threshold) {
            var cur_trans = this.rev_trans(dt);
            var obv_dt = Math.min(dt_prec, threshold);
            var obv_trans = util.affine.invert(this.rev_trans(obv_dt));
            return util.affine.dot(obv_trans, cur_trans);
        } else {
            return this.rev_trans(dt - dt_prec);
        }
    },
    
    _update_pre_trans: function (af) {
        if(!this.get_rule_prop('rect_field')) {
            // loc affine
            //this.rev_factors.pre_trans = util.affine.dot(
            //    this.rev_factors.pre_trans, af);
            // world affine
            this.rev_factors.pre_trans = util.affine.dot(
                af, this.rev_factors.pre_trans);
        }
    },
    
    _update_pre_collision: function () {
        if(!this.get_rule_prop('rect_field')) {
            this.rev_factors.pre_collision = this.rev_factors.pre_pre_collision;
            this.rev_factors.pre_pre_collision = [];
            util.array_set.add(
                this.rev_factors.pre_collision, this.get_interact('rigid'));
        }
    },
    
    _update_slide_trans: function (rev_trans) {
        var slide_trans = util.affine.id();
        if(this.contacts.length > 0 && this.get_rule_prop('slidable')) {
            var i;
            var vec_grp = [];
            var track = util.affine.translate_invert(rev_trans);
            var anchorage_vec = cc.v2(rev_trans.tx, rev_trans.ty);
            var track_vec = cc.v2(-rev_trans.tx, -rev_trans.ty);
            for(i = 0; i < this.contacts.length; i ++) {
                var contact = this.contacts[i];
                if(!contact.field.get_rule_prop('slidable')) {
                    break;
                }
                var tangent = contact.p2.sub(contact.p1);
                var tangent_inv = cc.Vec2.ZERO.sub(tangent);
                vec_grp.push(tangent);
                vec_grp.push(tangent_inv);
            }
            if(i >= this.contacts.length) {
                var prj_vec;
                if(this.contacts.length > 1) {
                    var rblk = this.get_vector_direct(anchorage_vec, vec_grp);
                    var _t;
                    if( ([prj_vec, _t] = util.vec.projection(track_vec, rblk[0][0], true))[1] > 0
                        || ([prj_vec, _t] = util.vec.projection(track_vec, rblk[1][0], true))[1] > 0 ) {
                        slide_trans = util.affine.translate(prj_vec.x, prj_vec.y);
                    }
                } else {
                    prj_vec = util.vec.projection(track_vec, vec_grp[0]);
                    slide_trans = util.affine.translate(prj_vec.x, prj_vec.y);
                    //slide_trans = util.affine.translate_projection(
                    //    track, vec_grp[0].x, vec_grp[0].y);
                }
            }
        }
        this.rev_factors.next_trans = slide_trans;
        this.rev_factors.next_tracer.calc(this.rev_factors.next_trans);
    },
    
    // min un-collision
    _1_dichotomy_tree_rev_dt: function () {
        return [
            0.5, [
                0.2, [0.1, 0.1, 0.2], [0.3, 0.3, [0.4, 0.4, 0.5]]
            ], [
                //0.7, [0.6, 0.6, 0.7], [0.8, 0.8, [0.9, 0.9, 1.0]]
                0.8, [0.6, 0.6, [0.7, 0.7, 0.8]], [0.9, 0.9, 1.0]
            ]
        ];
    },
    
    // max collision
    _2_dichotomy_tree_rev_dt: function () {
        return [
            0.5, [
                0.2, [0.1, 0.0, 0.1], [0.3, 0.2, [0.4, 0.3, 0.4]]
            ], [
                0.7, [0.6, 0.5, 0.6], [0.8, 0.7, [0.9, 0.8, 0.9]]
            ]
        ];
    },
    
    _dichotomy_tree_rev_dt: function () {
        return {
            tree: [
                0.9, [
                    0.4, [
                        0.2, [0.1, 0.1, 0.2], [0.3, 0.3, 0.4]
                    ], [
                        0.6, [0.5, 0.5, 0.6], [
                            0.8, [0.7, 0.7, 0.8], 0.9
                        ]
                    ]
                ], 1.0 ],
            precision: 0.1,
        };
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
            if(chk !== false) {
                for(var i = 0; i < this.rev_factors.pre_collision.length; i ++) {
                    var other = this.rev_factors.pre_collision[i];
                    if(this.in_interact('rigid', other)) continue;
                    if(this.field_field(other, rev_trans)) {
                        chk = false;
                        break;
                    }
                }
            }
            return (chk !== false);
        }).bind(this);
        var r = dichotomy(this._dichotomy_tree_rev_dt().tree, _chk_collision);
        return r;
    },
    
    _get_collision_moment_rect: function () {
        if(!this.get_rule_prop('rect_field')) {
            return undefined;
        }
        var brk = false === this.foreach_interact('rigid', function (field) {
            if(!field.get_rule_prop('rect_field')) {
                return false;
            }
        });
        if(brk) {
            return undefined;
        }
    },
    
    _line_line_intersect_curve_length: function (s1, s2, d1, d2) {
        var us_t = (d2.x - d1.x) * (s1.y - d1.y) - (d2.y - d1.y) * (s1.x - d1.x);
        var ud_t = (s2.x - s1.x) * (s1.y - d1.y) - (s2.y - s1.y) * (s1.x - d1.x);
        var u_d  = (d2.y - d1.y) * (s2.x - s1.x) - (d2.x - d1.x) * (s2.y - s1.y);
        if(u_d !== 0) {
            var us = us_t / u_d;
            var ud = ud_t / u_d;
            if( 0 <= us && us <= 1 && 0 <= ud && ud <= 1 ) {
                var ls = cc.v2(s2).sub(s1).mag();
                var ld = cc.v2(d2).sub(d1).mag();
                return [us, ud, ls, ld];
            }
        }
    },
    
    _get_points_line: function (points, idx) {
        var l = points.length;
        return [points[util.pmod(idx, l)], points[util.pmod(idx + 1, l)]];
    },
    
    _points_line_intersect_curve_length: function (src, d1, d2, src_rng = null) {
        if(src_rng === null) {
            src_rng = [0, src.length - 1];
        }
        var cl;
        for (var si = src_rng[0]; si < src_rng[1] + 1; si ++) {
            var s1, s2;
            [s1, s2] = this._get_points_line(src, si);
            cl = this._line_line_intersect_curve_length(s1, s2, d1, d2);
            if(cl) break;
        }
        return [cl, si];
    },
    
    _get_curve_point: function (p1, p2, curve) {
        var rp = p2.sub(p1).mul(curve).add(p1);
        return rp;
    },
    
    // only for tangency, the minimum contact
    _points_points_intersect_line: function (src, dst) {
        var first_cl, second_cl;
        var di, dl, d1, d2, si, ndi, nsi;
        for (di = 0, dl = dst.length; di < dl; di ++) {
            [d1, d2] = this._get_points_line(dst, di);
            [first_cl, si] = this._points_line_intersect_curve_length(src, d1, d2);
            if(first_cl) break;
        }
        var dr, dp;
        if(first_cl && dl > 2 && di < dl - 1) {
            var si_rng = [si - 1, si + 1];
            ndi = util.pmod(di + 1, dl);
            [d1, d2] = this._get_points_line(dst, ndi);
            [second_cl, nsi] = this._points_line_intersect_curve_length(
                src, d1, d2, si_rng);
            if(second_cl) {
                dr = [first_cl, [si, di], second_cl, [nsi, ndi]];
            } else if(di === 0) {
                ndi = util.pmod(di - 1, dl);
                [d1, d2] = this._get_points_line(dst, ndi);
                [second_cl, nsi] = this._points_line_intersect_curve_length(
                    src, d1, d2, si_rng);
                if(second_cl) {
                    dr = [second_cl, [nsi, ndi], first_cl, [si, di]];
                } else {
                    [d1, d2] = this._get_points_line(dst, di);
                    dp = this._get_curve_point(d1, d2, first_cl[1]);
                    return [d1, d2, di, dp];
                }
            } else {
                [d1, d2] = this._get_points_line(dst, di);
                dp = this._get_curve_point(d1, d2, first_cl[1]);
                return [d1, d2, di, dp];
            }
        } else if(first_cl) {
            dp = this._get_curve_point(d1, d2, first_cl[1]);
            return [d1, d2, di, dp];
        }
        if(dr) {
            var l1 = (1 - dr[0][1]) * dr[0][3];
            var l2 = dr[2][1] * dr[2][3];
            var dc;
            if(l1 >= l2) {
                di = dr[1][1];
                dc = dr[0][1];
            } else {
                di = dr[3][1];
                dc = dr[2][1];
            }
            [d1, d2] = this._get_points_line(dst, di);
            dp = this._get_curve_point(d1, d2, dc);
            return [d1, d2, di, dp];
        }
    },
    
    _get_collision_contacts: function (rev_dt) {
        var coll_ta = this.prev_coll_rev_trans(
            rev_dt, this._dichotomy_tree_rev_dt().precision);
        var coll_ps = this.points_apply_affine_transform(coll_ta);
        var contacts = [];
        this.foreach_interact('rigid', function (field) {
            var other_ps = field.get_world(field).points;
            var tl = this._points_points_intersect_line(coll_ps, other_ps);
            if(tl) {
                contacts.push({
                    field: field,
                    idxline: tl[2],
                    p1: tl[0],
                    p2: tl[1],
                    pi: tl[3],
                });
                //console.log('tangent', this.name, field.name, tl[0], tl[1]);
            }
        });
        for(var i = 0; i < this.rev_factors.pre_collision.length; i ++) {
            var field = this.rev_factors.pre_collision[i];
            if(this.in_interact('rigid', field)) continue;
            var other_ps = field.get_world(field).points;
            var tl = this._points_points_intersect_line(coll_ps, other_ps);
            if(tl) {
                contacts.push({
                    field: field,
                    idxline: tl[2],
                    p1: tl[0],
                    p2: tl[1],
                    pi: tl[3],
                });
                //console.log('tangent_p', this.name, field.name, tl[0], tl[1]);
                util.array_set.add(
                    this.rev_factors.pre_pre_collision, field);
            }
        }
        return contacts;
    },
    
    get_vector_direct: function (vec, dir_grp = null, rel = false, field = null) {
        if(field === null) {
            field = this;
        }
        if(dir_grp === null) {
            dir_grp = {
                'top': cc.v2(-1, 1),
                'right': cc.v2(1, 1),
                'bot': cc.v2(1, -1),
                'left': cc.v2(-1, -1),
            };
        }
        var rad = null;
        if(rel && field.node.rotation) {
            // vec2.rotate(anticlockwise) is invert to node.rotation(clockwise) or affine.rotate(clockwise)
            // but the same direct with cc.affineTransformRotate(anticlockwise)
            rad = - field.node.rotation * 180 / Math.PI;
        }
        var start = null;
        var end = null;
        for(var k in dir_grp) {
            var edge = dir_grp[k];
            if(rad !== null) {
                edge = edge.rotate(rad);
            }
            if(start === null 
                || util.vec.is_seq(start[0], edge, vec)) {
                start = [edge, k];
            }
            if(end === null
                || util.vec.is_seq(vec, edge, end[0])) {
                end = [edge, k];
            }
        }
        return [start, end];
    },
    
    update_movable: function () {
        //this.update_world(this);
        //var _t1 = this.rev_factors.pre_trans.ty;
        this.calc_rev_factors();
        //console.log('pre', this.name, _t1, this.rev_factors.pre_trans.ty);
        //console.log('curW', this.get_world().points[1], this.rev_factors.tracer.trans.tx, this.rev_factors.tracer.trans.ty);
        if(!this.has_interact('rigid')) {
            this.rev_factors.next_tracer.clean();
            this.contacts = [];
            return;
        }
        //console.log('slfps', this.name, this.get_world().points[0]);
        var rev_dt = this._get_collision_moment();
        this.contacts = this._get_collision_contacts(rev_dt);
        //console.log('cnct', this.name, this.contacts.length, this.contacts[0]?[this.contacts[0].field.name, this.contacts[0].p1, this.contacts[0].p2]:undefined);
        //rev_dt = 1; //!alert!
        var rev_m_trans = this.rev_trans(rev_dt);
        //rev_m_trans = cc.affineTransformMake(1,0,0,1,0,100);
        //console.log('revm', rev_dt, rev_m_trans.tx, rev_m_trans.ty);
        //console.log('prex', this.node.x, this.rev_factors.pre_trans.tx);
        //this.apply_loc_affine(rev_m_trans);
        this.apply_world_affine(rev_m_trans);
        this._update_pre_trans(rev_m_trans);
        //console.log('pc',this.name, this.rev_factors.pre_collision.length, this.rev_factors.pre_collision[0]?this.rev_factors.pre_collision[0].name:undefined, this.get_interact('rigid')[0].name);
        this._update_pre_collision();
        //console.log('cur', this.name, rev_dt, this.node.y, this.get_world().transform.ty);
        //console.log('curx', this.node.x, this.get_world().transform.tx);
        this._update_slide_trans(rev_m_trans);
        //console.log('slide', this.rev_factors.next_trans.tx, this.rev_factors.next_trans.ty, this.rev_factors.next_tracer.trans.tx, this.rev_factors.next_tracer.trans.ty);
        //var _t = this.node.getComponent('inertia');
        //_t.speed = cc.Vec2.ZERO;
    },
    
    update_next_movable: function () {
        if(this.rev_factors.next_tracer.dirty) {
            var slide_trans = this.rev_factors.next_trans;
            //var slide_trans = this.rev_factors.next_tracer.trans;
            //var slide_trans = util.affine.translate(3,3);
            this.apply_world_affine(slide_trans);
            this._update_pre_trans(slide_trans);
        }
    },
    
    init_rule: function () {
        this._super();
        var trc_typ;
        if(this.get_rule_prop('rect_field')) {
            trc_typ = 'slide';
        } else {
            trc_typ = 'standard';
        }
        this.rev_factors = {
            pre_collision: [],
            pre_pre_collision: [],
            pre_trans: cc.affineTransformMakeIdentity(),
            next_trans: cc.affineTransformMakeIdentity(),
            tracer: new util.rev_tracer(trc_typ),
            next_tracer: new util.rev_tracer('slide'),
        };
        this.contacts = [];
    },
    
    update_rule: function (dt, prio) {
        this._super();
        if(this.movable) {
            if(prio == 101) {
                //if(dt > 0.1) {
                //    console.log('break here');
                //}
                this.update_movable();
            } else if(prio == 1) {
                this.update_next_movable();
            }
        }
    },

    // use this for initialization
    // onLoad: function () {

    // },

    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },
});
