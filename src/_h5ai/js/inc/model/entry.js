
modulejs.define('model/entry', ['_', 'core/types', 'core/ajax'], function (_, types, ajax) {

	var doc = document,
		domain = doc.domain,
		forceEncode = function (href) {

			return href
					.replace(/'/g, '%27')
					.replace(/\[/g, '%5B')
					.replace(/\]/g, '%5D')
					.replace(/\(/g, '%28')
					.replace(/\)/g, '%29')
					.replace(/\+/g, '%2B')
					.replace(/\=/g, '%3D');
		},
		location = (function () {

			var testpathname = '/a b',
				a = doc.createElement('a'),
				isDecoded, location;

			a.href = testpathname;
			isDecoded = a.href.replace(/.*:\/\/[^\/]*/, '') === testpathname;

			a.href = '.';
			location = a.href.replace(/.*:\/\/[^\/]*/, '').replace(/[^\/]*$/, '');

			if (isDecoded) {
				location = encodeURIComponent(location).replace(/%2F/ig, '/');
			}

			if (!location) {
				location = doc.location.href.replace(/.*:\/\/[^\/]*/, '').replace(/[^\/]*$/, '');
			}

			return forceEncode(location);
		}()),


		// utils

		reEndsWithSlash = /\/$/,


		createLabel = function (sequence) {

			if (sequence.length > 1 && reEndsWithSlash.test(sequence)) {
				sequence = sequence.slice(0, -1);
			}
			try {
				sequence = decodeURIComponent(sequence);
			} catch (err) {}
			return sequence;
		},


		reSplitPath = /^\/([^\/]+\/?)$/,
		reSplitPath2 = /^(\/(?:.*\/)*?([^\/]+)\/)([^\/]+\/?)$/,

		splitPath = function (sequence) {

			var match;

			sequence = sequence.replace(/\/+/g, '/');
			if (sequence === '/') {
				return { parent: null, name: '/' };
			}
			match = reSplitPath2.exec(sequence);
			if (match) {
				return { parent: match[1], name: match[3] };
			}
			match = reSplitPath.exec(sequence);
			if (match) {
				return { parent: '/', name: match[1] };
			}
		},


		ajaxRequest = function (self, parser, callback) {

			ajax.getStatus(self.absHref, parser, function (response) {

				self.status = response.status;
				if (parser && response.status === 'h5ai') {
					parser.parse(self.absHref, response.content);
				}
				callback(self);
			});
		},




		// Entry

		cache = {},

		Entry = function (absHref) {

			absHref = forceEncode(absHref);

			var split = splitPath(absHref);

			cache[absHref] = this;

			this.absHref = absHref;
			this.type = types.getType(absHref);
			this.label = createLabel(absHref === '/' ? domain : split.name);
			this.time = null;
			this.size = null;
			this.parent = null;
			this.status = null;
			this.content = {};

			if (split.parent) {
				this.parent = cache[split.parent] || new Entry(split.parent);
				this.parent.content[this.absHref] = this;
				if (_.keys(this.parent.content).length > 1) {
					this.parent.isContentFetched = true;
				}
			}
		},

		get = function (absHref, time, size, status, isContentFetched) {

			absHref = forceEncode(absHref || location);

			var self = cache[absHref] || new Entry(absHref);

			if (_.isNumber(time)) {
				self.time = time;
			}
			if (_.isNumber(size)) {
				self.size = size;
			}
			if (status) {
				self.status = status;
			}
			if (isContentFetched) {
				self.isContentFetched = true;
			}

			return self;
		},

		folderstatus = (function () {

			try {
				return modulejs.require('ext/folderstatus');
			} catch (e) {}

			return {};
		}()),

		fetchStatus = function (absHref, callback) {

			var self = cache[absHref] || new Entry(absHref);

			if (self.status || !self.isFolder()) {
				callback(self);
			} else if (folderstatus[absHref]) {
				self.status = folderstatus[absHref];
				callback(self);
			} else {
				ajaxRequest(self, null, callback);
			}
		},

		fetchContent = function (absHref, parser, callback) {

			var self = cache[absHref] || new Entry(absHref);

			if (self.isContentFetched) {
				callback(self);
			} else {
				fetchStatus(absHref, function (self) {

					self.isContentFetched = true;
					if (self.status === 'h5ai') {
						ajaxRequest(self, parser, callback);
					} else {
						callback(self);
					}
				});
			}
		};


	_.extend(Entry.prototype, {

		isFolder: function () {

			return reEndsWithSlash.test(this.absHref);
		},

		isCurrentFolder: function () {

			return this.absHref === location;
		},

		isDomain: function () {

			return this.absHref === '/';
		},

		isEmpty: function () {

			return _.keys(this.content).length === 0;
		},

		fetchStatus: function (callback) {

			return fetchStatus(this.absHref, callback);
		},

		fetchContent: function (parser, callback) {

			return fetchContent(this.absHref, parser, callback);
		},

		getCrumb: function () {

			var entry = this,
				crumb = [entry];

			while (entry.parent) {
				entry = entry.parent;
				crumb.unshift(entry);
			}

			return crumb;
		},

		getSubfolders: function () {

			return _.sortBy(_.filter(this.content, function (entry) {

				return entry.isFolder();
			}), function (entry) {

				return entry.label.toLowerCase();
			});
		},

		getStats: function () {

			var folders = 0,
				files = 0;

			_.each(this.content, function (entry) {

				if (entry.isFolder()) {
					folders += 1;
				} else {
					files += 1;
				}
			});

			var depth = 0,
				entry = this;

			while (entry.parent) {
				depth += 1;
				entry = entry.parent;
			}

			return {
				folders: folders,
				files: files,
				depth: depth
			};
		}
	});

	return {
		get: get
	};
});
