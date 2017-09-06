var layerloader = require('layerloader');

cc.Class({
    extends: layerloader,

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
    
    pos_block2layer: function (blk_pos, blk_info) {
        return cc.pointApplyAffineTransform(blk_pos, blk_info.trans_block2layer);
    },
    
    pos_layer2block: function (lyr_pos, blk_info) {
        return cc.pointApplyAffineTransform(blk_pos, blk_info.trans_layer2block);
    },
    
    _on_block_loaded: function (block_info, err, asset) {
        this._super(block_info, err, asset);
        var b_nd = block_info.root_node;
        var res_info = b_nd.getComponent('layerresinfo');
        var b2l_trans = b_nd.getNodeToParentTransformAR();
        var l2b_trans = cc.affineTransformInvert(b2l_trans);
        block_info.trans_block2layer = b2l_trans;
        block_info.trans_layer2block = l2b_trans;
        block_info.res_info = res_info;
        if(!block_info.is_preload) {
            //preload all blks related with this
        }
    },
    
    init_rule: function () {
        this._super();
        this._shifter = this.node.getComponent('layershifter');
        this._blks = [];
    },
    
    update_rule: function (dt) {
        this._super(dt);
    },

    // use this for initialization
    // onLoad: function () {

    // },

    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },
});
