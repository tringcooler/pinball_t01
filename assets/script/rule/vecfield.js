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
    },
    
    get_field_rect: function () {
        var size = this.node.getContentSize();
        var ap = this.node.getAnchorPoint();
        var rect = cc.rect(
            -ap.x * size.width,
            -ap.y * size.height,
            size.width, size.height);
        return rect;
    },
    
    in_field: function (loc_pos) {
        var self_rect = this.get_field_rect();
        return cc.rectContainsPoint(self_rect, loc_pos);
    },
    
    get_vec: function (pos) {
        return cc.Vec2.ZERO;
    },
    
    get_vec_by_field: function (src_field, rel_pos = cc.Vec2.ZERO) {
        var loc_pos = this.get_loc_pos(src_field, rel_pos);
        //if(!this.in_field(loc_pos)) {
        if(!this.point_in_field(loc_pos)) {
            return undefined;
        }
        return this.get_vec(loc_pos);
    },

    // use this for initialization
    // onLoad: function () {

    // },

    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },
});
