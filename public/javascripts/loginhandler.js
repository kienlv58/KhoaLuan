var SCOPES = ['https://www.googleapis.com/auth/drive','profile', 'email'];
var CLIENT_ID = '1089090549465-c3gc6tm2oelikibrkth1lgfq7gvl0812.apps.googleusercontent.com';
var FOLDER_NAME = "";
var FOLDER_ID = "root";
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
        // showLoading();
        // getDriveFiles();

    } else {
        $("#login-box").show();
        $("#drive-box").hide();
    }
}
/******************** END AUTHENTICATION ********************/

/******************** DRIVER API ********************/
function getDriveFiles(){
	showStatus("Loading Google Drive files...");
    gapi.client.load('drive', 'v2', getFiles);
}