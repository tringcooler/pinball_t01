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
        
        offset: cc.v2(0, 0),
        
        editing: {
            default: false,
            serializable: false,
        },
        
        points: {
            default: function () {
                 return [cc.v2(-50,-50), cc.v2(50, -50), cc.v2(50,50), cc.v2(-50,50)];
            },
            type: [cc.Vec2]
        },
    },

    // use this for initialization
    onLoad: function () {

    },

    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },
});
