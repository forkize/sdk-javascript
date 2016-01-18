var $md5 = require("md5");
var $lodash = require("lodash");
var $FzError = require("./fz_error.js");
var debug = require("debug")("fz::sdk::request");

function FzRequest(sdk) {
    
    var _queue = new Array();
    
    var $requestHttp;
    if(sdk.getConfig().isBrowser()) {
    	$requestHttp = require('browser-request');
    }
    else 
    {
    	$requestHttp = require('request');
    }
    
    // ** private members
    var _sdk = sdk;

    var _self = this;
    
    var _isQueueBusy = false;
    
    function _queueProcess(){
        if(_isQueueBusy || _queue.length == 0) {
            debug("_queueProcess is busy or emty");
            return;
        }
        
        var currentItem = _queue[0];
        
        var currentEndpoint = currentItem["endpoint"];
        var currentReqData = currentItem["req_data"];
        var currentCallback = currentItem["callback"];
        
         _isQueueBusy = true;
         debug("Request from _queueProcess() : ", currentEndpoint, currentReqData);
         
        _self.post(currentEndpoint, currentReqData, function(err, body){
              debug(" Response for _queueProcess() : ", currentEndpoint, currentReqData, err, body);
              debugger;
               
                if(err) {
                    console.log("Error in _queueProcess() request");
                    // FZ::TODO do we need to emit error here
                    if($lodash.isFunction(currentCallback)) {
                        currentCallback(err, null);    
                    }
                   
                    _isQueueBusy = false;
                    _queueProcess();
                    return;
                }
                
                 console.log("+++++")
               
              
              
                // ** removes first elem from array and returns that elem
                _queue.shift();
                 console.log(_queue);
                  console.log("------")
                debugger;
                if($lodash.isFunction(currentCallback)) {
                    currentCallback(null, body);
                }
                
                _isQueueBusy = false;
                _queueProcess();
            });
    }
    
    this.queue = function(endpoint, reqData, callback) {
        debugger;
        _queue.push({"endpoint": endpoint, "req_data" : reqData, "callback" : callback});
         debug(" queue() :" , endpoint, reqData);
        _queueProcess();
    };
    
    // ** private functions
    this.post = function(endpoint, reqData, callback) {
        debug("Endpoint: ", endpoint);
        debug("Request: ", reqData);
        
        var baseUrl = [_sdk.getConfig().getApiUrl(), _sdk.getConfig().getVersion()].join("/") ;
        var apiURL = [baseUrl, endpoint].join("");
        
        console.log(apiURL);
        
        // access token is appended via second parameter set to true
    	var reqObject = _makeRequestObject(reqData);
    
        var reqOptions = {
                    method: 'POST',
                    url  : apiURL,
                    body : reqObject,
                    json: true,
                    encoding: 'utf8'
                 };
        
        $requestHttp(reqOptions, _responseHandler(callback));
    };
    
    function _responseHandler(callback) {
        return function(error, response, body) {
            if (error) {
                var fzerr = new $FzError("Something went wrong", 100, error);
                 debug("error::_responseHandler", fzerr);
                _sdk.emit("error", fzerr);
                if(callback) {
                     callback(error || body, null);
                }
                return;
            } 
          
            debug("success::_responseHandler: ", body);
            
            if(callback) {
                callback(null, body);
            }
    	};
    }
    
    function _makeRequestObject(apiData){
        var _appId = _sdk.getAppId(); 
    	var _appKey = _sdk.getAppKey();
    	
    	var profileInstance = _sdk.getProfile();
    	var configInstance = _sdk.getConfig();
    
    	var _userId = profileInstance.getUserId();
    	var _sdkName = configInstance.getSdk();
    	var _version = configInstance.getVersion();
    
        var reqObject = {};
    	reqObject["app_id"]  = _appId; 
    	reqObject["user_id"] = _userId; 
    	reqObject["sdk"]     = _sdkName;
    	reqObject["version"] = _version; 
    	
    	var hashArray = [_appId, _userId, _sdkName, _version, _appKey];
    
    	if(apiData) {
    	    reqObject['api_data'] = apiData;
    	    // ** FZ::TODO for updating user profile
    	    if(apiData.hasOwnProperty("upv")) {
    	        apiData["upv"] = profileInstance.getProfileVersion();
    	    }
    	    hashArray.push(JSON.stringify(apiData));
    	}
    	
    	reqObject["hash"] = $md5(hashArray.join("="));
    	
    	var profileToken = profileInstance.getToken();
    
    	if(profileToken) {
    	    reqObject['access_token'] = profileToken;
    	}
    	
    	console.log("Final req object : ", reqObject);
    	
    	return reqObject;
    }
}

module.exports = FzRequest;