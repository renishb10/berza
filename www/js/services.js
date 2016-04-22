angular.module('berza.services',[])

.factory("stockDataServices", function($q,$http){
    var getDetailsData = function(ticker){
        
        //http://query.yahooapis.com/v1/public/yql?format=json&q=select%20*%20from%20yahoo.finance.quotes%20where%20symbol%20in%20(%22AAPL%22)&env=store://datatables.org/alltableswithkeys
        var deferred = $q.defer(),
        url = "http://query.yahooapis.com/v1/public/yql?format=json&q=select%20*%20from%20yahoo.finance.quotes%20where%20symbol%20in%20(%22" + ticker + "%22)&env=store://datatables.org/alltableswithkeys";
        
        $http.get(url)
            .success(function(json){
                var jsonData = json.query.results;
                deferred.resolve(jsonData);
            })
            .error(function(error){
                console.log("Error in fetching Detail data - " + error);
                deferred.reject();
            });
            return deferred.promise;
    }
    
    var getPriceData = function(ticker){
        
        var deferred = $q.defer(),
        url = "http://finance.yahoo.com/webservice/v1/symbols/" + ticker + "/quote?format=json&view=detail";
        
        $http.get(url)
            .success(function(json){
                var jsonData = json.list.resources[0].resource.fields;
                deferred.resolve(jsonData);
            })
            .error(function(error){
                console.log("Error in fetching Price data - " + error);
                deferred.reject();
            });
            return deferred.promise;
    }
    
    return {
        getPriceData : getPriceData,
        getDetailsData : getDetailsData
    }
 });