import { Notes } from 'lib/store';
import { buildNotesJson, getSerializedNote, joinPath } from './util';
import FileAPI from './files';

/**
 * Write file to disk
 * @param filePath 
 * @param content 
 */
export async function writeFile(filePath: string, content: string) {
  const file = new FileAPI(filePath);
  console.log("md file", file)
  await file.writeFile(content);
}

/**
 * Write json containing all data to folder
 * @param parentDir 
 * @param json optional
 */
export async function writeJsonFile(parentDir: string, json = '') {
  const jsonFile = new FileAPI('mdsilo_all.json', parentDir);
  console.log("json file", jsonFile)
  const notesJson = json || buildNotesJson(true);
  await jsonFile.writeFile(notesJson);
}

/**
 * Delete a file
 * @param filePath string
 */
export async function deleteFile(filePath: string) {
  const file = new FileAPI(filePath);
  await file.deleteFiles();
}

/**
 * save all mds and json to a folder
 * @param dirPath string
 */
export async function writeAllFile(dirPath: string, notesObj: Notes) {
  // save mds
  const notesArr = Object.values(notesObj);
  const myNotes = notesArr.filter(n => !n.is_wiki);
  for (const note of myNotes) {
    const fileName = note.is_wiki ? `wiki_${note.title}.md` : `${note.title}.md`;
    const notePath = joinPath(dirPath, fileName);
    const content = getSerializedNote(note);
    await writeFile(notePath, content);
  }
  // save json with all notes, data
  const notesJson = buildNotesJson();
  await writeJsonFile(dirPath, notesJson);
}
