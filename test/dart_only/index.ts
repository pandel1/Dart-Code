export const wtf = require("wtfnode");
import * as test_runner from "../test_runner";

process.on('uncaughtException', function (err) {
	console.log('Caught exception: ' + err);
});

module.exports = test_runner;
