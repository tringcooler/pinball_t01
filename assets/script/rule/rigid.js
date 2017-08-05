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
                var slide_trans = this.rev_factors.tracer.trace(dt, mask);
                return util.affine.dot(slide_trans, trans);
            }
        } else {
            return this.rev_factors.tracer.trace(dt, mask);
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
            util.array_set.add(
                this.rev_factors.pre_collision, this.get_interact('rigid'));
        }
    },
    
    _update_slide_trans: function (contacts, rev_trans) {
        var slide_trans = util.affine.id();
        if(contacts.length == 1 && this.get_rule_prop('slidable')) {
            var contact = contacts[0];
            if(contact.field.get_rule_prop('slidable')) {
                //var track = this.rev_factors.tracer.slide_obv_trans();
                var track = util.affine.translate_invert(rev_trans);
                var tangent = contact.p2.sub(contact.p1);
                slide_trans = util.affine.translate_projection(
                    track, tangent.x, tangent.y);
            }
        }
        this.rev_factors.next_trans = slide_trans;
        this.rev_factors.next_tracer.calc(this.rev_factors.next_trans);
        this._should_slide = true;
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
        var _pre_collision_valid = false;
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
                        _pre_collision_valid = true;
                        break;
                    }
                }
            }
            return (chk !== false);
        }).bind(this);
        var r = dichotomy(this._dichotomy_tree_rev_dt().tree, _chk_collision);
        if(!_pre_collision_valid) {
            this.rev_factors.pre_collision = [];
        }
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
    
    // only for tangency, the minimum contact
    _points_points_intersect_line: function (src, dst) {
        var first_cl, second_cl;
        var di, dl, d1, d2, si, ndi, nsi;
        for (di = 0, dl = dst.length; di < dl; di ++) {
            [d1, d2] = this._get_points_line(dst, di);
            [first_cl, si] = this._points_line_intersect_curve_length(src, d1, d2);
            if(first_cl) break;
        }
        var dr;
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
                    return [d1, d2, di];
                }
            } else {
                [d1, d2] = this._get_points_line(dst, di);
                return [d1, d2, di];
            }
        } else if(first_cl) {
            return [d1, d2, di];
        }
        if(dr) {
            var l1 = (1 - dr[0][1]) * dr[0][3];
            var l2 = dr[2][1] * dr[2][3];
            if(l1 >= l2) {
                di = dr[1][1];
            } else {
                di = dr[3][1];
            }
            [d1, d2] = this._get_points_line(dst, di);
            return [d1, d2, di];
        }
    },
    
    _get_collision_contacts: function (rev_dt) {
        var coll_ta = this.rev_trans(
            rev_dt - this._dichotomy_tree_rev_dt().precision);
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
                });
                console.log('tangent', this.name, field.name, tl[0], tl[1]);
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
                });
                console.log('tangent_p', this.name, field.name, tl[0], tl[1]);
            }
        }
        return contacts;
    },
    
    update_movable: function () {
        //this.update_world(this);
        var _t1 = this.rev_factors.pre_trans.ty;
        this.calc_rev_factors();
        console.log('pre', this.name, _t1, this.rev_factors.pre_trans.ty);
        if(!this.has_interact('rigid')) {
            return;
        }
        console.log('slfps', this.name, this.get_world().points[0]);
        var rev_dt = this._get_collision_moment();
        var contacts = this._get_collision_contacts(rev_dt);
        console.log('cnct', rev_dt, this.name, contacts.length, contacts[0].field.name, contacts[0].p1, contacts[0].p2);
        //rev_dt = 1; //!alert!
        var rev_m_trans = this.rev_trans(rev_dt);
        //rev_m_trans = cc.affineTransformMake(1,0,0,1,0,100);
        console.log('prex', this.node.x, this.rev_factors.pre_trans.tx);
        //this.apply_loc_affine(rev_m_trans);
        this.apply_world_affine(rev_m_trans);
        this._update_pre_trans(rev_m_trans);
        console.log('pc',this.name, this.rev_factors.pre_collision.length, this.rev_factors.pre_collision[0]?this.rev_factors.pre_collision[0].name:undefined, this.get_interact('rigid')[0].name);
        this._update_pre_collision();
        console.log('cur', this.name, rev_dt, this.node.y, this.get_world().transform.ty);
        console.log('curx', this.node.x, this.get_world().transform.tx);
        this._update_slide_trans(contacts, rev_m_trans);
        console.log('slide', this.rev_factors.next_trans.tx, this.rev_factors.next_trans.ty, this.rev_factors.next_tracer.trans.tx, this.rev_factors.next_tracer.trans.ty);
        //var _t = this.node.getComponent('inertia');
        //_t.speed = cc.Vec2.ZERO;
    },
    
    update_next_movable: function () {
        if(this.rev_factors.next_tracer.dirty && this._should_slide) {
            var slide_trans = this.rev_factors.next_trans;
            //var slide_trans = this.rev_factors.next_tracer.trans;
            //var slide_trans = util.affine.translate(3,3);
            this.apply_world_affine(slide_trans);
            this._update_pre_trans(slide_trans);
            this._should_slide = false;
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
            pre_trans: cc.affineTransformMakeIdentity(),
            next_trans: cc.affineTransformMakeIdentity(),
            tracer: new util.rev_tracer(trc_typ),
            next_tracer: new util.rev_tracer('slide'),
        };
        this._should_slide = false;
    },
    
    update_rule: function (dt, prio) {
        this._super();
        if(this.movable) {
            if(prio == 101) {
                if(dt > 0.1) {
                    console.log('break here');
                }
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
