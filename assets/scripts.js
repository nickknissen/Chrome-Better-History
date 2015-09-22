/**
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 * This software consists of voluntary contributions made by many individuals
 * and is licensed under the new BSD license.
 *
 * @package     Chrome Better History
 * @author      David Zeller <dev@zellerda.com>
 * @license     http://www.opensource.org/licenses/BSD-3-Clause New BSD license
 * @since       2.0
 */

var now = new Date(), today = new Date(now.getFullYear(),now.getMonth(),now.getDate(),0,0,0,0), is_searching = false;
var getLanguage = function(){
    return chrome.i18n.getMessage('language');
};

var getHistoryByDay = function(day, scroll){
    scroll = scroll == undefined;
    if(is_searching){
        $('#container').html('');
        $('#search').val('');
        is_searching = false;
    }
    var dateStart = new Date(day.getFullYear(),day.getMonth(),day.getDate(),0,0,0,0);
    var dateEnd = new Date(day.getFullYear(),day.getMonth(),day.getDate(),23,59,59);
    var query = {
        text: '',
        startTime: dateStart.getTime(),
        endTime: dateEnd.getTime()
    };
    chrome.history.search(query, function(results){
        historyResponse(results, dateStart, dateEnd, scroll);
    });
};

var search = function(){
    var text = $('#search').val();
    if(text){
        is_searching = true;
        $('#container').html('<div class="loading"></div>');
        var dateStart = new Date(1970,1,1,0,0,0,0);
        var dateEnd = new Date(today.getFullYear(),today.getMonth(),today.getDate(),23,59,59);
        var query = {
            text: text,
            startTime: dateStart.getTime(),
            endTime: dateEnd.getTime()
        };
        chrome.history.search(query, function(results){
            historyResponse(results, dateStart, dateEnd, false);
        });
    } else {
        if(is_searching){
            $('#container').html('');
            $('#search').val('');
            is_searching = false;
        }
        getHistoryByDay(today);
    }
};

var getFavicon = function(url){
    return 'background-image: -webkit-image-set(url(chrome://favicon/size/16@1x/' + url + ') 1x, url(chrome://favicon/size/16@2x/' + url + ') 2x)';
};

var historyResponse = function(results, start, end, scroll){
    var datas = {}, item_date, item_date_day;
    $.each(results, function(k, v){
        item_date = new Date(v.lastVisitTime);
        item_date_day = new Date(item_date.getFullYear(),item_date.getMonth(),item_date.getDate(),0,0,0,0).getTime();
        if(start != undefined && end != undefined && !(item_date >= start && item_date <= end)){
            return;
        }
        if(!datas[item_date_day]){
            datas[item_date_day] = {};
        }
        datas[item_date_day][v.id] = [item_date.getTime(), v.title, v.url];
    });
    if($.isEmptyObject(datas)){
        datas[start.getTime()] = {};
        datas[start.getTime()]['empty'] = [];
    }
    $.each(datas, function(k, v){
        var output = '';
        if(!$('#container #' + k).length){
            output+= '<div class="entry" id="' + k + '">';
        }
        output+= '<h2>' + new Date(parseFloat(k)).toDateString() + '</h2>';
        $.each(v, function(id, item){
            if(id != 'empty'){
                output+= '<span class="row" id="' + id + '">';
                output+= '<span class="date">' + new Date(item[0]).toLocaleTimeString() + '</span>';
                output+= '<a class="link" href="' + item[2] + '" target="_blank" style="' + getFavicon(item[2]) + '">' + (item[1] ? item[1] : item[2]) + '</a>';
                output+= '</span>';
            } else {
                output+= '<span class="row empty"><span>';
                output+= chrome.i18n.getMessage('history_date_empty');
                output+= '</span></span>';
            }
        });
        if(!$('#container #' + k).length){
            output+= '</div>';
        }
        if($('#container #' + k).length){
            $('#' + k).html(output);
        } else {
            if($('#container > .entry').length){
                $('#container > .entry').each(function(){
                    if($(this).is(':last-child')){
                        if(k < $(this).attr('id')){
                            $(output).insertAfter($(this));
                        } else {
                            $(output).insertBefore($(this));
                        }
                        return false;
                    } else if(k > $(this).attr('id')){
                        if(k < $(this).attr('id')){
                            $(output).insertAfter($(this));
                        } else {
                            $(output).insertBefore($(this));
                        }
                        return false;
                    }
                });
            } else {
                $('#container').append(output);
            }
        }
        if(scroll && $('#container #' + k).length){
            $('#container').scrollTo('#' + k, { offsetTop: 91, duration: 100 });
        }
    });
    if(is_searching && $('#container .loading').length){
        $('#container .loading').remove();
    }
};

$(document).ready(function(){

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

    $('#datepicker').datetimepicker({
        timepicker: false,
        value: new Date(),
        maxDate: today,
        inline: true,
        lang: getLanguage(),
        onSelectDate: function(date){
            getHistoryByDay(date);
        }
    });

    getHistoryByDay(today);

    $('#search').on('keyup', function(e){
        if(e.keyCode == 13){
            search();
        }
    }).on('search', function(){
        search();
    });

    $('#search-btn').on('click', function(){
        search();
    });

    $('#container').on('scroll', function(){
        if(!is_searching){
            var height = $('#container').prop('scrollHeight') - 939;
            if(($(this).get(0).scrollTop) >= height * 0.8){
                var last = new Date(parseFloat($('#container .entry:last-child').attr('id')));
                last.setDate(last.getDate() - 1);
                if($('#' + last.getTime()).length == 0){
                    getHistoryByDay(last, false);
                }
            }
        }
    });

});

$.fn.scrollTo = function( target, options, callback ){
    if(typeof options == 'function' && arguments.length == 2){ callback = options; options = target; }
    var settings = $.extend({
        scrollTarget: target,
        offsetTop: 50,
        duration: 100,
        easing: 'swing'
    }, options);
    return this.each(function(){
        var scrollPane = $(this);
        var scrollTarget = (typeof settings.scrollTarget == "number") ? settings.scrollTarget : $(settings.scrollTarget);
        var scrollY = (typeof scrollTarget == "number") ? scrollTarget : scrollTarget.offset().top + scrollPane.scrollTop() - parseInt(settings.offsetTop);
        scrollPane.animate({scrollTop : scrollY }, parseInt(settings.duration), settings.easing, function(){
            if (typeof callback == 'function') { callback.call(this); }
        });
    });
};