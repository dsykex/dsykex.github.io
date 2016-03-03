<?php
    require_once 'adb/adb-functions.php';
    //$_SESSION['user'] = 'Blo a Bag!';
    $data = json_decode(file_get_contents('php://input'));

    $dstr = json_encode($data->user);
    //echo 'Here';
    //$query = $handler->query("INSERT INTO `sessions` (id, ip, session_id) VALUES ('', '".$_SERVER['REMOTE_ADDR']."', '".md5($dstr)."')");
    $update = $handler->query("UPDATE `users` SET session_id='".md5($dstr)."' WHERE id=".$data->id."");
    print_r(trim($data->sid));
?>