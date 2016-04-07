uno.factory('fbAuth', function($firebaseAuth){
    var ref = new Firebase(Configs.BACKEND_URL);
    return $firebaseAuth(ref);
});