 <?php
    $data = json_decode(file_get_contents("php://input"));
    $q = trim($data->query);
    $all = $data->all;
    $handler = new PDO('mysql:host='.$data->db_host.';dbname='.$data->db_name, $data->db_username, $data->db_password);
    $handler->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    function render($query)
    {
        global $q;

        $renderedQb = '';
        preg_match_all('/"(?:\\\\.|[^\\\\"])*"|\S+/', $q, $commands);
        //print_r($commands[0]);
        $commands = $commands[0];
        if($commands[0] ==="get"){
            if(trim($commands[1]) === "all") {
                $renderedQ = "SELECT * FROM `".$commands[2]."`;";
                return $renderedQ;
            }
            elseif (!empty($commands[4])) {
                if($commands[4]==='spec')
                {
                    $renderedQ = "SELECT * FROM `".$commands[1]."` WHERE `".$commands[2]."`='".$commands[3]."';";
                    return $renderedQ;
                }
                else
                {
                    echo 'ERROR: Mismatch query template';
                }
            }
            else
            {
               $renderedQ = 'SELECT * FROM `'.$commands[1].'` WHERE id='.$commands[2].';';
               return $renderedQ;
            }
        }
        else
        {
            return $query;
        }
    }

    try
    {
        $query = $handler->query(render($q));
        if($query){
            if($all==true){
                print_r(json_encode($query->fetchAll(PDO::FETCH_ASSOC)));
            }
            else
            {
                print_r(json_encode($query->fetch(PDO::FETCH_ASSOC)));
            }
        }else{
            //echo 'Error';
        }
    }
    catch (PDOException $e)
    {
        echo $e;
    }
?>