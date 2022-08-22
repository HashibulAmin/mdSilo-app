import * as dialog from '@tauri-apps/api/dialog';
import { invoke } from '@tauri-apps/api/tauri';
import { store } from 'lib/store';
import DirectoryAPI from './directory';
import FileAPI from './files';
import { processJson, processMds, processDirs } from './process';
import { getParentDir, joinPaths } from './util';
import { writeJsonFile } from './write';

/* 
Open files: 
  process and import to store, a json storing all data will be created and saved
Open json: 
  import to store, when edit any file, a .md will be created and saved 
*/

function getRecentDirPath() {
  const recentDir = store.getState().recentDir;
  if (recentDir && Array.isArray(recentDir) && recentDir.length > 0) {
    return recentDir[recentDir.length - 1] || '.';
  } else {
    return '.';
  }
}

/**
 * Dialog to get dir path to open
 * @returns 
 */
export const openDirDilog = async () => {
  const recentDirPath = getRecentDirPath();
  const dirPath  = await dialog.open({
    title: `Open Folder`,
    directory: true,
    multiple: false,
    defaultPath: recentDirPath,
    filters: [
      {name: 'dir', extensions: ['md', 'json']}
    ],
  });
  return dirPath;
};

/**
 * Open dir and process files w/ content, upsert note and tree to store
 * @param dir 
 * @returns 
 */
 export const listDir = async (dir: string, toListen=true): Promise<void> => {
  const dirInfo = new DirectoryAPI(dir);
  // console.log("dir api", dirInfo)
  if (!(await dirInfo.exists())) return;

  // attach listener to monitor changes in dir // TODO
  if (toListen) { dirInfo.listen(() => {/*TODO*/}); }

  store.getState().setMsgModalText('Importing, Please wait...');
  store.getState().setMsgModalOpen(true);

  // 1- get files and dirs
  const dirData = await dirInfo.listDirectory();
  // console.log("dir data 0", dirData);
  const files = dirData;
  const dirs = files.filter(f => f.is_dir).map(d => ({...d, file_text: ''}));
  const processedDirs = dirs.length ? processDirs(dirs) : [];
  const mds = files.filter(f => f.is_file).map(d => ({...d, file_text: ''}));
  const processedMds =  mds.length ? processMds(mds) : [];

  const upsertNote = store.getState().upsertNote;
  const upsertTree = store.getState().upsertTree;
  const dirPath = dirInfo.dirPath;
  // console.log("dir path 0", dirPath, dir);

  // 2- upsert store dirs
  for (const subdir of processedDirs) {
    const subDir =  new DirectoryAPI(subdir.file_path);
    if (await subDir.exists()) {
      // const parentDir = await getParentDir(subdir.file_path);
      // console.log("dir path1", dirPath, dir, parentDir);
      upsertTree(dirPath, subdir, true);
      upsertNote(subdir);
    }
  }
  
  // 3- upsert store md files
  for (const md of processedMds) {
    // const parentDir = await getParentDir(md.file_path);
    // console.log("dir path2", dirPath, dir, parentDir);
    upsertTree(dirPath, md, false);
    upsertNote(md);
  }

  // console.log("dir path", dirPath, dir, store.getState().noteTree);
  
  closeMsgModal();
}

/**
 * Open dir and process files, upsert note and tree to store
 * @param dir 
 * @returns 
 */
export const openDir = async (dir: string, toListen=true): Promise<void> => {
  const dirInfo = new DirectoryAPI(dir);
  // console.log("dir api", dirInfo)
  if (!(await dirInfo.exists())) return;

  // attach listener to monitor changes in dir // TODO
  if (toListen) { dirInfo.listen(() => {/*TODO*/}); }

  store.getState().setMsgModalText('Importing, Please wait...');
  store.getState().setMsgModalOpen(true);

  // 1- get files and dirs
  const dirData = await dirInfo.getFiles();
  const files = dirData.files;
  const dirs = files.filter(f => f.is_dir);
  const processedDirs = dirs.length ? processDirs(dirs) : [];
  const mds = files.filter(f => f.is_file);
  const processedMds =  mds.length ? processMds(mds) : [];

  const upsertNote = store.getState().upsertNote;
  const upsertTree = store.getState().upsertTree;
  const dirPath = dirInfo.dirPath;

  // 2- upsert store dirs
  for (const subdir of processedDirs) {
    const subDir =  new DirectoryAPI(subdir.file_path);
    if (await subDir.exists()) {
      upsertNote(subdir);
      // const parentDir = await getParentDir(subdir.file_path);
      // console.log("dir path1", dirPath, dir, parentDir);
      upsertTree(dirPath, subdir, true);
    }
  }
  
  // 3- upsert store md files
  for (const md of processedMds) {
    upsertNote(md);
    // const parentDir = await getParentDir(md.file_path);
    // console.log("dir path2", dirPath, dir, parentDir);
    upsertTree(dirPath, md, false);
  }

  // console.log("dir path", dirPath, dir, store.getState().noteTree);
  
  closeMsgModal();
}

/**
 * dialog to get file paths to open
 * @param ty file type: md or json
 * @param multi multi-select or not
 * @returns 
 */
export const openFileDilog = async (ty: string[], multi = true) => {
  const recentDirPath = getRecentDirPath();
  const filePaths = await dialog.open({
    title: `Open ${ty} File`,
    directory: false,
    multiple: multi,
    defaultPath: recentDirPath,
    filters: [
      {
        name: 'file', 
        extensions: ty,
      }
    ],
  });
  return filePaths;
};

/**
 * Open and process md files, upsert note and tree to store
 * @param filePaths 
 * @returns Promise<boolean>
 */
export async function openFilePaths(filePaths: string[]) {
  const files = [];
  for (const filePath of filePaths) {
    const fileInfo = new FileAPI(filePath);
    if (await fileInfo.exists()) {
      const fileMeta = await fileInfo.getMetadata();
      files.push(fileMeta);
    } 
  }
  // process files
  const processedRes = processMds(files);
  // sync store states to JSON
  if (processedRes.length > 0) {
    const upsertNote = store.getState().upsertNote;
    const upsertTree = store.getState().upsertTree;
    for (const md of processedRes) {
      upsertNote(md);
      const parentDir = await getParentDir(md.file_path);
      upsertTree(parentDir, md, false);
    }

    return true;
  }
}

/**
 * Open and process JSON
 * @param filePath
 * @returns Promise<boolean>
 */
export async function openJSONFilePath(filePath: string) {
  if (filePath && filePath.endsWith('mdsilo.json')) {
    const jsonInfo = new FileAPI(filePath);
    if (await jsonInfo.exists()) {
      const fileContent = await jsonInfo.readFile();
      const notesData = processJson(fileContent);
      return notesData;
    }
  }
}

/**
 * load all notes with content recursively
 * @param dir initDir
 */
 export const loadDir = async (dir: string) => {
  const dirInfo = new DirectoryAPI(dir);
  // console.log("dir api", dirInfo)
  if (!(await dirInfo.exists())) return;

  // firstly, try to use json to avoid heavy loading job 
  const jsonPath = await joinPaths(dir, ['mdsilo.json']);
  const jsonData = await openJSONFilePath(jsonPath);
  const isLoaded = jsonData?.isLoaded;
  if (isLoaded) {
    store.getState().setNotes(jsonData.notesObj);
    return;
  }

  const upsertNote = store.getState().upsertNote;
  // otherwise: 
  // 1- get files
  const dirData = await dirInfo.getFiles();
  const files = dirData.files;
  
  // 2- process mds and upsert store
  const mds = files.filter(f => f.is_file);
  const processedMds =  mds.length ? processMds(mds) : [];
  // upsert 
  for (const md of processedMds) {
    upsertNote(md);
  }

  // 3- process sub-dirs recursively
  const dirs = files.filter(f => f.is_dir);
  const processedDirs = dirs.length ? processDirs(dirs) : [];
  // process recursively
  for (const subdir of processedDirs) {
    await loadDir(subdir.file_path);
  }
  // write the loading to json
  await writeJsonFile(dir); 
};

/**
 * open an url
 * @returns boolean, if opened
 */
export async function openUrl(url: string): Promise<boolean> {
  return await invoke<boolean>(
    'open_url', { url }
  );
}

/**
 * dialog to get dir path to save data
 * @returns 
 */
 export const saveDilog = async () => {
  const recentDirPath = getRecentDirPath();
  const dirPath = await dialog.save({
    title: 'Select Folder to Save Data',
    defaultPath: recentDirPath,
  });
  return dirPath;
};

const closeMsgModal = () => {
  store.getState().setMsgModalOpen(false);
  store.getState().setMsgModalText('');
};
