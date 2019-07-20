/*!
 * froala_editor v2.8.5 (https://www.froala.com/wysiwyg-editor)
 * License https://froala.com/wysiwyg-editor/terms/
 * Copyright 2014-2018 Froala Labs
 */

(function ($) {
    $.extend($.FE.DEFAULTS, {
        wordCounter: false,
    });

    $.FE.PLUGINS.charCounter = function(editor) {
        var counter;

        function stripBbCode(text) {
            var parts = text.split(/(\[quote[^\]]*\]|\[\/quote\])/i);
            var s = '';
            var quoteLevel = 0;
            for (var i = 0; i < parts.length; i++) {
                var part = parts[i];
                if (i % 2 === 0) {
                    // always text, only include if not inside quotes
                    if (quoteLevel === 0) {
                        s = s + part.replace(/\s+$/, '') + "\n";
                    }
                } else {
                    // quote start/end
                    if (part[1] === '/') {
                        // close tag, down a level if open
                        if (quoteLevel) {
                            quoteLevel--;
                        }
                    } else {
                        // up a level
                        quoteLevel++;
                    }
                }
            }

            // replaces unviewable tags with a text representation
            s = s.replace('[*]', '');
            s = s.replace(/\[(attach|media|img|spoiler|ispoiler)[^]\]*?].*?\[\/\1\]/si, '',);

            // split the string into possible delimiters and text; even keys (from 0) are strings, odd are delimiters
            parts = s.split(/(\[[a-z0-9_]+(?:=[^]\]*){0,1}?]|\[[a-z0-9_]+(?:s?[a-z0-9_]+="[^"]*")+\]|\[\/[a-z0-9_]+\])/si);
            if (parts.length < 2) {
                return s;
            }

            var closes = {};
            var skips = {};

            // first pass: find all the closing tags and note their keys
            for (i = 1; i < parts.length; i += 2)
            {
                var match = parts[i].match(/^\[\/([a-z0-9_]+)\]/i);
                if (match)
                {
                    var k = match[1].toLowerCase();
                    if (!closes[k])
                    {
                        closes[k] = [];
                    }
                    closes[k].push(i);
                }
            }

            var cleaned = '';

            // second pass: look for all the text elements and any opens, then find
            // the first corresponding close that comes after it and remove it.
            // if we find that, don't display the open or that close
            for (i = 0; i < parts.length; i++)
            {
                part = parts[i];
                if (i % 2 === 0)
                {
                    // string part
                    cleaned = cleaned + part;
                    continue;
                }

                if (i in skips)
                {
                    // known close
                    continue;
                }

                match = part.match(/^\[([a-z0-9_]+)(?:=|s?[a-z0-9_]+="[^"]*"|\])/i);
                if (match)
                {
                    var tagName = match[1].toLowerCase();
                    if (closes[tagName])
                    {
                        var closeKey;
                        do
                        {
                            closeKey = closes[tagName].shift();
                        }
                        while (closes[tagName].length && closeKey < i);
                        if (closeKey)
                        {
                            // found a matching close after this tag
                            skips[closeKey] = true;
                            continue;
                        }
                    }
                }

                cleaned = cleaned + part;
            }

            return cleaned;
        }

        function countWords() {
            var text = editor.el.innerText || "";

            text = stripBbCode(text);
            text = text.replace(/\s+/gi, " ");
            text = text.trim();
            return text.length ? text.split(' ').length : 0;
        }

        function updateCounter() {
            if (editor.opts.wordCounter) {
                var text = countWords() + " " + (editor.opts.wordCounterLabel || "words");
                counter.text(text);
                editor.opts.toolbarBottom && counter.css("margin-bottom", editor.$tb.outerHeight(!0));
                var t = editor.$wp.get(0).offsetWidth - editor.$wp.get(0).clientWidth;
                0 <= t && ("rtl" == editor.opts.direction ? counter.css("margin-left", t) : counter.css("margin-right", t))
            }
        }
        return {
            _init: function() {
                if(!!editor.opts.wordCounter && !!editor.$wp){
                    counter = $('<span class="fr-counter"></span>').css("bottom", editor.$wp.css("border-bottom-width"));

                    editor.$box.append(counter);
                    editor.events.on("paste.afterCleanup", updateCounter);
                    editor.events.on("keyup contentChanged input", function() {
                        editor.events.trigger("charCounter.update")
                    });
                    editor.events.on("charCounter.update", updateCounter);
                    editor.events.trigger("charCounter.update");
                    void editor.events.on("destroy", function() {
                        $(editor.o_win).off("resize.char" + editor.id);
                        counter.removeData().remove();
                        counter = null
                    });
                }
            },
            count: countWords
        }
    }
})(jQuery);
