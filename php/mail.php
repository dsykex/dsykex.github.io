<?php
    ini_set('display_errors',1);
    $data = json_decode(file_get_contents('php://input'));

    $headers = "From: Tarzan <someone@your.com>";
    $to = $data->email;
    $subject = $data->subject;
    $message = wordwrap($data->message, 70, "\r\n");

    if(mail($to, $subject, $message, $headers)){
        echo 'Gang';
    }else{

    }
?>