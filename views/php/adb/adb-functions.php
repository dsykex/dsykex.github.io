<?php 
    $handler = new PDO('mysql:host=127.0.0.1;dbname=mydb', 'root', 'maxwel123');
    $handler->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
?>