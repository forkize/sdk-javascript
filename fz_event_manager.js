var $lodash = require("lodash");
var $uuid = require("uuid");
var $FzHelper = require("./fz_helper.js");
var $FzError = require("./fz_error.js");
var debug = require("debug")("fz::sdk::event");

function _generateSessionId() {
    return $uuid.v1();
}

function FzEventManager(sdk) {
    var _sdk = sdk;
    // ** session
    var _sessionId;
    var _sessionStartTime;
    var _sessionStarted = false;
    
    // ** state
    var _state;
    var _stateStartTime;
    
    var _eventDurationMap = {};
    var _superProperties = {};
    
    this.getState = function() {
        return _state;
    };
    
    // ** Super properties interface
    
    function _registerSuperProperties(propertiesMap, registerOnce) {
        registerOnce = registerOnce ? true : false;
        if(! $FzHelper.isValidEventAttrMap(propertiesMap)) {
            var fzerr = new $FzError("Invalid arguments in registerSuperProperties", 200);
            return _sdk.emit("error", fzerr);
        }
        
        var attrsArray = Object.keys(propertiesMap);
        var len = attrsArray.length;
       
        var attrName;
        for(var i = 0; i < len; i++) {
            attrName = attrsArray[i];
            if(!_superProperties.hasOwnProperty(attrName) || registerOnce == false) {
               _superProperties[attrName] = propertiesMap[attrName];
            }
        }
    };
    
    this.registerSuperProperties = function(propertiesMap) {
        _registerSuperProperties(propertiesMap, false);
        return _superProperties;
    };
    
    this.registerSuperPropertiesOnce = function(propertiesMap) {
        _registerSuperProperties(propertiesMap, true);
        return _superProperties;
    };

    this.advanceState = function(stateVal) {
        var now = Date.now();
        if(_state) {
            var stateDuration = now - _stateStartTime;
            
            var eventParams = {};
            eventParams['$state_duration'] = stateDuration;
            eventParams['$state_prev'] = _state;
            eventParams['$state_next'] = stateVal;
        
            this.trackEvent("$state_advance", eventParams);
        }
        
        _state = stateVal;
        _stateStartTime = now;
    };
    
    this.resetState = function() {
        var now = Date.now();
        if(_state) {
            var stateDuration = now - _stateStartTime;
            
            var eventParams = {};
            eventParams['$state_duration'] = stateDuration;
            eventParams['$state_prev'] = _state;
            eventParams['$state_next'] = "";
        
            this.trackEvent("$state_advance", eventParams);
        }
        
        _state = null;
        _stateStartTime = 0;
    };
    
    this.startSession = function() {
        if(!_sessionStarted) {
            _sessionStartTime = Date.now();
            _sessionId = _generateSessionId();
            _sessionStarted = true;
            this.trackEvent("$session_start", null);
        }
    };
    
    this.endSession = function() {
        if(_sessionStarted) {
            _sessionStarted = false;
            var eventParams = {};
            eventParams['$session_duration'] = Date.now() - _sessionStartTime;
            this.trackEvent("$session_end", eventParams);
        }
    };
    
    this.eventDuration = function(evnVal) {
        _eventDurationMap[evnVal] = Date.now();
    };
    
    this.trackEvent = function(evn, evd, callback) {
        var eventParams = {};
        debug("Track event", evn, evd);
        // ** validating and merging with event params
        var eventDataIsValid = evd ? $FzHelper.isValidEventAttrMap(evd) : true;
        
        if(!$FzHelper.isValidEventName(evn) ||  !eventDataIsValid) {
            var fzerr = new $FzError("Invalid argument provided to 'trackEvent'", 200)
            _sdk.emit("error", fzerr);
            if($lodash.isFunction(callback)) {
                callback(fzerr, null);
            }
            return;
        }
        
        if(evd) {
            eventParams = $FzHelper.mergeObjects(eventParams, evd);
        }
        
        var now = Date.now();
        
        eventParams["$utc_time"] = now;
        // ** session
        eventParams["$sid"] = _sessionId;
        eventParams["$session_time"] = now - _sessionStartTime;
        
        // ** state
        if(_state) {
            eventParams["$state"] = _state;
            eventParams["$state_time"] = now - _stateStartTime;
        }
        
        // ** check in event duration map 
        if(_eventDurationMap[evn]) {
             eventParams["$event_duration"] =now - _eventDurationMap[evn];
             delete _eventDurationMap[evn]
        }
        
        // ** super properties
        // ** FZ::TODO minify the function a little bit
        eventParams = $FzHelper.mergeObjects(eventParams, _superProperties);

        // ** device FZ::TODO get device specific info
        
        // ** request
        _sdk.getRequestManager().queue("/event/track", {"evn": evn, "evd" : eventParams}, callback);
    };
    
    this.batchEventTrack = function(eventsArray, callback) {
        if(!$FzHelper.isValidEventList(eventsArray) ) {
            var fzerr = new $FzError("Invalid argument provided to 'batchEventTrack'", 200)
            _sdk.emit("error", fzerr);
            if($lodash.isFunction(callback)) {
                callback(fzerr, null);
            }
            return;
        }
        _sdk.getRequestManager().queue("/event/batch", {'evlist' : eventsArray}, callback);
    };
    
}

module.exports = FzEventManager;