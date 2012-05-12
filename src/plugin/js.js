/**
 * @name global
 * @name require
 * @name initialized_modules
 * @name modules
 * @name global_eval
 * @name register_module
 * @name global_document
 */

    /**
     * Loads any JavaScript file a non-LMD module
     *
     * @param {String}   moduleName path to file
     * @param {Function} callback   callback(result) undefined on error HTMLScriptElement on success
     */
    require.js = function (moduleName, callback) {
        var module = modules[moduleName],
            readyState = 'readyState',
            isNotLoaded = 1,
            head;

        // If module exists
        if (module) {
            callback(initialized_modules[moduleName] ? module : require(moduleName));
            return;
        }

        // by default return undefined
        if (!global_document) {
/*$IF WORKER_OR_NODE$*/
            // if no global try to require
            // node or worker
            try {
                // call importScripts or require
                // any of them can throw error if file not found or transmission error
                module = register_module(moduleName, (global.importScripts || global.require)(moduleName) || {});
            } catch (e) {
                // error -> default behaviour
            }
/*$ENDIF WORKER_OR_NODE$*/
            callback(module);
            return;
        }

/*$IF WORKER_OR_NODE$*/
//#JSCOVERAGE_IF 0
/*$ENDIF WORKER_OR_NODE$*/
        var script = global_document.createElement("script");
        global.setTimeout(script.onreadystatechange = script.onload = function (e) {
            /*$IF IE$*/e = e || global.event;/*$ENDIF IE$*/
            if (isNotLoaded &&
                (!e ||
                !script[readyState] ||
                script[readyState] == "loaded" ||
                script[readyState] == "complete")) {

                isNotLoaded = 0;
                // register or cleanup
                callback(e ? register_module(moduleName, script) : head.removeChild(script) && void 0); // e === undefined if error
            }
        }, 3000); // in that moment head === undefined

        script.src = moduleName;
        head = global_document.getElementsByTagName("head")[0];
        head.insertBefore(script, head.firstChild);
/*$IF WORKER_OR_NODE$*/
//#JSCOVERAGE_ENDIF
/*$ENDIF WORKER_OR_NODE$*/
    };