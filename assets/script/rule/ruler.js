var util = require('util');

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
                var rule = rules[i]
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
        if(prio === null) {
            var threshold_prio = [
                Math.max(this._pause_prio[0], 0),
                Math.min(this._pause_prio[1], this.rule_pool.length),
                ];
            if(threshold_prio[0] < 0) {
                threshold_prio[0] += this.rule_pool.length + 1;
            }
            if(threshold_prio[1] < 0) {
                threshold_prio[1] += this.rule_pool.length + 1;
            }
            for(var i = threshold_prio[0]; i < threshold_prio[1]; i ++) {
                this.invoke_rules_prio('update_rule', i, [dt, i]);
            }
        } else {
            this.invoke_rules_prio('update_rule', prio, [dt, prio]);
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
        //if(dt > 0.1) dt = 0.1; //!alert!
        console.log(dt);
        this.update_rules(dt);
    },
});
