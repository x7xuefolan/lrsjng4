modulejs.define('ext/google-analytics-ua', ['_', 'core/event', 'core/settings'], function (_, event, allsettings) {

    var settings = _.extend({
            enabled: false,
            id: 'UA-000000-0'
        }, allsettings['google-analytics-ua']);
    var win = window;
    var doc = document;
    var scriptLiteral = 'script';
    var id = 'h5ai-ga';


    function init() {

        if (!settings.enabled) {
            return;
        }

        var el;
        var firstScriptElement;

        win.GoogleAnalyticsObject = id;
        win[id] = win[id] || function () {
            (win[id].q = win[id].q || []).push(arguments);
        };
        win[id].l = 1 * new Date();

        el = doc.createElement(scriptLiteral);
        el.async = true;
        el.src = '//www.google-analytics.com/analytics.js';

        firstScriptElement = doc.getElementsByTagName(scriptLiteral)[0];
        firstScriptElement.parentNode.insertBefore(el, firstScriptElement);

        win[id]('create', settings.id, 'auto');

        event.sub('location.changed', function (item) {

            var loc = win.location;
            win[id]('send', 'pageview', {
                location: loc.protocol + '//' + loc.host + item.absHref,
                title: _.pluck(item.getCrumb(), 'label').join(' > ')
            });
        });
    }


    init();
});
