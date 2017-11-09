'use strict';

var zlib = require('zlib');
var crypto = require('crypto');
var URLSafeBase64 = require('urlsafe-base64');

exports.encrypt = encrypt;
exports.decrypt = decrypt;
function encrypt(data, password) {
	var saltBytes = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 32;

	// Make JSON
	var jdata = JSON.stringify(data);
	// Compress data w/ GZip
	var gzip = zlib.gzipSync(jdata);
	// Salt - this is to prevent attacking the encryption by passing a known payload.
	var salt = crypto.randomBytes(saltBytes);
	var buffer = Buffer.concat([salt, gzip]);
	// Encrypt - urlCrypt.password has 256 bits of randomness
	var cipher = crypto.createCipher('aes-256-cbc', password);
	buffer = Buffer.concat([cipher.update(buffer), cipher.final()]);
	// Encode as urlSafeBase64
	var ret = URLSafeBase64.encode(buffer);
	return ret;
}

function decrypt(data, password) {
	var saltBytes = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 32;

	// Decode
	var buffer = URLSafeBase64.decode(data);
	// Decrypt
	var decipher = crypto.createDecipher('aes-256-cbc', password);
	buffer = Buffer.concat([decipher.update(buffer), decipher.final()]);
	// Remove and discard salt
	buffer = buffer.slice(saltBytes);
	// Decompress
	buffer = zlib.gunzipSync(buffer);
	// convert to buffer to string
	var str = buffer.toString('utf8');
	// Parse and return
	var ret = JSON.parse(str);
	return ret;
}