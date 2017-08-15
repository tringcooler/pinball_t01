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
    
    _res_refinc: function (res_name) {
        if( !(res_name in this._resources) ) {
            this._resources[res_name] = 0;
        }
        this._resources[res_name] ++;
    },
    
    _res_refdec: function (res_name) {
        if( !(res_name in this._resources) ) return;
        this._resources[res_name] --;
        if(this._resources[res_name] <= 0) {
            cc.loader.release(res_name);
            delete this._resources[res_name];
        }
    },
    
    _update_loaded_node: function (node, parent) {
        node.removeFromParent(false);
        parent.addChild(node);
        node._updateSgNode();
        var i, nodes = [];
        for(i = 0; i < node.children.length; i ++) {
            nodes.push(node.children[i]);
        }
        for (i = 0; i < nodes.length; i ++) {
            this._update_loaded_node(nodes[i], node);
        }
    },
    
    _on_block_loaded: function (block_info, err, asset) {
        var i;
        var scene = asset.scene;
        var node_path = block_info.node_name.split('/');
        var dst_node = scene.getChildByName('Canvas');
        for(i = 0; i < node_path.length; i ++) {
            dst_node = dst_node.getChildByName(node_path[i]);
        }
        this._update_loaded_node(dst_node, this.layer);
        dst_node.x += block_info.position.x;
        dst_node.y += block_info.position.y;
        block_info.root_node = dst_node;
        block_info.resources_depends = scene.dependAssets;
        if(block_info.resources_depends) {
            for (i = 0; i < block_info.resources_depends.length; i ++) {
                this._res_refinc(block_info.resources_depends[i]);
            }
        }
        cc.loader.release(asset);
        block_info.state = 'load';
    },
    
    // async
    load_block: function (scene_name, node_name, position) {
        var block_info = {
            scene_name: scene_name,
            node_name: node_name,
            key_name: scene_name + '/' + node_name,
            position: position,
            state: 'init',
            root_node: null,
            resources_depends: null,
        };
        cc.director.preloadScene(scene_name,
            this._on_block_loaded.bind(this, block_info));
        return block_info;
    },
    
    is_valid_block: function (block_info) {
        return (block_info.state == 'load');
    },
    
    release_block: function (block_info) {
        if(block_info.state == 'release') {
            return true;
        } else if(block_info.state == 'load') {
            block_info.root_node.destroy();
            block_info.root_node = null;
            if(block_info.resources_depends) {
                for (i = 0; i < block_info.resources_depends.length; i ++) {
                    this._res_refdec(block_info.resources_depends[i]);
                }
                block_info.resources_depends = null;
            }
            block_info.state = 'release';
            return true;
        } else {
            return false;
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
