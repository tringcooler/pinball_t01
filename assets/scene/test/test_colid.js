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
    },

    // use this for initialization
    onLoad: function () {
            var manager = cc.director.getCollisionManager();
            manager.enabled = true;
            manager.enabledDebugDraw = true;
        },
        
    onCollisionEnter: function (other, self) {
        console.log('on collision enter', other.name, self.name);
    
        // 碰撞系统会计算出碰撞组件在世界坐标系下的相关的值，并放到 world 这个属性里面
        var world = self.world;
    
        // 碰撞组件的 aabb 碰撞框
        var aabb = world.aabb;
    
        // 上一次计算的碰撞组件的 aabb 碰撞框
        var preAabb = world.preAabb;
    
        // 碰撞框的世界矩阵
        var t = world.transform;
    
        // 以下属性为圆形碰撞组件特有属性
        var r = world.radius;
        var p = world.position;
    
        // 以下属性为 矩形 和 多边形 碰撞组件特有属性
        var ps = world.points;
        
    },
    
    onCollisionStay: function (other, self) {
        //console.log('on collision stay', other, self);
    },
    
    onCollisionExit: function (other, self) {
        console.log('on collision exit', other.name, self.name);
    }

    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },
});
