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
    
    statics: {
        rule_priority: 5,
        rule_interacts: ['vecfield', 'gf_test_gravity'],
    },
    
    init_rule: function () {
        this._super();
    },
    
    update_rule: function (dt) {
        this._super(dt);
        //this.foreach_interact('vecfield', function (field, fld_name, glb) {
        this.foreach_interacts(function (field, fld_name, glb) {
            //console.log(fld_name, glb);
            var vec = field.get_vec_by_field(this);
            if(!vec) {
                return;
            }
            var inertia = this.get_rule('inertia');
            if(!inertia) {
                throw 'need rule inertia';
            }
            inertia.force(vec);
        });
    },

    // use this for initialization
    // onLoad: function () {

    // },

    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },
});
