var $util = require('util');
var $EventEmitter = require('events');

var $FzConfig = require("./fz_config.js");
var $FzRequest = require("./fz_request.js");
var $FzUserProfile = require("./fz_profile.js");
var $FzEventManager = require("./fz_event_manager.js");

function Forkize(appIdVal, appKeyVal) {
    $EventEmitter.call(this);
    
    var _appId = appIdVal;
    var _appKey = appKeyVal;

    this.getAppId = function() {
        return _appId;  
    };
    
    this.getAppKey = function() {
        return _appKey;
    };
    
    var _config;
    var _requestManager;
    var _eventManager;
    var _profile;

    this.getConfig = function() {
        if(!_config) {
            _config = new $FzConfig(this);
        }
        
        return _config;
    };
    
    this.getRequestManager = function() {
        if(!_requestManager) {
            _requestManager = new $FzRequest(this);
        }
        return _requestManager;
    };
    
    this.getEventManager = function() {
        if(!_eventManager) {
            _eventManager = new $FzEventManager(this);
        }
        return _eventManager;
    };
    
    this.getProfile = function() {
        if(!_profile) {
            _profile = new $FzUserProfile(this);
        }
        
        return _profile;
    };
}

$util.inherits(Forkize, $EventEmitter);

Forkize.prototype.identify = function(userId, callback) {
    this.getProfile().identify(userId, callback);
};

Forkize.prototype.alias = function(alisIdVal, callback) {
    this.getProfile().alias(alisIdVal, callback);
};

Forkize.prototype.eventDuration = function(eventName) {
    this.getEventManager().eventDuration(eventName);
};

Forkize.prototype.advanceState = function(state) {
    this.getEventManager().advanceState(state);
};

Forkize.prototype.resetState = function() {
    this.getEventManager().resetState();
};

Forkize.prototype.getState = function() {
    return this.getEventManager().getState();
};

Forkize.prototype.startSession = function() {
    this.getEventManager().startSession();
};

Forkize.prototype.endSession = function() {
    this.getEventManager().endSession();
};

Forkize.prototype.setSuperProperties = function(superPropertiesMap) {
    return this.getEventManager().registerSuperProperties(superPropertiesMap);
};

Forkize.prototype.setSuperPropertiesOnce = function(superPropertiesMap) {
    return this.getEventManager().registerSuperPropertiesOnce(superPropertiesMap);
};

Forkize.prototype.resetSuperProperties = function(superPropertiesMap) {
    this.getEventManager().resetSuperProperties();
};

Forkize.prototype.track = function(evName, evData, callback) {
    this.getEventManager().trackEvent(evName, evData, callback);  
};

Forkize.prototype.purchase = function(productId, currency, price, quantity, callback) {
    var evData = {};
    evData["product_id"] = productId;
    evData["currency"] = currency;
    evData["price"] = price;
    evData["quantity"] = quantity ;
    this.getEventManager().trackEvent("purchase", evData, callback);  
};

Forkize.prototype.getSegments = function() {
    return this.getProfile().getSegments();
};


module.exports = Forkize;