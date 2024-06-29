import { PluginSettings } from "../types";

export default (context: { contentScriptId: string, postMessage: any }) => {
	return {
		plugin: async (codeMirror: any) => {
			// Exit if not a CodeMirror 5 editor.
			if (codeMirror.cm6) {
				return;
			}

			codeMirror.defineOption('enable-extension', true, async function(cm) {

			    const updateSettings = (settings: PluginSettings) => {
				    cm.setOption('styleActiveLine', settings.highlightActiveLine);
				    cm.setOption('lineNumbers', settings.lineNumbers);
                }

			    codeMirror.registerCommand('cm-extended-settings-update', (settings: PluginSettings) => {
			    	updateSettings(settings);
			    });

			    const settings: PluginSettings = await context.postMessage('getSettings');
			    updateSettings(settings);
			});
		},

		// Sets CodeMirror 5 default options. Has no efffect in CodeMirror 6.
		codeMirrorOptions: { 'enable-extension': true },

		// See https://codemirror.net/5/doc/manual.html#addon_active-line
		codeMirrorResources: [ 'addon/selection/active-line.js' ],

		assets: () => {
			return [ { name: './style.css' } ];
		},
	};
};