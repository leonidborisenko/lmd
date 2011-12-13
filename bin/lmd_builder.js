/**
 * LMD
 *
 * @author  Mikhail Davydov
 * @licence MIT
 */

var LMD_JS = __dirname + '/../src/lmd_min.js',
    fs = require('fs');

var LmdBuilder = function (argv) {
    this.configFile = argv[2];
    this.outputFile = argv[3];
    if (this.configure()) {
        this.build();
    }
};

LmdBuilder.prototype.compress = function (code) {
    var parser = require("uglify-js").parser,
        uglify = require("uglify-js").uglify;

    var ast = parser.parse(code);
    ast = uglify.ast_mangle(ast);
    ast = uglify.ast_squeeze(ast);

    return uglify.gen_code(ast);
};

LmdBuilder.prototype.escape = function (file) {
    return JSON.stringify(file);
};

LmdBuilder.prototype.render = function (lmd_modules, lmd_main, pack) {
    var lmd_js = fs.readFileSync(LMD_JS, 'utf8').replace(/\/\*\{\*\/.*\/\*\}\*\//g, ''),
        result;

    lmd_modules = '{\n' + lmd_modules.join(',\n') + '\n}';
    result = lmd_js + '(' + lmd_modules + ')(' + lmd_main + ')';

    if (pack) {
        result = this.compress(result);
    }

    return result;
};

LmdBuilder.prototype.configure = function () {
    if (!this.configFile) {
        console.log('lmd usage:\n\t    lmd config.lmd.json [output.lmd.js]');
        return false;
    }
    return true;
};

LmdBuilder.prototype.build = function () {
    var config = JSON.parse(fs.readFileSync(this.configFile, 'utf8')),
        lazy = typeof config.lazy === "undefined" ? true : config.lazy,
        mainModuleName = config.main,
        pack = lazy ? true : typeof config.pack === "undefined" ? true : config.pack,
        path =  config.path || '',
        configDir = fs.realpathSync(this.configFile),
        moduleContent,
        modulePath,
        lmdModules = [],
        lmdMain,
        lmdFile,
        isJson;

    configDir = configDir.split('/');
    configDir.pop();
    configDir = configDir.join('/');

    if (config.modules) {
        if (path[0] !== '/') { // non-absolute
            path = configDir + '/' + path;
        }
        for (var moduleName in config.modules) {
            modulePath = fs.realpathSync(path + config.modules[moduleName]);
            moduleContent = fs.readFileSync(modulePath, 'utf8');

            try {
                JSON.parse(moduleContent);
                isJson = true;
            } catch (e) {
                isJson = false;
            }

            if (!isJson && pack) {
                moduleContent = this.compress(moduleContent);
            }

            if (moduleName === mainModuleName) {
                lmdMain = moduleContent;
            } else {
                if (!isJson && lazy) {
                    moduleContent = this.escape('(' + moduleContent.replace(/^function[^\(]*/, 'function') + ')' );
                }
                lmdModules.push(this.escape(moduleName) + ': ' + moduleContent);
            }
        }

        lmdFile = this.render(lmdModules, lmdMain, pack);

        if (this.outputFile) {
            fs.writeFileSync(this.outputFile, lmdFile,'utf8')
        } else {
            process.stdout.write(lmdFile);
        }
    }
};

module.exports = LmdBuilder;