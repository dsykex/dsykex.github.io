uno.controller('AppCtrl', function($http, geolocation, $timeout, $rootScope, $scope, fbAuth, _uno, $interval, $location, $sce, Upload){
    if(!Configs.isStatic){
        _uno.load($scope);
        _uno.auth($scope);

        _uno.signup_action($scope);
        _uno.login_action($scope);
        $scope.logout = function(){fbAuth.$unauth(); $scope.currentUser = null;};

        _uno.route_data($scope, Configs.global_data);
    }

    $scope.addslashes = function(str) { return (str + '').replace(/[\\"']/g, '\\$&').replace(/\u0000/g, '\\0'); };

    rangy.init();
    $scope.userTime = new Date();
    $scope.visitortimezone = 'GMT '+ -$scope.userTime.getTimezoneOffset()/60;
});

uno.controller('Ctrl', function($route, $timeout, $scope, fbAuth, _uno, $interval, $http, $routeParams, $sce, $location){
        var allowed = false;
        var _routeFound = false;
        var _routeArray = [];
        var route = $routeParams.page;
        var child = $routeParams.child;

        $scope.child = child;
        $scope.path = $scope.path.replace(':page', route);
        angular.forEach(route_data._, function(value){
            _routeArray.push(value.route);
        });

        var rz = [];
        angular.forEach(route_data._, function(routez){
            rz.push(routez.route);
        });

        if(rz.indexOf($scope.path) != -1){
            var value = route_data._.filter(function(value) { return (value.route == $scope.path)})[0];
            $scope.pageTitle = 'DERP';
            if(value !== undefined){
                _routeFound=true;
                if(!Configs.isStatic){
                    if(value.needLogin){
                        if($scope.currentUser){
                            if(value.accessLevel !== '*'){
                                angular.forEach(value.accessLevel, function(level){
                                    if($scope.currentUser.rank == level){
                                        allowed = true;
                                        if(value.data.length)
                                            _uno.route_data($scope, value.data, value);
                                    }
                                });

                                if(!allowed){
                                    angular.forEach(route_data._, function(r){
                                        if(r.homePage)
                                            $location.path(r.route);
                                    });
                                }
                            }else
                                if(value.data.length)
                                    _uno.route_data($scope, value.data, value);

                        }
                        else
                        {
                            angular.forEach(route_data._, function(r){
                                if(r.homePage)
                                    $location.path(r.route);
                            });
                        }
                    }else{
                        if(value.data.length){
                            _uno.route_data($scope, value.data, value);

                        }
                    }
                }else{
                    console.log(Configs.isStatic);
                }

            }else{
                $location.path('/home');
            }
        }else{
            $location.url('/home');
            $scope.$apply();
            $route.reload();
        }

        if(!_routeFound){
            angular.forEach(route_data._, function(r){
                if(r.homePage){
                    $location.url(r.route);
                }
            });
        }

        $scope.$on('$destroy', function() {
            angular.forEach(Configs.db, function(db){
                $interval.cancel($scope[db+'_watcher']);
                $interval.cancel($scope[db+'_child_watcher']);
                $interval.cancel($scope[db+'_autoupdater']);
            });
        });
});
