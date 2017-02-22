var App = angular.module('myApp', ['as.sortable']);
var isNoteMsg = false;
var uploadedURL = null;
App.controller('AppController', function ($scope, $timeout, $filter) { // 入力されたユーザー名を保持
    $scope.songName = '';
    //無データ時の仮表示
    $scope.ifShowPlaceholder = true;
    $scope.ifShowClonePlaceholder = true;
    $scope.notFoundPlaceholder = false;
    $scope.waitingResult = false;

    function detectPlaceholder() {
        if ($scope.itemsList.showList.length == 0) {
            $scope.ifShowPlaceholder = true;
        }
        else {
            $scope.ifShowPlaceholder = false;
        }
        $scope.ifShowClonePlaceholder = false;
    }
    // 登録を押されたときの関数
    $scope.findSong = function () { // 音楽リストを更新する
        $scope.waitingResult = true;
        clearSong();
        getInfo($scope.songName);
        detectPlaceholder();
    };
    //アップロードが押されたときの関数
    $scope.uploadSong = function () {
        uploadFile();
    }
    $scope.hideMe = function () {
            return $scope.itemsList.showList.length > 0;
        }
        //カード作成サンプル
    $scope.itemsList = {
        songs: []
        , showList: []
        , form: {}
    };
    $scope.sortableOptions = {
        containment: '#sortable-container'
        , allowDuplicates: true
        , itemMoved: function (event) {
            getMoved(event)
        }
        , orderChanged: function (event) {
            orderChanged(event)
        }
    };
    $scope.sortableCloneOptions = {
        containment: '#sortable-container'
        , clone: true
        , itemMoved: function (event) {
            getMoved(event)
        }
        , orderChanged: function (event) {
            orderChanged(event)
        }
    };
    //コールバック設定
    function getMoved(event){
        console.log(event.dest.index);
        updateTime();
       ga('send','event','Push',$scope.itemsList.showList[event.dest.index].title,$scope.itemsList.showList[event.dest.index].artist,event.dest.index);
    }
    function orderChanged(event){
        console.log(event);
        updateTime();  ga('send','event','Move',$scope.itemsList.showList[event.dest.index].title,$scope.itemsList.showList[event.dest.index].artist,event.dest.index);
    }
    $scope.getRemove = function (index){
        console.log(index);
        ga('send','event','Remove',$scope.itemsList.showList[index].title,$scope.itemsList.showList[index].artist,index);
    }
    // 前回分リストを消去
    function clearSong() {
        $scope.itemsList.songs = [];
    };
    // 渡された情報をもとに検索、データ取得
    function getInfo(keyWord) {
        // 基本情報
        var params = {
            lang: 'en_us'
            , entry: 'music'
            , media: 'music'
            , country: 'JP'
            , term: keyWord
            , limit: '50'
        , };
        // APIに投げる
        $.ajax({
            url: 'https://itunes.apple.com/search'
            , method: 'GET'
            , data: params
            , dataType: 'jsonp', //成功
            success: function (json) {
                pushResult(json);
            }, //失敗
            error: function () {
                $(function () {
                    console.log("Error while connecting iTunes DB");
                });
            }
        , });
    };

    function pushResult(json) {
        // データが取得できた
        if (json.results.length != 0) {
            $scope.notFoundPlaceholder = false;
            for (var i = 0, len = json.results.length; i < len; i++) {
                var result = json.results[i];
                $scope.itemsList.songs.push({
                    title: result.trackName
                    , picture: result.artworkUrl100
                    , artist: result.artistName
                    , previewURL: result.previewUrl
                    , time: toHms(result.trackTimeMillis)
                    , timeMillis: result.trackTimeMillis
                });
            }
            $scope.waitingResult = false;
            $scope.$apply();
            ga('send','event','Search',$scope.songName,json.results.length);
        }
        // データが取得できなかった
        else {
            $scope.notFoundPlaceholder = true;
            $scope.waitingResult = false;
            $scope.$apply();
            ga('send','event','Search',$scope.songName,'0');
        }
    }
    //サンプル音源再生
    var audio = new Audio("");
    $scope.playSample = function (index) {
        audio.pause();
        if ($scope.itemsList.songs[index].previewURL == audio.src) {
            audio.src = "";
            ga('send','event','Preview',$scope.itemsList.songs[index].title,'PAUSE');
            return;
        }
        audio.currentTime = 0;
        audio.src = $scope.itemsList.songs[index].previewURL;
        audio.play();
        ga('send','event','Preview',$scope.itemsList.songs[index].title,audio.src);
    };
    $scope.radioSample = function (index) {
        audio.pause();
        if ($scope.itemsList.showList[index].previewURL == audio.src) {
            audio.src = "";
            ga('send','event','Preview',$scope.itemsList.showList[index].title,'PAUSE');
            return;
        }
        audio.currentTime = 0;
        audio.src = $scope.itemsList.showList[index].previewURL;
        audio.play();
        ga('send','event','Preview',$scope.itemsList.showList[index].title,audio.src);
    };
    //削除ボタン
    $scope.updateLong = function (index) {
            updateTime();
        }
        //プログレスバー
    var showMaxMillis = 3600000;
    //リクエスト送信
    $scope.sendRequest = function (index) {
            //送信前の整合性確認
            if ($scope.itemsList.showList.length == 0) {
                sweetAlert("No songs selected Error", "Please choose one or more!", "error");
                return;
            }
            if ($scope.form.$invalid) {
                sweetAlert("Missing Basic Information Error", "Please fill all of them!", "error");
                return;
            }
            swal({
                title: "Can I send your request?"
                , text: "Submit to broadcast your idea"
                , type: "info"
                , showCancelButton: true
                , closeOnConfirm: false
                , showLoaderOnConfirm: true
            , }, function () {
                var dataToSend = [];
                dataToSend.push($scope.itemsList.form);
                dataToSend.push($scope.itemsList.showList);
                console.log(JSON.stringify(dataToSend));
                $.ajax({
                    async: true
                    , type: "POST"
                    , url: "./php/getshow.php"
                    , data: JSON.stringify(dataToSend)
                }).done(function (msg) {
                    swal("Request sended successfully!");
                    isNoteMsg = false;
                }).fail(function (msg) {
                    swal("Error while sending request.\nPlease try again!");
                });
            });
        }
        /* Script written by Adam Khoury @ DevelopPHP.com */
        /* Video Tutorial: http://www.youtube.com/watch?v=EraNFJiY0Eg */
    function _(el) {
        return document.getElementById(el);
    }

    function uploadFile() {
        var file = _("file1").files[0];
        // alert(file.name+" | "+file.size+" | "+file.type);
        var formdata = new FormData();
        formdata.append("file1", file);
        formdata.append("g-recaptcha-response", $('#g-recaptcha-response').val());
        var ajax = new XMLHttpRequest();
        ajax.upload.addEventListener("progress", progressHandler, false);
        ajax.addEventListener("load", completeHandler, false);
        ajax.addEventListener("error", errorHandler, false);
        ajax.addEventListener("abort", abortHandler, false);
        //送信前チェック
        if ($scope.originalTitle == null) {
            _("status").innerHTML = "Please input the title!";
            return false;
        }
        if ($scope.originalArtist == null) {
            _("status").innerHTML = "Please input the artist!";
            return false;
        }
        if (grecaptcha.getResponse() == "") {
            _("status").innerHTML = "Please check your reCAPTCHA";
            return false;
        }
        ajax.open("POST", "./php/uploadmusic.php");
        ajax.send(formdata);
    }

    function progressHandler(event) {
        _("loaded_n_total").innerHTML = "Uploaded " + event.loaded + " bytes of " + event.total;
        var percent = (event.loaded / event.total) * 100;
        _("status").innerHTML = Math.round(percent) + "% uploaded... please wait";
    }

    function completeHandler(event) {
        if (~event.target.responseText.indexOf('uploads')) {
            var result = event.target.responseText.split("『こえいうじぇぼ』");
            var soundTime = result[1];
            uploadedURL = result[0].replace("./", "./php/");
            console.log("URL改変成功");
            if (uploadedURL != null) {
                //アップロード内容から時間などを取得
                $scope.itemsList.showList.push({
                    title: $scope.originalTitle
                    , picture: "image/placeholder.jpg"
                    , artist: $scope.originalArtist
                    , previewURL: uploadedURL
                    , time: toHms(soundTime * 1000)
                    , timeMillis: soundTime * 1000
                });
                ga('send','event','Upload',$scope.originalTitle+"-Artist-"+$scope.originalArtist,uploadedURL);
                $scope.originalTitle = "";
                updateTime();
                uploadedURL = null;
                $scope.$apply();
                grecaptcha.reset();
                _("status").innerHTML = "";
                _("loaded_n_total").innerHTML = "";
                $("#file1").val("");
                $("#editModal").modal('hide');
            }
        }
        else {
            _("status").innerHTML = event.target.responseText;
            _("loaded_n_total").innerHTML = "";
        }
    }

    function errorHandler(event) {
        _("status").innerHTML = "Upload Failed. Try Again!";
        _("loaded_n_total").innerHTML = "";
    }

    function abortHandler(event) {
        _("status").innerHTML = "Upload Aborted. Try Again!";
        _("loaded_n_total").innerHTML = "";
    }

    function updateTime() {
        detectPlaceholder();
        isNoteMsg = true;
        var value = 0;
        for (var i = 0; $scope.itemsList.showList.length > i; i++) {
            value = $scope.itemsList.showList[i].timeMillis + value;
        }
        $scope.sumTime = toHms(value);
        console.log(value / showMaxMillis * 100);
        $scope.percentage = value / showMaxMillis * 100;
        if ($scope.percentage < 100) {
            $scope.backColor = "#f0ad4e";
        }
        else {
            $scope.backColor = "#d9534f";
        }
    };
    //再生時間算出
    function toHms(t) {
        var hms = "";
        t = t / 1000;
        var h = t / 3600 | 0;
        var m = t % 3600 / 60 | 0;
        var s = t % 60;
        if (h != 0) {
            hms = h + ":" + padZero(m) + ":" + padZero(s);
        }
        else if (m != 0) {
            hms = m + ":" + padZero(s);
        }
        else {
            hms = parseInt(s);
        }
        return hms;

        function padZero(v) {
            v = parseInt(v);
            if (v < 10) {
                return "0" + v;
            }
            else {
                return v;
            }
        }
    }
});
$(window).on('beforeunload', function (event) {
    if (isNoteMsg) {
        return 'If you not send a request yet, we will miss your idea.';
    }
});
$(document).on('change', ':file', function () {
    var input = $(this)
        , numFiles = input.get(0).files ? input.get(0).files.length : 1
        , label = input.val().replace(/\\/g, '/').replace(/.*\//, '');
    input.parent().parent().next(':text').val(label);
});