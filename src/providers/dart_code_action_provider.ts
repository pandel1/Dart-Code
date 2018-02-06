"use strict";

import {
	TextDocument, Position, CancellationToken, CodeActionProvider, CodeActionContext,
	TextEdit, Range, Command,
} from "vscode";
import { Analyzer } from "../analysis/analyzer";
import { logError, isAnalyzableAndInWorkspace } from "../utils";
import * as as from "../analysis/analysis_server_types";

export class DartCodeActionProvider implements CodeActionProvider {
	private analyzer: Analyzer;
	constructor(analyzer: Analyzer) {
		this.analyzer = analyzer;
	}

	public provideCodeActions(document: TextDocument, range: Range, context: CodeActionContext, token: CancellationToken): Thenable<Command[]> {
		if (!isAnalyzableAndInWorkspace(document))
			return null;
		return new Promise<Command[]>((resolve, reject) => {
			Promise.all([
				this.analyzer.editGetFixes({
					file: document.fileName,
					offset: document.offsetAt(range.start),
				}),
				this.analyzer.editGetAssists({
					file: document.fileName,
					length: range.end.character - range.start.character,
					offset: document.offsetAt(range.start),
				}),
			]).then((results) => {
				const fixes = results[0] as as.EditGetFixesResponse;
				const assists = results[1] as as.EditGetAssistsResponse;

				const allEdits = new Array<as.SourceChange>().concat(...fixes.fixes.map((fix) => fix.fixes)).concat(...assists.assists);

				resolve(allEdits.map((edit) => this.convertResult(document, edit)));
			}, (e) => { logError(e); reject(); });
		});
	}

	private convertResult(document: TextDocument, change: as.SourceChange): Command {
		return {
			arguments: [document, change],
			command: "_dart.applySourceChange",
			title: change.message,
		};
	}
}