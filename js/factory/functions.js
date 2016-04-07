uno.factory('_uno', function(fbAuth, geolocation, $http, $timeout, $firebaseArray, $interval, $routeParams, $sce, Upload, $location){
    var fact = {};
    fact.loaded = false;
    fact.load = function(scope){
        fact.loaded  = false;
        angular.forEach(Configs.db, function(value){
            scope[value] = null;
            fact.get_all(value).success(function(_data){

                angular.forEach(_data, function(_value){
                    fact.convert_time(_value, scope);
                    var keys = Object.keys(_value);
                    angular.forEach(keys, function(key){
                        if(parseInt(_value[key])){
                            //console.log(_value[key]);
                            if(key != 'createdAt')
                                _value[key] = parseInt(_value[key]);
                            else if(_value[key] == '0'){

                            }
                        }
                    });

                });
                scope[value] = _data;
                scope.$watch(value, function(newValue) {
                    if(newValue !== undefined){
                        scope[value] ==  newValue;
                    }
                });
            });
        });
        fact.loaded = true;
    };

    fact.auto_update = function(scope, db){
        scope[db+'_autoupdater'] = $interval(function(){
            angular.forEach(scope[db], function(_data){
                var index = scope[db].map(function(value){ return value.id; }).indexOf(_data.id);
                fact.get('get '+db+' id '+_data.id+' spec', false).success(function(data){
                    //console.log(scope['child_'+db]);
                    if(data.id === undefined){
                        var child_index = scope['child_'+db].map(function(value){ return value.id; }).indexOf(_data.id);
                        scope[db].splice(index, 1);
                        scope['child_'+db].splice(child_index,1);
                    }

                    if(data.id !== undefined){
                        var keys = (Object.keys(data));
                        angular.forEach(keys, function(key){
                            if(key != 'createdAt'){
                                scope[db][index][key] = (Configs.editorCols.indexOf(key) != -1) ? $sce.trustAsHtml(data[key].toString()) :  data[key];
                            }
                            if(parseInt(scope[db][index][key])){
                                //console.log(_value[key]);
                                if(key != 'createdAt')
                                    scope[db][index][key] = parseInt(scope[db][index][key]);
                                else if(scope[db][index][key] == 0){
                                    console.log('yeadd');
                                }
                            }
                        });
                    }
                });
            });
        },450);
    };

    fact.auth = function(scope, callback){
        scope.currentUser = '';
        fbAuth.$onAuth(function(authData){
            console.log(authData);
            if(authData){
                var authToken = ''; var pic = ''; var name = '';
                var authType = (authData.facebook !== undefined) ? 'facebook' : (authData.twitter !== undefined) ? 'twitter': (authData.google !== undefined) ? 'google': undefined;
                if(authType !== undefined){
                    authToken = authData[authType].accessToken;
                    name = authData[authType].displayName;
                    pic = authData[authType].profileImageURL;

                    fact.get('get users authToken '+authToken.substr(0,5)+' spec', false).success(function(data){
                        if(!data.authToken){
                            var query = 'INSERT INTO `users` (display_name, picture, authType, authToken, rank) VALUES ("'+name+'", "'+pic+'", "'+authType+'", "'+authToken.substr(0,5)+'", "m");';

                            fact.post(query).success(function(data){
                                fact.get('get users authToken '+authToken.substr(0,5)+' spec',false).success(function(data){
                                    scope.users.push(data);
                                });
                            });
                        }
                    });
                }
                scope.$watch('users', function(newValue) {
                    if (newValue !== undefined) {
                        if(authType === undefined){
                            scope.currentUser = scope.users.filter(function(value){ return (value.email == authData.password.email) })[0];
                        }
                        else{
                            scope.currentUser = scope.users.filter(function(value){console.log(authData[authType]); return (value.authToken.toString().substr(0,3) == authData[authType].accessToken.substr(0,3)) })[0];
                        }
                        scope.isAdmin = (Configs.modRanks.indexOf(scope.currentUser.rank) != -1) ? true : false;
                        //scope[callback](data);
                    }
                });
            }
        });
    };

    fact.watchdb = function(scope, db_table){
        scope[db_table+'_watcher'] = $interval(function(){
            fact.get_all(db_table).success(function(data){
                angular.forEach(data, function(dbObj){
                   //console.log(dbObj);
                    var o = scope[db_table].filter(function(value){ return (value.id == dbObj.id); })[0];
                    var index = (o !== undefined) ? o : undefined;
                    //console.log(index);
                    if(index === undefined){
                        fact.convert_time(dbObj, scope);
                        angular.forEach(Configs.editorCols, function(cols){
                            if(dbObj[cols])
                                dbObj[cols] = $sce.trustAsHtml(dbObj[cols]);
                        });
                        scope[db_table].push(dbObj);
                    }
                });
            });
        }, 450);
    };

    fact.watchdb_spec = function(scope, scope_data, db_table){
        scope[db_table+'_child_watcher'] = $interval(function(){
            fact.get_all(db_table).success(function(data){
                angular.forEach(data, function(dbObj){
                    var o = scope[db_table].filter(function(value){ return (value.id == dbObj.id); })[0];
                    var index = (o !== undefined) ? o : undefined;

                    if(index === undefined){
                        fact.convert_time(dbObj, scope);
                        fact.log(dbObj.id);
                        angular.forEach(Configs.editorCols, function(cols){
                            if(dbObj[cols])
                                dbObj[cols] = $sce.trustAsHtml(dbObj[cols]);
                        });
                        scope[scope_data].push(dbObj);
                        scope[db_table].push(dbObj);
                    }
               });
            });
        }, 450);
    };

    fact.isNullOrEmpty = function(str){
        return (str === undefined || str === '') ? true : false;
    };

    fact.assign = function(scope, obj, value){ scope[obj] = value; };

    fact.trustAsHtml = function(scope){
        scope.trustAsHtml = function(str){
            return $sce.trustAsHtml(str);
        };
    };

    fact.splice = function(match, data){
        var unique = data.filter(function(value){ return (value.id == match); });
        for(var _i = 1; _i < unique.length; _i++){ data.splice(data.indexOf(unique[_i])); }
    };

    fact.getTime = function(time, timezone){ return fact.post_time(time, timezone); };
    fact.convert_time = function(obj, scope){
        fact.getTime('', scope.visitortimezone).success(function(data){
            var dte = moment.tz(obj.createdAt, data[2]);
            var _dte = dte.clone().tz(data[1]);
            //console.log(data);
            obj.createdAt = _dte.format();
        });
    };

    fact.signup_action = function(scope, callback){
        scope.signup = function(user){

            user.picture = (scope.preview !== undefined || null) ? scope.preview : 'media/img/default.png';
            if(!fact.isNullOrEmpty(user.email) && !fact.isNullOrEmpty(user.password) && !fact.isNullOrEmpty(user.display_name)){
                fbAuth.$createUser({
                    email: user.email,
                    password: user.password
                }).then(function(userData){
                    fact.post('INSERT INTO `users` (email, display_name, password, picture, rank, isNew, createdAt) VALUES ("'+user.email+'", "'+user.display_name+'", "'+user.password+'", "'+user.picture+'", "m", 1, NOW())').success(function(data){
                        return fbAuth.$authWithPassword({
                            email: user.email,
                            password: user.password
                        });
                    });
                    scope.users.push(user);

                    if(scope[callback]) { scope[callback](user); }
                });
            }else{
                ////console.log('UnoError: You have empty fields that are required for registering.');
            }
        };
    };

    fact.reset_user = function(user){
        fact.get_spec('users', 'email', user.email, false).success(function(data){
            if(data.email){
                console.log(user);
            }
        });
    };

    fact.login_action = function(scope, callback){
        scope.login = function(user, socialLogin){
            scope.loggingIn = false;
            scope.loggedIn = false;
            if(!scope.currentUser){
                switch(socialLogin){
                    case 'facebook':{
                        fbAuth.$authWithOAuthPopup("facebook", function(error, authData) {
                            scope.loggedIn = true;
                            if (error){
                                //console.log("Login Failed!", error);
                            }else{
                                scope.loggingIn = true;
                            }
                        }, { scope: "email,user_likes" }).then(function(authData){

                            scope.loggingIn = false;
                            scope.loggedIn = true;
                        });
                    }break;
                    case 'twitter':{
                        fbAuth.$authWithOAuthPopup("twitter", function(error, authData) {
                            if (error){
                                //console.log("Login Failed!", error);
                            }
                        }).then(function(authData){
                            scope.loggedIn = true;
                            scope.loggingIn = false;
                            scope.closeModal();
                        });
                    }break;
                    case 'google':{
                        fbAuth.$authWithOAuthPopup("google", function(error, authData) {
                            if (error){
                                //console.log("Login Failed!", error);
                            }
                        }, { scope: "email" }).then(function(authData){
                            scope.loggedIn = true;
                            scope.loggingIn = false;
                        });
                    }break;
                    case 'internal':{
                        fact.get('get users email '+user.email+' spec', false).success(function(data){
                            //console.log(data);
                            scope.loggingIn = true;
                            console.log(data);
                            console.log(user);
                            fact.isEqual(data.password, user.password);
                            if(data.password.toString() == user.password.toString()){
                                console.log('yeeep');
                                fbAuth.$authWithPassword({
                                    email: user.email,
                                    password: user.password
                                }).then(function(authData){
                                    scope.loggingIn = false;
                                    $timeout(function(){

                                        scope.loggedIn = true;
                                        scope[callback]();
                                        //console.log(scope);
                                    }, 200);
                                }).catch(function(authData){
                                    fact.log('FirebaseError: Auth Failed!');
                                });
                            }else{
                                console.log('Invalid Credentials');
                                scope.loggingIn = false;
                                scope.invalidLogin = "Invalid Credentials";
                            }
                            if(scope[callback]) {  }
                        });
                    }
                }

            }else{
                //console.log('UnoError: Your already logged in.');
            }
        };
    };

    fact.isEqual = function(str1, str2){
        if(str1 == str2){
            console.log('YES');
        }else{
            console.log('NO');
        }
    };

    fact.add_upload = function(scope, func, upload_dir, fileObj){
        scope.isUploading = false;
        scope[func] = function (files) {
            fact.upload_action(scope, files, upload_dir, undefined, fileObj, func);
        };
    };

    fact.route_data = function(scope, data_set, route){
        if(data_set !== undefined){
            angular.forEach(data_set, function(_value){

                angular.forEach(Configs.db, function(db_name){
                    if(_value['get_'+db_name]){

                        angular.forEach(_value, function(_val){
                            if(_val[0] != 'parent'){
                                fact.get_object(scope, _val[0], db_name, _val[1], _val[2], false);
                            }else{
                                fact.get_object(scope, 'obj', db_name, 'id', $routeParams.child, false);
                                if(scope.obj.parent_id){
                                    fact.get_object(scope, 'parentObj', _val[1], 'id', scope.obj.parent_id, false);
                                }
                            }
                        });
                    }

                    if(_value['get_'+db_name+'_list']){
                        angular.forEach(_value, function(_val){
                            fact.get_object(scope, _val[0], db_name, _val[1], _val[2], true);
                        });
                    }

                    if(_value['get_'+db_name+'_count']){
                        console.log('Count Called!');
                        angular.forEach(_value,function(_val){
                            var func = db_name+'_count';
                            console.log(func);
                            fact.get_child_count(scope, func, db_name);
                        });
                    }

                    if(_value['bindTo_'+db_name]){
                        angular.forEach(_value, function(_val){
                            fact.get_object(scope, 'obj', db_name, 'id', $routeParams.child, false);
                            if(scope.obj){
                                angular.forEach(Configs.editorCols, function(col){
                                   if(scope.obj[col])
                                       scope.obj[col] = $sce.trustAsHtml(scope.obj[col].toString());
                                });
                                if(scope.obj.parent_id !== undefined){
                                    angular.forEach(Configs.dbRelations, function(dbRels){
                                       var key = Object.keys(dbRels)[0];
                                       angular.forEach(dbRels, function(rels){
                                           if(rels.indexOf(db_name) != -1 && rels.indexOf('parent_id') != -1){
                                               fact.get_object(scope, 'parentObj', key, 'id', scope.obj.parent_id, false);
                                           }
                                       });
                                    });
                                }

                                angular.forEach(Configs.dbRelations, function(dbRels){
                                    var key = Object.keys(dbRels)[0];
                                    if(db_name == key){
                                        var values = dbRels[key];
                                        if(values[1] == 'parent_id'){
                                            fact.get_children(scope, 'get_'+values[0], 'child_'+values[0], values[0], values[1]);
                                        }
                                    }
                                });
                            }else{
                                ////console.log('DERP');
                                $location.path('/404');
                            }
                        });
                    }

                    if(_value['get_'+db_name+'_by']){
                        angular.forEach(_value, function(_val){
                            fact.get_by_object(scope, db_name, _val[0], _val[1], _val[2], _val[3]);
                        });
                    }

                    if(_value['add_'+db_name+'_watcher']){
                        angular.forEach(_value, function(_val){
                             fact.watchdb(scope, db_name);
                        });
                    }

                    if(_value['add_'+db_name+'_updater']){
                        angular.forEach(_value, function(_val){
                            fact.auto_update(scope, db_name);
                        });
                    }

                    if(_value['add_'+db_name+'_modifier']){
                        angular.forEach(_value, function(_val){
                            fact.add_modifier(scope, db_name+'_'+_val[0]+'_mod', db_name, _val[0], _val[1], _val[2]);
                        });
                    }

                    if(_value['deleteFrom_'+db_name]){
                        angular.forEach(_value,function(_val){

                             fact.add_delete(scope, db_name+'_remover', db_name, _val[0], _val[1]);
                        });
                    }

                    if(_value['get_'+db_name+'_insertEditor']){
                        angular.forEach(_value, function(_val){
                            fact.editor(scope, _val[0], db_name, _val[1], true, _val[2]);
                        });
                    }

                    if(_value['get_'+db_name+'_updateEditor']){
                        angular.forEach(_value, function(_val){
                            fact.editor(scope, _val[0], db_name, _val[1], false, _val[2]);
                        });
                    }

                    if(_value['updateFor_'+db_name]){
                        angular.forEach(_value,function(_val){
                            fact.update_data(scope, db_name+'_updater', '', db_name, _val[0], _val[1]);
                        });
                    }

                    if(_value['insertFor_'+db_name]){
                        angular.forEach(_value, function(_val){
                            fact.insert_data(scope, db_name+'_inserter', '', db_name, _val[0], _val[1]);
                        });
                    }

                    angular.forEach(scope, function(sObj){
                        //var scope_keys = Object.keys(sObj);
                        //console.log(sObj);
                        if(_value['set_'+sObj+'_filter']){
                            console.log('FOUND IT');
                            angular.forEach(_value, function(_val){
                                fact.filter_content(scope, _val[1], _val[2], sObj);
                            });
                        }
                    });
                });

                if(_value.get_object){
                    angular.forEach(_value, function(_val){
                        switch(_val[0]){
                            case 'parent':{
                                fact.get_object(scope, 'obj', _val[1], 'id', $routeParams.child, false);
                                if(scope.obj){
                                    angular.forEach(Configs.editorCols, function(col){
                                       if(scope.obj[col])
                                           scope.obj[col] = $sce.trustAsHtml(scope.obj[col].toString());
                                    });
                                    if(scope.obj.parent_id !== undefined){
                                        fact.get_object(scope, 'parentObj', _val[2], 'id', scope.obj.parent_id);
                                    }
                                    ////console.log(scope.parentObj);
                                }else{
                                    $location.path('/404');
                                }
                            }break;
                            case 'children': {
                                fact.get_children(scope, _val[1], _val[2], _val[3], _val[4]);
                            }break;
                            case 'specific':{
                                fact.get_object(scope, _val[1], _val[2], _val[3], _val[4], _val[5]);
                            }break;
                        }
                    });
                }

                if(_value.bindTo){
                    angular.forEach(_value, function(_val){
                        fact.get_object(scope, 'obj', _val[0], 'id', $routeParams.child, false);
                        if(scope.obj){
                            angular.forEach(Configs.editorCols, function(col){
                               if(scope.obj[col])
                                   scope.obj[col] = $sce.trustAsHtml(scope.obj[col].toString());
                            });

                            if(scope.obj.parent_id !== undefined){
                                angular.forEach(Configs.dbRelations, function(dbRels){
                                   var key = Object.keys(dbRels)[0];
                                   angular.forEach(dbRels, function(rels){
                                       if(rels.indexOf(_val[0]) != -1 && rels.indexOf('parent_id') != -1){
                                           fact.get_object(scope, 'parentObj', key, 'id', scope.obj.parent_id, false);
                                       }
                                   });
                                });
                            }
                            angular.forEach(Configs.dbRelations, function(dbRels){
                                var key = Object.keys(dbRels)[0];
                                if(_val[0] == key){
                                    var values = dbRels[key];
                                    if(values[1] == 'parent_id'){
                                        fact.get_children(scope, 'get_'+values[0], 'child_'+values[0], values[0], values[1]);
                                    }
                                }
                            });
                        }else{
                            $location.path('/404');
                        }
                    });
                }


                if(_value.get_by_object){
                    angular.forEach(_value, function(_val){
                        fact.get_by_object(scope, _val[0], _val[1], _val[2], _val[3], _val[4]);
                    });
                }

                if(_value.parent_db){
                    angular.forEach(_value, function(_val){
                        scope.parent_obj = scope[_val[0]].filter(function(v){ return (v.id == $routeParams.child); })[0];
                        //console.log(scope.parent_obj);
                        if(scope.parent_obj === undefined){
                            $location.path('/404');
                        }
                    });
                }

                if(_value.add_watcher){
                    angular.forEach(_value, function(_val){
                         fact.watchdb(scope, scope[_val[0]], _val[0]);
                    });
                }

                if(_value.add_specific_watcher){
                    angular.forEach(_value, function(_val){
                        fact.watchdb_spec(scope, _val[0], _val[1]);
                    });
                }

                if(_value.add_updater){
                    angular.forEach(_value, function(_val){
                        fact.auto_update(scope, _val[0]);
                    });
                }else{
                    $interval.cancel(scope.auto_updater);
                    scope.auto_updater = undefined;
                }

                if(_value.set_object){
                    angular.forEach(_value, function(_val){ fact.assign(scope, _val[0], _val[1]); });
                }

                if(_value.join_objects){
                    console.log('JOININGG!');
                    angular.forEach(_value, function(_val){
                        fact.join_objects(scope, _val[0], _val[1], _val[2]);
                    });
                }

                if(_value.add_upload){
                    angular.forEach(_value, function(_val){ fact.add_upload(scope, _val[0], _val[1], _val[2]); });
                }

                if(_value.add_insert){
                    angular.forEach(_value, function(_val){
                        fact.insert_data(scope, _val[0], _val[1], _val[2], _val[3], _val[4]);
                    });
                }

                if(_value.get_location){
                    angular.forEach(_value, function(_val){
                        fact.get_location(scope, _val[0]);
                    });
                }

                if(_value.pageTitle){
                    scope.pageTitle = _value.pageTitle;
                }

                if(_value.set_specials){
                    angular.forEach(Configs.editorCols, function(col){
                        if(scope.obj[col])
                            scope.inputText = scope.obj[col];
                    });

                    if(scope.obj['picture'])
                        scope.thumb = scope.obj['picture'];

                    if(scope.obj['video'])
                        scope.video = scope.obj['video'];

                    if(scope.obj['audio'])
                        scope.audio = scope.obj['audio'];

                    if(scope.obj['file'])
                        scope.file = scope.obj['file'];
                }

                if(_value.add_update){
                    angular.forEach(_value,function(_val){
                       fact.update_data(scope, _val[0], _val[1], _val[2], _val[3], _val[4]);
                    });
                }

                if(_value.add_delete){
                    angular.forEach(_value, function(_val){

                        fact.add_delete(scope, _val[0], _val[1], _val[2], _val[3]);
                    });
                }

                if(_value.get_editor){
                    angular.forEach(_value, function(_val){
                        fact.editor(scope, _val[0], _val[1], _val[2], _val[3], _val[4], _val[5]);
                    });
                }

                if(_value.add_modifier){
                    angular.forEach(_value, function(_val){
                        ////console.log('kkk');
                        fact.add_modifier(scope, _val[0], _val[1], _val[2], _val[3], _val[4]);
                    });
                }

                if(_value.set_filter){
                    angular.forEach(_value, function(_val){

                        fact.filter_content(scope, _val[1], _val[2], _val[0]);
                    });
                }

                if(_value.get_child_count){
                    angular.forEach(_value,function(_val){
                        fact.get_child_count(scope, _val[0], _val[1]);
                    });
                }

                if(_value.get_parent_relatives){
                    angular.forEach(_value, function(_val){
                        fact.get_parent_relatives(scope, _val[0], _val[1], _val[2]);
                    });
                }

                if(_value.get_relatives){
                    angular.forEach(_value, function(_val){
                        fact.get_similar_objects(scope, _val[0], _val[1], _val[2], _val[3]);
                    });
                }
            });
        }else{
            console.log('No Data!');
        }

        if(route){
            if(route.callback){
                if(scope.$parent[route.callback])
                   scope.$parent[route.callback](scope);
                else
                    console.log('UnoError: Callback function is not defined.');
            }
        }

    };

    fact.get_location = function(scope, objName){
        geolocation.getLocation().then(function(data){
            var long = Number(Math.round(data.coords.longitude+'e7')+'e-7');
            var lat = Number(Math.round(data.coords.latitude+'e7')+'e-7');
            $http.get('http://maps.googleapis.com/maps/api/geocode/json?latlng='+lat+','+long+'&sensor=false').success(function(data){
                scope[objName] = data.results[0].formatted_address;
            });
        });
    };

    fact.add_modifier = function(scope, func, db, col, operator, finishCallback){
        scope[func] = function(id, value){
            fact.get('get '+db+' id '+id+' spec', false).success(function(data){
                var obj = scope[db].filter(function(value){ return (value.id == id); })[0];
                if(obj.id){
                    var _val = 0;
                    var colVal = parseInt(obj[col]);

                    switch(operator){
                        case "+":
                            _val = colVal + value;
                            break;
                        case "-":
                            _val = colVal - value;
                            break;
                        case "*":
                            _val = colVal * value;
                            break;
                        case "/":
                            _val = colVal / value;
                            break;
                    }

                    var query = 'UPDATE `'+db+'` SET '+col+'='+_val+' WHERE id='+id+';';
                    fact.post(query).success(function(data){
                        obj[col] = _val;
                        if(finishCallback){
                            var params = [];
                            for(var i = 1; i < finishCallback.length; i++){
                                if(finishCallback[i]){
                                    switch(finishCallback[i]){
                                        case 'db': {
                                            params.db = db;
                                        }break;
                                        case 'column':{
                                            params.column = col;
                                        }break;
                                        case 'operator':{
                                            params.operator = operator;
                                        }break;
                                        case 'id':{
                                            params.id = id;
                                        }break;
                                        case 'scope':{
                                            params.scope = scope;
                                        }break;
                                        case 'resp':{
                                            params.resp = data;
                                        }break;
                                        case 'parent_id': {
                                            params.parent_id = $routeParams.child;
                                        }break;
                                        case 'user_id': {
                                            params.user_id = scope.currentUser.id;
                                        }break;
                                    }
                                }
                            }

                            if(scope[finishCallback[0]]){
                                scope[finishCallback[0]](params);
                            }else{ console.log('UnoError: Callback Function is not defined'); }
                        }
                    });
                }

            });
        };
    };

    fact.get = function(query, all){
        return $http({
           url: 'php/adb/adb.php',
           method: 'POST',
           cache: true,
           headers: {
               'Content-Type': 'application/x-www-form-urlencoded'
           },
           data: {
                'db_host': Configs.db_host,
                'db_name': Configs.db_name,
                'db_username': Configs.db_username,
               'db_password': Configs.db_password,
               'query': query,
               'all': all
           }
        });
    };

    fact.post = function(query){
        return $http({
           url:'php/adb/update.php',
           method:"POST",
           headers: {
               'Content-Type': 'application/x-www-form-urlencoded'
           },
           data: {
                  'db_host': Configs.db_host,
                  'db_name': Configs.db_name,
                  'db_username': Configs.db_username,
                  'db_password': Configs.db_password,
                  'query': query,
           }
        });
    };

    fact.post_time = function(time, timezone){
        /*return $http({
            url: 'https://flypapermagazine.com/screatives/time.php',
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            data: {
                't': time,
                'zone': timezone
            }
        });*/
        return $http.post('php/time.php', {'t': time, 'zone': timezone});
    };


    fact.join_objects = function(scope, obj_1, obj_2, outputObj){
        scope[outputObj] = scope[obj_2];
        console.log(scope[outputObj]);
    };

    fact.get_children = function(scope, func, children, db, col){
        scope[func] = function(id){
            scope[children] = scope[db].filter(function(value){ return (value[col] == id) });
            angular.forEach(Configs.editorCols, function(col){
                angular.forEach(scope[children], function(c){
                    if(c[col]){
                        c[col] = $sce.trustAsHtml(c[col].toString());
                    }
                });
            });
            fact.watchdb_spec(scope, children, db);
        };
    };

    fact.get_child_count = function(scope, func, obj){
        scope[func] = function(id){ return scope[obj].filter(function(value){ return (value.parent_id == id)}).length; };
    };

    fact.get_all = function(db){ return fact.get('get all '+db, true); };
    fact.get_spec = function(db, col, val, all){ return fact.get('get '+db+' '+col+' '+val+' spec', all); };

    fact.get_object = function(scope, _obj, obj, col, id, isList){
        scope[_obj] = [];
        if(id == 'parent')
            id = $routeParams.child;

        //console.log(scope[obj]);
        angular.forEach(scope[obj], function(value){
            if(value[col] == id){
                //console.log(id);
                scope[_obj].push(value);
            }else{
                //console.log('UH OH');
            }
            //scope[_obj].push(value);
        });
        if(_obj == 'userComments'){
            console.log(scope[_obj]);
        }
        if(!isList){
            scope[_obj] = scope[_obj][0];
        }
        ////console.log(scope[_obj]);
    };

    fact.get_by_object = function(scope, db, col, compareObj, compareCol, _obj){
        scope[_obj] = [];
        ////console.log(scope[compareObj].length);
        if(scope[compareObj].length){
        angular.forEach(scope[compareObj], function(cObj){
            angular.forEach(scope[db], function(dbObj){
                if(dbObj[col] == cObj[compareCol]){
                    scope[_obj].push(dbObj);
                }else{
                    ////console.log('NOPEE');
                }
            });
        });
        }else{
            angular.forEach(scope[db], function(dbObj){
                if(dbObj[col] == scope[compareObj][compareCol]){
                    scope[_obj].push(dbObj);
                }else{
                    //console.log('NOPEE');
                }
            });
        }
        console.log(scope[_obj]);
    };

    fact.get_rel = function(haystack){
        angular.forEach(haystack, function(_v){ console.log(_v); });
    };

    fact.get_similar_objects = function(scope, col, val, _obj, obj){
        scope[_obj]= [];
        if(val == 'parent_id')
            val = $routeParams.child;

        angular.forEach(scope[obj], function(o){
             if(o[col] == val){
                 scope[_obj].push(o);
             }
        });
    };

    fact.get_parent_relatives = function(scope, col, _obj, obj){
        scope[_obj] = []; var colArray = scope.obj[col].split(',');
        angular.forEach(colArray,function(val){
           angular.forEach(scope[obj], function(o){
                if(o.id != scope.obj.id)
                    if(o[col].indexOf(val.trim()) != -1)
                        scope[_obj].push(o);
           });
        });
    };

    fact.filter_content = function(scope, amount, pageNum, obj){
        scope.view = (pageNum == 0) ? 'Show' : 'View More';
        scope[obj+'_limit'] = function() {return amount * pageNum;};
        scope['hasMore_'+obj] = function() {return pageNum < (scope[obj].length / amount);};
        scope['show_'+obj] = function() {
            pageNum = pageNum + 1; scope.view = "View More";
            if(!scope.currentUser){
                if(Configs.isStrict[0] == true){
                    if(Configs.isStrict[1] == 'heavy' && pageNum > 1){
                        pageNum = pageNum - 1;
                        scope.view = 'Login to view more';
                    }
                    else if(Configs.isStrict[1] == 'dense' && pageNum > 3){
                        pageNum = pageNum - 1;
                        scope.view = 'Login to view more';
                    }
                    else if(Configs.isStrict[1] == 'light' && pageNum > 7){
                        pageNum = pageNum - 1;
                        scope.view = 'Login to view more';
                    }
                }
            }
        };
        scope['hide_'+obj] = function() { pageNum = 0; scope.view == 'Show'};

    };

    fact.get_user = function(id, scope){
        for(var i = 0; i < scope.users.length; i++){
            if(scope.users[i].id == id)
                return scope.users[i];
        }
    };

    fact.update_data = function(scope, func, editorId, db, fields, finishCallback){
        if(scope.currentUser)
            scope[func] = function(obj){ fact.update_action(scope, editorId, fields, obj, obj.id, db, finishCallback); };
    };

    fact.update_action = function(scope, editorId, fields, o, id, db, finishCallback){
        if(scope.currentUser){
            console.log('UPDATE CALLED!');
            var elem = '';
            if(editorId !== '')
                elem = angular.element('#'+editorId);

            if(scope.attachType=='img') {
                elem.append('<hr><img class="thumbnail" src="'+scope.preview+'" alt="" />');
            } else if(scope.attachType=='vid') {
                elem.append('<hr><div class="flex-video widescreen"><video style="height:275px;" controls="true"><source src="'+scope.preview+'" type="'+scope.fileType+'" /></video></div>');
            }
            var html = (editorId !== '') ? elem.html() : '';
            if(editorId !== ''){
                var html = html.replace('&lt;', '<');
                var html = html.replace('&gt;', '>');
            }

            var fields_str = ''; var query = 'UPDATE `'+db+'` SET '; var defVal = '';
            for(var i = 0; i < fields.length; i++){
                defVal = (fields[i] == 'parent_id') ?  (scope.obj.id) ? scope.obj.id : $routeParams.child : (fields[i] == 'user_id') ? scope.currentUser.id : (fields[i] == 'picture') ? scope.thumb : (fields[i] == 'audio') ? scope.audio : (fields[i] == 'video') ? scope.video : (fields[i] == 'file') ? scope.file : (fields[i] == 'likes') ? 0 : (Configs.editorCols.indexOf(fields[i]) !== -1) ? scope.addslashes(html) : o[fields[i]];
                fields_str += (fields.indexOf(fields[i+1]) != -1) ? '`'+fields[i]+'`="'+defVal+'",' : '`'+fields[i]+'`="'+defVal+'" WHERE id='+id+'';
            }
            query += fields_str;

            fact.post(query).success(function(data){
                //console.log('ID: '+id+' updated for '+db+'!');
                //console.log(finishCallback);
                if(finishCallback){
                    var params = [];
                    for(var i = 1; i < finishCallback.length; i++){
                        if(finishCallback[i]){
                            switch(finishCallback[i]){
                                case 'db': {
                                    params.db = db;
                                }break;
                                case 'resp':{
                                    params.resp = data;
                                }break;
                                case 'scope':{
                                    params.scope = scope;
                                }break;
                                case 'id':{
                                    params.id = id;
                                }break;
                                case 'obj':{
                                    params.obj = o;
                                }break;
                                case 'parent_id': {
                                    params.parent_id = $routeParams.child;
                                }break;
                                case 'user_id': {
                                    params.user_id = scope.currentUser.id;
                                }break;
                            }
                        }
                    }
                    if(scope[finishCallback[0]]){
                        scope[finishCallback[0]](params);
                    }else{ console.log('UnoError: Callback Function is not defined'); }
                }
            });
        }
    };

    fact.insert_data = function(scope, func, editorId, db, fields, finishCallback){
            scope[func] = function(o){ fact.insert_action(scope, editorId, db, fields, o, finishCallback); };
    };

    fact.insert_action = function(scope, editorId, db, fields, o, finishCallback){
            var elem = '';

            if(editorId !== '')
                elem = angular.element('#'+editorId);

            var fields_str = '';
            var values_str = '';
            var query = 'INSERT INTO `'+db+'`(';

            if(scope.attachType=='img') {
                elem.append('<hr><img class="thumbnail text-center" src="'+scope.preview+'" alt="" />');
            } else if(scope.attachType=='vid') {
                elem.append('<hr><div class="flex-video widescreen text-center"><video style="height:275px;" controls="true"><source src="'+scope.preview+'" type="'+scope.fileType+'" /></video></div>');
            }

            var html = (editorId !== '') ? elem.html() : '';

            if(editorId !== ''){
                html = html.replace('&lt;', '<');
                html = html.replace('&gt;', '>');
                elem.html('');
            }

            for(var i = 0; i < fields.length; i++){
                var defVal = (fields[i] == 'parent_id') ? parseInt($routeParams.child) : (fields[i] == 'user_id') ? parseInt(scope.currentUser.id) : (fields[i] == 'createdAt') ? 'NOW()' : (fields[i] == 'picture') ? scope.thumb : (fields[i] == 'audio') ? scope.audio : (fields[i] == 'video') ? scope.video : (fields[i] == 'file') ? scope.file : (fields[i] == 'likes') ? 0 : (Configs.editorCols.indexOf(fields[i]) !== -1) ? scope.addslashes(html) : o[fields[i]];
                fields_str += (fields.indexOf(fields[i+1]) != -1) ? '`'+fields[i]+'`,' : '`'+fields[i]+'`) VALUES (';
                values_str += (fields.indexOf(fields[i+1]) != -1) ? ((typeof(defVal) == 'number') || (defVal == 'NOW()')) ? ''+defVal+',' : '"'+defVal+'",' : ((typeof(defVal) == 'number') || (defVal == 'NOW()')) ? ''+defVal+');' : '"'+defVal+'");';
            }

            fields_str += values_str; query += fields_str;
            scope.preview = null;
            console.log(query);
            fact.post(query).success(function(data){
                ////console.log(data);
                if(finishCallback){
                    var params = [];
                    for(var i = 1; i < finishCallback.length; i++){
                        if(finishCallback[i]){
                            switch(finishCallback[i]){
                                case 'db': {
                                    params.db = db;
                                }break;
                                case 'resp':{
                                    params.resp = data;
                                }break;
                                case 'scope':{
                                    params.scope = scope;
                                }break;
                                case 'obj':{
                                    params.obj = o;
                                }break;
                                case 'parent_id': {
                                    params.parent_id = $routeParams.child;
                                }break;
                                case 'user_id': {
                                    params.user_id = scope.currentUser.id;
                                }break;
                            }
                        }
                    }
                    if(scope[finishCallback[0]]){
                        scope[finishCallback[0]](params);
                    }else{ console.log('UnoError: Callback Function is not defined'); }
                }
            });
    };

    fact.editor = function(scope, id, db, fields, isInsert, finishCallback){
        console.log('editor called');
        var attachment = false; var attachType = null;
        angular.element('#'+id).html('<h1>STRERFT</h1>'); scope.showEmoji = false;

        scope.emos = [
            'angry','anguished','astonished','blush','bowtie','cold_sweat',
            'confounded','confused','cry','dizzy_face','mask','disappointed',
            'disappointed_relieved','expressionless','frowning','grimacing',
            'grinning','grin','heart_eyes','hushed','innocent','kissing_closed_eyes',
            'kissing_face','kissing','kissing_heart','kissing_smiling_eyes','laughing',
            'neutral_face','no_mouth','pensive','persevere','open_mouth','relaxed',
            'relieved','satisfied','scream','sleeping','sleepy','smile',
            'smiley','smirk','sob','stuck_out_tongue','stuck_out_tongue_closed_eyes',
            'stuck_out_tongue_winking_eye','sunglasses','sweat','sweat_smile',
            'tired_face','triumph','unamused','weary','wink','worried',
            'yum','joy','fearful','fire','pill','pizza','point_up_2',
            'point_down','point_left','point_right','soccer','sound',
            'stew','sweat_drops','tennis','syringe','toilet','trophy','tv','v',
            'wave','wine_glass','zap','x','ring','--1','-1','100','alien','angel',
            'baby','art','baseball','basketball','beer',
            'barber','bike','bikini','black_joker','bulb','book','birthday','calling','clapper',
            'cd','clap','coffee','cloud','cocktail','cake','collision','cop','copyright','computer',
            'dash','dancer','droplet','donut','dollar','earth_africa','email','facepunch',
            'eyes','football','fist','full_moon','sun','guardsman','gun','guitar','hash','hamburger',
            'hammer','handbag','gem','hankey','heart','hand','icecream','iphone','anger',
            'kiss','key','microphone','metal','microscope','mortar-board','moneybag',
            'muscle','notes','ok_hand',
        ];

        scope.toggleEmojis = function(){
            if(!scope.showEmoji)
                scope.showEmoji = true;
            else
                scope.showEmoji = false;
        };

        scope.renderEmoji = function(emoji){
            var elem = angular.element("#"+id);
            elem.append('<img style="margin-right:3px;border:none !important;" class="em em-'+emoji+'">');
        };

        scope.format = function(format){
            var editor = angular.element('#'+id);
            var sel = rangy.getSelection().toString();
            switch(format)
            {
                case 'p':{
                    editor.html(editor.html().replace(sel, '<span style="font-size:15px; text-decoration:initial!important; font-weight:normal; font-style:normal;">'+sel+'</span>'));
                }break;

                case 'bold':{
                    editor.html(editor.html().replace(sel, '<span style="font-weight:bold">'+sel+'</span>'));
                }break;
                case 'italic':{
                    editor.html(editor.html().replace(sel, '<span style="font-style:italic">'+sel+'</span>'));
                }break;
                case 'strike':{
                    //console.log(sel);
                    editor.html(editor.html().replace(sel, '<span style="text-decoration:line-through">'+sel+'</span>'));
                }break;
                case'h1':{
                    editor.html(editor.html().replace(sel, '<span style="font-size:40px; font-weight:bold;">'+sel+'</span>'));
                }break;
                case 'h2':{
                    editor.html(editor.html().replace(sel, '<span style="font-size:30px; font-weight:bold;">'+sel+'</span>'));
                }break;
                case 'h3':{
                    editor.html(editor.html().replace(sel, '<span style="font-size:20px; font-weight:bold;">'+sel+'</span>'));
                }break;
            }
            rangy.getSelection().deleteFromDocument();
        };

        scope.justify = function(format){
            var editor = angular.element('#'+id); var sel = rangy.getSelection().toString();
            editor.html(editor.html().replace(sel, '<p class="text-'+format+'">'+sel+'</p>'));
        };

        scope.output = function(){
            var editor = angular.element('#'+id); var sel = rangy.getSelection().toString();

        };

        scope.addImg = function(){
            var editor = angular.element('#'+id); var sel = rangy.getSelection().toString();
            var img = prompt("Enter an image url");
            if(img !== null)
                editor.append('<img class="radius thumbnail" src="'+img+'" alt="" />');
        };

        scope.addVid = function(){
            var editor = angular.element('#'+id); var sel = rangy.getSelection().toString();
            var video = prompt("Enter an youtube video url (ex. /cMSS0Ly9MrY)");
            if(video !== null)
                editor.append('<iframe width="100%" height="455" src="https://youtube.com/embed/'+video+'" frameborder="0" allowfullscreen></iframe>');
        };

        scope.addLink = function(){
            var editor = angular.element('#'+id); var sel = rangy.getSelection().toString();
            var link = prompt("Enter a url to link to");
            if(link !== null)
                editor.html(editor.html().replace(sel, '<a href="'+link+'" class="button small radius">'+sel+'</a>'));
        };

        scope.uploadAttachment = function(type, files){
             fact.upload_action(scope, files, '', type, 'preview', 'uploadAttachment');
        };

        scope.submit_editor = function(o){
            if(isInsert)
                fact.insert_action(scope, id, db, fields, o, finishCallback);
            else
                fact.update_action(scope, id, fields, o, o.id, db, finishCallback);
        };
    };

    fact.upload_action = function(scope, files, uploadDir, fileType, fileLink, func){
        var attachment = false; scope.attachType = fileType;
        if(attachment)
            scope.preview = null;

        if(scope.attachType !== undefined)
            uploadDir = (scope.attachType == 'img') ? 'media/img/' : (scope.attachType == 'vid') ? 'media/vid/' : uploadDir;

        scope.isUploading = false;
        if(files && files.length){
            for(var i = 0; i < files.length; i++){
                //console.log(files[i]);
                Upload.upload({
                    url: 'https://flypapermagazine.com/screatives/upload.php',
                    header: {'Content-Type': 'application/x-www-form-urlencoded'},
                    data: {file: files[i], 'dir': uploadDir}
                }).then(function (resp) {

                    if(resp.config.data.file){
                        ////console.log(resp);
                        scope[fileLink] = null;
                        scope[fileLink] = resp.data;

                        attachment=true; scope.fileType = resp.config.data.file.type;
                        $timeout(function(){ scope[func+'_isUploading']=false; }, 500);

                    }
                }, function (res){
                }, function (evt){
                    if(evt.config.data.file){
                        scope.progress = 0;
                        scope[func+'_isUploading'] = true;
                        scope.progress = parseInt(100.0 * evt.loaded / evt.total);
                        console.log(scope.progress);
                    }
                });
            }
        }
    };

    fact.add_delete = function(scope, func, db, collection, finishCallback){
        scope.finish = null;

        scope[func] = function(id){
            var query = 'DELETE FROM `'+db+'` WHERE id='+id+'';
            fact.post(query).success(function(data){
                fact.delete_action(scope, db, collection, '', id, finishCallback);
            });
        };
    };

    fact.delete_action = function(scope, db, collection, redirect, id, finishCallback){
        var index = scope[db].map(function(value){ return value.id; }).indexOf(id);
        var o = scope[db].filter(function(value){ return (value.id == id) })[0];
        scope[db].splice(index,1);

        if(collection !== undefined){
            var _index = scope[collection].map(function(value){ return value.id; }).indexOf(id);
            scope[collection].splice(_index,1);
        }

        angular.forEach(Configs.dbRelations, function(rels){
            if(rels[db]){
                var r = rels[db]; //console.log(r[0]);
                query = 'DELETE FROM `'+r[0]+'` WHERE '+r[1]+'='+id+'';
                fact.post(query).success(function(data){
                    console.log('Deleted from ['+r[0]+'] at '+r[1]+' of '+id+'');
                });

                angular.forEach(Configs.dbRelations, function(_rels){
                    if(_rels[r[0]]){
                        angular.forEach(scope[r[0]], function(o){
                            fact.delete_action(scope, r[0], undefined, '', o.id);
                        });
                    }
                });
            }
        });
        if(finishCallback){
            var params = [];
             for(var i = 1; i < finishCallback.length; i++){
                if(finishCallback[i]){
                    switch(finishCallback[i]){
                        case 'db': {
                            params.db = db;
                        }break;
                        case 'resp':{
                            params.resp = data;
                        }break;
                        case 'scope':{
                            params.scope = scope;
                        }break;
                        case 'obj':{
                            params.obj = o;
                        }break;
                        case 'parent_id': {
                            params.parent_id = $routeParams.child;
                        }break;
                        case 'user_id': {
                            params.user_id = scope.currentUser.id;
                        }break;
                    }
                }
            }
            if(scope[finishCallback[0]]){
                scope[finishCallback[0]](params);
            }else{ console.log('UnoError: Callback Function is not defined'); }
        }
    };

    fact.log = function(msg){ console.log(msg); };
    return fact;
});