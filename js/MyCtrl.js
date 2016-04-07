uno.controller('CustomCtrl', function($location, $timeout, $scope, $http, _uno, $rootScope){
    $scope.isStatic = Configs.isStatic;

    $scope.getChildLength = function(id, db){
        return $scope.$parent[db].filter(function(value){ return (value.parent_id == id)});
    };

    $scope.getObject = function(db, col, val){
        return $scope[db].filter(function(value){ return (value[col] == val)})[0];
    };
});