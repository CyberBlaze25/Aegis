class FakeSocket {
  constructor() {
    this.listeners = {};
    this.start();
  }

  on(event, cb) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(cb);
  }

  emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach((cb) => cb(data));
    }
  }

  start() {
    setInterval(() => {
      this.emit("suspicion_score", {
        value: Math.random(),
      });

      this.emit("new_event", {});

      if (Math.random() > 0.7) {
        this.emit("honeypod_activity", {});
      }
    }, 1000);
  }
}

export const socket = new FakeSocket();