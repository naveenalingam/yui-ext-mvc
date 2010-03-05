/*
	Copyright (c) 2009, Yahoo! Inc. All rights reserved.
	Code licensed under the BSD License:
	http://developer.yahoo.net/yui/license.txt
	version: 3.0.0
	build: 1549
*/

YUI.add('gallery-number', function(Y) {

/**
 * Supplies number manipulation utilities and exposes the more powerful Math
 * methods directly on the Y.Number namespace.
 * This adds additional functionality to what is provided in yui-base, and the
 * methods are applied directly to the YUI instance. This module
 * is useful for sites that manipulate many numbers.
 * @module gallery-number
 */

var L = Y.Lang,
	_isNumber = L.isNumber,
	nan = Number.NaN,
	_knownPrimes = [3, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97, 101, 103, 107, 109, 113, 127, 131, 137, 139, 149, 151, 157, 163, 167, 173, 179, 181, 191, 193, 197, 199];

/**
 * The following methods are added to the YUI instance
 * @class YUI~number
 */

Y.Number = {

	/**
	 * Convert radians to degrees.
	 * @method degrees
	 * @param radian {Number} Required. The number to convert.
	 * @return {Number} The degrees.
	 * @public
	 */
	degrees: function(radian) {
		return _isNumber(radian) ? radian * 180 / Math.PI : nan;
	},

	/**
	 * Formats the number according to the 'format' string; adherses to the american number standard where a comma is inserted after every  digits.
	 * Note: there should be only 1 contiguous number in the format, where a number consists of digits, period, and commas
	 * any other characters can be wrapped around this number, including '$', '%', or text
	 * examples (123456.789):
	 * '0' - (123456) show only digits, no precision
	 * '0.00' - (123456.78) show only digits, 2 precision
	 * '0.0000' - (123456.7890) show only digits, 4 precision
	 * '0,000' - (123,456) show comma and digits, no precision
	 * '0,000.00' - (123,456.78) show comma and digits, 2 precision
	 * '0,0.00' - (123,456.78) shortcut method, show comma and digits, 2 precision
	 * Note: Fails on formats with multiple periods.
	 * @method format
	 * @param n {Number} Required. A number to convert.
	 * @param format {String} Required. The way you would like to format this text.
	 * @return {String} The formatted number.
	 * @public
	 */
	format: function(n, format) {
		if (! _isNumber(n)) {return '';}
		if (! L.isString(format)) {format = '0,0.00';} // default format

		var hasComma = -1 < format.indexOf(','),
			psplit = format.replace(/[^0-9\u2013\-\.]/g, '').split('.');

		// compute precision
		if (1 < psplit.length) {
			// fix number precision
			n = n.toFixed(psplit[1].length);
		}
		// error: too many periods
		else if (2 < psplit.length) {
			throw('NumberFormatException: invalid format, formats should have no more than 1 period: ' + format);
		}
		// remove precision
		else {
			n = n.toFixed(0);
		}

		// get the string now that precision is correct
		var fnum = n.toString();

		// format has comma, then compute commas
		if (hasComma) {
			// remove precision for computation
			psplit = fnum.split('.');

			var cnum = psplit[0],
			parr = [],
			j = cnum.length,
			x = Math.floor(j / 3),
			y = (cnum.length % 3) || 3; // y cannot be ZERO or causes infinite loop

			// break the number into chunks of 3 digits; first chunk may be less than 3
			for (var i = 0; i < j; i += y) {
				if (0 !== i) {y = 3;}
				parr[parr.length] = cnum.substr(i, y);
				x -= 1;
			}

			// put chunks back together, separated by comma
			fnum = parr.join(',');

			// add the precision back in
			if (psplit[1]) {fnum += '.' + psplit[1];}
		}

		// replace the number portion of the format with fnum
		return format.replace(/[\d,\.]+/, fnum);
	},

	/**
	 * Determines the number of significant figures in Number; Will return Not a Number (NaN).
	 * @method getPrecision
	 * @param n {Number} Required. A number to convert.
	 * @return {Number} The number of significant figures.
	 * @public
	 */
	getPrecision: function(n) {
		if (! _isNumber(n)) {return nan;}
		var sb = ('' + Math.abs(n)).split('.');
		return 1 === sb.length ? 0 : sb[1].length;
	},

	/**
	 * Determines if the number value is between two other values.
	 * @method isBetween
	 * @param n {Number} Required. A number to evaluate.
	 * @param i {Number} Required. The lower bound of the range.
	 * @param j {Number} Required. The upper bound of the range.
	 * @param inclusive {Boolean} Optional. True if i and j are to be included in the range.
	 * @return {Boolean} True if i < n < j or j > n > i.
	 * @public
	 */
	isBetween: function(n, i, j, inclusive) {
		if (! (_isNumber(n) && _isNumber(i) && _isNumber(j))) {return false;}
		return inclusive ? ((i <= n && j >= n) || (j <= n && i >= n)) :
			((i < n && j > n) || (j < n && i > n));
	},

	/**
	 * Determines if the number value is not between two other values.
	 * @method isNotBetween
	 * @param n {Number} Required. A number to evaluate.
	 * @param i {Number} Required. The lower bound of the range.
	 * @param j {Number} Required. The upper bound of the range.
	 * @param inclusive {Boolean} Optional. True if i and j are to be included in the range.
	 * @return {Boolean} True if i > n || val > j.
	 * @public
	 */
	isNotBetween: function(n, i, j, inclusive) {
		return (_isNumber(n) && _isNumber(i) && _isNumber(j)) && ! Y.Number.isBetween(n, i, j, inclusive);
	},

	/**
	 * Evaluate if a number is a prime.
	 * @methid isPrime
	 * @param n {Number} Required. A number to evaluate.
	 * @return {Boolean} Is a prime.
	 * @public
	 */
	isPrime: function(n) {
		if (_isNumber(n)) {
			if (2 === n || 5 === n) {return true;} // two-special primes

			// is even
			if (n % 2) {
				var val, prime, sqrt, i, j;

				// less than 200, check known primes
				if (200 > n) {
					return -1 < Y.Array.indexOf(_knownPrimes, n);
				}

				// more than 200, divide by known primes
				sqrt = Math.sqrt(n);

				for (i=0, j=_knownPrimes.length; i < j; i += 1) {
					prime = _knownPrimes[i];
					val = n / prime;

					if (val === Math.round(val)) {
						return false;
					}

					// when greater than the sqrt, go ahead and stop
					if (prime > sqrt) {return true;}
				}

				return true;
			}
		}

		return false;
	},

	/**
	 * Convert degrees to radians.
	 * @method radians
	 * @param degrees {Number} Required. The number to convert.
	 * @return {Number} The radians.
	 * @public
	 */
	radians: function(degrees) {
		return _isNumber(degrees) ? degrees * Math.PI / 180 : nan;
	},

	/**
	 * Computes a random integer from 'm'; if parameter n is passed, then computes a number in the range between 'm' and 'n'.
	 * @method random
	 * @param m {Number} Required. The maximum integer.
	 * @param n {Number} Optional. The minimum integer.
	 * @return {Number} A random integer.
	 * @public
	 */
	random: function(m, n) {
		if (! _isNumber(m)) {return nan;}
		if (n === m) {return n;}
		if (! n) {n = 0;}
		var max = (n < m) ? m : n,
		min = n === max ? m : n;

		return min + Math.floor(Math.random() * (max - min) + 1);
	},

	/**
	 * Rounds to the next whole number at a given precision.
	 * @method roundToPrecision
	 * @param n {Number} Required. A number to convert.
	 * @param prec {Number} Optional. The precision to round to: 1, 10, 100, etc...; default is 10, which rounds to the nearest tenth.
	 * @return {Number} The converted number.
	 * @public
	 */
	roundToPrecision: function(n, prec) {
		if (! _isNumber(n)) {return nan;}
		if (1 > n) {return 1;}
		var pstr = ('' + prec),
		precision = _isNumber(prec) ? (Math.pow(10, pstr.length) / 10) : 10;
		return Math.ceil(n / precision) * precision;
	}
};

}, '3.0.0' );