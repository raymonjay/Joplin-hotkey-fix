import joplin from 'api';
import Utils from './utils';
import { MenuItemLocation, ContentScriptType } from 'api/types';
import { SettingItemSubType, SettingItemType, ToolbarButtonLocation } from 'api/types';

import { hotKeyList } from './hotkeys';
import { registerSettings } from './settings';
import { PluginSettings } from './types';

/**
 * codemirror script setup function
 */
let lastSettings: PluginSettings;

const registerMessageListener = async (contentScriptId: string) => {
	await joplin.contentScripts.onMessage(
		contentScriptId,
		
		// Sending messages with `context.postMessage` from the content script with
		// the given `contentScriptId` calls this onMessage listener:
		async (message: any) => {
			if (message === 'getSettings') {
				return lastSettings;
			}
		},
	);
};

const registerCodeMirrorContentScript = async (contentScriptName: string) => {
	const id = contentScriptName;
	await registerMessageListener(id);
	await joplin.contentScripts.register(
		ContentScriptType.CodeMirrorPlugin,
		id,
		`./contentScript/${id}.js`,
	);
};

async function setupCodeMirror() {
	lastSettings = await registerSettings((settings: PluginSettings) => {
		lastSettings = settings;
		joplin.commands.execute('editor.execCommand', {
			name: 'cm-extended-settings-update',
			args: [ settings ],
		});
	});

	await registerCodeMirrorContentScript('codeMirror6');
	await registerCodeMirrorContentScript('codeMirror5');
}

/**
 * hotkey command setup function
 */
async function setupHotKeyCommand() {
	// Register HotKey Command
	for (const item of hotKeyList) {
		await joplin.commands.register({
			name: item.name + 'Command',
			label: item.label,
			iconName: item.iconName,
			enabledCondition: item.enabledCondition,
			execute: async () => {
				await Utils[item.commandName](...item.args)
			},
		});

		await joplin.views.menuItems.create(item.name + 'MenuItem', item.name + 'Command', item.menuItemLocation, { accelerator: item.accelerator });
	}

	await joplin.commands.register({
		name: 'aboutCommand',
		label: 'AboutHotKey',
		iconName: 'fas fa-drum',
		execute: async () => {
			console.info('about from https://github.com/laurent22/joplin/issues/7943');
		},
	});

	await joplin.views.menuItems.create('aboutMenuItem', 'aboutCommand', MenuItemLocation.Edit);
}

/**
 * status bar panel setup function
 */
async function setupStatueBarPanel() {
		const panels = joplin.views.panels;
		const panel = await joplin.views.panels.create('status_bar_panel');
		await joplin.views.panels.addScript(panel, './asserts/bootstrap.min.css');
		await joplin.views.panels.addScript(panel, './asserts/bootstrap.bundle.min.js');
		await joplin.views.panels.addScript(panel, './asserts/jquery.min.js');

		await joplin.views.panels.addScript(panel, './status_bar_panel.css');
		await joplin.views.panels.addScript(panel, './status_bar_panel.js');
		await joplin.views.panels.setHtml(panel, `<form class="row gy-2 gx-3 align-items-center"><div class="col-auto"><div id="progress"></div></div></form>`);

		panels.show(panel, true);

		panels.onMessage(panel, async (message:any) => {
			let pageNum = 1;
			switch(message) {
				case "get-folders":	
					let folderNum = 0
				    for(;;){
				        const response = await joplin.data.get(['folders'], {page:pageNum});
						folderNum += response.items.length;
						pageNum++;
						if (!response.has_more)	break
				    }
					return folderNum;
				case "get-notes":	
					let noteNum = 0
				    for(;;){
				        const response = await joplin.data.get(['notes'], {page:pageNum});
						noteNum += response.items.length;
						pageNum++;
						if (!response.has_more)	break
				    }
					return noteNum;
			}
		});
}

joplin.plugins.register({
	onStart: async function() {
		await setupHotKeyCommand();

		await setupCodeMirror();

		await setupStatueBarPanel();
	},
});