var video_local = document.getElementById("video");
var btn_play = document.getElementById("play");
var btn_start = document.getElementById("start");
var btn_stop = document.getElementById("stop");
var google_docs = document.getElementById("google");
var mediaRecorder;
btn_play.disabled = false;
btn_play.hidden = true;
var chunks = [];
var workerPath = 'https://archive.org/download/ffmpeg_asm/ffmpeg_asm.js';
var blob2;

document.getElementById('start').onclick = function () {
    // captureScreen();
    getScreenId(function (error, sourceId, screen_constraints) {
        btn_start.disabled = true;
        btn_stop.disabled = false;


        // error    == null || 'permission-denied' || 'not-installed' || 'installed-disabled' || 'not-chrome'
        // sourceId == null || 'string' || 'firefox'

        navigator.getUserMedia = navigator.mozGetUserMedia || navigator.webkitGetUserMedia;
        navigator.getUserMedia(screen_constraints, function (stream) {
            navigator.getUserMedia({audio: {mimeType: 'audio/webm'}}, function (audioStream) {
                stream.addTrack(audioStream.getAudioTracks()[0]);
                console.log('mime',audioStream.mimeType);
                startRecording(stream);
                console.log("---------------------", stream.getAudioTracks()[0]);
            }, function (error) {
                console.log(error);
            });


            // document.querySelector('video').src = URL.createObjectURL(stream);

            // share this "MediaStream" object using RTCPeerConnection API
        }, function (error) {
            console.error(error);
        });
    })();
};
function startRecording(stream) {
    mediaRecorder = new MediaStreamRecorder(stream);
    mediaRecorder.mimeType = 'video/webm';
    mediaRecorder.ondataavailable = function (blob) {
        chunks.push(blob);
    };
    mediaRecorder.start(10);
}
// function handleStop(event) {
//     var blob2 = new Blob(chunks,{type:'video/webm;'});
//     // convertStreams(blob2);
//
//
//     var videoURL = window.URL.createObjectURL(blob2);
//     video_local.src = videoURL;
//     mediaRecorder.save(blob2,'kltn.webm');
// }

var worker;
btn_stop.onclick = function () {
    mediaRecorder.stop();
    blob2 = new Blob(chunks, {type: 'video/webm;'});
    console.log("stop record");
    // convertStreams(blob2);

    var videoURL = window.URL.createObjectURL(blob2);
    video_local.src = videoURL;
    mediaRecorder.save(blob2,'kltn.webm');
    google_docs.hidden = true;
    video_local.hidden = false;

};

btn_play.onclick = function () {
    // var videoURL = window.URL.createObjectURL(blob2);
    // video_local.src = videoURL;
    // mediaRecorder.save(blob2,'kltn.webm');
};

function convertStreams(videoBlob) {
    var aab;
    var buffersReady;
    var workerReady;
    var posted;
    var fileReader = new FileReader();
    fileReader.onload = function () {
        aab = this.result;
        postMessage();
    };
    fileReader.readAsArrayBuffer(videoBlob);
    if (!worker) {
        worker = processInWebWorker();
    }
    worker.onmessage = function (event) {
        var message = event.data;
        if (message.type == "ready") {
            log('<a href="' + workerPath + '" download="ffmpeg-asm.js">ffmpeg-asm.js</a> file has been loaded.');
            workerReady = true;
            if (buffersReady)
                postMessage();
        } else if (message.type == "stdout") {
            log(message.data);
        } else if (message.type == "start") {
            log('<a href="' + workerPath + '" download="ffmpeg-asm.js">ffmpeg-asm.js</a> file received ffmpeg command.');
        } else if (message.type == "done") {
            log(JSON.stringify(message));
            var result = message.data[0];
            log(JSON.stringify(result));
            var blob = new Blob([result.data], {
                type: 'video/mp4'
            });
            log(JSON.stringify(blob));
            mediaRecorder.save(blob, 'convert.mp4');
            var videoURL = window.URL.createObjectURL(blob);
            video_local.src = videoURL;
        }
    };
    var postMessage = function () {
        posted = true;
        worker.postMessage({
            type: 'command',
            arguments: [
                '-i', 'videofile',
                '-c:v', 'mpeg4',
                '-b:v', '6400k',
                '-strict', 'experimental', 'output.mp4'
            ],
            files: [
                {
                    data: new Uint8Array(aab),
                    name: 'videoFile'
                }
            ]
        });
    };
}
function processInWebWorker() {
    var blob = URL.createObjectURL(new Blob(['importScripts("' + workerPath + '");var now = Date.now;function print(text) {postMessage({"type" : "stdout","data" : text});};onmessage = function(event) {var message = event.data;if (message.type === "command") {var Module = {print: print,printErr: print,files: message.files || [],arguments: message.arguments || [],TOTAL_MEMORY: message.TOTAL_MEMORY || false};postMessage({"type" : "start","data" : Module.arguments.join(" ")});postMessage({"type" : "stdout","data" : "Received command: " +Module.arguments.join(" ") +((Module.TOTAL_MEMORY) ? ".  Processing with " + Module.TOTAL_MEMORY + " bits." : "")});var time = now();var result = ffmpeg_run(Module);var totalTime = now() - time;postMessage({"type" : "stdout","data" : "Finished processing (took " + totalTime + "ms)"});postMessage({"type" : "done","data" : result,"time" : totalTime});}};postMessage({"type" : "ready"});'], {
        type: 'application/javascript'
    }));
    var worker = new Worker(blob);
    URL.revokeObjectURL(blob);
    return worker;
}