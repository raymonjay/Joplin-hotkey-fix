setInterval(function(){
    webviewApi.postMessage('get-folders').then(function(response){
        $("#progress").html("folder: " + response);
    });
    webviewApi.postMessage('get-notes').then(function(response){
        $("#progress").append(", notes: " + response);
    });
}, 2000);