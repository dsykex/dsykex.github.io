<?php
    $name = $_FILES['file']['name'];
    $tmp_name = $_FILES['file']['tmp_name'];
    $dir = '../../'.$_POST['dir'];
    $loc = $dir.$name;

    if(!is_dir($dir) && !file_exists($dir)){
        mkdir($dir, 0777, true);
    }
    echo 'hee';
    if(move_uploaded_file($_FILES['file']['tmp_name'], $loc)){
        echo 'File Uploaded!';
    }
?>