'use strict'

// local video and remote video
var localVideo = document.querySelector('video#localvideo');
var remoteVideo = document.querySelector('video#remotevideo');

// The status of a meeting
var btnConn =  document.querySelector('button#connserver');
var btnLeave = document.querySelector('button#leave');

// The information of room and user
var inputRoom = document.querySelector('input#room');
var roomid = null;
var userName = document.querySelector('input#username')

// Chat room
var outputArea = document.querySelector('textarea#output');
var inputArea = document.querySelector('textarea#input');
var btnSend = document.querySelector('button#send');

// Shared desktop
var shareDeskBox  = document.querySelector('input#shareDesk');

// Local stream and remote stream
var localStream = null;
var remoteStream = null;

// peerConnection and dataChannel
var pc = null;
var dc = null;

// sockect.io
var socket = null;

// The state of user
var state = 'init';

/**
 * Check if the equipment is pc or the other
 */
function IsPC() {
    var userAgentInfo = navigator.userAgent;
    var Agents = ["Android", "iPhone","SymbianOS", "Windows Phone","iPad", "iPod"];
    var flag = true;

    for (var v = 0; v < Agents.length; v++) {
        if (userAgentInfo.indexOf(Agents[v]) > 0) {
            flag = false;
            break;
        }
    }
    return flag;
}

/**
 * The process of some handling error
 */

function handleError(err) {
    console.error('Failed to get Media Stream!', err);
}

function handleAnswerError(err) {
    console.error('Failed to create answer!', err);
}

function handleOfferError(err) {
    console.error('Failed to get Offer!', err)
}

/**
 * The implementation of Peer to Peer Connection
 */

function getAnswer(desc) {
    pc.setLocalDescription(desc);
    sendMessage(roomid, desc);
}

function getOffer(desc) {
    pc.setLocalDescription(desc);
    sendMessage(roomid, desc);
}

function sendMessage(roomid, data) {
    console.log('send p2p message', roomid, data);
    if (socket) {
        socket.emit('message', roomid, data);
    }
}

/**
 * Get the remote stream
 */
function getRemoteStream(e){
    remoteStream = e.streams[0];
    remoteVideo.srcObject = e.streams[0];
}

function createPeerConnection() {
    console.log('create RTCPeerConnection!');
    if (!pc) {
        // If do not have a peerconnection, create it
        var pcConfig = {
            'iceServers': [{
                'urls': 'turn:49.235.113.88:3478',
                'credential': "123456",
                'username': "teiyui"
            }]
        };
        pc = new RTCPeerConnection(pcConfig);

        pc.onicecandidate = function (e) {
            if (e.candidate) {
                console.log('find a new candidate:', e.candidate);

                // Send the message of SDP
                sendMessage(roomid, {
                    type: 'candidate',
                    label: e.candidate.sdpMLineIndex,
                    id: e.candidate.sdpMid,
                    candidate: e.candidate.candidate
                });
            } else {
                console.log('this is the end candidate');
            }
        }

        pc.ondatachannel = (e) => {
            if (!dc) {
                dc = e.channel;
                dc.onmessage = receivemsg;
                dc.onopen = dataChannelStateChange;
                dc.onclose = dataChannelStateChange;
            }
        }

        pc.ontrack = getRemoteStream;
    }

    if (localStream) {
        localStream.getTracks().forEach((track) => {
            pc.addTrack(track, localStream);
        })
    }
}

/**
 * The feature 1: Connect to the room
 */

function conn() {

    socket = io.connect();

    socket.on('joined', (roomid, id) => {
        console.log('receive joined message:', roomid, id);
        state = 'joined';

        createPeerConnection();

        btnConn.disabled = true;
        btnLeave.disabled = false;

        console.log('receive joined message:state=', state);
    });

    socket.on('otherjoin', (roomid, id) => {
        console.log('receive otherjoin message: ', roomid, id);

        if (state === 'joined_unbind') {
            createPeerConnection();
        }

        dc = pc.createDataChannel('chat');
        dc.onmessage = receivemsg;
        dc.onopen = dataChannelStateChange;
        dc.onclose = dataChannelStateChange;

        state = 'joined_conn';

        call();
        console.log('receive otherjoin message:state=', state);
    });

    socket.on('full', (roomid, id) => {
        console.log('receive full message: ', roomid, id);
        state = 'leaved';
        console.log('receive full message:state=', state);
        socket.disconnect();

        alert('the room is full!');

        btnConn.disabled = false;
        btnLeave.disabled = true;
    });

    socket.on('leaved', (roomid, id) => {
        console.log('receive leaved message: ', roomid, id);
        state = 'leaved';
        console.log('receive leaved message:state=', state);
        socket.disconnect();

        btnConn.disabled = false;
        btnLeave.disabled = true;
    });

    socket.on('bye', (roomid, id) => {
        console.log('receive bye message: ', roomid, id);
        state = 'joined_unbind';
        closePeerConnection();
        console.log('receive bye message:state=', state);
    });

    socket.on('message', (roomid, data) => {
        console.log('receive client message: ', roomid, data);

        if (data) {
            if (data.type === 'offer') {
                pc.setRemoteDescription(new RTCSessionDescription(data));
                pc.createAnswer()
                    .then(getAnswer)
                    .catch(handleAnswerError)
            } else if (data.type === 'answer') {
                pc.setRemoteDescription(new RTCSessionDescription(data));
            } else if (data.type === 'candidate') {
                var candidate = new RTCIceCandidate({
                    sdpMLineIndex: data.label,
                    candidate: data.candidate
                });

                pc.addIceCandidate(candidate);
            } else {
                console.log('the message is invalid!', data);
            }
        }
    });

    socket.emit('join', roomid);

    return;

}

function getMediaStream(stream) {

    if(localStream){
        stream.getAudioTracks().forEach((track)=>{
            localStream.addTrack(track);
            stream.removeTrack(track);
        });
    }else{
        localStream = stream;
    }
    localVideo.srcObject = localStream;

    conn();

}

function start(){

    if(!navigator.mediaDevices ||
        !navigator.mediaDevices.getUserMedia){
        console.error('the getUserMedia is not supported!');
        return;
    }else {

        var constraints;

        if (shareDeskBox.checked && shareDesk()) {
            constraints = {
                video: false,
                // put some gains into music
                audio:  {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            }
        } else {
            constraints = {
                video: true,
                // put some gains into music
                audio:  {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            }
        }

        navigator.mediaDevices.getUserMedia(constraints)
            .then(getMediaStream)
            .catch(handleError);
    }

}

function connSignalServer() {

    if (inputRoom.value === null || inputRoom.value === '' || inputRoom.value === undefined
        || userName.value === null || userName.value === '' || userName.value === undefined) {
        alert('Please input your username and room id');
    } else {
        roomid = inputRoom.value;
        start(); // Start shared desktop or local stream
    }
    return true;

}

function call() {

    if (state === 'joined_conn') {
        if (pc) {
            var options = {
                offerToReceiveAudio: 1,
                offerToReceiveVideo: 1,

            }
            pc.createOffer(options)
                .then(getOffer)
                .catch(handleOfferError);
        }
    }

}

/**
 * The feature 2: Leave the room
 */

function closeLocalMedia() {

    if (localStream && localStream.getTracks()) {
        localStream.getTracks().forEach((track) => {
            track.stop();
        })
    }

}

function closePeerConnection() {

    console.log('close RTCPeerConnection!');
    if (pc) {
        pc.close();
        pc = null;
    }

}

function leave() {

    if (socket) {
        socket.emit('leave', roomid);
    }
    closePeerConnection();
    closeLocalMedia();
    btnConn.disabled = false;
    btnLeave.disabled = true;

}

/**
 * The feature 3: Chat room
 */

function dataChannelStateChange() {

    var readyState = dc.readyState;
    if (readyState === 'open') {
        inputArea.disabled = false;
        btnSend.disabled = false;
    } else {
        inputArea.disabled = true;
        btnSend.disabled = true;
    }

}

function receivemsg(e) {

    var msg = e.data;
    if (msg) {
        outputArea.value = outputArea.value + msg + '\r';
    } else {
        console.error('received msg is null');
    }

}

function sendText() {

    var data = inputArea.value;
    data = userName.value + ':' + data;
    if (data) {
        dc.send(data);
    }
    outputArea.value = outputArea.value + data + '\r';
    inputArea.value = '';

}

/**
 * The feature 4: Shared desktop
 */

function getDeskStream(stream){

    localStream = stream;

}

function shareDesk(){

    if(IsPC()){
        navigator.mediaDevices.getDisplayMedia({video: true})
            .then(getDeskStream)
            .catch(handleError);

        return true;
    }

    return false;

}

btnConn.onclick = connSignalServer;
btnLeave.onclick = leave;
btnSend.onclick = sendText;