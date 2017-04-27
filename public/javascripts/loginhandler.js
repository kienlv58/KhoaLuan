var SCOPES = ['https://www.googleapis.com/auth/drive','profile', 'email'];
var CLIENT_ID = '1089090549465-c3gc6tm2oelikibrkth1lgfq7gvl0812.apps.googleusercontent.com';
var FOLDER_NAME = "";
FOLDER_ID = "";
var FOLDER_PERMISSION = true;
var FOLDER_LEVEL = 0;
var NO_OF_FILES = 1000;
var DRIVE_FILES = [];
var FILE_COUNTER = 0;
var FOLDER_ARRAY = [];
var accessToken = "";
/******************** AUTHENTICATION ********************/
function checkAuth() {
    gapi.auth.authorize({
        'client_id': CLIENT_ID,
        'scope': SCOPES.join(' '),
        'immediate': true
    }, handleAuthResult);
}
//authorize apps
function handleAuthClick(event) {
    gapi.auth.authorize(
          { client_id: CLIENT_ID, scope: SCOPES, immediate: false },
          handleAuthResult);
    return false;
}
//check the return authentication of the login is successful, we display the drive box and hide the login box.
function handleAuthResult(authResult) {
    if (authResult && !authResult.error) {
    	gapi.client.load('plus','v1', function(){
 var request = gapi.client.plus.people.get({
   'userId': 'me'
 });
 request.execute(function(resp) {
   console.log('Retrieved profile for:',resp);
   $("#avatar").attr("src",resp.image.url);
   $("#user_name").text(resp.displayName);
   $("#givenName").text(resp.name.givenName);
   $("#email").text(resp.emails[0].value);

 });
});
        accessToken = authResult.access_token;
    	console.log("profile",authResult);

        $("#drive-box").css("display", "inline-block");
        $("#login-box").hide();


      // var initialRequest = gapi.client.drive.files.list();
      var initialRequest = gapi.client.request({
        'folderId':'root',
      'path': '/drive/v2/files',
      'q' : 'trashed = false',
      'method': 'GET',
      });
       initialRequest.execute(function(resp) {
               if (!resp.error) {
                    console.log("initialRequest",resp);
                     //check folder exist
        var folder;
        var folder_exist = false;
        console.log("length",resp.items.length);
        for(var i = 0; i < resp.items.length;i++){
          if((resp.items)[i].title === "EasyRC"){
            console.log("title",(resp.items)[i].title);
            FOLDER_ID = (resp.items)[i].id;
            console.log("id----------",FOLDER_ID);
                getDriveFiles();
            folder_exist = true;
            break;
          }
        }
      
        //create new folder if not exist
        if(folder_exist == false){

        var create_file = function(){
        var access_token =  gapi.auth.getToken().access_token;
            var request = gapi.client.request({
               'path': '/drive/v2/files/',
               'method': 'POST',
               'headers': {
                   'Content-Type': 'application/json',
                   'Authorization': 'Bearer ' + access_token,             
               },
               'body':{
                   "title" : "EasyRC",
                   "mimeType" : "application/vnd.google-apps.folder",
                   "parents": [{
                        "kind": "drive#file",
                        "id": "root"
                    }]
               }
            });

            request.execute(function(resp) {
               if (!resp.error) {
                FOLDER_ID = resp.id;
                console.log("id----------",FOLDER_ID);
                getDriveFiles();
                    console.log("create file success",resp);
               }else{
                    console.log("create file errors",resp.errors.message);
               }
            });

}();
}else{
  console.log("folder exist");
}


               }else{
                    console.log("initialRequest",resp.errors.message);
               }
            });
    

       

    } else {
        $("#login-box").show();
        $("#drive-box").hide();
    }
}
/******************** END AUTHENTICATION ********************/

/******************** DRIVER API ********************/
function getDriveFiles(){
  var reques_getfile = gapi.client.request({
            'path': '/drive/v2/files/'+FOLDER_ID+'/children',
            'method': 'GET',
            });
        
 reques_getfile.execute(function(resp){
    console.log("get list file",resp);
     $.each(resp.items, function(index, val) {
         /* iterate through array or object */
         // console.log(val.id);
         getDriverFileId(val.id);
     });
 });
	// showStatus("Loading Google Drive files...");
 //    gapi.client.load('drive', 'v2', getFiles);
}

function getDriverFileId(fileID) {
    var request_getfolder = gapi.client.request({
        'path': '/drive/v2/files/'+fileID,
        'method': "GET"
    });
    request_getfolder.execute(function(resp){
        console.log(resp);
        var data = '';
        url_image = resp.thumbnailLink;
        data +='<li class="list-group-item">';
        data += '<input type="hidden" class="url_video" value="'+resp.webContentLink+'">'
        data +='<img src="'+url_image+'" alt="loi anh" class="media-photo" width="50" height="50" />';
        data += '<label for="checkbox3">'+resp.title+'</label>';
        data +='<div class="pull-right action-buttons">';
        data += '<a href="javascript:void(0)" class="playitem"><span class="glyphicon glyphicon-play"></span></a>';
        data += '<a href="#" class="trash"><span class="glyphicon glyphicon-trash"></span></a>';
        data += '<a href="#" class="flag"><span class="glyphicon glyphicon-share-alt"></span></a>';
        data += '</div>';
        data += '</li></br>';
        $('.page-content').append(data);
    });

    $('.playitem').on('click', function (e) {
        console.log("aaaaaaaaaaaaaaaa");
        e.preventDefault();
        $('#modal-video').modal();
    });
}