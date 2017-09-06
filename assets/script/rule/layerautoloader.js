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
    
    pos_block2layer: function (blk_pos, blk) {
        return this.get_loc_pos(blk, blk_pos);
    },
    
    pos_layer2block: function (lyr_pos, blk) {
        return this.get_rel_pos(blk, lyr_pos);
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
