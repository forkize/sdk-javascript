var $lodash = require("lodash");

var FzHelper = {};

FzHelper.isValidUserId = function(userId) {
    // FZ::TODO
    return $lodash.isString(userId) && (userId.length < 128);
};

FzHelper.isEmptyOrValidUserId = function(userId) {
    return !userId || FzHelper.isValidUserId(userId);
};

FzHelper.isNumberOrString = function(arg) {
    return $lodash.isNumber(arg) || $lodash.isString(arg);
};

FzHelper.isValidEventAttrName = function(attrName) {
    if(!$lodash.isString(attrName) || attrName.indexOf("$") == 0) {
        return false;
    }
    
    return true;
};

FzHelper.isValidEventAttrNameArray = function(attrNameArray) {
    if(!$lodash.isArray(attrNameArray)) {
        return false;
    }
    
    var len = attrNameArray.length;
    for(var i = 0 ; i < len; i++) {
        if(!FzHelper.isValidEventAttrName(attrNameArray[i])){
            return false;
        }
    }
    
    return true;
}

FzHelper.isValidEventAttrValue = function(attrValue) {
    if($lodash.isString(attrValue) || $lodash.isNumber(attrValue) || $lodash.isBoolean(attrValue) ) {
        return true;
    }
    console.log("INVALID ARGUMENT isValidEventAttrValue ", attrValue)
    return false;
};

FzHelper.isValidEventName = function(eventName) {
    if(!$lodash.isString(eventName)) {
        console.log("INVALID ARGUMENT  isValidEventName ", eventName)
        return false;
    }
    
    if(eventName.length > 64) {
        return false;
    }
    
    return true;
};

FzHelper.isValidEventAttrMap = function(attrMap) {
    if(attrMap && !$lodash.isObject(attrMap)) {
        return false;
    }

    var keys = Object.keys(attrMap);
    var len = keys.length;
    
    var attrName;
    var attrValue;
    for(var i = 0 ; i < len; i++) {
        attrName = keys[i];
        attrValue = attrMap[attrName];
        if(!FzHelper.isValidEventAttrName(attrName) || !FzHelper.isValidEventAttrValue(attrValue)) {
            return false;
        }
    }

    return true;
};

FzHelper.isValidEventAttrNumericMap = function(numericMap) {
    var keys = Object.keys(numericMap);
    var len = keys.length;
    
    var attrName;
    var attrValue;
    for(var i = 0 ; i < len; i++) {
        attrName = keys[i];
        attrValue = numericMap[attrName];
        if(!FzHelper.isValidEventAttrName(attrName) || !FzHelper.isValidEventAttrValue(attrValue) || !$lodash.isNumber(attrValue)) {
            return false;
        }
    }
    
    return true;
};

FzHelper.isValidEventList = function(eventList) {
    // FZ::TODO
    return true;
}

FzHelper.mergeObjects = function (ob1, ob2) {
    var keys = Object.keys(ob2);
    var len = keys.length;
    
    var attrName;
    for(var i = 0 ; i < len; i++) {
        attrName = keys[i];
        ob1[attrName] = ob2[attrName];
    }
    
    return ob1;
};


module.exports = FzHelper;