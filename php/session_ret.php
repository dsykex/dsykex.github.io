<?php
    require_once 'adb/adb-functions.php';
    $ip = $_SERVER['REMOTE_ADDR'];
    //print_r($ip);
    $query = $handler->query("SELECT * FROM `sessions` WHERE ip='".$ip."';");
    $sid = json_encode($query->fetch(PDO::FETCH_ASSOC)['session_id']);
    if(!empty($sid))
        print_r(trim($sid));
    else
        print_r('no Session');
?>