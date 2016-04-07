<?php 
    //require_once('info.php');
    //$_SESSION['user_id'] = 5;
    //print_r($_SESSION['user_id']);
    require_once '../php/adb/adb-functions.php';
    $data = json_decode(file_get_contents("php://input"));
    if((isset($data->email) && !empty($data->email)) && (isset($data->pw) && !empty($data->pw)))
    {
        $query = $handler->query("SELECT * FROM `users` WHERE email='".$data->email."' && password='".md5($data->pw)."'");
        $user = $query->fetchAll(PDO::FETCH_ASSOC)[0];
        if(!empty($user))
        {
            print_r(json_encode($user));
        }
        else
        {
            print_r('Invalid..');
        }
    }
    else
    {
        print_r('Nope');
    }
?>