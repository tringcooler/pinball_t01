var util = require('util');

/* main loop:
can pause: {
    event before update
    comp start
    comp update: {
        ruler priority 0~99
    }
    scheduler update: {
        system priority: {
            action manager
            animation manager
            collider manager
            physics manager
        }
        non system priority
    }
    comp lateupdate: {
        ruler priority 100~
    }
    event after update
}
event before visit
visit scene
event after visit
render
event after draw
*/

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
    
    push: function (rule) {
        var prio = rule.get_rule_prop('priority');
        if(prio instanceof Array) {
            for(var i = 0; i < prio.length; i ++) {
                util.dict_pool.push(this.rule_pool, prio[i], rule);
            }
        } else {
            util.dict_pool.push(this.rule_pool, prio, rule);
        }
        if(!rule.is_inited()) {
            rule.init_rule();
        }
    },
    
    remove: function(rule) {
        var prio = rule.get_rule_prop('priority');
        if(prio instanceof Array) {
            for(var i = 0; i < prio.length; i ++) {
                util.dict_pool.remove(this.rule_pool, prio[i], rule);
            }
        } else {
            util.dict_pool.remove(this.rule_pool, prio, rule);
        }
    },
    
    invoke_rules_prio: function (fname, prio, args) {
        if(this.rule_pool[prio] instanceof Array) {
            var rules = this.rule_pool[prio];
            for(var i = 0; i < rules.length; i ++) {
                var rule = rules[i];
                if(rule.has_tags(this._pause_tags)) {
                    continue;
                }
                var func = rule[fname];
                if( (!rule.bypass) && func) {
                    func.apply(rule, args);
                }
            }
        }
    },
    
    update_rules: function (dt, prio = null) {
        if(typeof prio == 'number') {
            this.invoke_rules_prio('update_rule', prio, [dt, prio]);
        } else {
            var max_prio = this.rule_pool.length;
            if(prio === null) {
                prio = [0, max_prio];
            }
            var _neg = function(v) {
                if(v < 0) {
                    return v + max_prio + 1;
                } else {
                    return v;
                }
            };
            var threshold_prio = [
                Math.max(_neg(this._pause_prio[0]), _neg(prio[0])),
                Math.min(_neg(this._pause_prio[1]), _neg(prio[1]))
            ];
            for(var i = threshold_prio[0]; i < threshold_prio[1]; i ++) {
                this.invoke_rules_prio('update_rule', i, [dt, i]);
            }
        }
    },
    
    pause_low: function (prio = null) {
        if(prio === null) {
            prio = this.get_rule_prop('priority') + 1;
        }
        this._pause_prio = [0, prio];
    },
    
    pause_hi: function (prio = null) {
        if(prio === null) {
            prio = this.get_rule_prop('priority');
        }
        this._pause_prio = [prio, -1];
    },
    
    pause_tags: function (tags) {
        if(!(tags instanceof Array)) {
            tags = [tags];
        }
        for(var i = 0; i < tags.length; i ++) {
            var ti = this._pause_tags.indexOf(tags[i]);
            if(ti == -1) {
                this._pause_tags.push(tags[i]);
            }
        }
    },
    
    unpause_tags: function (tags) {
        if(!(tags instanceof Array)) {
            tags = [tags];
        }
        for(var i = 0; i < tags.length; i ++) {
            var ti = this._pause_tags.indexOf(tags[i]);
            if(ti != -1) {
                this._pause_tags.splice(ti, 1);
            }
        }
    },
    
    unpause: function () {
        this._pause_prio = [0, -1];
        this._pause_tags = [];
    },

    // use this for initialization
    onLoad: function () {
        cc.log('ruler init');
        this.rule_pool = [];
        this.unpause();
    },

    // called every frame, uncomment this function to activate update callback
    update: function (dt) {
        this.update_rules(dt, [0, 99]);
    },
    
    lateUpdate: function (dt) {
        this.update_rules(dt, [100, -1]);
    }
});
