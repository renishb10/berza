angular.module('berza.controllers', [])

.controller('AppCtrl', function($scope, $ionicModal, $timeout) {

  // With the new view caching in Ionic, Controllers are only called
  // when they are recreated or on app start, instead of every page change.
  // To listen for when this page is active (for example, to refresh data),
  // listen for the $ionicView.enter event:
  //$scope.$on('$ionicView.enter', function(e) {
  //});

  // Form data for the login modal
  $scope.loginData = {};

  // Create the login modal that we will use later
  $ionicModal.fromTemplateUrl('templates/login.html', {
    scope: $scope
  }).then(function(modal) {
    $scope.modal = modal;
  });

  // Triggered in the login modal to close it
  $scope.closeLogin = function() {
    $scope.modal.hide();
  };

  // Open the login modal
  $scope.login = function() {
    $scope.modal.show();
  };

  // Perform the login action when the user submits the login form
  $scope.doLogin = function() {
    console.log('Doing login', $scope.loginData);

    // Simulate a login delay. Remove this and replace with your login
    // code if using a login system
    $timeout(function() {
      $scope.closeLogin();
    }, 1000);
  };
})

.controller('MyStocksCntrl', ['$scope',
  function($scope) {
    $scope.myStocksArray = [
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
}])

.controller('StockCntrl', ['$scope','$stateParams','$http','stockDataServices', '$window', 'dateServices', 'chartDataServices',
  function($scope, $stateParams, $http,stockDataServices, $window, dateServices, chartDataServices) {

    $scope.ticker = $stateParams.stockTicker;
    $scope.chartView = 4;
    $scope.oneYearAgoDate = dateServices.oneYearAgoDate();
    $scope.currentDate = dateServices.currentDate();
    
    $scope.$on("$ionicView.afterEnter",function(){
      getPriceData();
      getDetailsData();
      getChartData();
    })
    
    $scope.chartViewFunc = function(value){
      console.log(value);
      $scope.chartView = value;
    }
    
    function getPriceData(){
      var promise = stockDataServices.getPriceData($scope.ticker);
      promise.then(function(data){
        $scope.stockPriceData = data;
      });
    }
    function getDetailsData(){
      var promise = stockDataServices.getDetailsData($scope.ticker);
      promise.then(function(data){
        $scope.stockDetailsData = data;
      });
    }
    
    function getChartData() {
      var promise = chartDataServices.getHistoricalData($scope.ticker, $scope.oneYearAgoDate, $scope.currentDate);
      promise.then(function(data){
        $scope.myData = JSON.parse(data);
        $scope.myData.map(function(series) {
            series.values = series.values.map(function(d) { return {x: d[0], y: d[1] } });
            return series;
        });
      })
    }

	var xTickFormat = function(d) {
		var dx = $scope.myData[0].values[d] && $scope.myData[0].values[d].x || 0;
		if (dx > 0) {
      return d3.time.format('%b %d')(new Date(dx));
		}
		return null;
	};
        
  var x2TickFormat = function(d) {
    var dx = $scope.myData[0].values[d] && $scope.myData[0].values[d].x || 0;
    return d3.time.format('%b %Y')(new Date(dx))
  };
  
  var y1TickFormat = function(d) {
    return d3.format(',f')(d);
  };
  
  var y2TickFormat = function(d) { 
    return d3.format('s')(d); 
  };
  
  var y3TickFormat = function(d) {
    return d3.format(',.2s')(d);
  };
  
  var y4TickFormat = function(d) { 
    return d3.format(',.2s')(d); 
  };            
  
  var xValueFunction = function(d, i) { 
    return i;
  };
  
  var marginBottom = ($window.innerWidth / 100) * 10;
	$scope.chartOptions = {
    chartType: 'linePlusBarWithFocusChart',
    data: 'myData',
    margin: {top: 15, right: 40, bottom: marginBottom, left: 70},
    interpolate: "cardinal",
    useInteractiveGuideline: false,
    xShowMaxMin: false,
    yShowMaxMin: false,
    tooltips: false,
    showLegend: false,
    useVoronoi: false,
    xValue: xValueFunction,
    xAxisTickFormat: xTickFormat,
    x2AxisTickFormat: x2TickFormat,
    y1AxisTickFormat: y1TickFormat,
    y2AxisTickFormat: y2TickFormat,
    y3AxisTickFormat: y3TickFormat,
    y4AxisTickFormat: y4TickFormat,
    transitionDuration: 500
	};
    
}]);