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
        if(this.rev_factors.next_tracer.dirty) {
            if(dt <= this._slide_curve_threshold) {
                dt = dt / this._slide_curve_threshold;
                return this.rev_factors.tracer.trace(dt, mask);
            } else {
                dt = (dt - this._slide_curve_threshold) / (1 - this._slide_curve_threshold);
                var trans = this.rev_factors.tracer.trans;
                var slide_trans = this.rev_factors.next_tracer.trace(dt, mask);
                return util.affine.dot(slide_trans, trans);
            }
        } else {
            return this.rev_factors.tracer.trace(dt, mask);
        }
    },
    
    prev_coll_rev_trans: function (dt, dt_prec) {
        if( this.rev_factors.next_tracer.dirty && dt > this._slide_curve_threshold) {
            var cur_trans = this.rev_trans(dt);
            var obv_dt = Math.min(dt_prec, this._slide_curve_threshold);
            var obv_trans = util.affine.invert(this.rev_trans(obv_dt));
            return util.affine.dot(obv_trans, cur_trans);
        } else {
            return this.rev_trans(dt - dt_prec);
        }
    },
    
    _update_pre_trans: function (af) {
        this.rev_factors.pre_trans = util.affine.dot(
            af, this.rev_factors.pre_trans);
    },
    
    _update_pre_collision: function () {
        this.rev_factors.pre_collision = this.rev_factors.pre_pre_collision;
        this.rev_factors.pre_pre_collision = [];
        util.array_set.add(
            this.rev_factors.pre_collision, this.get_interact('rigid'));
    },
    
    _update_slide_trans: function (rev_trans) {
        var slide_trans = util.affine.id();
        if(this.contacts.length > 0 && this.get_rule_prop('slidable')) {
            var i;
            var vec_grp = [];
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
            if(this._rect_collision_dt !== null && dt <= this._rect_collision_dt) {
                return false;
            }
            var rev_trans = this.rev_trans(dt);
            var chk = this.foreach_interact('rigid', function (field) {
                if(this._pass_rect_collision(field)) return;
                if(this.field_field(field, rev_trans)) {
                    return false;
                }
            });
            if(chk !== false) {
                for(var i = 0; i < this.rev_factors.pre_collision.length; i ++) {
                    var other = this.rev_factors.pre_collision[i];
                    if(this._pass_rect_collision(other)) continue;
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
    
    _get_1_collision_moment_contact_rect: function (other, track, i_offset = null) {
        var self_rect = this.get_world(this).aabb;
        var other_rect = this.get_world(other).aabb;
        if(i_offset !== null) {
            self_rect = self_rect.clone();
            self_rect.x -= i_offset.x;
            self_rect.y -= i_offset.y;
        }
        var _mid = function (amin, amax, bmin, bmax) {
            var d = [
                amax - amin,
                amax - bmin,
                bmax - amin,
                bmax - bmin,
            ];
            var r, dmin = null;
            for(var i = 0; i < d.length; i ++) {
                if(d[i] < 0) {
                    return null;
                }
                if(dmin === null || d[i] < dmin) {
                    dmin = d[i];
                    r = d[i] / 2 + ((i % 2) ? bmin : amin);
                }
            }
            return r;
        };
        var rx, ry, rslx, rsly, rlx, rly;
        if(track.tx >= 0) {
            rx = Math.max(self_rect.xMax - other_rect.xMin, 0);
            rslx = [
                cc.v2(self_rect.xMax, self_rect.yMin),
                cc.v2(self_rect.xMax, self_rect.yMax),
            ];
            rlx = [
                cc.v2(other_rect.xMin, other_rect.yMin),
                cc.v2(other_rect.xMin, other_rect.yMax),
            ];
        } else {
            rx = Math.min(self_rect.xMin - other_rect.xMax, 0);
            rslx = [
                cc.v2(self_rect.xMin, self_rect.yMin),
                cc.v2(self_rect.xMin, self_rect.yMax),
            ];
            rlx = [
                cc.v2(other_rect.xMax, other_rect.yMin),
                cc.v2(other_rect.xMax, other_rect.yMax),
            ];
        }
        if(track.ty >= 0) {
            ry = Math.max(self_rect.yMax - other_rect.yMin, 0);
            rsly = [
                cc.v2(self_rect.xMin, self_rect.yMax),
                cc.v2(self_rect.xMax, self_rect.yMax),
            ];
            rly = [
                cc.v2(other_rect.xMin, other_rect.yMin),
                cc.v2(other_rect.xMax, other_rect.yMin),
            ];
        } else {
            ry = Math.min(self_rect.yMin - other_rect.yMax, 0);
            rsly = [
                cc.v2(self_rect.xMin, self_rect.yMin),
                cc.v2(self_rect.xMax, self_rect.yMin),
            ];
            rly = [
                cc.v2(other_rect.xMin, other_rect.yMax),
                cc.v2(other_rect.xMax, other_rect.yMax),
            ];
        }
        var rdx = rx / track.tx;
        var rdy = ry / track.ty;
        if(rdx == rdy) {
            var rp = cc.v2(rlx[0].x, rly[0].y);
            return [ rdx, [rlx, rp], [rly, rp] ];
        }
        var _fmx = function () {
            var rc_d = track.ty * rdx;
            var rc_mid = _mid(
                rlx[0].y, rlx[1].y,
                rslx[0].y - rc_d, rslx[1].y - rc_d);
            if(rc_mid !== null) {
                return [ rdx, [rlx, cc.v2(rlx[0].x, rc_mid)] ];
            }
        };
        var _fmy = function () {
            var rc_d = track.tx * rdy;
            var rc_mid = _mid(
                rly[0].x, rly[1].x,
                rsly[0].x - rc_d, rsly[1].x - rc_d);
            if(rc_mid !== null) {
                return [ rdy, [rly, cc.v2(rc_mid, rly[0].y)] ];
            }
        };
        if( rdx > rdy ) {
            return (_fmx() || _fmy());
        } else {
            return (_fmy() || _fmx());
        }
    },
    
    _pass_rect_collision: function (field) {
        return (
            this._rect_collision_dt !== null
            && this.get_rule_prop('rect_field')
            && field.get_rule_prop('rect_field')
        );
    },
    
    _get_collision_rect: function () {
        if(!this.get_rule_prop('rect_field')) {
            this._rect_collision_dt = null;
            return false;
        }
        var track = this.rev_factors.tracer.slide_obv_trans();
        var all_rect = true;
        var rev_dt = 0;
        var _f = function (track, i_offset, field) {
            if(!field.get_rule_prop('rect_field')) {
                all_rect = false;
                return;
            }
            var info = this._get_1_collision_moment_contact_rect(field, track, i_offset);
            if(info && info[0] > 0) {
                var _dt = Math.min(info[0], 1);
                if(_dt > rev_dt) {
                    rev_dt = _dt;
                }
                for(var i = 1; i < info.length; i ++) {
                    var l = info[i][0];
                    var p = info[i][1];
                    this.contacts.push({
                        field: field,
                        p1: l[0],
                        p2: l[1],
                        pi: p,
                    });
                }
            }
        };
        var i, field;
        this.foreach_interact('rigid', _f.bind(this, track, null));
        for(i = 0; i < this.rev_factors.pre_collision.length; i ++) {
            field = this.rev_factors.pre_collision[i];
            if(this.in_interact('rigid', field)) continue;
            _f.call(this, track, null, field);
        }
        if(this.rev_factors.next_tracer.dirty) {
            if(rev_dt >= 1) {
                var pre_off = track;
                track = this.rev_factors.next_tracer.slide_obv_trans();
                rev_dt = 0;
                this.foreach_interact('rigid', _f.bind(this, track, pre_off));
                for(i = 0; i < this.rev_factors.pre_collision.length; i ++) {
                    field = this.rev_factors.pre_collision[i];
                    if(this.in_interact('rigid', field)) continue;
                    _f.call(this, track, pre_off, field);
                }
                rev_dt = rev_dt * (1 - this._slide_curve_threshold)
                    + this._slide_curve_threshold;
            } else {
                rev_dt *= this._slide_curve_threshold;
            }
        }
        this._rect_collision_dt = rev_dt;
        return all_rect;
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
        this.foreach_interact('rigid', function (field) {
            if(this._pass_rect_collision(field)) return;
            var other_ps = field.get_world(field).points;
            var tl = this._points_points_intersect_line(coll_ps, other_ps);
            if(tl) {
                this.contacts.push({
                    field: field,
                    p1: tl[0],
                    p2: tl[1],
                    pi: tl[3],
                });
            }
        });
        for(var i = 0; i < this.rev_factors.pre_collision.length; i ++) {
            var field = this.rev_factors.pre_collision[i];
            if(this._pass_rect_collision(field)) continue;
            if(this.in_interact('rigid', field)) continue;
            var other_ps = field.get_world(field).points;
            var tl = this._points_points_intersect_line(coll_ps, other_ps);
            if(tl) {
                this.contacts.push({
                    field: field,
                    p1: tl[0],
                    p2: tl[1],
                    pi: tl[3],
                });
                util.array_set.add(
                    this.rev_factors.pre_pre_collision, field);
            }
        }
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
    
    get_collision: function () {
        var rev_dt;
        if(this.get_rule_prop('rect_field')
            && this._get_collision_rect()) {
            rev_dt = this._rect_collision_dt;
        } else {
            rev_dt = this._get_collision_moment();
            this._get_collision_contacts(rev_dt);
        }
        return rev_dt;
    },
    
    update_movable: function () {
        this.calc_rev_factors();
        this.contacts = [];
        if(!this.has_interact('rigid')) {
            this.rev_factors.next_tracer.clean();
            return;
        }
        var rev_dt = this.get_collision();
        var rev_m_trans = this.rev_trans(rev_dt);
        this.apply_world_affine(rev_m_trans);
        this._update_pre_trans(rev_m_trans);
        this._update_pre_collision();
        this._update_slide_trans(rev_m_trans);
    },
    
    update_next_movable: function () {
        if(this.rev_factors.next_tracer.dirty) {
            var slide_trans = this.rev_factors.next_trans;
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
        this._slide_curve_threshold = 0.5;
        this._rect_collision_dt = null;
    },
    
    update_rule: function (dt, prio) {
        this._super();
        if(this.movable) {
            if(prio == 101) {
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
