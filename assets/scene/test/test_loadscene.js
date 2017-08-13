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
        //cc.loader.loadRes('scene/test/res_test', cc.SceneAsset, function (err, res) {
        //cc.director.preloadScene('scene/test/res_test', function (err, res) {
        //cc.AssetLibrary.loadAsset('e0a3b4d4-c56c-4dad-a25c-40ceed25c5f0', function (err, res) {
        //cc.loader.load({type:'uuid', uuid:'e0a3b4d4-c56c-4dad-a25c-40ceed25c5f0'}, function (err, res) {
        cc.director.preloadScene('test_plat_4', function (err, res) {
            cc.log(err, res);
            var root = res.scene.getChildByName('Canvas');
            //root._onBatchCreated();
            /*for(var i = root.children.length - 1; i > -1; i --) {
                var node = root.children[i];
                cc.log('load', node.name);
                node.parent = this.node;
                cc.log('after link', node.name);
                node._updateSgNode();
                //node._onBatchCreated();
            }*/
            var i, nodes = [];
            for(i = 0; i < root.children.length; i ++) {
                nodes.push(root.children[i]);
            }
            for(i = 0; i < nodes.length; i ++) {
                var node = nodes[i];
                node.parent = this.node;
                node._updateSgNode();
            }
            //this.node._onBatchCreated();
            //root.parent = this.node.parent;
            //root.removeFromParent(false);
            //this.node.parent.addChild(root);
        }.bind(this));
    },

    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },
});
