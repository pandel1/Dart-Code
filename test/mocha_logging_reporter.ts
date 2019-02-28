import { ITest, reporters } from "mocha";
import { LogCategory, LogSeverity } from "../src/debug/utils";
import { log } from "../src/utils/log";
import { wtf } from "./dart_only";
import testRunner = require("vscode/lib/testrunner");
const onExit = require("signal-exit"); // tslint:disable-line:no-var-requires

onExit(() => {
	wtf.dump();
});

export class LoggingReporter extends reporters.Base {
	constructor(runner: any, options: any) {
		super(runner);

		// runner.on("start", () => { });

		runner.on("test", (test: ITest) => {
			log(`Starting test ${test.fullTitle()}...`, LogSeverity.Info, LogCategory.CI);
		});

		runner.on("pending", (test: ITest) => {
			log(`Test ${test.fullTitle()} pending/skipped`, LogSeverity.Info, LogCategory.CI);
		});

		runner.on("pass", (test: ITest) => {
			log(`Test ${test.fullTitle()} passed after ${test.duration}ms`, LogSeverity.Info, LogCategory.CI);
		});

		runner.on("fail", (test: ITest) => {
			log(`Test ${test.fullTitle()} failed after ${test.duration}ms`, LogSeverity.Error, LogCategory.CI);
			const err = (test as any).err;
			if (err) {
				log(err.message, LogSeverity.Error, LogCategory.CI);
				log(err.stack, LogSeverity.Error, LogCategory.CI);
			}
		});

		runner.once("end", () => {
			wtf.dump();
			setTimeout(() => wtf.dump(), 1000);
			setTimeout(() => wtf.dump(), 5000);
			setTimeout(() => wtf.dump(), 30000);
		});
	}
}
