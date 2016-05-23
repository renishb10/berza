angular.module('berza.services',[])

.constant('FIREBASE_URL', 'https://berza.firebaseio.com/')

.factory('firebaseRef', function($firebase, FIREBASE_URL){
    var firebaseRef = new Firebase(FIREBASE_URL);
    return firebaseRef;    
})

.factory('userService', function($rootScope, firebaseRef, modalService){
    var login = function(user){
        firebaseRef.authWithPassword({
            email: user.email,
            password: user.password
        }, function(error, authData){
            if(error){
                console.log("Login Failed:", error);
            }
            else{
                $rootScope.currentUser = user;
                modalService.closeModal();
                console.log("Authenticated successfully with the payload:", authData);
            }
        });
    };
    
    var signup = function(user){
        firebaseRef.createUser({
            email: user.email,
            password: user.password
        }, function(error, userData){
            if(error){
                console.log("Error creating user:", error);
            }
            else{
                login(user);
                console.log("Successfully created user account with uid:", userData.uid);
            }
        });
    };
    
    var getAuth = function(){
        return firebaseRef.getAuth();
    }
    
    if(getAuth()){
        $rootScope.currentUser = getUser();
    }
    
    var logout = function(){
        firebaseRef.unauth();
        $rootScope.currentUser = '';
    }
    
    return{
        login: login,
        signup: signup,
        logout: logout
    }
})

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
            maxAge: 60 * 1000,
            deleteOnExpire: 'aggressive',
            storageMode: 'localStorage'
        });
    }
    else{
        chartDataCache = CacheFactory.get('chartDataCache');
    }
    
    return chartDataCache;
})

.factory("stockPriceCacheService", function(CacheFactory){
    var stockPriceCache;
    
    if(!CacheFactory.get('stockPriceCache')){
        stockPriceCache = CacheFactory('stockPriceCache', {
            maxAge: 5 * 1000,
            deleteOnExpire: 'aggressive',
            storageMode: 'localStorage'
        });
    }
    else{
        stockPriceCache = CacheFactory.get('stockPriceCache');
    }
    
    return stockPriceCache;
})

.factory("stockDataServices", function($q,$http,EncodeURIServices, chartDataCacheService, stockPriceCacheService){
    var getDetailsData = function(ticker){
        
        //http://query.yahooapis.com/v1/public/yql?format=json&q=select%20*%20from%20yahoo.finance.quotes%20where%20symbol%20in%20(%22AAPL%22)&env=store://datatables.org/alltableswithkeys
        var deferred = $q.defer(),
        
        cacheKey = ticker,
        stockDetailsCache = chartDataCacheService.get(cacheKey);
        
        query = 'select * from yahoo.finance.quotes where symbol in ("' + ticker + '")';
        url = 'http://query.yahooapis.com/v1/public/yql?format=json&q=' + EncodeURIServices.encode(query) + '&env=store://datatables.org/alltableswithkeys';
        
        if(stockDetailsCache){
            deferred.resolve(stockDetailsCache);
        }
        else{
            $http.get(url)
                .success(function(json){
                    var jsonData = json.query.results.quote;
                    deferred.resolve(jsonData);
                })
                .error(function(error){
                    console.log("Error in fetching Detail data - " + error);
                    deferred.reject();
                });
            }
         return deferred.promise;
        }
    
    var getPriceData = function(ticker){
        
        var deferred = $q.defer(),
        
        cacheKey = ticker,
        
        url = "http://finance.yahoo.com/webservice/v1/symbols/" + ticker + "/quote?format=json&view=detail";
        
        $http.get(url)
            .success(function(json){
                var jsonData = json.list.resources[0].resource.fields;
                deferred.resolve(jsonData);
                stockPriceCacheService.put(cacheKey,  jsonData);
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
})

.factory('notesCacheService', function(CacheFactory){
    var notesCache;
    
    if(!CacheFactory.get('notesCache')){
        notesCache = CacheFactory('notesCache', {
            storageMode: 'localStorage'
        });
    }
    else{
        notesCache = CacheFactory.get('notesCache');
    }
    
    return notesCache;
})

.factory('notesService', function(notesCacheService){
    return {
        getNotes : function(ticker){
            return notesCacheService.get(ticker);
        },
        addNotes : function(ticker, note){
            var stockNotes = [];
            
            if(notesCacheService.get(ticker)){
                stockNotes = notesCacheService.get(ticker);
                stockNotes.push(note);
            }
            else{
                stockNotes.push(note);
            }
            notesCacheService.put(ticker, stockNotes);
        },
        deleteNote : function(ticker, index){
            var stockNotes = [];
            
            stockNotes = notesCacheService.get(ticker);
            stockNotes.splice(index, 1);
            notesCacheService.put(ticker, stockNotes);
        }
    };
})

.factory('newsService', function($q, $http){
    return {
        getNews : function(ticker){
            var deferred = $q.defer(),
            
            x2js = new X2JS(),
            
            url = "http://finance.yahoo.com/rss/headline?s=" + ticker;
            
            $http.get(url)
                .success(function(xml){
                    xmlParsed = x2js.parseXmlString(xml),
                    json = x2js.xml2json(xmlParsed),
                    jsonData = json.rss.channel.item;
                    deferred.resolve(jsonData);
                    console.log(jsonData);
                })
                .error(function(error){
                    deferred.reject();
                    console.log("News error: " + error);
                });
            return deferred.promise;
        }
    }
})

.factory('fillMyStocksCacheService', function(CacheFactory){
    var myStockCache;
    
    if(!CacheFactory.get('myStockCache')){
        myStockCache = CacheFactory('myStockCache', {
            storageMode: 'localStorage'
        });
    }
    else{
        myStockCache = CacheFactory.get('myStockCache');
    }
    
    var fillMyStocksCache = function(){
        var myStocksArray = [
            {ticker: "AAPL" },
            {ticker: "GPRO" },
            {ticker: "FB" },
            {ticker: "NFLX" },
            {ticker: "TSLA" },
            {ticker: "BRK-A" },
            {ticker: "MSFT" },
            {ticker: "INTC" },
            {ticker: "GE" }
        ];
        
        myStockCache.put('myStocks', myStocksArray);
    };
    
    return{
        fillMyStocksCache: fillMyStocksCache
    }
})

.factory('myStocksCacheService', function(CacheFactory){
    var myStockCache = CacheFactory.get('myStockCache');
    
    return myStockCache;
})

.factory('myStocksArrayService', function(fillMyStocksCacheService, myStocksCacheService){
    if(!myStocksCacheService.info('myStocks')){
        fillMyStocksCacheService.fillMyStocksCache();
    }
    
    var myStocks = myStocksCacheService.get('myStocks');
    
    return myStocks;
})

.factory('followStockService', function(myStocksArrayService, myStocksCacheService){
    return {
        follow: function(ticker){
            var stockToAdd = {"ticker": ticker};
            myStocksArrayService.push(stockToAdd);
            myStocksCacheService.put('myStocks', myStocksArrayService);
        },
        
        unfollow: function(ticker){
            for(var i = 0; i < myStocksArrayService.length; i++){
                if(myStocksArrayService[i].ticker == ticker){
                    myStocksArrayService.splice(i, 1);
                    myStocksCacheService.remove('myStocks');
                    myStocksCacheService.put('myStocks', myStocksArrayService);
                    
                    break;
                }
            }
        },
        
        checkFollowing: function(ticker){
            for(var i = 0; i < myStocksArrayService.length; i++){
                if(myStocksArrayService[i].ticker == ticker){
                    return true;
                }
            }
            return false;
        }
    };
})

.service('modalService', function($ionicModal){
    
    this.openModal = function(id){
        
        var _this = this;
        
        if(id == 1){
            $ionicModal.fromTemplateUrl('templates/search.html', {
                scope: null,
                controller: 'SearchCntrl'
            }).then(function(modal) {
                _this.modal = modal;
                _this.modal.show();
            });
        }
        else if(id == 2){
            $ionicModal.fromTemplateUrl('templates/login.html', {
                scope: null,
                controller: 'LoginSearchCntrl'
            }).then(function(modal) {
                _this.modal = modal;
                _this.modal.show();
            });
        }
        else if(id == 3){
            $ionicModal.fromTemplateUrl('templates/signup.html', {
                scope: null,
                controller: 'LoginSearchCntrl'
            }).then(function(modal) {
                _this.modal = modal;
                _this.modal.show();
            });
        }
    };
    
    this.closeModal = function(){
        var _this = this;
        if(!_this.modal) return;
        _this.modal.hide();
        _this.modal.remove();
    };
})

.factory('searchService', function($q, $http){
    return {
        search: function(query){
            var deferred = $q.defer(),
            
            url = 'https://s.yimg.com/aq/autoc?query=' + query + '&region=CA&lang=en-CA'; //&callback=YAHOO.util.ScriptNodeDataSource.callbacks';
            
            var callback = function(data){
                console.log(data);
                var jsonData = data.ResultSet.Result;
                deferred.resolve(jsonData);
            };
            
            $http.get(url)
                .success(function(data){
                    callback(data);
                })
                .error(function(error){
                    console.log(error);
                    deferred.reject();
                })
            return deferred.promise;
        }
    }
})