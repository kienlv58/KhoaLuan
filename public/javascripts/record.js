/*
 *  Copyright (c) 2015 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */

// This code is adapted from
// https://rawgit.com/Miguelao/demos/master/mediarecorder.html

'use strict';

/* globals MediaRecorder */

// var mediaSource = new MediaSource();
// mediaSource.addEventListener('sourceopen', handleSourceOpen, false);
var mediaRecorder;
var mediaRecorder2;
var recordedBlobs = [];
var recordedBlobs_cam = [];
var alldata_video;
var alldata_cam;
var FOLDER_ID = "root";
var hasinstallext = false;


getChromeExtensionStatus(function (status) {
    console.log("status", status);

    if (status === 'installed-disabled') {
        $('#install-button').show();
        hasinstallext = false;
    }
    if (status === 'installed-enabled') {
        $('#install-button').hide();
        hasinstallext = true;
    }

    // etc.
});

function showaleart() {
    getChromeExtensionStatus(function (status) {
        if (status === 'installed-enabled')
            alert("you must install extention befor record");
    });
}


var recordedVideo = document.querySelector('video#recorded');
var videocamera = document.querySelector('video#camera');

var recordButton = document.querySelector('button#start');
var stopButton = document.querySelector('button#stop');
var playButton = document.querySelector('button#play');
var downloadButton = document.querySelector('button#download');
var uploadButton = document.querySelector('button#upload');

var checkbox_camera = document.getElementById("check_camera");
var checkbox_audio = document.getElementById("check_audio");


recordButton.onclick = function () {
    if (!$('#install-button').is(':hidden')) {
        showaleart();
        return;
    }
    // captureScreen();

    getScreenId(function (error, sourceId, screen_constraints) {
        // error    == null || 'permission-denied' || 'not-installed' || 'installed-disabled' || 'not-chrome'
        // sourceId == null || 'string' || 'firefox'


        navigator.getUserMedia = navigator.mozGetUserMedia || navigator.webkitGetUserMedia;
        navigator.getUserMedia(screen_constraints, function (stream) {
            window.stream = stream;
            recordedVideo.src = URL.createObjectURL(window.stream);

            recordedBlobs = [];
            alldata_video = null;
            recordedBlobs_cam = [];
            alldata_cam = null;
            //check box
            if (checkbox_camera.checked == true) {
                var options = {audio: checkbox_audio.checked, video: {width: 1280, height: 720}};
                startRecording(window.stream);
                recordCam(options);
                $('#camera').show();
                recordButton.disabled = true;
                stopButton.disabled = false;

            } else if (checkbox_audio.checked == true) {
                $('#camera').hide();
                console.log("-----------------------------\n");
                navigator.getUserMedia({audio: true}, function (audioStream) {
                    // merge audio tracks into the screen
                    console.log("audio stream",audioStream);
                    window.stream.addTrack(audioStream.getAudioTracks()[0]);
                    startRecording(window.stream);
                    recordButton.disabled = true;
                    stopButton.disabled = false;
                }, function (error) {
                    console.error(error);
                });
            } else {
                startRecording(window.stream);
                recordButton.disabled = true;
                stopButton.disabled = false;
                $('#camera').hide();
            }


            // share this "MediaStream" object using RTCPeerConnection API
        }, function (error) {
            recordButton.disabled = false;
            console.error(error);
        });
    });
};

function recordCam(options) {

    navigator.mediaDevices.getUserMedia(options)
        .then(function (stream) {

            console.log("bat dau record cam");
            videocamera.src = URL.createObjectURL(stream);
            mediaRecorder2 = new MediaRecorder(stream);
            mediaRecorder2.ondataavailable = function (blob) {
                if (blob.data != null)
                    recordedBlobs_cam.push(blob.data);
            };
            mediaRecorder2.onstop = function () {
                //
                stream.getVideoTracks()[0].stop();
                stream.getAudioTracks()[0].stop();

            };
            mediaRecorder2.start(1000);
        });
};

function startRecording(stream) {

    var options = {mimeType: 'video/webm;codecs=vp9'};
    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        console.log(options.mimeType + ' is not Supported');
        options = {mimeType: 'video/webm;codecs=vp8'};
        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
            console.log(options.mimeType + ' is not Supported');
            options = {mimeType: 'video/webm'};
            if (!MediaRecorder.isTypeSupported(options.mimeType)) {
                console.log(options.mimeType + ' is not Supported');
                options = {mimeType: ''};
            }
        }
    }


    mediaRecorder = new MediaRecorder(stream,options);
    // mediaRecorder.mimeType = 'video/webm';
    mediaRecorder.ondataavailable = function (blob) {
        if (blob.data != null)
            recordedBlobs.push(blob.data);
    }
    mediaRecorder.onstop = function () {
        stream.getVideoTracks()[0].stop();
        stream.getAudioTracks()[0].stop();

    };
    mediaRecorder.start(1000);
}


stopButton.onclick = function () {
    mediaRecorder.stop();
    if (mediaRecorder2 != null) {
        mediaRecorder2.stop();
    }
    recordedVideo.pause();
    recordedVideo.src = null;

    videocamera.pause();
    videocamera.src = null;




    alldata_video = new Blob(recordedBlobs, {type: 'video/webm'});
    alldata_cam = new Blob(recordedBlobs_cam, {type: 'video/webm'});
    console.log("alldata_video", alldata_video);
    recordButton.disabled = false;
    stopButton.disabled = true;
    playButton.disabled = false;
    download.disabled = false;
    uploadButton.disabled = false;
    console.log("stop record");
    console.log("recordedBlobs", recordedBlobs);


};
playButton.onclick = function () {
    if (alldata_video != null) {
        recordedVideo.src = window.URL.createObjectURL(alldata_video);
        recordedVideo.play();
    }
    console.log("cam data",alldata_cam.size);
    if(alldata_cam != null && alldata_cam.size != 0){
        $('#camera').show();
        videocamera.src = window.URL.createObjectURL(alldata_cam);
        videocamera.play();
    }else {
        $('#camera').hide();
    }

};
downloadButton.onclick = function () {
    alldata_video = new Blob(recordedBlobs, {type: 'video/webm'});
    var url = URL.createObjectURL(alldata_video);
    var a = document.createElement('a');
    document.body.appendChild(a);
    a.style = 'display: none';
    a.href = url;
    a.download = 'test.webm';
    a.click();
    window.URL.revokeObjectURL(url);
}

// upload file to google driver
uploadButton.onclick = function () {
    console.log("acs", accessToken);
    var fileupload = new File(recordedBlobs, "kien.webm", null);
    console.log("file", fileupload);
    insertFile(fileupload, a);
    function a(c) {
        console.log(c);
    }
}


function insertFile(fileData, callback) {
    const boundary = '-------314159265358979323846';
    const delimiter = "\r\n--" + boundary + "\r\n";
    const close_delim = "\r\n--" + boundary + "--";

    var reader = new FileReader();
    reader.readAsBinaryString(fileData);
    reader.onload = function (e) {
        var contentType = fileData.type || 'application/octet-stream';
        var metadata = {
            'title': "kienabc",
            'mimeType': "video/webm",
            'parents': [{"id": FOLDER_ID}]
        };

        var base64Data = btoa(reader.result);
        var multipartRequestBody =
            delimiter +
            'Content-Type: application/json\r\n\r\n' +
            JSON.stringify(metadata) +
            delimiter +
            'Content-Type: ' + contentType + '\r\n' +
            'Content-Transfer-Encoding: base64\r\n' +
            '\r\n' +
            base64Data +
            close_delim;

        var request = gapi.client.request({
            'path': '/upload/drive/v2/files',
            'method': 'POST',
            'params': {'uploadType': 'multipart'},
            'headers': {
                'Content-Type': 'multipart/mixed; boundary="' + boundary + '"'
            },
            'body': multipartRequestBody
        });
        if (!callback) {
            callback = function (file) {
                console.log(file)
            };
        }
        request.execute(callback);
    }
}


