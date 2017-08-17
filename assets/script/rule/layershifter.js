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
        camera: {
            default: null,
            type: cc.Camera,
        },
        
        zoomed: true,
        
        z_base: 100,
        z_distance: 100,
        
    },
    
    statics: {
        rule_priority: 150,
    },
    
    pos_local2layer: function (lcl_pos) {
        return lcl_pos.mul(this.base_scale);
    },
    
    pos_layer2local: function (lyr_pos) {
        return lyr_pos.div(this.base_scale);
    },
    
    pos_layer2global: function (lyr_pos) {
        var layer_scale = this.z_base / this.z_distance / this.base_scale;
        return lyr_pos.mul(layer_scale);
    },
    
    pos_global2layer: function (glb_pos) {
        var layer_scale = this.z_base / this.z_distance / this.base_scale;
        return glb_pos.div(layer_scale);
    },
    
    pos_local2global: function (lcl_pos) {
        var real_scale = this.z_base / this.z_distance;
        return lcl_pos.mul(real_scale);
    },
    
    pos_global2local: function (glb_pos) {
        var real_scale = this.z_base / this.z_distance;
        return glb_pos.div(real_scale);
    },
    
    _update_cur_z: function () {
        if(this.cam_stat.scale == this.camera.zoomRatio) {
            return false;
        }
        this.z_distance = (
            this.z_base / this.camera.zoomRatio - this.z_base)
            + this.init_z_distance;
        this.cam_stat.scale = this.camera.zoomRatio;
        return true;
    },
    
    _update_cur_scale: function () {
        if(!this._update_cur_z()) {
            return false;
        }
        var scale = this.z_base / this.z_distance / this.base_scale;
        this.node.scale = scale / this.camera.zoomRatio;
        return true;
    },
    
    _update_cur_shift: function () {
        if( !this._update_cur_scale()
            && this.cam_stat.pos.equals(this.camera.node.position) ) {
            return false;
        }
        var pos = this.pos_local2global(this.camera.node.position);
        this.node.x = this.camera.node.x - pos.x;
        this.node.y = this.camera.node.y - pos.y;
        this.node.setNodeDirty();
        this.cam_stat.pos = this.camera.node.position.clone();
        return true;
    },
    
    init_rule: function () {
        this._super();
        if(this.zoomed) {
            this.base_scale = this.z_base / this.z_distance / this.node.scale;
        } else {
            this.base_scale = 1;
            this.node.scale = this.z_base / this.z_distance;
            this.node.setNodeDirty();
        }
        if(!this.node.position.equals(cc.Vec2.ZERO)
            || this.node.rotation
            || this.node.skewX || this.node.skewY) {
            throw "layer shouldn't be shifted/rotaited/skewed before init";
        }
        this.init_z_distance = this.z_distance;
        this.cam_stat = {
            pos: this.camera.node.position.clone(),
            scale: this.camera.zoomRatio,
        };
    },
    
    update_rule: function (dt) {
        this._super();
        this._update_cur_shift();
    },

    // use this for initialization
    // onLoad: function () {

    // },

    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },
});
