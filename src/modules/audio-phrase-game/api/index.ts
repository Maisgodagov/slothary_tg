import { publicGameSnippetsApi } from '../../../features/game-snippets/publicApi';
import { usersApi } from '../../../features/users/api';

export const audioPhraseGameApi = {
  listGameSnippets: publicGameSnippetsApi.listGame,
  addXp: usersApi.addXp,
};
