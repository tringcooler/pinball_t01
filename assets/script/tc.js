
module.exports = {
    
    dbcp: function (cp = 'dummyball') {
        return cc.find('Canvas/dummyball').getComponent(cp);
    },
    
    dummyballs: function () {
        return [1, 2].map(function (idx) {
            return cc.find('Canvas/dummyball' + idx).getComponent('dummyball');
        })
    },
    
    ruler: function () {
        return cc.find('ruler').getComponent('ruler');
    },
    
    test_rev_trans: function () {
        var plt1 = cc.find('Canvas/plat1');
        var rgd = plt1.getComponent('rigid');
        rgd.bypass = true;
        rgd.calc_rev_factors();
        plt1.scale = 2.5;
        plt1.rotation = 30;
        plt1.x += 100;
        plt1.y += 300;
        var async_f = function () {
            rgd.calc_rev_factors();
            rgd.cur = cc.affineTransformClone(rgd.get_world().transform);
            var cnt = 0, ih;
            var f1 = function () {
                var ra = rgd.rev_trans(cnt);
                rgd.set_n2w_affine(rgd.cur);
                rgd.apply_affine(ra);
                if(cnt > 1) {
                    cnt = 0;
                    clearInterval(ih);
                }
                cnt += 0.001;
            };
            ih = setInterval(f1, 10);
        };
        setTimeout(async_f, 100);
        return [plt1, rgd];
    },
    
    ls2_load: function () {
        var camera = cc.find('Canvas/camera');
        var ll = camera.getComponent('layerloader');
        var blk1 = ll.load_block('test_loadscene_2_res', 'layer_bg1', 'scroller/bg2_layer');
        var blk2 = ll.load_block('test_loadscene_2_res', 'layer_bg2', 'scroller/bg3_layer');
        var blk3 = ll.load_block('test_loadscene_2_res', 'layer_bg3', 'scroller/bg4_layer');
        return [camera, ll, blk1, blk2, blk3];
    },
};
