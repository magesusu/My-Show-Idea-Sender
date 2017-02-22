<?php

//***************************************************************
//Edit this to match your recaptcha secret key.
//Visit: https://developers.google.com/recaptcha/docs/start
$url = 'https://www.google.com/recaptcha/api/siteverify';
$data = array(
    'secret' => '****YOUR_SECRET_KEY_HERE*****',
    'response' => $_REQUEST['g-recaptcha-response'],
    'remoteip' => $_SERVER['REMOTE_ADDR'],
);
//***************************************************************
$url .= '?' . http_build_query($data);
$header = Array(
    'Content-Type: application/x-www-form-urlencoded',
);
$options = array('http' =>
    array(
        'method' => 'GET',
        'header'  => implode("\r\n", $header),
        'ignore_errors' => true
    )
);
$apiResponse = file_get_contents($url, false, stream_context_create($options));
$jsonData = json_decode($apiResponse, TRUE);
if($jsonData['success'] !== TRUE){
    echo 'CAPTCHA Authentication failed.';
    exit();
}else{
    //http://qiita.com/mpyw/items/939964377766a54d4682
    try {
        // 未定義である・複数ファイルである・$_FILES Corruption 攻撃を受けた
        // どれかに該当していれば不正なパラメータとして処理する
        if (!isset($_FILES['file1']['error']) || !is_int($_FILES['file1']['error'])) {
            throw new RuntimeException('Invalid parameter');
        }

        // $_FILES['file1']['error'] の値を確認
        switch ($_FILES['file1']['error']) {
            case UPLOAD_ERR_OK: // OK
                break;
            case UPLOAD_ERR_NO_FILE:   // ファイル未選択
                throw new RuntimeException('No file selected');
            case UPLOAD_ERR_INI_SIZE:  // php.ini定義の最大サイズ超過
            case UPLOAD_ERR_FORM_SIZE: // フォーム定義の最大サイズ超過 (設定した場合のみ)
                throw new RuntimeException('File is too large');
            default:
                throw new RuntimeException('Unknown Error');
        }

        // ここで定義するサイズ上限のオーバーチェック
        // (必要がある場合のみ)
        if ($_FILES['file1']['size'] > 100000000) {
            throw new RuntimeException('File is too large');
        }

        // $_FILES['file1']['mime']の値はブラウザ側で偽装可能なので
        // MIMEタイプに対応する拡張子を自前で取得する
        /*if (!$ext = array_search(
            mime_content_type($_FILES['file1']['tmp_name']),
            array(
                'mp3' => 'audio/mpeg',
                'mp3' => 'audio/mp3',
                'mp3' => 'audio/mpg',
                'mp3' => 'audio/x-mp3',
                'mp3' => 'audio/x-mpg',
                'wav' => 'audio/x-pn-wav',
                'wav' => 'audio/x-pn-windows-acm',
                'wav' => 'audio/x-pn-windows-pcm',
                'wav' => 'audio/x-wav',
                'wav' => 'audio/wav',
                'aiff' => 'audio/aiff',
                'wma' => 'audio/x-ms-wma',
                'm4a' => 'audio/aac',
                'ogg' => 'audio/ogg',
                'ra' => 'audio/vnd.rn-realaudio',
            ),
            true
        )) {
            throw new RuntimeException('Invalid file extension');
        }*/

        // ファイルデータからSHA-1ハッシュを取ってファイル名を決定し，保存する
        if (!move_uploaded_file(
            $_FILES['file1']['tmp_name'],
            $path = sprintf('./uploads/%s.%s',
                sha1_file($_FILES['file1']['tmp_name']),
                substr($_FILES['file1']['name'],strrpos($_FILES['file1']['name'], '.') + 1)
            )
        )) {
            throw new RuntimeException('Error while saving file');
        }
        // ファイルのパーミッションを確実に0644に設定する
        chmod($path, 0644);
        
        //ファイルを解析し、再生時間を取得
        require_once('./id3/getid3/getid3.php');
        $getID3 = new getID3();
        $fileInfo = $getID3->analyze($path);
        getid3_lib::CopyTagsToComments($fileInfo);
        //曲時間（秒）
        echo $path."『こえいうじぇぼ』".$fileInfo['playtime_seconds'];
        
    } catch (RuntimeException $e) {
        echo $e->getMessage();
    }
}
?>