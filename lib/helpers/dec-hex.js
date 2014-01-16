'use strict';

/**
 * @see http://danvk.org/hex2dec.html
 * A function for converting hex <-> dec w/o loss of precision.
 *
 * The problem is that parseInt("0x12345...") isn't precise enough to convert
 * 64-bit integers correctly.
 *
 * Internally, this uses arrays to encode decimal digits starting with the least
 * significant:
 * 8 = [8]
 * 16 = [6, 1]
 * 1024 = [4, 2, 0, 1]
 */

// Adds two arrays for the given base (10 or 16), returning the result.
// This turns out to be the only "primitive" operation we need.
var add = function(x, y, base) {
  var z = [];
  var n = Math.max(x.length, y.length);
  var carry = 0;
  var i = 0;
  while (i < n || carry) {
    var xi = i < x.length ? x[i] : 0;
    var yi = i < y.length ? y[i] : 0;
    var zi = carry + xi + yi;
    z.push(zi % base);
    carry = Math.floor(zi / base);
    i += 1;
  }
  return z;
};

// Returns a*x, where x is an array of decimal digits and a is an ordinary
// JavaScript number. base is the number base of the array x.
var multiplyByNumber = function(num, x, base) {
  if (num < 0) {
    return null;
  }
  if (num === 0) {
    return [];
  }

  var result = [];
  var power = x;
  while (true) {
    if (num & 1) {
      result = add(result, power, base);
    }
    num = num >> 1;
    if (num === 0) {
      break;
    }
    power = add(power, power, base);
  }

  return result;
};

var parseToDigitsArray = function(str, base) {
  var digits = str.split('');
  var ary = [];
  for (var i = digits.length - 1; i >= 0; i -=1) {
    var n = parseInt(digits[i], base);
    if (isNaN(n)) {
      return null;
    }
    ary.push(n);
  }
  return ary;
};

var convertBase = function(str, fromBase, toBase) {
  var digits = parseToDigitsArray(str, fromBase);
  if (digits === null) {
    return null;
  }

  var outArray = [];
  var power = [1];
  for (var i = 0; i < digits.length; i += 1) {
    // invariant: at this point, fromBase^i = power
    if (digits[i]) {
      outArray = add(outArray, multiplyByNumber(digits[i], power, toBase), toBase);
    }
    power = multiplyByNumber(fromBase, power, toBase);
  }

  var out = '';
  for (i = outArray.length - 1; i >= 0; i -= 1) {
    out += outArray[i].toString(toBase);
  }
  return out;
};

module.exports = function(decStr) {
  var hex = convertBase(decStr.toString(), 10, 16);
  return hex ? hex : null;
};