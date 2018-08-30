
define(function () {
  class Collection {
    constructor (list) {
      this.list = [];
      this.map = new Map();
      this.deleted = 0;
      list && list.forEach(v => this.push(v));
    }

    skip (...items) {
      return new Collection(this.list.filter(v => items.indexOf(v) === -1));
    }

    covers (...items) {
      return items.every(v => this.list.indexOf(v) > -1);
    }

    contains (...items) {
      return items.some(v => this.list.indexOf(v) > -1);
    }

    find (callback) {
      return this.list.find(callback);
    }

    each (callback) {
      this.list.forEach(callback);
      return this;
    }

    map (callback) {
      return this.list.map(callback);
    }

    push (...items) {
      items.forEach(item => {
        this.list.push(item);
        this.map.set(this.list.indexOf(item) + this.deleted, item);
      });
      return this;
    }

    add (key, item) {
      this.list.push(item);
      this.map.set(key, item);
      return this;
    }

    discard (...values) {
      values.forEach(v => this.delete(this.keyof(v)));
      return this;
    }

    delete (key) {
      if (!this.map.has(key)) { return this; }
      const item = this.map.get(key);
      const index = this.list.indexOf(item);
      this.list.splice(index, 1);
      this.map.delete(key);
      ++this.deleted;
      return this;
    }

    merge (key, item) {
      Object.assign(this.map.get(key), item);
      return this;
    }

    set (key, item) {
      this.delete(key);
      this.add(key, item);
      return this;
    }

    get (key) {
      return this.map.get(key);
    }

    keyof (value) {
      return [...this.map.keys()].find(key => this.map.get(key) === value);
    }

    clear () {
      this.list.splice(0);
      this.map.clear();
      return this;
    }

    toString () {
      return JSON.stringify(this.list);
    }

    toJSON () {
      return this.list;
    }

    get length () {
      return this.list.length;
    }

    get last () {
      return this.list[this.list.length - 1];
    }

    get first () {
      return this.list[0];
    }
  }

  return Collection;
});