var $ForkizeInstance = require("./fz_instance.js");
var $FzConfig = require("./fz_config.js");

var _sdkFactory = {};

_sdkFactory.getInstance = function(appId, appKey) {
    var sdkInstance = new $ForkizeInstance(appId, appKey);
    return sdkInstance;
};

_sdkFactory.browserify = function() {
    $FzConfig.isBrowser = true;
    return _sdkFactory;
}

module.exports = _sdkFactory;