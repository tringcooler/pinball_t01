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
        
    },
    
    statics: {
        rule_priority: 50,
    },
    
    _res_refinc: function (res_names) {
        if(!res_names) {
            return;
        } else if( !(res_names instanceof Array) ) {
            res_names = [res_names];
        }
        for(var i = 0; i < res_names.length; i ++) {
            var res_name = res_names[i];
            if( !(res_name in this._resources) ) {
                this._resources[res_name] = 0;
            }
            this._resources[res_name] ++;
        }
    },
    
    _res_refdec: function (res_names) {
        if(!res_names) {
            return;
        } else if( !(res_names instanceof Array) ) {
            res_names = [res_names];
        }
        for(var i = 0; i < res_names.length; i ++) {
            var res_name = res_names[i];
            if( !(res_name in this._resources) ) continue;
            this._resources[res_name] --;
            if(this._resources[res_name] <= 0) {
                cc.loader.release(res_name);
                delete this._resources[res_name];
            }
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
    
    _get_node_by_name: function (scene, name) {
        var node_path = name.split('/');
        var node = scene.getChildByName('Canvas');
        for(i = 0; i < node_path.length; i ++) {
            node = node.getChildByName(node_path[i]);
        }
        return node;
    },
    
    _on_block_loaded: function (block_info, err, asset) {
        var i;
        var scene = asset.scene;
        var dst_node = this._get_node_by_name(scene, block_info.node_name);
        this._update_loaded_node(dst_node, block_info.layer);
        dst_node.x += block_info.position.x;
        dst_node.y += block_info.position.y;
        block_info.root_node = dst_node;
        block_info.resources_depends = scene.dependAssets;
        this._res_refinc(block_info.resources_depends);
        cc.loader.release(asset);
        block_info.state = 'load';
    },
    
    // async
    load_block: function (scene_name, node_name, layer, position = cc.Vec2.ZERO, kargs = {}) {
        if(typeof layer == 'string') {
            layer = this._get_node_by_name(cc.director.getScene(), layer);
        }
        var block_info = {
            scene_name: scene_name,
            node_name: node_name,
            key_name: scene_name + '/' + node_name,
            layer: layer,
            position: position,
            state: 'init',
            root_node: null,
            resources_depends: null,
        };
        for(var k in kargs) {
            block_info[k] = kargs[k];
        }
        var scene_info = cc.director._getSceneUuid(scene_name);
        cc.AssetLibrary.loadAsset(scene_info.uuid,
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
            this._res_refdec(block_info.resources_depends);
            block_info.resources_depends = null;
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
        var cur_scene_res = cc.director.getScene().dependAssets;
        this._res_refinc(cur_scene_res);
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
