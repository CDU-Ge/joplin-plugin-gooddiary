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

		async function createDailyNote() {
			const noteName = getDailyNoteName();
			const dailyFolderName = getDailyFolderName();
			
			// check if daily folder exists else create it
		    await joplin.data.get(['folders']).then(async function(folderList: any)  {
				const dailyFolder = folderList.items.find((folder: any) => folder.title === dailyFolderName);
				if (!dailyFolder) {
					await joplin.data.post(['folders'], null, { title: dailyFolderName });
				}
			});
			console.log('createDailyNote', noteName, dailyFolderName);
			// create daily note
			const folderList = await joplin.data.get(['folders']);
			console.log(folderList);
			const dailyFolder = folderList.items.find((folder: any) => folder.title === dailyFolderName);
			console.log(dailyFolder.id);
			const noteList = await joplin.data.get(['folders', dailyFolder.id, 'notes'], null);
			if (await noteList.items.find((note: any) => note.title === noteName)) {
				return;
			}
			await joplin.data.post(['notes'], null, { title: noteName, body: '', parent_id: dailyFolder.id });
		}
		
		window.cdu = {
			createDailyNote,
		}
		// create daily note
		await createDailyNote();
		// setInterval(createDailyNote, 1000);
		setInterval(createDailyNote, 1000 * 60 * 60 * 2);
	},
});
