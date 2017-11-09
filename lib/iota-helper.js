var IOTA = require('iota.lib.js');
var curl = require('curl.lib.js');
var localAttachToTangle = require('./localAttatchToTangle');
var crypt = require('./crypt');
var encrypt = crypt.encrypt;
var decrypt = crypt.decrypt;

const MAX_TRYTES = 2187;

var IotaHelper = function() {

	this.init = function(seed, attachToTangle = false) {
		this.iota = new IOTA({provider: 'https://node.tangle.works:443'});
		this.seed = seed != null ? seed : this.createSeed();
		if (attachToTangle) {
			this.iota.api.attachToTangle = localAttachToTangle.default(this.iota, curl);
			curl.init();
		}
	}

	this.createSeed = function() {
		var text = '';
		const alphabet = '9ABCDEFGHIJKLMNOPQRSTUVWXYZ';

		for (var i = 0; i < 81; i++) {
			text += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
		}
		return text;
	}

	this.uploadToTangle = function(data, completion) {
		var _this = this;
		function _sendTransaction(tx) {
			var to = _this.sendTransactions(tx, function(error, result) {
				if (error) { completion(error, null); return; }
				if (result.length == 0) { completion("Invalid result", null); return; }
				completion(null, {
					bundle: result[0].bundle,
					seed: _this.seed
				});
			});
		}
		this.generateAddress(function(error, address) {
			if (error) { completion(error, null); return; }
			var tx = _this.createTransactions(data, address);
			_sendTransaction(tx);
		});
	}

	this.fetchFromTangle = function(bundle, completion) {
		var _this = this;

		function fetch(theBundle) {
			var transactions = _this.getTransactions(theBundle, function(error, result) {
				if(error) { completion(error, null); return; }

				var txs = result.sort(function (a, b) { return a.currentIndex - b.currentIndex; });
				var trytes = txs.map(function (tx) { return tx.signatureMessageFragment; });
				var data = _this.trytesToBase64(trytes);
				completion(null, decrypt(data, _this.seed));
			});
		}

		if (bundle != null) {
			fetch(bundle);
		}else{
			this.iota.api.getAccountData(this.seed, function(error, result) {
				var theBundle = result.transfers[result.transfers.length - 1][0].bundle;
				if(error) { completion(error, null); return; }
				if(theBundle == null) { completion("Invalid bundle", null); return; }
				fetch(theBundle);
			});
		}
	}

	this.generateAddress = function(completion) {
		this.iota.api.getNewAddress(this.seed, {}, completion);
	}

	this.sendTransactions = function(txs, completion) {
		this.iota.api.sendTransfer(this.seed, 4, 14, txs, {}, completion);
	}

	this.toTrytes = function(data) {
		return this.iota.utils.toTrytes(data);
	}

	this.trytesToBase64 = function(tryteChunks) {
		var regExp = new RegExp('9+$');
		tryteChunks[tryteChunks.length - 1] = tryteChunks[tryteChunks.length - 1].replace(regExp, '');
		return this.iota.utils.fromTrytes(tryteChunks.join(''));
	}

	this.makeChunks = function(trytes) {
		return trytes.match(new RegExp(`.{1,${MAX_TRYTES}}`, 'g'));
	}

	this.createTransactions = function(data, address) {
		var encrypedData = encrypt({ data }, this.seed);

		var trytes = this.toTrytes(encrypedData);
		if (!trytes) {
			throw new Error('Could not make trytes :S');
		}

		var chunks = this.makeChunks(trytes);
		if (!chunks) {
			throw new Error('Could not make chunks :S');
		}

		return chunks.map(chunk => {
			return {
				'address': address,
				'value': 0,
				'message': chunk,
				'tag': 'CUSTOMDATA'
			};
		});
	}

	this.getTransactions = function(bundle, completion) {
		this.iota.api.findTransactionObjects({ bundles: [bundle] }, completion);
	}
}

module.exports = IotaHelper;