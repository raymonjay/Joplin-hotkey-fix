import joplin from 'api';
import Utils from './utils';
import { MenuItemLocation, ContentScriptType } from 'api/types';
import { SettingItemSubType, SettingItemType, ToolbarButtonLocation } from 'api/types';

import { registerSettings } from './settings';
import { PluginSettings } from './types';

const hotKeyList = [
	{
		name: "TitleH1",
		label: "H1",
		iconName: "fas fa-music",
		enabledCondition: "noteIsMarkdown",
		menuItemLocation: MenuItemLocation.Edit,
		accelerator:"CmdOrCtrl+1",
		commandName: "supplyHeadText",
		args: [ "#" ]
	},
	{
		name: "TitleH2",
		label: "H2",
		iconName: "fas fa-music",
		enabledCondition: "noteIsMarkdown",
		menuItemLocation: MenuItemLocation.Edit,
		accelerator:"CmdOrCtrl+2",
		commandName: "supplyHeadText",
		args: [ "##" ]
	},
	{
		name: "TitleH3",
		label: "H3",
		iconName: "fas fa-music",
		enabledCondition: "noteIsMarkdown",
		menuItemLocation: MenuItemLocation.Edit,
		accelerator:"CmdOrCtrl+3",
		commandName: "supplyHeadText",
		args: [ "###" ]
	},
	{
		name: "TitleH4",
		label: "H4",
		iconName: "fas fa-music",
		enabledCondition: "noteIsMarkdown",
		menuItemLocation: MenuItemLocation.Edit,
		accelerator:"CmdOrCtrl+4",
		commandName: "supplyHeadText",
		args: [ "####" ]
	},
	{
		name: "TitleH5",
		label: "H5",
		iconName: "fas fa-music",
		enabledCondition: "noteIsMarkdown",
		menuItemLocation: MenuItemLocation.Edit,
		accelerator:"CmdOrCtrl+5",
		commandName: "supplyHeadText",
		args: [ "#####" ]
	},
	{
		name: "UnorderedList",
		label: "UnorderedList",
		iconName: "fas fa-music",
		enabledCondition: "noteIsMarkdown",
		menuItemLocation: MenuItemLocation.Edit,
		accelerator:"CmdOrCtrl+Shift+[",
		commandName: "supplyUnorderedList",
		args: [ "-" ]
	},
	{
		name: "TaskList",
		label: "TaskList",
		iconName: "fas fa-music",
		enabledCondition: "noteIsMarkdown",
		menuItemLocation: MenuItemLocation.Edit,
		accelerator:"CmdOrCtrl+Shift+L",
		commandName: "supplyTaskText",
		args: [ "[ ]" ]
	},
]

let lastSettings: PluginSettings;

const highlightLineSettingId = 'highlight-active-line';

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

joplin.plugins.register({
	onStart: async function() {
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

		lastSettings = await registerSettings((settings: PluginSettings) => {
			lastSettings = settings;
			joplin.commands.execute('editor.execCommand', {
				name: 'cm-extended-settings-update',
				args: [ settings ],
			});
		});

		await registerCodeMirrorContentScript('codeMirror6');
		await registerCodeMirrorContentScript('codeMirror5');

		const panel = await joplin.views.panels.create('status_bar_panel');
		await joplin.views.panels.addScript(panel, './asserts/bootstrap.min.css');
		await joplin.views.panels.addScript(panel, './asserts/bootstrap.bundle.min.js');
		await joplin.views.panels.addScript(panel, './asserts/jquery.min.js');

		await joplin.views.panels.addScript(panel, './status_bar_panel.css');
		await joplin.views.panels.addScript(panel, './status_bar_panel.js');
		await joplin.views.panels.setHtml(panel, `
<form class="row gy-2 gx-3 align-items-center">
  <div class="col-auto">
	<div id="progress">
			hello
	</div>
  </div>
</form>
`);
	},
});