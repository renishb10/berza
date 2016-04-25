angular.module('berza.services',[])

.factory("EncodeURIServices",function(){
  return {
      encode: function(string){
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

.factory("chartDataCacheService", function(CacheFactory){
    var chartDataCache;
    
    if(!CacheFactory.get('chartDataCache')){
        chartDataCache = CacheFactory('chartDataCache', {
            maxAge: 60 * 60 * 8 * 1000,
            deleteOnExpire: 'aggressive',
            storageMode: 'localStorage'
        });
    }
    else{
        chartDataCache = CacheFactory.get('chartDataCache');
    }
    
    return chartDataCache;
})

.factory("stockDataServices", function($q,$http,EncodeURIServices){
    var getDetailsData = function(ticker){
        
        //http://query.yahooapis.com/v1/public/yql?format=json&q=select%20*%20from%20yahoo.finance.quotes%20where%20symbol%20in%20(%22AAPL%22)&env=store://datatables.org/alltableswithkeys
        var deferred = $q.defer(),
        query = 'select * from yahoo.finance.quotes where symbol in ("' + ticker + '")';
        url = 'http://query.yahooapis.com/v1/public/yql?format=json&q=' + EncodeURIServices.encode(query) + '&env=store://datatables.org/alltableswithkeys';
        
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
 })
 
 .factory("chartDataServices", function($q,$http,EncodeURIServices,chartDataCacheService){
    var getHistoricalData = function(ticker, fromDate, todayDate){
        //select * from yahoo.finance.historicaldata where symbol = "YHOO" and startDate = "2009-09-11" and endDate = "2010-03-10"
        var deferred = $q.defer(),
        
        cacheKey = ticker,
        chartDataCache = chartDataCacheService.get(cacheKey),
        
        query = 'select * from yahoo.finance.historicaldata where symbol = "' + ticker + '" and startDate = "' + fromDate + '" and endDate = "' + todayDate + '"';
        console.log(query);
        url = 'http://query.yahooapis.com/v1/public/yql?format=json&q=' + EncodeURIServices.encode(query) + '&env=store://datatables.org/alltableswithkeys';
        
        if(chartDataCache){
            deferred.resolve(chartDataCache);
        }
        else{
            $http.get(url)
            .success(function(json){
                var jsonData = json.query.results.quote;
                
                var priceData = [],
                volumeData = [];
                
                jsonData.forEach(function(dayDataObject){
                   var dateToMillis = dayDataObject.Date,
                   date = Date.parse(dateToMillis),
                   price = parseFloat(Math.round(dayDataObject.Close * 100) / 100).toFixed(3),
                   volume = dayDataObject.Volume,
                   
                   volumeDatum = '[' + date + ',' + volume + ']',
                   priceDatum = '[' + date + ',' + price + ']';
                   
                   volumeData.unshift(volumeDatum);
                   priceData.unshift(priceDatum);
                });
                
                var formattedChartData = 
                    '[{' +
                        '"key":' + '"volume",' +
                        '"bar":' + 'true,' +
                        '"values":' + '[' + volumeData + ']' +
                      '},' +
                      '{' +
                        '"key":' + '"' + ticker + '",' +
                        '"values":' + '[' + priceData + ']' +
                      '}]';
                
                deferred.resolve(formattedChartData);
                chartDataCacheService.put(cacheKey, formattedChartData);
            })
            .error(function(error){
                console.log("Chart data error: " + error);
                deferred.reject();
            });
        }
        return deferred.promise;
    }
    
    return {
        getHistoricalData : getHistoricalData
    }
});