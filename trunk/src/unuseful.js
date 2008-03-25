/**
 * Hash class (prototype).
 * @name Hash
 * @class
 */
Hash.addMethods(
/** @scope Hash.prototype */
{
  isset: function(key) {
    return this.keys().member(key);
  }
});

/**
 * Array class (prototype). Contains extension for arrays of objects.
 * @name Array
 * @class
 */
Object.extend(Array.prototype,
/** @scope  Array.prototype */
{
  /** Gets index of first element in array by its property value */
  indexOfBy: function(key, prop) {
    prop = prop || 'id';
    for(var i = 0; i < this.length; i++) {
      if (Object.isHash(this[i])) {
        var value = this[i].get(prop);
      } else {
        var value = this[i][prop];
      }
      if (value == key) {
        return i;
      }
    }
    return -1;
  },
  /** Gets object from array by it's property value */
  get: function(key, prop) {
    prop = prop || 'id';
    return this.find(function(cur) {
      if (Object.isHash(cur)) {
        var value = cur.get(prop);
      } else {
        var value = cur[prop];
      }
      if (value == key) { return cur; }
      return false;
    });
  },
  /** Replaces array item by it's key */
  set: function(key, value, prop) {
    prop = prop || 'id';    
    i = this.indexOfBy(key, prop);
    if (i == -1) {
      this.push(value);
    } else {
      this[i] = value;
    }
  },
  /** Checks array item existance */
  isset: function(key, prop) {
    return this.indexOfBy(key,prop) != -1;
  },
  /** Removes item from array by key */
  unset: function(key, prop) {
    i = this.indexOfBy(key, prop);
    if (i != -1) {
        delete this[i];
    }
  }
});
