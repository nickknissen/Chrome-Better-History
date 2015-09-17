$(document).ready(function(){

    var date_now = new Date();
    var date_start = new Date(date_now.getFullYear(),date_now.getMonth(),date_now.getDate() - 7,0,0,0);
    var date_end = new Date(date_now.getFullYear(),date_now.getMonth(),date_now.getDate(),23,59,59,999);

    var search = function(text, max_results, start, end){
        text = text || '';
        max_results = max_results || 0;
        start = start || date_start.getTime();
        end = end || date_end.getTime();
        $('#history-display .content').html('<div class="loading"></div>');
        chrome.history.search({text: text, maxResults: max_results, startTime: start, endTime: end}, function(results){
            var last_date;
            $('#history-display .content').html('');
            $.each(results, function(k, v){
                var date = new Date(v.lastVisitTime);
                var current_date = [date.getDate(),date.getMonth(),date.getFullYear()].join('-');
                if(current_date != last_date){
                    $('#history-display .content').append($('<h2 />').html(date.toDateString()));
                    last_date = current_date;
                }
                var row = $('<div />').addClass('row').attr('id', v.id);
                row.append($('<div />').addClass('date')
                    .html(date.toLocaleTimeString()));
                row.append($('<a />').addClass('link')
                    .attr('href', v.url)
                    .attr('target', '_blank')
                    .html(v.title ? v.title : v.url)
                    .css('background-image', '-webkit-image-set(url(chrome://favicon/size/16@1x/' + v.url + ') 1x, url(chrome://favicon/size/16@2x/' + v.url + ') 2x)'));
                $('#history-display .content').append(row);
            });
        });
    };

    var search_input = function(){
        if($('#search').val()){
            $('#history-summary-label, #history-summary-search').css('display', 'inline-block');
            $('#history-summary-search').html('"' + $('#search').val() + '"');
            search($('#search').val(), 200, new Date(1970,0,1,0,0,0).getTime());
        } else {
            $('#history-summary-label, #history-summary-search').css('display', 'none');
            search();
        }
    };

    // Load and replace language
    $('[i18n]').each(function(){
        var i18n = $(this).attr('i18n');
        if(i18n.indexOf(':') >= 0){
            var tmp = i18n.split(':');
            $(this).attr(tmp[0], chrome.i18n.getMessage(tmp[1]));
        } else {
            $(this).html(chrome.i18n.getMessage(i18n));
        }
    });

    $('#search-btn').on('click', function(){
        search_input();
    });

    $('#search').on('search', function(){
        search_input();
    });

    $('#search').on('keyup', function(e){
        if(e.keyCode == 13){
            search_input();
        }
    });

    $('#history-clear-all').on('click', function(){
        chrome.history.deleteAll(function(){
            $('#history-display .content').html('');
        });
    });

    search();

});