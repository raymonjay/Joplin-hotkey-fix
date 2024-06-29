import { ContentScriptContext } from "api/types";
import { PluginSettings } from "../types";
import { codeFolding, foldGutter } from '@codemirror/language';
import { Compartment } from "@codemirror/state";
import { EditorView, gutter, highlightActiveLine, highlightActiveLineGutter, highlightTrailingWhitespace, highlightWhitespace, lineNumbers } from "@codemirror/view";


export default (context: { contentScriptId: string, postMessage: any }) => {
	return {
		plugin: async (codeMirror: any) => {
			if (!codeMirror.cm6) return;

			const extensionCompartment = new Compartment();
			codeMirror.addExtension([
				extensionCompartment.of([]),
			]);

			const updateSettings = (settings: PluginSettings) => {
				const extensions = [
					settings.lineNumbers ? [ lineNumbers(), highlightActiveLineGutter(), gutter({}) ] : [],
					settings.codeFolding ? [ codeFolding(), foldGutter(), gutter({}) ] : [],
					codeMirror.joplinExtensions.enableLanguageDataAutocomplete.of(settings.enableAutocomplete),
					settings.highlightActiveLine ? [
						highlightActiveLine(),

						EditorView.baseTheme({
							'&light .cm-line.cm-activeLine': {
								backgroundColor: 'rgba(100, 100, 140, 0.1)',
							},
							'&dark .cm-line.cm-activeLine': {
								backgroundColor: 'rgba(200, 200, 240, 0.1)',
							},
						}),
					] : [],
					settings.highlightActiveLineGutter ? highlightActiveLineGutter() : [],
					settings.highlightSpaces ? highlightWhitespace() : [],
					settings.highlightTrailingSpaces ? highlightTrailingWhitespace() : [],
				];
				(codeMirror.editor as EditorView).dispatch({
					effects: [
						extensionCompartment.reconfigure(extensions),
					],
				});
			}

			codeMirror.registerCommand('cm-extended-settings-update', (settings: PluginSettings) => {
				updateSettings(settings);
			});

			const settings: PluginSettings = await context.postMessage('getSettings');
			updateSettings(settings);
			(window as any).ec = codeMirror;
		},
		assets: () => {
			return [ { name: './style.css' } ];
		},
	};
};