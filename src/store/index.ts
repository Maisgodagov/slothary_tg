import { combineReducers, configureStore } from '@reduxjs/toolkit';
import {
  FLUSH,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
  REHYDRATE,
  persistReducer,
  persistStore,
} from 'redux-persist';
import storage from 'redux-persist/lib/storage';

import authReducer from '../features/auth/slice';
import videoFeedReducer from '../features/video-feed/slice';
import dictionaryReducer from '../features/dictionary/slice';
import homeReducer from '../modules/home/store/slice';
import videoReducer from '../modules/video/store/slice';
import dictionaryModuleReducer from '../modules/dictionary/store/slice';
import profileReducer from '../modules/profile/store/slice';
import adminReducer from '../modules/admin/store/slice';
import audioPhraseGameReducer from '../modules/audio-phrase-game/store/slice';
import wordTrainingModuleReducer from '../modules/word-training/store/slice';

const rootReducer = combineReducers({
  auth: authReducer,
  videoFeed: videoFeedReducer,
  dictionary: dictionaryReducer,
  home: homeReducer,
  video: videoReducer,
  dictionaryModule: dictionaryModuleReducer,
  profile: profileReducer,
  admin: adminReducer,
  audioPhraseGame: audioPhraseGameReducer,
  wordTrainingModule: wordTrainingModuleReducer,
});

const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['auth'],
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);
