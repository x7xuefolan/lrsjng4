
modulejs.define('core/event', ['_'], function (_) {

	var subscriptions = {},

		sub = function (topic, callback) {

			if (_.isString(topic) && _.isFunction(callback)) {

				if (!subscriptions[topic]) {
					subscriptions[topic] = [];
				}
				subscriptions[topic].push(callback);
			}
		},

		unsub = function (topic, callback) {

			if (_.isString(topic) && _.isFunction(callback) && subscriptions[topic]) {

				subscriptions[topic] = _.without(subscriptions[topic], callback);
			}
		},

		pub = function (topic, data) {

			// console.log('EVENT PUB', topic, data);
			if (_.isString(topic) && subscriptions[topic]) {

				_.each(subscriptions[topic], function (callback) {

					callback(data);
				});
			}
		};

	return {
		sub: sub,
		unsub: unsub,
		pub: pub
	};
});
