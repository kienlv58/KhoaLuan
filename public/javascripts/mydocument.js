// function test(link) {
//     console.log(link);
//     $('#video-src').attr("src", link);
// }
$("#loading").fadeIn('slow')
function getDriverFileId(fileID) {
    var request_getfolder = gapi.client.request({
        'path': '/drive/v2/files/'+fileID,
        'method': "GET"
    });
    request_getfolder.execute(function(resp){
        console.log(resp);
        var data = '';
        url_image = "https://drive-thirdparty.googleusercontent.com/16/type/video/webm";
        // url_image = resp.thumbnailLink;
       //  url_image = "https://drive.google.com/thumbnail?authuser=0&sz=w320&id="+resp.id;
       //  url_image = "https://drive.google.com/thumbnail?sz=w100-h100&id="+resp.id;


        var link = resp.alternateLink;
        // console.log();
        data +='<li class="list-group-item">';
        data += '<input type="hidden" class="url_video" value="'+resp.embedLink+'">'
        data +='<img src="'+url_image+'" alt="loi anh" class="media-photo" width="50" height="50" />';
        data += '<label for="checkbox3">'+resp.title+'</label>';
        data +='<div class="pull-right action-buttons">';
        data += '<a class="playitem"><span class="glyphicon glyphicon-play"></span></a>';
        data += '<a href="#" class="trash"><span class="glyphicon glyphicon-trash"></span></a>';
        data += '<a href="#" class="flag"><span class="glyphicon glyphicon-share-alt"></span></a>';
        data += '</div>';
        data += '</li></br>';
        $('.page-content').append(data);
    });
}

(function($) {
    $(document).on('click', '.playitem', function () {
        console.log(1);
        var link = $(this).parents('.list-group-item').children('.url_video').val();
        console.log(link);
        $('#video-src').attr("src", link);
        $('#modal-video').modal('show');
    });
})(jQuery);