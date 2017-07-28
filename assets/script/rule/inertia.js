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
        
        mass: 10,
        speed: cc.Vec2.ZERO,
        accelerate: cc.Vec2.ZERO,
    },
    
    statics: {
        rule_priority: 10,
    },
    
    force: function (f) {
        this.accelerate.addSelf(f.div(this.mass));
    },
    
    init_rule: function () {
        this._super();
    },
    
    update_rule: function (dt) {
        this._super(dt);
        //var nd = this.getComponent(cc.Node);
        var nd = this.node;
        this.speed.addSelf(this.accelerate.mul(dt));
        //nd.position.addSelf(this.speed.mul(dt));
        //nd.position = nd.position.add(this.speed.mul(dt));
        nd.x += this.speed.x * dt;
        nd.y += this.speed.y * dt;
        this.accelerate = cc.Vec2.ZERO;
        this.node.setNodeDirty();
    },

    // use this for initialization
    // onLoad: function () {
    //     this._super();
    // },

    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {
        
    // },
});
