import * as assert from "assert";
import * as vs from "vscode";
import { VersionStatus } from "../../../src/pub/global";
import { activate, defer, extApi, sb } from "../../helpers";

const alreadyInstalledPackage = "devtools";
const installedButOutOfDatePackage1 = "args";
const installedButOutOfDatePackage1NewVersion = "1.5.1";
const installedButOutOfDatePackage2 = "meta";
const installedButOutOfDatePackage2NewVersion = "1.1.7";
const definitelyNotInstalledPackage = "path";

describe.skip("pub global", () => {
	beforeEach("activate", () => activate(null));

	it("reports not-installed for a package that's not installed", async () => {
		const status = await extApi.pubGlobal.getInstalledStatus(definitelyNotInstalledPackage, definitelyNotInstalledPackage);
		assert.equal(status, VersionStatus.NotInstalled);
	});

	it("reports valid for a package that's installed and up-to-date", async () => {
		const status = await extApi.pubGlobal.getInstalledStatus(alreadyInstalledPackage, alreadyInstalledPackage, "0.0.1");
		assert.equal(status, VersionStatus.Valid);
	});

	it("reports out-of-date for a package installed but old", async () => {
		// DevTools is installed by CI scripts. Probably it'll never reach v999.999.999.
		const status = await extApi.pubGlobal.getInstalledStatus(alreadyInstalledPackage, alreadyInstalledPackage, "999.999.999");
		assert.equal(status, VersionStatus.UpdateRequired);
	});

	it("can install a package that's not installed", async () => {
		const installPrompt = sb.stub(vs.window, "showWarningMessage").resolves(`Activate ${definitelyNotInstalledPackage}`);

		// Prompt to install it, and ensure it's successful.
		const installed = await extApi.pubGlobal.promptToInstallIfRequired(definitelyNotInstalledPackage, definitelyNotInstalledPackage);
		assert.equal(installed, true);
		assert.equal(installPrompt.calledOnce, true);

		// Ensure new status checks includes it.
		defer(() => extApi.pubGlobal.uninstall(definitelyNotInstalledPackage));
		const status = await extApi.pubGlobal.getInstalledStatus(definitelyNotInstalledPackage, definitelyNotInstalledPackage);
		assert.equal(status, VersionStatus.Valid);
	});

	it("can prompt to update an out-of-date package", async () => {
		const installPrompt = sb.stub(vs.window, "showWarningMessage").resolves(`Update ${installedButOutOfDatePackage1}`);

		// Prompt to update it, and ensure it's successful.
		const installed = await extApi.pubGlobal.promptToInstallIfRequired(installedButOutOfDatePackage1, installedButOutOfDatePackage1, "", installedButOutOfDatePackage1NewVersion);
		assert.equal(installed, true);
		assert.equal(installPrompt.calledOnce, true);

		// Ensure new status checks includes it.
		const status = await extApi.pubGlobal.getInstalledStatus(installedButOutOfDatePackage1, installedButOutOfDatePackage1);
		assert.equal(status, VersionStatus.Valid);
	});

	it("can auto-update an out-of-date package", async () => {
		const installPrompt = sb.stub(vs.window, "showWarningMessage");

		// Ensure we're not prompted but it's updated.
		const installed = await extApi.pubGlobal.promptToInstallIfRequired(installedButOutOfDatePackage2, installedButOutOfDatePackage2, "", installedButOutOfDatePackage2NewVersion, true);
		assert.equal(installed, true);
		assert.equal(installPrompt.called, false);

		// Ensure new status checks includes it.
		const status = await extApi.pubGlobal.getInstalledStatus(installedButOutOfDatePackage2, installedButOutOfDatePackage2);
		assert.equal(status, VersionStatus.Valid);
	});

	it("does not prompt to install a package that's already installed", async () => {
		const installPrompt = sb.stub(vs.window, "showWarningMessage");

		const installed = await extApi.pubGlobal.promptToInstallIfRequired(alreadyInstalledPackage, alreadyInstalledPackage);
		assert.equal(installed, true);
		assert.equal(installPrompt.calledOnce, false);
	});
});
