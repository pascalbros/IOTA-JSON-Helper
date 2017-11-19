# IOTA JSON Helper

## A IOTA helper library for encrypt and decrypt JSON transactions on the fly

As you know, IOTA is a fee-less transaction system, this means that you can carry some data within the transaction without paying a single Iota.
The aim of this library is to semplify the upload and the fetching from tangle by converting any object to JSON and viceversa.

## Install

```
npm install iota-json-helper
```

## Initialize

```
var IotaHelper = require("iota-json-helper");
var helper = new IotaHelper();
helper.init("<MY_SEED_OR_NULL>"); //Leave it null to generate a random seed
helper.init("<MY_SEED_OR_NULL>", "http://localhost:14625"); //Custom node
```

## Upload

```
helper.uploadToTangle({title: "Hello", description: "world"}, function(error, result) {
	console.log(error);
	console.log(result);
});
```

## Fetch

```
helper.fetchFromTangle("<BUNDLE_OR_NULL>", function(error, result) { //Leaving it null will result in a much slower operation
	console.log(error);
	console.log(result);
});
```