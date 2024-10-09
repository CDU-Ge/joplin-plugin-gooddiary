import joplin from 'api';

declare global {
	interface Window {
		cdu: {
			createDailyNote: () => void;
		};
	}
}

joplin.plugins.register({
	onStart: async function() {
		// eslint-disable-next-line no-console
		// static variables (i18)
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
		console.log(i18n);
		
		// local language
		const locale = await joplin.settings.globalValue('locale');
		const localeStandard = locale.replace('_', '-');
	
		let i18 = null;
		try {
			i18 = i18n.get(localeStandard) || i18n.get('en');
		} catch (error) {
			console.error(error);
			i18 = {};
		}
		
		function getDailyFolderName() {
			return i18.dailyFolder;
		}

		function getDailyNoteName() {
			const date = new Date();
		    const noteName = `${i18.dailyNote} ${date.toISOString().slice(0, 10)}`;
			return noteName;
		}

		function createDailyNote() {
			const noteName = getDailyNoteName();
			const dailyFolderName = getDailyFolderName();
			console.log(noteName);
			// check if daily folder exists else create it
			joplin.data.get(['folders']).then((folderList: any) => {
				const dailyFolder = folderList.items.find((folder: any) => folder.title === dailyFolderName);
				if (!dailyFolder) {
					joplin.data.post(['folders'], null, { title: dailyFolderName });
				}
			});
			// check if note exists else create it
			joplin.data.get(['notes']).then((noteList: any) => {
				const note = noteList.items.find((note: any) => note.title === noteName);
				if (!note) {
					joplin.data.post(['notes'], null, { title: noteName, body: 'Hello World!' });
				}
			});
		}
		
		window.cdu = {
			createDailyNote,
		}
		// create daily note
		createDailyNote();
		setInterval(createDailyNote, 1000 * 60 * 60 * 2);
	},
});
