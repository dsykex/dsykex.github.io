<?php 
    require_once 'adb/adb-functions.php';
    $data = json_decode(file_get_contents("php://input"));
    $query = $handler->query("SELECT * FROM users WHERE session_id='".$data->sid."'");
    print_r($query->fetchAll(PDO::FETCH_ASSOC));
?>