cc.Class({
    extends: cc.Component,

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
        line_width: 10,
        
        size: 100,
        
        fill_color: cc.Color.WHITE,
    },
    
    // errata for the anchor invalid bug only when use graphics component
    pos_with_anchor: function (pos) {
        var anchor = cc.v2(this.node.width * this.node.anchorX,
            this.node.height * this.node.anchorY);
        return pos.add(anchor);
    },

    // use this for initialization
    onLoad: function () {
        var g = this.getComponent(cc.Graphics);

        g.lineWidth = this.line_width;
        g.fillColor = this.fill_color;
        
        var pos = this.pos_with_anchor(cc.v2(0, 0));
        g.circle(pos.x, pos.y, this.size);
        
        g.stroke();
        g.fill();
    },

    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },
});
