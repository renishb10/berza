angular.module('berza.services',[])

.factory("EncodeURIServices",function(){
  return {
      encode: function(string){
          console.log(string);
          return encodeURIComponent(string).replace(/\"/g, "%22").replace(/\"/g, "%20").replace(/[!'()]/g,escape);
      }
  }  
})

.factory("dateServices",function($filter){
    var currentDate = function(){
        var d = new Date();
        var date = $filter('date')(d, 'yyyy-MM-dd');
        return date;
    }
    
    var oneYearAgoDate = function(){
        var d = new Date(new Date().setDate(new Date().getDate() - 365));
        var date = $filter('date')(d, 'yyyy-MM-dd');
        return date;
    }
    
    return {
        currentDate : currentDate,
        oneYearAgoDate : oneYearAgoDate
    }
})

.factory("stockDataServices", function($q,$http,EncodeURIServices){
    var getDetailsData = function(ticker){
        
        //http://query.yahooapis.com/v1/public/yql?format=json&q=select%20*%20from%20yahoo.finance.quotes%20where%20symbol%20in%20(%22AAPL%22)&env=store://datatables.org/alltableswithkeys
        var deferred = $q.defer(),
        query = 'select * from yahoo.finance.quotes where symbol in ("' + ticker + '")';
        url = 'http://query.yahooapis.com/v1/public/yql?format=json&q=' + EncodeURIServices.encode(query) + '&env=store://datatables.org/alltableswithkeys';
        console.log(url);
        
        $http.get(url)
            .success(function(json){
                var jsonData = json.query.results.quote;
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