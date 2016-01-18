var $lodash = require("lodash");
var $uuid = require("uuid");
var $FzHelper = require("./fz_helper");
var $FzError = require("./fz_error.js");

var debug = require("debug")("fz::sdk::profile");

function _generateUserId() {
    return $uuid.v1();
}
    
function UserProfile(sdk) {
    var _sdk = sdk;
    
    var _userId = null;
    var _token = null;
    
    var _profileData = {};
    var _profileVersion = null;
    
    function _setToken(token) {
        _token = token;
    }
      
    function _setProfileData(upvVal, upVal) {
        _profileVersion = upvVal;
        _profileData = upVal;
    }
    
    this.getAttr = function(key) {
      return _profileData[key];  
    };
    
    this.getToken = function() {
        return _token;
    };
    
    this.getProfileVersion = function() {
        console.log("get profile version ,  _profileVersion");
      return _profileVersion;  
    };

    // a - userid and b - callback, a - userid no callback, no userid, a - callback
    this.identify = function(a, b) {
        var _self = this;
    
        var userId;
        var callback;
        
        if(a && b && $lodash.isString(a) && $lodash.isFunction(a)){
           // a should be userId and b callback
           userId = a;
           callback = b;
        }
        else if(a && $lodash.isFunction(a)) {
            userId = null;
            callback = a;
        }
        else if(a && $lodash.isString(a)){
            userId = a;
            callback = null;
        }
        else {
            var fzerr = new $FzError("Invalid arguments provided in 'identify'", 300);
            _sdk.emit("error", fzerr);
            if($lodash.isFunction(callback)) {
                callback(fzerr, null);
            }
            return;
        }
        
        if(!userId) {
            // ** setting genereted userId
            userId = _generateUserId();
        }
        
        _userId = userId;
        
        // !!! reseting token before identify
        _token = null;
        
        _sdk.getRequestManager().queue("/people/identify", null, function (err, body){
            if(err) {
                var fzerr = new $FzError("Identify failed", 300, err);
                _sdk.emit("error", fzerr);
                
                if($lodash.isFunction(callback)) {
                    callback(fzerr, null);
                }
    
                return;
            }
            _setToken(body["access_token"]);
        });
        
        
        var now = Date.now();
        
        _sdk.getEventManager().startSession();
        
        _sdk.getRequestManager().queue("/profile/sync", null, _createProfileResponseHandler());
        _self.setOnce("first_seen", now);
        _self.set("last_seen", now);
    };
    
    this.alias = function(aliasIdVal, callback) {
        var _self = this;
    
        var fzerr;
        
        if(! $FzHelper.isValidUserId(aliasIdVal)){
            fzerr = new $FzError("Invalid aliasId is provided in 'alias'", 300);
            _sdk.emit("error", fzerr);
            if($lodash.isFunction(callback)) {
                callback(fzerr, null);
            }
            return;
        }
        
        if(_userId == aliasIdVal) {
            fzerr = new $FzError("Invalid aliasId is provided in 'alias'. Must differ from user id", 300);
            _sdk.emit("error", fzerr);
            if($lodash.isFunction(callback)) {
                callback(fzerr, null);
            }
            return;
        }
        
        callback = $lodash.isFunction(callback) ? callback : null;
        
        _sdk.getRequestManager().queue("/people/alias", {'alias_id' : aliasIdVal}, function(err, body){
            
            if(err) {
                var fzerr = new $FzError("Alias failed", 300, err);
                _sdk.emit("error", fzerr);
                if(callback) {
                    callback(fzerr, null);
                }
                return;
            }
          
            _userId = aliasIdVal;
            _setToken(body["access_token"]);
            console.log("SET ACCESS TOKEN IN ALIAS ", body["access_token"]);
            
            if(callback) {
                callback(null, true);
            }
        });
    };
    
    this.getUserId = function() {
        return _userId;
    };
    
    // ** queued calls - should  run series way
    
    this.setOnce = function(attrName, attrValue, c) {
        if(!$FzHelper.isValidEventAttrName(attrName) || !$FzHelper.isValidEventAttrValue(attrValue)){
            var fzErr = new $FzError("Invalid arguments provided to function 'set'", 300);
            _sdk.emit("error", fzErr);
            if($lodash.isFunction(c)) {
                c(fzErr, null);
            }
            return;
        }
        
        var setParams = {};
        setParams[attrName] = attrValue;
        var apiData = {"set_once" : setParams};

        apiData["upv"] = _profileVersion;
    
        var callback = $lodash.isFunction(c) ? c : null;
        _sdk.getRequestManager().queue("/profile/setonce", apiData, _createProfileResponseHandler(callback));
    };
    
    this.set = function(attrName, attrValue, c) {
        if(!$FzHelper.isValidEventAttrName(attrName) || !$FzHelper.isValidEventAttrValue(attrValue)){
            var fzErr = new $FzError("Invalid arguments provided to function 'set'", 300);
            _sdk.emit("error", fzErr);
            if($lodash.isFunction(c)) {
                c(fzErr, null);
            }
            return;
        }
        
        var setParams = {};
        setParams[attrName] = attrValue;
        var apiData = {"set" : setParams};
        apiData["upv"]=_profileVersion;
    
        var callback = $lodash.isFunction(c) ? c : null;
        _sdk.getRequestManager().queue("/profile/set", apiData, _createProfileResponseHandler(callback));
    };
    
    this.setBatch = function(attrMap, c) {
        if(!$FzHelper.isValidEventAttrMap(attrMap)) {
            var fzErr = new $FzError("Invalid arguments provided to function 'setBatch'", 300);
            _sdk.emit("error", fzErr);
            if($lodash.isFunction(c)) {
                c(fzErr, null);
            }
            return;
        }
        
         var apiData = {"set" : attrMap};
         apiData["upv"]=_profileVersion;
        
        var callback = $lodash.isFunction(c) ? c : null;
        _sdk.getRequestManager().queue("/profile/set", apiData, _createProfileResponseHandler(callback));
    };
    
    this.unset = function(attrName, c) {
        if(!$FzHelper.isValidEventAttrName(attrName)){
            var fzErr = new $FzError("Invalid arguments provided to function 'unset'", 300);
            _sdk.emit("error", fzErr);
            if($lodash.isFunction(c)) {
                c(fzErr, null);
                return;
            }
        } 
        
        var attrNamesArray = [];
        attrNamesArray.push(attrName);
        var apiData = {"unset" : attrNamesArray};
        apiData["upv"]=_profileVersion;
    
        var callback = $lodash.isFunction(c) ? c : null;
        
        // function body
        _sdk.getRequestManager().queue("/profile/unset", apiData, _createProfileResponseHandler(callback));
    };
    
    this.unsetBatch = function(attrNamesArray, c) {
        if(!$FzHelper.isValidEventAttrNameArray(attrNamesArray)) {
            var fzErr = new $FzError("Invalid arguments provided to function 'unsetBatch'", 300);
            _sdk.emit("error", fzErr);
            if($lodash.isFunction(c)) {
                c(fzErr, null);
            }
            return;
        }
        
        var apiData = {"unset" : attrNamesArray};
        apiData["upv"]=_profileVersion;
        
        var callback = $lodash.isFunction(c) ? c : null;
         _sdk.getRequestManager().queue("/profile/unset", apiData, _createProfileResponseHandler(callback));
    };
    
    this.increment = function(attrName, attrNumericValue, c) {
        if(!$FzHelper.isValidEventAttrName(attrName) || !$lodash.isNumber(attrNumericValue)){
            var fzErr = new $FzError("Invalid arguments provided to function 'increment'", 300);
            _sdk.emit("error", fzErr);
            if($lodash.isFunction(c)) {
                c(fzErr, null);
            }
            return;
        }
        var incParams = {};
        incParams[attrName] = attrNumericValue;
        var apiData = {"increment" : incParams};
        apiData["upv"]=_profileVersion;
    
        var callback = $lodash.isFunction(c) ? c : null;
        
        // function body
        _sdk.getRequestManager().queue("/profile/increment", apiData, _createProfileResponseHandler(callback));
    };
    
    this.incrementBatch = function(attrNumericMap, c) {
        if(!$FzHelper.isValidEventAttrNumericMap(attrNumericMap)) {
            var fzErr = new $FzError("Invalid arguments provided to function 'incrementBatch'", 300);
            _sdk.emit("error", fzErr);
            if($lodash.isFunction(c)) {
                c(fzErr, null);
            }
            return;
        }
        var apiData = {"increment" : attrNumericMap};
        apiData["upv"]=_profileVersion;
         
        var callback = $lodash.isFunction(c) ? c : null;
        _sdk.getRequestManager().queue("/profile/increment", apiData, _createProfileResponseHandler(callback));
    };
    
    this.append = function(attrName, attrValue, c) {
        if(!$FzHelper.isValidEventAttrName(attrName) || !$FzHelper.isValidEventAttrValue(attrValue)){
            var fzErr = new $FzError("Invalid arguments provided to function 'append'", 300);
            _sdk.emit("error", fzErr);
            if($lodash.isFunction(c)) {
                c(fzErr, null);
            }
            return;
        }
        
        var appendParams = {};
        appendParams[attrName] = attrValue;
        var apiData = {"append" : appendParams};
        apiData["upv"]=_profileVersion;
    
        var callback = $lodash.isFunction(c) ? c : null;
        
        // function body
        _sdk.getRequestManager().queue("/profile/append", apiData, _createProfileResponseHandler(callback));
    };
    
    this.prepend = function(attrName, attrValue, c) {
        if(!$FzHelper.isValidEventAttrName(attrName) || !$FzHelper.isValidEventAttrValue(attrValue)){
            var fzErr = new $FzError("Invalid arguments provided to function 'prepend'", 300);
            _sdk.emit("error", fzErr);
            if($lodash.isFunction(c)) {
                c(fzErr, null);
            }
            return;
        }
        
        var prependParams = {};
        prependParams[attrName] = attrValue;
        var apiData = {"prepend" : prependParams};
        apiData["upv"]=_profileVersion;
    
        var callback = $lodash.isFunction(c) ? c : null;
        
        // function body
        _sdk.getRequestManager().queue("/profile/prepend", apiData, _createProfileResponseHandler(callback));
    };
    
    this.getSegments = function() {
         _sdk.getRequestManager().post("/profile/getsegments", {}, function(err, response) {
            if(err) {
                return console.log(" getSegments " , err);
            }
            console.log(response);
         });
    };
    
    function _getProfileData(callback) { 
        _sdk.getRequestManager().queue("/profile/sync", null, _createProfileResponseHandler(callback));
    }
    
    // ** FZ::TODO maybe we shuld check for mandatory profile data for identify case
    
    function _createProfileResponseHandler(cfn) {
        return function _syncProfileResponseHandler (err, profileData) {
            if(err) {
                var fzerr = new $FzError("Identify failed", 300, err);
                debug("_getProfileData ", fzerr, profileData );
                _sdk.emit("error", fzerr);
                
                if($lodash.isFunction(cfn)) {
                    cfn(fzerr, null);
                }
                
                return;
            }
            
            _setProfileData(profileData["upv"], profileData["up"]);
            
            if($lodash.isFunction(cfn)) {
                cfn(null, true);
            }
            
            return;
        };
    }
}

module.exports = UserProfile;