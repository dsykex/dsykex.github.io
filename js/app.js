var uno = angular.module('uno', ['ngRoute', 'ngtimeago', 'firebase', 'ngSanitize', 'geolocation', 'angularMoment', 'ngFileUpload'])
.config(function($routeProvider, $locationProvider){
    $routeProvider
    .when('/:page', {
        controller:'Ctrl',
        templateUrl: function($routeParams){
            var template = '';
            var route = '/'+$routeParams.page;
            angular.forEach(route_data._, function(value){
                if(route == value.route){
                    template = value.template;
                }
            });

            return template;
        }
    })
    .when('/:page/:child', {
        controller:'Ctrl',
        templateUrl: function($routeParams, $rootScope){
            var template = '';
            var route = '/'+$routeParams.page+'/:child';
            var child = $routeParams.child;
            angular.forEach(route_data._, function(value){
                if(route == value.route){
                    template = value.template;
                }
            });

            return template;
        }
    })
    .otherwise({
        redirectTo: '/home'
    });
})
.run(function($rootScope, $location, _uno, $timeout){
    $rootScope.$on('$routeChangeStart', function(event, next){
        $rootScope.path = next.originalPath;
    });
});