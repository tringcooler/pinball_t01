/*jshint maxerr: 10000 */

var assert = function (cond) {
    if(!cond) {
        throw 'assert error';
    }
};

var array_set = {
    
    add: function (arr, elm) {
        if(elm instanceof Array) {
            for(var i = 0; i < elm.length; i ++) {
                array_set.add(arr, elm[i]);
            }
        } else {
            if(arr.indexOf(elm) == -1) {
                arr.push(elm);
            }
        }
    },
    
    remove: function (arr, elm) {
        if(elm instanceof Array) {
            var rslt = false;
            for(var i = 0; i < elm.length; i ++) {
                rslt |= array_set.remove(arr, elm[i]);
            }
            return rslt;
        } else {
            var ri = null;
            if( (ri = arr.indexOf(elm)) != -1 ) {
                var rr = arr.splice(ri, 1)[0];
                if(rr != val) {
                    throw 'RuntimeError: invalid array_set remove';
                }
                return true;
            } else {
                return false;
            }
        }
    },
};

var dict_pool = {
    
    push: function (pool, key, val) {
        if(typeof pool[key] == 'undefined') {
            pool[key] = [];
        }
        if(pool[key].indexOf(val) == -1) {
            pool[key].push(val);
        }
    },
    
    strip_as_array: function (arr) {
        if(arr instanceof Array) {
            while( arr.length > 0
                && typeof arr[arr.length - 1] == 'undefined' ) {
                arr.pop();
            }
        }
    },
    
    remove: function (pool, key, val) {
        var ri = null;
        if( (pool[key] instanceof Array)
            && ((ri = pool[key].indexOf(val)) != -1) ) {
            var rr = pool[key].splice(ri, 1)[0];
            if(rr != val) {
                throw 'RuntimeError: invalid dict_pool remove';
            }
            if(pool[key].length === 0) {
                delete pool[key];
                dict_pool.strip_as_array(pool);
            }
            return true;
        }
        return false;
    },
    
    get_all: function (pool) {
        var r = [];
        for(var key in pool) {
            array_set.add(r, pool[key]);
        }
        return r;
    },
    
    get: function (pool, key = null) {
        if(key === null) {
            return dict_pool.get_all(pool);
        } else {
            return pool[key].slice();
        }
    },
    
    contains: function (pool, key, val) {
        var r = dict_pool.get(pool, key);
        return (r.indexOf(val) != -1);
    },

};

var float_eq = function (a, b, max_times = 1e9) {
    var base = Math.abs(a) + Math.abs(b);
    var diff = Math.abs(a - b);
    if(a == b) {
        return true;
    } else if (a === 0 || b === 0 || diff <= Number.EPSILON * max_times) {
        return true;
    } else {
        return  diff / base <= Number.EPSILON * max_times;
    }
};

var _float_eq = function (a, b, max_times = 50) {
    return Math.abs(a - b) <= Number.EPSILON * max_times;
};

// errata for rotate bug:
// now: rslt = A * [[cos, sin], [-sin, cos]]

/*
2d affine matrix:
 [[a, c, tx],
  [b, d, ty]]

xxxApplyAffineTransform(X, A):
return: A * X

affineTransformTranslate(A, T):
return: A * T

affineTransformScale(A, S):
return: A * S

next functions something unusual:

affineTransformRotate(A, R):
return: A * R ^ -1

affineTransformConcat(A1, A2):
return: A2 * A1

so these functions will be implemented by here.

*/
var affine = {
    _arccs: function (c, s) {
        var rc = Math.acos(c);
        var rs = Math.asin(s);
        var rslt;
        if(1 >= c && c >= 0 && 0 <= s && s <= 1) {
            rslt = [rc, rs];
        } else if (0 >= c && c >= -1 && 1 >= s && s >= 0) {
            rslt = [rc, Math.PI - rs];
        } else if (-1 <= c && c <= 0 && 0 >= s && s >= -1) {
            //rslt = [2 * Math.PI - rc, Math.PI - rs];
            rslt = [- rc, - Math.PI - rs];
        } else if (0 <= c && c <= 1 && -1 <= s && s <= 0) {
            //rslt = [2 * Math.PI - rc, 2 * Math.PI + rs];
            rslt = [- rc, rs];
        }
        assert(float_eq(rslt[0], rslt[1]));
        return rslt;
    },
    
    id: function () {
        return cc.affineTransformMakeIdentity();
    },
    
    invert: function (af) {
        return cc.affineTransformInvert(af);
    },
    
    translate: function (tx, ty) {
        return cc.affineTransformMake(
            1, 0,
            0, 1,
            tx, ty);
    },
    
    scale: function (sx, sy) {
        return cc.affineTransformMake(
            sx, 0,
            0, sy,
            0, 0);
    },
    
    skew: function (kx, ky) {
        return cc.affineTransformMake(
            1, ky,
            kx, 1,
            0, 0);
    },
    
    rotate: function (r) {
        return cc.affineTransformMake(
            Math.cos(r), - Math.sin(r),
            Math.sin(r), Math.cos(r),
            0, 0);
    },
    
    dot: function (a1, a2) {
        return cc.affineTransformMake(
            a1.a * a2.a + a1.c * a2.b,
            a1.b * a2.a + a1.d * a2.b,
            a1.a * a2.c + a1.c * a2.d,
            a1.b * a2.c + a1.d * a2.d,
            a1.a * a2.tx + a1.c * a2.ty + a1.tx,
            a1.b * a2.tx + a1.d * a2.ty + a1.ty);
    },
    
    affine2rsrt: function (a, b, c, d, tx, ty) {
        if(typeof a == 'object') {
            b = a.b;
            c = a.c;
            d = a.d;
            tx = a.tx;
            ty = a.ty;
            a = a.a;
        }
        var sp = Math.sqrt( Math.pow(a + d, 2) + Math.pow(b - c, 2) );
        // let sy always bigger than sx
        var ss =  - Math.sqrt( Math.pow(a - d, 2) + Math.pow(b + c, 2) );
        var sx = (sp + ss) / 2;
        var sy = (sp - ss) / 2;
        var cosp, sinp, coss, sins, rp, rp2, rs, rs2;
        if(sp !== 0) {
            cosp = (a + d) / sp;
            sinp = -(b - c) / sp;
            [rp, rp2] = affine._arccs(cosp, sinp);
        } else {
            rp = 0;
        }
        if(ss !== 0) {
            coss = (a - d) / ss;
            sins = -(b + c) / ss;
            [rs, rs2] = affine._arccs(coss, sins);
        } else {
            rs = 0;
        }
        var r2 = (rp + rs) / 2;
        var r1 = (rp - rs) / 2;
        return [r1, sx, sy, r2, tx, ty];
    },
    
    rsrt2affine: function (
        r1 = 0, sx = 1, sy = 1, r2 = 0, tx = 0, ty = 0) {
        var a = affine.id();
        a = affine.dot(affine.rotate(r1), a);
        a = affine.dot(affine.scale(sx, sy), a);
        a = affine.dot(affine.rotate(r2), a);
        a = affine.dot(affine.translate(tx, ty), a);
        return a;
    },
    
    affine2skscrt: function(a, b, c, d, tx = 0, ty = 0) {
        if(typeof a == 'object') {
            b = a.b;
            c = a.c;
            d = a.d;
            tx = a.tx;
            ty = a.ty;
            a = a.a;
        }
        var sx = Math.sqrt( Math.pow(a, 2) + Math.pow(b, 2) );
        var kx, cosr, sinr;
        if(sx !== 0) {
            kx = (a * c + b * d) / (a * a + b * b);
        } else {
            kx = 0;
        }
        var sy = Math.sqrt( Math.pow(c, 2) + Math.pow(d, 2) - Math.pow(kx * sx, 2) );
        var sp = Math.sqrt( Math.pow(b - c + kx * a, 2)
            + Math.pow(a + d - kx * b, 2) );
        var ss = Math.sqrt( Math.pow(b + c - kx * a, 2)
            + Math.pow(a - d + kx * b, 2) );
        if(float_eq(sp, sx + sy)) {
            assert(float_eq(ss, Math.abs(sx - sy)));
        } else {
            assert(float_eq(sp, Math.abs(sx - sy)));
            // let sy always positive
            sx = -sx;
            assert(float_eq(ss, Math.abs(sx - sy)));
        }
        if(sx !== 0) {
            cosr = a / sx;
            sinr = - b / sx;
        } else if(sy !== 0) {
            sinr = c / sy;
            cosr = d / sy;
        } else {
            return [0, 0, 0, 0];
        }
        // ky = 0 cause an error that cosr/sinr > 1 when A = [-1, 2, -3, -4]
        // console.log(kx, sx, sy, cosr, sinr);
        var r = affine._arccs(cosr, sinr)[0];
        return [kx, 0, sx, sy, r, tx, ty];
    },
    
    skscrt2affine: function (
        kx = 0, ky = 0, sx = 1, sy = 1, r = 0, tx = 0, ty = 0) {
        var a = affine.id();
        a = affine.dot(affine.skew(kx, ky), a);
        a = affine.dot(affine.scale(sx, sy), a);
        a = affine.dot(affine.rotate(r), a);
        a = affine.dot(affine.translate(tx, ty), a);
        return a;
    },
    
    _test_convert: function () {
        var _c = function (cb, cbi, a, b, c, d) {
            var A = cbi.apply(this, cb(a, b, c, d));
            if(!( float_eq(A.a, a) && float_eq(A.b, b)
                && float_eq(A.c, c) && float_eq(A.d, d) )) {
                console.log(a, b, c, d);
                console.log(A.a, A.b, A.c, A.d);
                console.log(Math.abs(A.a - a), Math.abs(A.b - b),
                    Math.abs(A.c - c), Math.abs(A.d - d));
                throw 'test faild ' + cb.name;
            }
        };
        var _r = function (n) {
            var v = Math.random() * n;
            if(Math.random() > 0.5) v = -v;
            return v;
        };
        for(var i = 0; i < 1000000; i ++) {
            _c(affine.affine2rsrt, affine.rsrt2affine,
                _r(100), _r(100), _r(100), _r(100));
            _c(affine.affine2skscrt, affine.skscrt2affine,
                _r(100), _r(100), _r(100), _r(100));
        }
    }
};

var rev_tracer = (function() {
    function rev_tracer(type = 'standard') {
        this.type = type;
    }
    
    rev_tracer.prototype.calc = function (
        cur_trans_or_obv_trans, pre_trans = null) {
        if(this.type == 'slide') {
            this.calc_slide(cur_trans_or_obv_trans, pre_trans);
        } else {
            this.calc_trans(cur_trans_or_obv_trans, pre_trans);
            this.calc_factors();
        }
    };
    
    rev_tracer.prototype.calc_trans = function (
        cur_trans_or_obv_trans, pre_trans = null) {
        var trans;
        if(pre_trans === null) {
            trans = affine.invert(cur_trans_or_obv_trans);
        } else {
            trans = affine.dot(
                pre_trans,
                affine.invert(cur_trans_or_obv_trans));
        }
        this.trans = trans;
    };
    
    rev_tracer.prototype.calc_factors = function () {
        var rsrt = affine.affine2rsrt(this.trans);
        this.r1sr1 = rsrt.slice(0, 3);
        this.r2 = rsrt[0] + rsrt[3];
        this.tx = rsrt[4];
        this.ty = rsrt[5];
    };
    
    rev_tracer.prototype.calc_slide = function (
        cur_trans_or_obv_trans, pre_trans = null) {
        if(pre_trans !== null) {
            this.tx = pre_trans.tx;
            this.ty = pre_trans.ty;
        }
        this.tx -= cur_trans_or_obv_trans.tx;
        this.ty -= cur_trans_or_obv_trans.ty;
    };
    
    rev_tracer.prototype.trace = function (dt, mask = 0xf) {
        dt = Math.max(Math.min(dt, 1), 0);
        var a = affine.id();
        if(this.type == 'slide') {
            mask &= 0xc;
        }
        if(mask & 0x1) {
            var rsr = this.r1sr1;
            var r1 = affine.rotate(rsr[0]);
            var sc = affine.scale(1 + (rsr[1] - 1) * dt, 1 + (rsr[2] - 1) * dt);
            var r1i = affine.rotate(-rsr[0]);
            a = affine.dot(affine.dot(r1i, affine.dot(sc, r1)), a);
        }
        if(mask & 0x2) {
            a = affine.dot(affine.rotate(this.r2 * dt), a);
        }
        if(mask & 0xc) {
            a = affine.dot(
                    affine.translate(
                        this.tx * dt, this.ty * dt),
                    a);
        } else if(mask & 0x4) {
            a = affine.dot(
                    affine.translate(this.tx * dt, 0),
                    a);
        } else if(mask & 0x8) {
            a = affine.dot(
                    affine.translate(0, this.ty * dt),
                    a);
        }
        return a;
    };
    
    return rev_tracer;
})();

var dichotomy = function(tree, cb) {
    if(tree instanceof Array) {
        var t = cb(tree[0]);
        if(t) {
            return dichotomy(tree[1], cb);
        } else {
            return dichotomy(tree[2], cb);
        }
    } else {
        return tree;
    }
};

var array_intersect = function (arr1, arr2) {
    var r = arr2.every(function (elm) {
        return arr1.indexOf(elm) == -1;
    });
    return !r;
};

var pmod = function (v, m) {
    var r = (v % m);
    if(r < 0) {
        r += m;
    }
    return r;
};

module.exports = {
    array_set: array_set,
    dict_pool: dict_pool,
    float_eq: float_eq,
    affine: affine,
    rev_tracer: rev_tracer,
    dichotomy: dichotomy,
    array_intersect: array_intersect,
    pmod: pmod,
};
