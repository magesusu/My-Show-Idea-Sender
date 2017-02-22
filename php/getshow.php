<?php
//***************************************************************
//Edit Mail Settings

//Request mail reception address
$to = "request@ssr990.com";
//Request mail subject
$title = "[SSR Admin] Request:$bi_showName received";
//Request mail header
$content = "You got a request from the contributor portal.\n\n";
//Mail Client Server
$from = "From: ssr990@sv2202.xserver.jp";

//***************************************************************

// Ajax以外からのアクセスを遮断
$request = isset($_SERVER['HTTP_X_REQUESTED_WITH']) ? strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) : '';
if($request !== 'xmlhttprequest') exit;

$json = file_get_contents('php://input');
$data = json_decode($json, true);

//配列を格納
        $json_count = count($data[1]);
        $bi_name = $data[0]["myName"];
        $bi_email = $data[0]["email"];
        $bi_showName = $data[0]["showName"];
        $bi_details = $data[0]["details"];
    //文字指定
    mb_language("Japanese");
    mb_internal_encoding("UTF-8");

    //メールの内容
    $content .= "Sender: $bi_name ($bi_email) \nTitle:$bi_showName \n\nComment:\n$bi_details \n\nContents: \n";
    for($i=0;$json_count>$i;$i++){
        $content .= " ";
        $content .= $i+1;
        $content .= ". ";
        $content .= $data[1][$i]["title"];
        $content .= " (";
        $content .= $data[1][$i]["artist"];
        $content .= ") [";
        $content .= $data[1][$i]["time"];
        $content .=  "]\n";
        $content .= $data[1][$i]["previewURL"];
        $content .=  "\n\n";
    }

    //メールの送信
    $send_mail = mb_send_mail($to, $title, $content, $from);
exit();
?>