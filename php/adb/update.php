<?php
    $data = json_decode(file_get_contents('php://input'));
    $query = $data->query;
    $handler = new PDO('mysql:host='.$data->db_host.';dbname='.$data->db_name, $data->db_username, $data->db_password);
    $handler->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    try{
    $run = $handler->query($query);
    echo 'Data Updated.';
    }catch(PDOException $e){
        echo $e;
    }
?>