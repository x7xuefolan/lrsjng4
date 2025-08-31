
modulejs.define('ext/l10n', ['_', '$', 'core/settings', 'core/langs', 'core/format', 'core/store', 'core/event', 'core/server'], function (_, $, allsettings, langs, format, store, event, server) {

	var settings = _.extend({
			enabled: false,
			lang: 'en',
			useBrowserLang: true
		}, allsettings.l10n),

		defaultTranslations = {
			isoCode: 'en',
			lang: 'english',
			details: 'details',
			list: 'list',
			grid: 'grid',
			icons: 'icons',
			name: 'Name',
			lastModified: 'Last modified',
			size: 'Size',
			parentDirectory: 'Parent Directory',
			empty: 'empty',
			folders: 'folders',
			files: 'files',
			download: 'download',
			noMatch: 'no match',
			dateFormat: 'YYYY-MM-DD HH:mm',
			filter: 'filter',
			'delete': 'delete'
		},

		blockTemplate = '<div class="block"><div class="select"><select id="langs"/></div></div>',
		optionTemplate = '<option/>',

		storekey = 'ext/l10n',

		loaded = {
			en: _.extend({}, defaultTranslations)
		},
		currentLang = loaded.en,

		update = function (lang) {

			if (lang) {
				currentLang = lang;
			}

			$('#langs option')
				.removeAttr('selected').removeProp('selected')
				.filter('.' + currentLang.isoCode)
				.attr('selected', 'selected').prop('selected', 'selected');

			$.each(currentLang, function (key, value) {
				$('.l10n-' + key).text(value);
			});
			format.setDefaultDateFormat(currentLang.dateFormat);

			$('#items .item .date').each(function () {

				var $this = $(this);

				$this.text(format.formatDate($this.data('time')));
			});

			$('#filter input').attr('placeholder', currentLang.filter);
		},

		loadLanguage = function (isoCode, callback) {

			if (loaded[isoCode]) {

				callback(loaded[isoCode]);
			} else {

				server.request({action: 'get', l10n: true, l10nCodes: isoCode}, function (response) {

					var json = response.l10n && response.l10n[isoCode] ? response.l10n[isoCode] : {};
					loaded[isoCode] = _.extend({}, defaultTranslations, json, {isoCode: isoCode});
					callback(loaded[isoCode]);
				});
			}
		},

		localize = function (langs, isoCode, useBrowserLang) {

			var storedIsoCode = store.get(storekey);

			if (langs[storedIsoCode]) {
				isoCode = storedIsoCode;
			} else if (useBrowserLang) {
				var browserLang = navigator.language || navigator.browserLanguage;
				if (browserLang) {
					if (langs[browserLang]) {
						isoCode = browserLang;
					} else if (browserLang.length > 2 && langs[browserLang.substr(0, 2)]) {
						isoCode = browserLang.substr(0, 2);
					}
				}
			}

			if (!langs[isoCode]) {
				isoCode = 'en';
			}

			loadLanguage(isoCode, update);
		},

		initLangSelector = function (langs) {

			var isoCodes = _.keys(langs).sort(),
				$block = $(blockTemplate),
				$select = $block.find('select')
					.on('change', function (event) {
						var isoCode = event.target.value;
						store.put(storekey, isoCode);
						localize(langs, isoCode, false);
					});

			$.each(isoCodes, function (idx, isoCode) {
				$(optionTemplate)
					.attr('value', isoCode)
					.addClass(isoCode)
					.text(isoCode + ' - ' + (_.isString(langs[isoCode]) ? langs[isoCode] : langs[isoCode].lang))
					.appendTo($select);
			});

			$block.appendTo('#settings');
		},

		init = function () {

			if (settings.enabled) {
				initLangSelector(langs);
			}

			event.sub('location.changed', function () {

				localize(langs, settings.lang, settings.useBrowserLang);
			});
		};

	init();
});
