const {each, map, includes} = require('../lo');
const server = require('../server');
const event = require('../core/event');
const allsettings = require('../core/settings');

const settings = Object.assign({
    enabled: false,
    img: ['img-bmp', 'img-gif', 'img-ico', 'img-jpg', 'img-png'],
    mov: ['vid-avi', 'vid-flv', 'vid-mkv', 'vid-mov', 'vid-mp4', 'vid-mpg', 'vid-webm'],
    doc: ['x-pdf', 'x-ps'],
    delay: 1,
    size: 100,
    exif: false
}, allsettings.thumbnails);
const landscapeRatio = 4 / 3;


function queueItem(queue, item) {
    let type = null;

    if (includes(settings.img, item.type)) {
        type = 'img';
    } else if (includes(settings.mov, item.type)) {
        type = 'mov';
    } else if (includes(settings.doc, item.type)) {
        type = 'doc';
    } else {
        return;
    }

    if (item.thumbSquare) {
        item.$view.find('.icon.square img').addClass('thumb').attr('src', item.thumbSquare);
    } else {
        queue.push({
            type,
            href: item.absHref,
            ratio: 1,
            callback: src => {
                if (src && item.$view) {
                    item.thumbSquare = src;
                    item.$view.find('.icon.square img').addClass('thumb').attr('src', src);
                }
            }
        });
    }

    if (item.thumbRational) {
        item.$view.find('.icon.landscape img').addClass('thumb').attr('src', item.thumbRational);
    } else {
        queue.push({
            type,
            href: item.absHref,
            ratio: landscapeRatio,
            callback: src => {
                if (src && item.$view) {
                    item.thumbRational = src;
                    item.$view.find('.icon.landscape img').addClass('thumb').attr('src', src);
                }
            }
        });
    }
}

function requestQueue(queue) {
    const thumbs = map(queue, req => {
        return {
            type: req.type,
            href: req.href,
            width: Math.round(settings.size * req.ratio),
            height: settings.size
        };
    });

    server.request({
        action: 'get',
        thumbs
    }).then(json => {
        each(queue, (req, idx) => {
            req.callback(json && json.thumbs ? json.thumbs[idx] : null);
        });
    });
}

function handleItems(items) {
    const queue = [];

    each(items, item => {
        queueItem(queue, item);
    });

    if (queue.length) {
        requestQueue(queue);
    }
}

function onViewChanged(added) {
    setTimeout(() => {
        handleItems(added);
    }, settings.delay);
}

function init() {
    if (!settings.enabled) {
        return;
    }

    event.sub('view.changed', onViewChanged);
}


init();
