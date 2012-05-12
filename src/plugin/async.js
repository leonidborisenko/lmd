/**
 * @name global
 * @name require
 * @name initialized_modules
 * @name modules
 * @name global_eval
 * @name register_module
 */

    /**
     * Load off-package LMD module
     *
     * @param {String}   moduleName same origin path to LMD module
     * @param {Function} callback   callback(result) undefined on error others on success
     */
    require.async = function (moduleName, callback) {
        var module = modules[moduleName],
            XMLHttpRequestConstructor = global.XMLHttpRequest || global.ActiveXObject;

        // If module exists or its a node.js env
        if (module) {
            callback(initialized_modules[moduleName] ? module : require(moduleName));
            return;
        }

/*$IF NODE$*/
        if (!XMLHttpRequestConstructor) {
            global.require('fs').readFile(moduleName, 'utf8', function (err, module) {
                if (err) {
                    callback();
                    return;
                }
                // check file extension not content-type
                if ((/js$|json$/).test(moduleName)) {
                    module = global_eval('(' + module + ')');
                }
                // 4. Then callback it
                callback(register_module(moduleName, module));
            });
            return;
        }
/*$ENDIF NODE$*/

/*$IF NODE$*/
//#JSCOVERAGE_IF 0
/*$ENDIF NODE$*/
        // Optimized tiny ajax get
        // @see https://gist.github.com/1625623
        var xhr = new XMLHttpRequestConstructor("Microsoft.XMLHTTP");
        xhr.onreadystatechange = function () {
            if (xhr.readyState == 4) {
                // 3. Check for correct status 200 or 0 - OK?
                if (xhr.status < 201) {
                    module = xhr.responseText;
                    if ((/script$|json$/).test(xhr.getResponseHeader('content-type'))) {
                        /*$IF IE$*/module = '(function(){return' + module + '})()';/*$ENDIF IE$*/
                        module = global_eval('(' + module + ')');
                    }
                    // 4. Then callback it
                    callback(register_module(moduleName, module));
                } else {
                    callback();
                }
            }
        };
        xhr.open('get', moduleName);
        xhr.send();
/*$IF NODE$*/
//#JSCOVERAGE_ENDIF
/*$ENDIF NODE$*/
    };