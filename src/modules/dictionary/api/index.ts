import { dictionaryApi } from '../../../features/dictionary/api';
import { muellerApi } from '../../../features/mueller/api';
import { videoDictionaryApi } from '../../../features/video-dictionary/api';

export const dictionaryModuleApi = {
  getUserDictionary: dictionaryApi.getUserDictionary,
  addUserDictionaryEntry: dictionaryApi.addUserDictionaryEntry,
  deleteUserDictionaryEntry: dictionaryApi.deleteUserDictionaryEntry,
  getStats: dictionaryApi.getStats,
  recordView: dictionaryApi.recordView,
  searchMueller: muellerApi.lookup,
  getVideoDictionary: videoDictionaryApi.searchPhrase,
};
