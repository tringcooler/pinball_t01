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
    
    editor: {
        executeInEditMode: true,
    },
    
    search: function (dir, fn, key) {
        var fs = require('fs');
        //Editor.log('s:', dir, fn, key);
        var r = [];
        if(fn.includes(key)) {
            r = [dir + '\\' + fn];
        }
        //Editor.log('s:', dir + '\\' + fn);
        var node;
        try {
            node = fs.readdirSync(dir + '\\' + fn);
        } catch (ex) {
            //Editor.log(ex);
        }
        //Editor.log('s:', node);
        if(node) {
            for(var i = 0; i < node.length; i ++) {
                var cr = this.search(dir + '\\' + fn, node[i], key);
                r = r.concat(cr);
            }
        }
        return r;
    },
    
    search_file: function (dir, key) {
        var fs = require('fs');
        //Editor.log('s:', dir, key);
        var r = [];
        var node;
        try {
            node = fs.readdirSync(dir);
        } catch (ex) {
            //Editor.log(ex);
        }
        if(node) {
            for(var i = 0; i < node.length; i ++) {
                var cr = this.search_file(dir + '\\' + node[i], key);
                r = r.concat(cr);
            }
        } else {
            var content;
            try {
                content = fs.readFileSync(dir);
            } catch (ex) {
                //Editor.log(ex);
            }
            //Editor.log(typeof content);
            if(content && content.includes(key)) {
                r = [dir];
            }
        }
        return r;
    },
    
    savebat: function (src, dst) {
        var fs = require('fs');
        for(var i = 0; i < src.length; i ++) {
            var srcn = src[i];
            var dstn = srcn.replace(/\\/g, '_').replace(/\:/g, '_');
            dstn = dst + '\\' + dstn.slice(-16);
            //Editor.log('save:', srcn, dstn);
            fs.writeFileSync(dstn, fs.readFileSync(srcn));
        }
    },
    
    copydir: function (src, dst) {
        var fs = require('fs');
        var node;
        try {
            node = fs.readdirSync(src);
        } catch (ex) {
            //Editor.log(ex);
        }
        if(node) {
            if(!fs.existsSync(dst))
                fs.mkdirSync(dst);
            for(var i = 0; i < node.length; i ++) {
                var ns = src + '\\' + node[i];
                var nd = dst + '\\' + node[i];
                this.copydir(ns, nd);
            }
        } else {
            try {
                //Editor.log('cp:', src, dst);
                fs.writeFileSync(dst, fs.readFileSync(src));
            } catch (ex) {
                //Editor.log(ex);
            }
        }
    },

    // use this for initialization
    onLoad: function () {
        if(CC_EDITOR) {
            Editor.log('Hello World!');
            var dst_url = 'packages://inspector/inspectors/comps/physics/points-base-collider.js';
            Editor.log('path:', Editor.url(dst_url, 'utf8'));
            var Fs = require('fs');
            Editor.log('cwd:', process.cwd());
            Editor.log('dir:', __dirname, __filename);
            //Editor.log('Fs:', Object.keys(Fs));
            //var content = Fs.readFileSync(Editor.url(dst_url, 'utf8'));
            //Editor.log('content:', content);
            //Fs.writeFileSync('E:\\temp\\table5\\points-base-collider.js', content);
            //Editor.log('require:', require);
            //Editor.log('readFileSync:', Fs.readFileSync);
            //Editor.log('dir:', Fs.readdirSync(
            //    'E:\\CocosCreator\\resources\\app.asar\\editor\\builtin\\assets\\core'));
            //Fs.writeFileSync('E:\\temp\\table5\\dst.js', Fs.readFileSync(
            //    'E:\\CocosCreator\\resources\\app.asar\\node_modules\\winston\\test\\transports\\file-archive-test.js'));
            //Fs.writeFileSync('E:\\temp\\table5\\dst.js', Fs.readFileSync.toString());
            //var sc = this.search('E:\\CocosCreator\\resources', 'app.asar', 'fs.js');
            //var sc = this.search_file('E:\\CocosCreator\\resources\\app.asar', 'copyFileOut');
            //Editor.log('search:', sc);
            //this.savebat(sc, 'E:\\temp\\table5\\t02');
            //this.copydir('E:\\CocosCreator\\resources\\app.asar', 'E:\\temp\\table5\\t05');
            Editor.log('done');
        }
    },

    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },
});
