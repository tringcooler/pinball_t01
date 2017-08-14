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
        
        layer: {
            default: null,
            type: cc.Node,
        },
    },
    
    statics: {
        rule_priority: 50,
    },
    
    _on_block_loaded: function (err, asset) {
        
    },
    
    // async
    load_block: function (scene_name, position) {
        var block_info = {
            scene_name: scene_name,
            position: position,
            result: null,
            root_node: null,
        };
        
    },
    
    is_valid_block: function (block_info) {
        
    },
    
    release_block: function (block_info) {
        if(!this.is_valid_block(block_info)) {
            return;
        }
    },
    
    init_rule: function () {
        this._super();
        var resources = this.get_global('resources');
        if(typeof resources == 'undefined') {
            resources = {};
            this.set_global('resources', resources);
        }
        this._resources = resources;
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
