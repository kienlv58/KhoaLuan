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
var recordedBlobs = [];
var alldata_video;
var FOLDER_ID = "root";

var recordedVideo = document.querySelector('video#recorded');

var recordButton = document.querySelector('button#start');
var stopButton = document.querySelector('button#stop');
var playButton = document.querySelector('button#play');
var downloadButton = document.querySelector('button#download');
var uploadButton = document.querySelector('button#upload');


getChromeExtensionStatus(function (status) {
    if (status === 'installed-enabled') alert('installed');
    if (status === 'installed-disabled') alert('installed but disabled');
    // etc.
});


recordButton.onclick = function () {
    // captureScreen();
    getScreenId(function (error, sourceId, screen_constraints) {
        // error    == null || 'permission-denied' || 'not-installed' || 'installed-disabled' || 'not-chrome'
        // sourceId == null || 'string' || 'firefox'

        navigator.getUserMedia = navigator.mozGetUserMedia || navigator.webkitGetUserMedia;
        navigator.getUserMedia(screen_constraints, function (stream) {
            navigator.getUserMedia({audio: {mimeType: 'audio/webm'}}, function (audioStream) {
                stream.addTrack(audioStream.getAudioTracks()[0]);
                console.log('mime', audioStream.mimeType);


                console.log("---------------------", stream.getAudioTracks()[0]);
            }, function (error) {
                console.log(error);
            });

            recordedVideo.src = URL.createObjectURL(stream);
            startRecording(stream);

            recordButton.disabled = true;
            stopButton.disabled = false;


            // share this "MediaStream" object using RTCPeerConnection API
        }, function (error) {
            recordButton.disabled = false;
            console.error(error);
        });
    });
};

function startRecording(stream) {
    recordedBlobs = [];
    alldata_video = null;

    mediaRecorder = new MediaRecorder(stream);
    // mediaRecorder.mimeType = 'video/webm';
    mediaRecorder.ondataavailable = function (blob) {
        if (blob.data != null)
            recordedBlobs.push(blob.data);
    }
    mediaRecorder.onstop = function () {

    }
    mediaRecorder.start(2000);
}


stopButton.onclick = function () {
    mediaRecorder.stop();
    recordedVideo.src = null;

    console.log("alldata_video", alldata_video);
    recordButton.disabled = false;
    stopButton.disabled = true;
    playButton.disabled = false;
    download.disabled = false;
    uploadButton.disabled = false;
    console.log("stop record");
    console.log("recordedBlobs", recordedBlobs);
    alldata_video = new Blob(recordedBlobs, {type: 'video/webm'});

};
playButton.onclick = function () {
    if (alldata_video != null) {
        recordedVideo.src = window.URL.createObjectURL(alldata_video);
    }


}
downloadButton.onclick = function () {

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
    console.log("acs",accessToken);

    var fileupload = new File(recordedBlobs,"kien.webm",null);
    console.log("file",fileupload);
    insertFile(fileupload,a);
    function  a(c) {
        console.log(c);
    }
    // $.ajax({
    //     // url: 'https://www.googleapis.com/upload/drive/v2/files',
    //     url: 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
    //     type: 'POST',
    //     data: alldata_video,
    //     headers: {
    //                 'Authorization': 'Bearer ' + accessToken
    //             },
    //     name:'kienkltn',
    //     body:{
    //             'title': "kltn_video",
    //             'parents': [
    //                 {
    //                     'id': FOLDER_ID
    //                 }
    //             ]
    //         },
    //     processData: false, // tell jQuery not to process the data
    //     contentType: false, // tell jQuery not to set contentType
    //     success: function(results) {
    //         console.log(JSON.stringify(results));
    //     },
    //     error: function(results) {
    //         console.log(JSON.stringify(results));
    //     }
    // });


}

function insertFile(fileData, callback) {
    const boundary = '-------314159265358979323846';
    const delimiter = "\r\n--" + boundary + "\r\n";
    const close_delim = "\r\n--" + boundary + "--";

    var reader = new FileReader();
    reader.readAsBinaryString(fileData);
    reader.onload = function(e) {
        var contentType = fileData.type || 'application/octet-stream';
        var metadata = {
            'title': "kienabc",
            'mimeType': "video/webm",
            'parents':[{"id":FOLDER_ID}]
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
            'body': multipartRequestBody});
        if (!callback) {
            callback = function(file) {
                console.log(file)
            };
        }
        request.execute(callback);
    }   
}

var reques_getfile = gapi.client.request({
            'path': '/drive/v2/files',
            'method': 'GET',
            'q':FOLDER_ID+' in parents'});
        
 reques_getfile.execute(function(resp){
    console.log("get list file",resp);
 });