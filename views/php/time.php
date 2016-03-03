<?php
    $data = json_decode(file_get_contents("php://input"));
    $offset = explode(' ', $data->zone)[1];
    $time = (empty($data->t)) ? 'now' : $data->t;
    $original = new DateTime($data->t);
    $timezoneName = timezone_name_from_abbr("", $offset*3600, false);
    $modified = $original->setTimezone(new DateTimezone($timezoneName));
    $arr = [$original->format('Y-m-d H:i:s'), $timezoneName, date_default_timezone_get()];
    print_r(json_encode($arr));
?>