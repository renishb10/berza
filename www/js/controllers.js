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

.controller('StockCntrl', ['$scope','$stateParams','$http','stockDataServices', 'dateServices',
  function($scope, $stateParams, $http,stockDataServices,dateServices) {

    $scope.ticker = $stateParams.stockTicker;
    $scope.chartView = 1;
    
    console.log(dateServices.currentDate());
    console.log(dateServices.oneYearAgoDate());
    
    $scope.$on("$ionicView.afterEnter",function(){
      getPriceData();
      getDetailsData();
    })
    
    $scope.chartViewFunc = function(value){
      console.log(value);
      $scope.chartView = value;
    }
    
    function getPriceData(){
      var promise = stockDataServices.getPriceData($scope.ticker);
      promise.then(function(data){
        console.log(data);
        $scope.stockPriceData = data;
      });
    }
    function getDetailsData(){
      var promise = stockDataServices.getDetailsData($scope.ticker);
      promise.then(function(data){
        console.log(data);
        $scope.stockDetailsData = data;
      });
    }
}]);
