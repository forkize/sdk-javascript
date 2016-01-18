var FzConfig = function () {
    
    var _API_URL = "http://fzgate.cloudapp.net:8080";
    var _VERSION = "1.0";
    var _SDK = "ios";

    this.getApiUrl = function() {
        return _API_URL;
    };
    
    this.getVersion = function() {
        return _VERSION;
    };
    
    this.getSdk = function() {
        return _SDK;
    };
    
    this.isBrowser = function() {
        return FzConfig.isBrowser;  
    };
    
    this.setBrowser = function(val) {
       FzConfig.isBrowser  = val;  
    };

}

FzConfig.isBrowser = false;

module.exports = FzConfig;