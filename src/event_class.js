export default class EventClass {
	constructor() {
		this.events = {};
	}
	dispatchEvent(event_name, data) {
		var list = this.events[event_name]
		if (!list) return;
		for (var i = 0; i < list.length; i++) {
			if (typeof list[i] === 'function') {
				list[i](data)
			}
		}
	}
	on(event_name, cb) {
		if (!this.events[event_name]) {
			this.events[event_name] = []
		}
		this.events[event_name].safePush(cb)
	}
	removeEventListener(event_name, cb) {
		if (this.events[event_name]) {
			this.events[event_name].remove(cb);
		}
	}
}