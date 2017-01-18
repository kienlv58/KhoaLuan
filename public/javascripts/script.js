var video_local = document.getElementById("video");
var btn_play = document.getElementById("play");
var btn_start = document.getElementById("start");
var btn_stop = document.getElementById("stop");
var mediaRecorder;
btn_play.disabled = false;

//check is chorme
var isChrome = !!navigator.webkitGetUserMedia;
console.log(isChrome);
var DetectRTC = {};
(function () {
    var screenCallback;
    DetectRTC.screen ={
        chromeMediaSource: 'screen',
        getSourceId: function(callback) {
            if(!callback) throw '"callback" parameter is mandatory.';
            screenCallback = callback;
            //console.log('screenCallback',callback);
            window.postMessage('get-sourceId', '*');
        },
        isChromeExtensionAvailable: function(callback) {
            if (!callback) return 1;
            if(DetectRTC.screen.chromeMediaSource == 'desktop') return callback(true);

            // ask extension if it is available
            window.postMessage('are-you-there', '*');
            setTimeout(function() {
                if(DetectRTC.screen.chromeMediaSource == 'screen') {
                    callback(false);
                }
                else callback(true);
            }, 2000);
        },
        onMessageCallback: function(data) {
            if (!(typeof data == 'string' || !!data.sourceId)) return;

            console.log('chrome message from onMessageCallback', data);

            // "cancel" button is clicked
            if (data == 'PermissionDeniedError') {
                DetectRTC.screen.chromeMediaSource = 'PermissionDeniedError';
                if (screenCallback) return screenCallback('PermissionDeniedError');
                else throw new Error('PermissionDeniedError');
            }
            // extension notified his presence
            if(data == 'rtcmulticonnection-extension-loaded') {
                if(document.getElementById('install-button')) {
                    document.getElementById('install-button').parentNode.innerHTML = '<strong>Great!</strong> <a href="https://chrome.google.com/webstore/detail/screen-capturing/ajhifddimkapgcifgcodmmfdlknahffk" target="_blank">Google chrome extension</a> is installed.';
                }
                DetectRTC.screen.chromeMediaSource = 'desktop';
            }

            // extension shared temp sourceId
            if(data.sourceId) {
                DetectRTC.screen.sourceId = data.sourceId;
                if(screenCallback) screenCallback( DetectRTC.screen.sourceId );
            }
        },
        getChromeExtensionStatus: function (callback) {
            if (!!navigator.mozGetUserMedia) return callback('not-chrome');

            var extensionid = 'ajhifddimkapgcifgcodmmfdlknahffk';

            var image = document.createElement('img');
            image.src = 'chrome-extension://' + extensionid + '/icon.png';
            image.onload = function () {
                DetectRTC.screen.chromeMediaSource = 'screen';
                window.postMessage('are-you-there', '*');
                setTimeout(function () {
                    if (!DetectRTC.screen.notInstalled) {
                        callback('installed-enabled');
                    }
                }, 2000);
            };
            image.onerror = function () {
                DetectRTC.screen.notInstalled = true;
                callback('not-installed');
            };
        }

    };

    if(window.postMessage && isChrome) {
        var kq = DetectRTC.screen.isChromeExtensionAvailable();
        console.log(kq);
    }




})();

DetectRTC.screen.getChromeExtensionStatus(function(status) {
    if(status == 'installed-enabled') {
        if(document.getElementById('install-button')) {
            document.getElementById('install-button').parentNode.innerHTML = '<strong>Great!</strong> <a href="https://chrome.google.com/webstore/detail/screen-capturing/ajhifddimkapgcifgcodmmfdlknahffk" target="_blank">Google chrome extension</a> is installed.';
        }
        DetectRTC.screen.chromeMediaSource = 'desktop';
    }
});

window.addEventListener('message', function (event) {
    if (event.origin != window.location.origin) {
        return;
    }

    DetectRTC.screen.onMessageCallback(event.data);
});
console.log('current chromeMediaSource', DetectRTC.screen.chromeMediaSource);
//============================================================================================================
//onclick

document.getElementById('start').onclick = function() {
   // captureScreen();
    getScreenId(function (error, sourceId, screen_constraints) {
        btn_start.disabled = true;
        btn_stop.disabled = false;


        // error    == null || 'permission-denied' || 'not-installed' || 'installed-disabled' || 'not-chrome'
        // sourceId == null || 'string' || 'firefox'

        navigator.getUserMedia = navigator.mozGetUserMedia || navigator.webkitGetUserMedia;
        navigator.getUserMedia(screen_constraints, function (stream) {
            navigator.getUserMedia({audio:true},function (audioStream) {
                stream.addTrack(audioStream.getAudioTracks()[0]);
                startRecording(stream);
                console.log("---------------------",stream.getAudioTracks()[0]);
            },function (error) {
               console.log(error);
            });


           // document.querySelector('video').src = URL.createObjectURL(stream);

            // share this "MediaStream" object using RTCPeerConnection API
        }, function (error) {
            console.error(error);
        });
    })();
};


function captureScreen(callback) {
    console.log('captureUserMedia chromeMediaSource', DetectRTC.screen.chromeMediaSource);

    var screen_constraints = {
        mandatory: {
            chromeMediaSource: DetectRTC.screen.chromeMediaSource,
            maxWidth: screen.width > 1920 ? screen.width : 1920,
            maxHeight: screen.height > 1080 ? screen.height : 1080
            // minAspectRatio: 1.77
        },
        optional: [{ // non-official Google-only optional constraints
            googTemporalLayeredScreencast: true
        }, {
            googLeakyBucket: true
        }]
    };

    if(isChrome && DetectRTC.screen.chromeMediaSource == 'desktop' && !DetectRTC.screen.sourceId) {
        DetectRTC.screen.getSourceId(function(error) {
            if(error && error == 'PermissionDeniedError') {
                alert('PermissionDeniedError: User denied to share content of his screen.');
            }

            captureUserMedia(callback);
        });
        return;
    }

    if(isChrome && DetectRTC.screen.chromeMediaSource == 'desktop') {
        screen_constraints.mandatory.chromeMediaSourceId = DetectRTC.screen.sourceId;
    }
    var constraints = {
        audio: false,
        video: screen_constraints
    };

    //record






    navigator.mediaDevices.getUserMedia(constraints).then(function(stream) {
        /* use the stream */
       video_local.src = URL.createObjectURL(stream);

    }).catch(function(error) {
        /* handle the error */
        console.log("error",error);
    });

    // getUserMedia({
    //     video: video,
    //     constraints: constraints,
    //     onsuccess: function(stream) {
    //         video_local.src = URL.createObjectURL(stream);
    //         callback && callback();
    //         video.setAttribute('muted', true);
    //         rotateVideo(video);
    //     },
    //     onerror: function() {
    //         if (isChrome && location.protocol === 'http:') {
    //             alert('Please test this WebRTC experiment on HTTPS.');
    //         } else if(isChrome) {
    //             alert('Screen capturing is either denied or not supported. Please install chrome extension for screen capturing or run chrome with command-line flag: --enable-usermedia-screen-capturing');
    //         }
    //         // else if(!!navigator.mozGetUserMedia) {
    //         //     alert(Firefox_Screen_Capturing_Warning);
    //         // }
    //     }
    // });

}
function rotateVideo(video) {
    video.style[navigator.mozGetUserMedia ? 'transform' : '-webkit-transform'] = 'rotate(0deg)';
    setTimeout(function() {
        video.style[navigator.mozGetUserMedia ? 'transform' : '-webkit-transform'] = 'rotate(360deg)';
    }, 1000);
}

function getUserMedia(options) {
    var n = navigator,
        media;
    n.getMedia = n.webkitGetUserMedia || n.mozGetUserMedia;
    n.getMedia(options.constraints || {
            audio: true,
            video: video_constraints
        }, streaming, options.onerror || function(e) {
            console.error(e);
        });

    function streaming(stream) {
        var video = options.video;
        if (video) {
            video[moz ? 'mozSrcObject' : 'src'] = moz ? stream : window.webkitURL.createObjectURL(stream);
            video.play();
        }
        options.onsuccess && options.onsuccess(stream);
        media = stream;
    }

    return media;
}

function startRecording(stream) {
    recordedBlobs = [];
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
    try {
        mediaRecorder = new MediaRecorder(stream, options);
    } catch (e) {
        console.error('Exception while creating MediaRecorder: ' + e);
        alert('Exception while creating MediaRecorder: '
            + e + '. mimeType: ' + options.mimeType);
        return;
    }
    console.log('Created MediaRecorder', mediaRecorder, 'with options', options);
    mediaRecorder.onstop = handleStop;
    mediaRecorder.ondataavailable = handleDataAvailable;
    mediaRecorder.start(10); // collect 10ms of data
    console.log('MediaRecorder started', mediaRecorder);
}
function handleStop(event) {
    //var superBuffer = new Blob(recordedBlobs, {type: 'video/webm'});
    //mediaRecorder.save(superBuffer,'test.mp4');
    console.log('Recorder stopped: ', event);
}
function handleDataAvailable(event) {
    if (event.data && event.data.size > 0) {
        recordedBlobs.push(event.data);
    }
}

function play() {
    var superBuffer = new Blob(recordedBlobs, {type: 'video/webm'});
    // mediaRecorder.save(superBuffer);
    video_local.src = window.URL.createObjectURL(superBuffer);
}
btn_stop.onclick = function () {
    btn_play.disabled = false;
    mediaRecorder.stop();
    play();

};
btn_play.onclick = function () {
    console.log("jjjj");
    navigator.getUserMedia({audio:true},function (audioStream) {
        console.log("---------------------",audioStream.getAudioTracks()[0]);
    },function (error) {
        console.log(error);
    });
};