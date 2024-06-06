
modulejs.define('ext/preview-txt', ['_', '$', 'core/settings', 'core/store', 'core/event', 'ext/preview'], function (_, $, allsettings, store, event, preview) {

	var settings = _.extend({
			enabled: false,
			types: {
				authors: 'plain',
				copying: 'plain',
				c: 'c',
				cpp: 'cpp',
				css: 'css',
				h: 'c',
				hpp: 'cpp',
				install: 'plain',
				log: 'plain',
				java: 'java',
				makefile: 'xml',
				markdown: 'plain',
				// php: 'php',
				python: 'python',
				readme: 'plain',
				rb: 'ruby',
				rtf: 'plain',
				script: 'shell',
				text: 'plain',
				js: 'js',
				xml: 'xml'
			}
		}, allsettings['preview-txt']),

		templateText = '<pre id="pv-txt-text" class="highlighted"/>',
		templateMarkdown = '<div id="pv-txt-text" class="markdown"/>',

		// adapted from SyntaxHighlighter
		getHighlightedLines = function (sh, alias, content) {

			var brushes = sh.vars.discoveredBrushes,
				Brush, brush;

			if (!brushes) {
				brushes = {};

				_.each(sh.brushes, function (info, brush) {

					var aliases = info.aliases;

					if (aliases) {
						info.brushName = brush.toLowerCase();

						for (var i = 0; i < aliases.length; i += 1) {
							brushes[aliases[i]] = brush;
						}
					}
				});

				sh.vars.discoveredBrushes = brushes;
			}

			Brush = sh.brushes[brushes[alias || 'plain']];

			if (!Brush) {
				return $();
			}

			brush = new Brush();
			brush.init({toolbar: false, gutter: false});

			return $(brush.getHtml(content)).find('.line');
		},

		loadScript = function (url, globalId, callback) {

			if (window[globalId]) {
				callback(window[globalId]);
			} else {
				$.ajax({
					url: url,
					dataType: 'script',
					complete: function () {

						callback(window[globalId]);
					}
				});
			}
		},
		loadSyntaxhighlighter = function (callback) {

			loadScript(allsettings.h5aiAbsHref + 'client/js/syntaxhighlighter.js', 'SyntaxHighlighter', callback);
		},
		loadMarkdown = function (callback) {

			loadScript(allsettings.h5aiAbsHref + 'client/js/markdown.js', 'markdown', callback);
		},

		adjustSize = function () {

			var $window = $(window),
				$container = $('#pv-txt-content'),
				$spinner = $('#pv-txt-spinner'),
				$spinnerimg = $spinner.find('img').width(100).height(100),
				margin = 20,
				barheight = 31;

			$container.css({
				height: $window.height() - 2 * margin - barheight - 32,
				top: margin
			});

			$spinner.css({
				width: $window.width() - 2 * margin,
				height: $window.height() - 2 * margin - barheight,
				left: margin,
				top: margin
			});

			$spinnerimg.css({
				margin: '' + (($spinner.height() - $spinnerimg.height()) / 2) + 'px ' + (($spinner.width() - $spinnerimg.height()) / 2) + 'px'
			});
		},

		preloadText = function (absHref, callback) {

			$.ajax({
				url: absHref,
				dataType: 'text',
				success: function (content) {

					callback(content);
					// setTimeout(function () { callback(content); }, 1000); // for testing
				},
				error: function (jqXHR, textStatus, errorThrown) {

					callback('[ajax error] ' + textStatus);
				}
			});
		},

		onEnter = function (items, idx) {

			var currentItems = items,
				currentIdx = idx,
				currentItem = items[idx],

				onIdxChange = function (rel) {

					currentIdx = (currentIdx + rel + currentItems.length) % currentItems.length;
					currentItem = currentItems[currentIdx];

					var spinnerTimeout = setTimeout(function () { preview.showSpinner(true); }, 200);

					preloadText(currentItem.absHref, function (textContent) {

						clearTimeout(spinnerTimeout);
						preview.showSpinner(false);

						$('#pv-content').fadeOut(100, function () {

							var $text;

							if (currentItem.type === 'markdown') {
								$text = $(templateMarkdown).text(textContent);
								$text.replaceWith($text);

								loadMarkdown(function (md) {

									if (md) {
										$text.html(md.toHTML(textContent));
									}
								});
							} else {
								$text = $(templateText).text(textContent);
								$text.replaceWith($text);

								loadSyntaxhighlighter(function (sh) {

									if (sh) {
										var $table = $('<table/>');

										getHighlightedLines(sh, settings.types[currentItem.type], textContent).each(function (i) {
											$('<tr/>')
												.append($('<td/>').addClass('nr').append(i + 1))
												.append($('<td/>').addClass('line').append(this))
												.appendTo($table);
										});

										$text.empty().append($table);
									}
								});
							}

							$('#pv-content').empty().append($text).fadeIn(200);

							preview.setIndex(currentIdx + 1, currentItems.length);
							preview.setLabels([
								currentItem.label,
								'' + currentItem.size + ' bytes'
							]);
							preview.setRawLink(currentItem.absHref);
						});
					});
				};

			onIdxChange(0);
			preview.setOnIndexChange(onIdxChange);
			preview.enter();
		},

		initItem = function (item) {

			if (item.$view && _.indexOf(_.keys(settings.types), item.type) >= 0) {
				item.$view.find('a').on('click', function (event) {

					event.preventDefault();

					var matchedEntries = _.compact(_.map($('#items .item'), function (item) {

						item = $(item).data('item');
						return _.indexOf(_.keys(settings.types), item.type) >= 0 ? item : null;
					}));

					onEnter(matchedEntries, _.indexOf(matchedEntries, item));
				});
			}
		},

		onLocationChanged = function (item) {

			_.each(item.content, initItem);
		},

		onLocationRefreshed = function (item, added, removed) {

			_.each(added, initItem);
		},

		init = function () {

			if (!settings.enabled) {
				return;
			}

			event.sub('location.changed', onLocationChanged);
			event.sub('location.refreshed', onLocationRefreshed);
		};

	init();
});
