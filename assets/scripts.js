$(document).ready(function(){

    var date_now = new Date();
    var date_start = new Date(date_now.getFullYear(),date_now.getMonth(),date_now.getDate(),0,0,0,0);
    var date_end = new Date(date_now.getFullYear(),date_now.getMonth(),date_now.getDate(),23,59,59);

    var search = function(text, max_results, start, end){
        text = text || '';
        max_results = max_results || 0;
        start = start || date_start;
        end = end || date_end;
        $('#content').html('<div class="loading"></div>');
        localStorage['search'] = text;
        var query = {
            text: text,
            maxResults: max_results,
            startTime: start.getTime(),
            endTime: end.getTime()
        };
        if(text){
            $('#history-summary-label, #history-summary-search').css('display', 'inline-block');
            $('#history-summary-search').html('"' + $('#search').val() + '"');
        } else {
            $('#history-summary-label, #history-summary-search').css('display', 'none');
            $('#search').val('');
        }
        chrome.history.search(query, function(results){
            var last_date = 0;
            $('#content').html('');
            $.each(results, function(k, v){
                var result_date = new Date(v.lastVisitTime);
                if(result_date >= start && result_date <= end){
                    var current_date = [result_date.getDate(),result_date.getMonth(),result_date.getFullYear()].join('-');
                    if(current_date != last_date){
                        $('#content').append($('<h2 />').html(result_date.toDateString()));
                        last_date = current_date;
                    }
                    var row = $('<div />').addClass('row').attr('id', v.id);
                    row.append($('<div />').addClass('date')
                        .html(result_date.toLocaleTimeString()));
                    row.append($('<a />').addClass('link')
                        .attr('href', v.url)
                        .attr('target', '_blank')
                        .html(v.title ? v.title : v.url)
                        .css('background-image', '-webkit-image-set(url(chrome://favicon/size/16@1x/' + v.url + ') 1x, url(chrome://favicon/size/16@2x/' + v.url + ') 2x)'));
                    $('#content').append(row);
                }
            });
        });
    };

    var search_input = function(){
        if($('#search').val()){
            search($('#search').val(), 200, new Date(1970,0,1,0,0,0));
        } else {
            search();
        }
    };

    var get_language = function(){
        return chrome.i18n.getMessage('language');
    };

    var search_date = function(search_date){
        var start = new Date(search_date.getFullYear(),search_date.getMonth(),search_date.getDate(),0,0,0,0);
        var end = new Date(search_date.getFullYear(),search_date.getMonth(),search_date.getDate(),23,59,59);
        search('', 0, start, end);
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
        if(confirm(chrome.i18n.getMessage('warning_history_clear'))){
            chrome.history.deleteAll(function(){
                $('#history-display .content').html('');
            });
        }
    });

    $('#datepicker').datetimepicker({
        timepicker: false,
        value: localStorage['date'] ? new Date(localStorage['date']) : new Date(),
        maxDate: date_end,
        inline: true,
        lang: get_language(),
        onSelectDate: function(e){
            localStorage['date'] = e.toLocaleDateString();
            search_date(e);
        }
    });

    if(localStorage['search']){
        $('#search').val(localStorage['search']);
        search_input();
    } else if(localStorage['date']) {
        search_date(new Date(localStorage['date']))
    } else {
        search();
    }

});