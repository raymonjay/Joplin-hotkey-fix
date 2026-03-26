import { MenuItemLocation, ContentScriptType } from 'api/types';
export const hotKeyList = [
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
];