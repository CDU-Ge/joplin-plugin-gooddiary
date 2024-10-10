/**
 * Registers the Joplin plugin and initializes the daily note creation functionality.
 * 
 * @module index
 * 
 * @requires joplin
 * 
 * @global
 * @typedef {Object} Window
 * @property {Object} cdu - Custom daily note utilities.
 * @property {Function} cdu.createDailyNote - Function to create a daily note.
 * 
 * @function showMessage
 * @description Displays a message in a dialog.
 * @param {string} content - The content to display in the dialog.
 * 
 * @constant {Map<string, Object>} i18n - A map containing internationalization strings for different locales.
 * 
 * @function getDailyFolderName
 * @description Retrieves the name of the daily folder based on the current locale.
 * @returns {string} The name of the daily folder.
 * 
 * @function getDailyNoteName
 * @description Generates the name of the daily note based on the current date and locale.
 * @returns {string} The name of the daily note.
 * 
 * @function createDailyNote
 * @description Creates a daily note in the daily folder. If the daily folder does not exist, it creates the folder first.
 * 
 * @event joplin.workspace#onSyncStart
 * @description Event triggered when synchronization starts. It calls the createDailyNote function.
 * 
 * @event joplin.workspace#onNoteSelectionChange
 * @description Event triggered when the note selection changes. It calls the createDailyNote function.
 * 
 * @global
 * @property {Object} window.cdu - Custom daily note utilities.
 * @property {Function} window.cdu.createDailyNote - Function to create a daily note.
 */


import joplin from 'api';

declare global {
	interface Window {
		cdu: {
			createDailyNote: () => void;
		};
	}
}


const TIMEOUT = 1000 * 60 * 60 * 2; // 2 hours


/**
 * Displays a message in a Joplin dialog.
 * 
 * TODO: this func has a bug, it will create a new dialog every time it is called
 *
 * @param content - The message content to display in the dialog.
 * @returns A promise that resolves when the dialog is opened.
 */
async function showMessage(content: string) {
	const dialog = await joplin.views.dialogs.create('cduMessage');
	await joplin.views.dialogs.setHtml(dialog, `<p>${content}</p>`);
	await joplin.views.dialogs.open(dialog);
}

async function _showMessage(content: string, level: string = 'info', timeout: number = 1000 * 3) {

}

// i18n translations
async function getI18n() {
	const i18n = new Map();
	i18n.set('en', {
		'dailyNote': 'Daily Note',
		'dailyFolder': 'Daily Notes',
	});
	i18n.set('en-US', i18n.get('en'));
	i18n.set('en-UK', i18n.get('en'));
	i18n.set('zh-Hans', {
		'dailyNote': '日记',
		'dailyFolder': '日记本',
	});
	i18n.set('zh-CN', i18n.get('zh-Hans'));
	i18n.set('zh-Hant', {
		'dailyNote': '日記',
		'dailyFolder': '日記本',
	});
	return i18n;
}

async function getLocale() {
	const locale = await joplin.settings.globalValue('locale');
	const localeStandard = locale.replace('_', '-');
	return localeStandard;
}

async function getI18nString(i18n: Map<string, Object>, localeStandard: string) {
	let i18 = null;
	try {
		i18 = i18n.get(localeStandard) || i18n.get('en');
	} catch (error) {
		console.error(error);
		i18 = {};
	}
	return i18;
}

async function getDailyFolderName() {
	const i18n = await getI18n();
	const localeStandard = await getLocale();
	const i18 = await getI18nString(i18n, localeStandard);
	return i18.dailyFolder;
}

async function getDailyNoteName() {
	const date = new Date();
	const dateName = date.toLocaleDateString().replace(/\//g, '-');
	const i18n = await getI18n();
	const localeStandard = await getLocale();
	const i18 = await getI18nString(i18n, localeStandard);
	const noteName = `${i18.dailyNote} ${dateName}`;
	return noteName;
}

async function createDailyNote() {
	const noteName = await getDailyNoteName();
	const dailyFolderName = await getDailyFolderName();

	// check if daily folder exists else create it
	await joplin.data.get(['folders']).then(async function (folderList: any) {
		const dailyFolder = folderList.items.find((folder: any) => folder.title === dailyFolderName);
		if (!dailyFolder) {
			await joplin.data.post(['folders'], null, { title: dailyFolderName });
		}
	});

	// create daily note
	const folderList = await joplin.data.get(['folders']);
	const dailyFolder = folderList.items.find((folder: any) => folder.title === dailyFolderName);
	const noteList = await joplin.data.get(['folders', dailyFolder.id, 'notes'], null);
	if (await noteList.items.find((note: any) => note.title === noteName)) {
		return;
	}
	await joplin.data.post(['notes'], null, { title: noteName, body: '', parent_id: dailyFolder.id });
}


joplin.plugins.register({
	onStart: async function () {
		// eslint-disable-next-line no-console
		console.info('Daily Note Plugin started');
		// expose function
		window.cdu = { createDailyNote };

		// create daily note
		await createDailyNote();

		// events
		await joplin.workspace.onSyncStart(createDailyNote);
		await joplin.workspace.onNoteSelectionChange(createDailyNote);

		// create daily note every 2 hours
		setInterval(createDailyNote, TIMEOUT);
	},
});
