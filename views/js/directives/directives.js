uno.directive('uWrapper', function(){
    return{
        restrict: 'E',
        transclude: true,
        replace: true,
        template: function(elem, attr){
            return '<div class="row"><div class="small-12 columns '+attr.c+'" ng-transclude></div></div>';
        }
    };
});

uno.directive('uRow', function(){
    return{
        restrict: 'E',
        transclude: true,
        replace: true,
        template: function(elem, attr){
            return '<div class="row '+attr.align+'" style="'+attr.style+'" ng-transclude></div>';
        }
    };
});

uno.directive('uLayout',  function(){
    return{
        transclude: true,
        replace: true,
        template: function(elem, attr){
            return '<div class="'+attr.l+' columns '+attr.align+'" ng-transclude></div>';
        }
    };
});

uno.directive('uColumn', function(){
    return{
        transclude:true,
        replace: true,
        template: function(elem, attr){
            return '<div class="column '+attr.align+'" ng-transclude></div>';
        }
    };
});

uno.directive('uButton', function(){
   return {
       replace: true,
       transclude: true,
       template: function(elem, attr){
           return '<a ng-href="'+attr.link+'" ng-click="'+attr.action+'" class="button '+attr.style+'">'+attr.txt+'</a>';
       }
   };
});

uno.directive('uUpload', function(){
    return {
        replace: true,
        template: function(elem, attr){
          return '<div class="button hollow" ngf-select="'+attr.action+'($files)" ngf-pattern="\''+attr.file+'\'" ngf-accept="\''+attr.file+'\'">Select a file</div>';
      }
    };
});

uno.directive('uProgress', function(){
    return {
        replace: true,
        template: function(elem, attr){
            return '<div ng-show="'+attr.loader+'" class="progress animated" role="progressbar" tabindex="0"><span class="progress-meter" style="width: {{progress}}%"></span></div>';
        }
    };
});

uno.directive('uEditor', function(){
    return {
        replace:true,
        link: function(scope, element, attr){
            scope.eId = attr.eid;
        },
        templateUrl: function(elem,attr){
            return Configs.partialDir+'forms/editor-'+attr.type+'.html';
        }
    };
});


uno.directive('uModal', function(){
    return {
        replace:true,
        transclude: true,
        template: function(elem, attr){
            return '<div class="reveal" data-close-on-click="true" id="'+attr.id+'" data-reveal ng-transclude></div>';
        }
    };
});

uno.directive('uForm', function(){
    return {
        replace:true,
        templateUrl: function(elem, attr){
            return Configs.partialDir+'forms/'+attr.t+'.html';
        }
    };
});

uno.directive('uBlock', function(){
    return {
        templateUrl: function(elem, attr){
            return Configs.partialDir+'blocks/'+attr.t+'.html';
        }
    };
});

uno.directive('uList', function(){
    return {
        replace: true,
        template: function(elem, attr){
            return '<div class="small-4 columns" ng-repeat="obj in '+attr.r+' | orderBy: \''+attr.o+'\' | limitTo: limit()"><u-render t="'+attr.t+'"></u-render></div>';
        }
    };
});
uno.directive('uRender', function(){
    return {
        templateUrl: function(elem, attr){
            return Configs.partialDir+''+attr.t+'.html';
        }
    };
});

