var token = "";
var tuid = "";
var ebs = "";

// because who wants to type this every time?
var twitch = window.Twitch.ext;

// create the request options for our Twitch API calls
var requests = {
    set: createRequest('POST', 'cycle'),
    get: createRequest('GET', 'query')
};

function createRequest(type, method) {

    return {
        type: type,
        url: location.protocol + '//localhost:8081/color/' + method,
        success: updateBlock,
        error: logError
    }
}

function connectWebSocket(){
    return new Promise((resolve, reject)=>{
        try{
            const connection = new WebSocket(`ws://localhost:8081/ws`);
            resolve(connection)
        }catch(err){
            reject(err)
        }
    })
}

function setAuth(token) {
    Object.keys(requests).forEach((req) => {
        twitch.rig.log('Setting auth headers');
        requests[req].headers = { 'Authorization': 'Bearer ' + token }
    });
}

twitch.onContext(function(context) {
    twitch.rig.log(context);
});

twitch.onAuthorized(function(auth) {
    // save our credentials
    token = auth.token;
    tuid = auth.userId;

    // enable the button
    $('#cycle').removeAttr('disabled');

    setAuth(token);
    $.ajax(requests.get);
});

function updateBlock(hex) {
    twitch.rig.log('Updating block color');
    $('#color').css('background-color', hex);
}

function logError(_, error, status) {
  twitch.rig.log('EBS request returned '+status+' ('+error+')');
}

function logSuccess(hex, status) {
  // we could also use the output to update the block synchronously here,
  // but we want all views to get the same broadcast response at the same time.
  twitch.rig.log('EBS request returned '+hex+' ('+status+')');
}

$(async function() {

    // when we click the cycle button
    $('#cycle').click(function() {
        if(!token) { return twitch.rig.log('Not authorized'); }
        twitch.rig.log('Requesting a color cycle');
        $.ajax(requests.set);
    });

    // listen for incoming broadcast message from our EBS
    twitch.listen('broadcast', function (target, contentType, color) {
        console.log(`target : ${target}`)
        console.log(`contentType : ${contentType}`)
        console.log(`color : ${color}`)
        twitch.rig.log('Received broadcast color');
        updateBlock(color);
    });

    // Listen websocket
    console.log("Starting websocket")
    const ws = await connectWebSocket()
    //通信が接続された場合
    ws.onopen = function(e) {
        console.log("WS CONNECTED!")
        const msg = {
            message:"hi"
        }
        ws.send(JSON.stringify(msg))
    };
    
    //エラーが発生した場合
    ws.onerror = function(error) {
        console.log("WS ERROR")
        console.error(error)
    };
    
    //メッセージを受け取った場合
    ws.onmessage = function(e) {
        console.log("WS Message received")
        console.log(e)
    };
    
    //通信が切断された場合
    ws.onclose = function() {
        console.log("WS CLOSED")
    };
});
