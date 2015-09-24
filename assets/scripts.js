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
 * @since       3.1
 */

var now = new Date(), today = new Date(now.getFullYear(),now.getMonth(),now.getDate(),0,0,0,0), is_searching = false, loading = false, entries;
var getLanguage = function(){
    return chrome.i18n.getMessage('language');
};

var getContainerScrollHeight = function(){
    return $('#container').prop('scrollHeight') - 939;
};

var clearSearch = function(){
    $('#container').html('');
    $('#search').val('');
    $('#history-summary-label').hide();
    $('#history-summary-search').hide();
    $('#datepicker').datetimepicker({minDate:false});
    is_searching = false;
};

var getHistoryByDay = function(day, scroll, nb){
    scroll = scroll == undefined;
    nb = nb || 5000;
    if(is_searching){
        clearSearch();
    }
    var dateStart = new Date(day.getFullYear(),day.getMonth(),day.getDate(),0,0,0,0);
    var dateEnd = new Date(day.getFullYear(),day.getMonth(),day.getDate(),23,59,59);
    var query = {
        text: '',
        startTime: dateStart.getTime(),
        endTime: dateEnd.getTime(),
        maxResults: nb
    };
    loading = true;
    chrome.history.search(query, function(results){
        historyResponse(results, dateStart, dateEnd, scroll);
    });
};

var search = function(){
    var text = $('#search').val();
    if(text){
        $('#datepicker').datetimepicker({minDate:today});
        is_searching = true;
        $('#container').html('<div class="loading"></div>');
        var dateStart = new Date(1970,1,1,0,0,0,0);
        var dateEnd = new Date(today.getFullYear(),today.getMonth(),today.getDate(),23,59,59);
        var query = {
            text: text,
            startTime: dateStart.getTime(),
            endTime: dateEnd.getTime(),
            maxResults: 0
        };
        $('#history-summary-label').css('display', 'inline-block');
        $('#history-summary-search').html(text).css('display', 'inline-block');
        loading = true;
        chrome.history.search(query, function(results){
            historyResponse(results, dateStart, dateEnd, false);
        });
    } else {
        if(is_searching){
            clearSearch();
        }
        getHistoryByDay(today);
    }
};

var getFavicon = function(url){
    return 'background-image: -webkit-image-set(url(\'chrome://favicon/size/16@1x/' + url + '\') 1x, url(\'chrome://favicon/size/16@2x/' + url + '\') 2x)';
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
        datas[item_date_day][v.lastVisitTime] = [v.id, v.title, v.url];
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
        output+= '<h2>' + new Date(parseFloat(k)).format(chrome.i18n.getMessage('date_format')) + '</h2>';
        $.each(v, function(id, item){
            if(id != 'empty'){
                output+= '<span class="row" id="' + item[0] + '">';
                output+= '<span class="date">' + new Date(parseFloat(id)).format('isoTime') + '</span>';
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
            $('#container').scrollTo('#' + k, { offsetTop: 91, duration: 0 });
        }
    });
    if(is_searching && $('#container .loading').length){
        $('#container .loading').remove();
    }
    if($('body.popup').length){
        $('html, body').height($('.sizable').height());
    }
    entries = $('#container .entry').map(function(){
        if ($(this).offset().top < $(this)[0].scrollTop + 100)
            return this;
    });
    loading = false;
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

    if($('body.popup').length){
        getHistoryByDay(today, false, 10);
        $('#view-full-history').on('click', function(){
            chrome.tabs.create({url: 'chrome://history'});
        });
    } else {
        $('#datepicker').datetimepicker({
            timepicker: false,
            value: new Date(),
            maxDate: today,
            inline: true,
            todayButton: false,
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
            if(!is_searching && !loading){
                if(($(this)[0].scrollTop) >= getContainerScrollHeight() * 0.9){
                    var last = new Date(parseFloat($('#container .entry:last-child').attr('id')));
                    last.setDate(last.getDate() - 1);
                    if($('#' + last.getTime()).length == 0){
                        getHistoryByDay(last, false);
                    }
                }

                var cur = $(entries[entries.length-1]);
                $('#datepicker').datetimepicker({value: new Date(parseFloat(cur.attr('id')))});
            }
        });

        $('#history-clear-all').on('click', function(){
            if(confirm(chrome.i18n.getMessage('warning_history_clear'))){
                chrome.history.deleteAll(function(){
                    getHistoryByDay(today);
                });
            }
        });

        $('#datepicker-today').on('click', function(){
            $('#datepicker').datetimepicker({value: new Date()});
            getHistoryByDay(today);
        });
    }

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

var dateFormat = function () {
    var token = /d{1,4}|m{1,4}|yy(?:yy)?|([HhMsTt])\1?|[LloSZ]|"[^"]*"|'[^']*'/g,
        timezone = /\b(?:[PMCEA][SDP]T|(?:Pacific|Mountain|Central|Eastern|Atlantic) (?:Standard|Daylight|Prevailing) Time|(?:GMT|UTC)(?:[-+]\d{4})?)\b/g,
        timezoneClip = /[^-+\dA-Z]/g,
        pad = function (val, len) {
            val = String(val);
            len = len || 2;
            while (val.length < len) val = "0" + val;
            return val;
        };

    // Regexes and supporting functions are cached through closure
    return function (date, mask, utc) {
        var dF = dateFormat;

        // You can't provide utc if you skip other args (use the "UTC:" mask prefix)
        if (arguments.length == 1 && Object.prototype.toString.call(date) == "[object String]" && !/\d/.test(date)) {
            mask = date;
            date = undefined;
        }

        // Passing date through Date applies Date.parse, if necessary
        date = date ? new Date(date) : new Date;
        if (isNaN(date)) throw SyntaxError("invalid date");

        mask = String(dF.masks[mask] || mask || dF.masks["default"]);

        // Allow setting the utc argument via the mask
        if (mask.slice(0, 4) == "UTC:") {
            mask = mask.slice(4);
            utc = true;
        }

        var _ = utc ? "getUTC" : "get",
            d = date[_ + "Date"](),
            D = date[_ + "Day"](),
            m = date[_ + "Month"](),
            y = date[_ + "FullYear"](),
            H = date[_ + "Hours"](),
            M = date[_ + "Minutes"](),
            s = date[_ + "Seconds"](),
            L = date[_ + "Milliseconds"](),
            o = utc ? 0 : date.getTimezoneOffset(),
            flags = {
                d:    d,
                dd:   pad(d),
                ddd:  dF.i18n.dayNames[D],
                dddd: dF.i18n.dayNames[D + 7],
                m:    m + 1,
                mm:   pad(m + 1),
                mmm:  dF.i18n.monthNames[m],
                mmmm: dF.i18n.monthNames[m + 12],
                yy:   String(y).slice(2),
                yyyy: y,
                h:    H % 12 || 12,
                hh:   pad(H % 12 || 12),
                H:    H,
                HH:   pad(H),
                M:    M,
                MM:   pad(M),
                s:    s,
                ss:   pad(s),
                l:    pad(L, 3),
                L:    pad(L > 99 ? Math.round(L / 10) : L),
                t:    H < 12 ? "a"  : "p",
                tt:   H < 12 ? "am" : "pm",
                T:    H < 12 ? "A"  : "P",
                TT:   H < 12 ? "AM" : "PM",
                Z:    utc ? "UTC" : (String(date).match(timezone) || [""]).pop().replace(timezoneClip, ""),
                o:    (o > 0 ? "-" : "+") + pad(Math.floor(Math.abs(o) / 60) * 100 + Math.abs(o) % 60, 4),
                S:    ["th", "st", "nd", "rd"][d % 10 > 3 ? 0 : (d % 100 - d % 10 != 10) * d % 10]
            };

        return mask.replace(token, function ($0) {
            return $0 in flags ? flags[$0] : $0.slice(1, $0.length - 1);
        });
    };
}();

// Some common format strings
dateFormat.masks = {
    "default":      "ddd mmm dd yyyy HH:MM:ss",
    shortDate:      "m/d/yy",
    mediumDate:     "mmm d, yyyy",
    longDate:       "mmmm d, yyyy",
    fullDate:       "dddd, mmmm d, yyyy",
    shortTime:      "h:MM TT",
    mediumTime:     "h:MM:ss TT",
    longTime:       "h:MM:ss TT Z",
    isoDate:        "yyyy-mm-dd",
    isoTime:        "HH:MM:ss",
    isoDateTime:    "yyyy-mm-dd'T'HH:MM:ss",
    isoUtcDateTime: "UTC:yyyy-mm-dd'T'HH:MM:ss'Z'"
};

// Internationalization strings
dateFormat.i18n = {
    dayNames: chrome.i18n.getMessage('date_day_names').split('|'),
    monthNames: chrome.i18n.getMessage('date_month_names').split('|')
};

// For convenience...
Date.prototype.format = function (mask, utc) {
    return dateFormat(this, mask, utc);
};