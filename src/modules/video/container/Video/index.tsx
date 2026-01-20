import { useSearchParams } from 'react-router-dom';

import { VideoFeed } from '../../../../features/video-feed/components/video-feed';
import { PageShell } from '../../../../shared/ui/PageShell';
import { setLastOpenedContentId } from '../../store/slice';
import { useAppDispatch } from '../../../../app/hooks';
import { VideoWrapper } from './styles';
import { useEffect } from 'react';

export function VideoContainer() {
  const [params] = useSearchParams();
  const contentId = params.get('contentId');
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (contentId) {
      dispatch(setLastOpenedContentId(contentId));
    }
  }, [contentId, dispatch]);

  return (
    <PageShell scroll={false} pullToRefresh={false}>
      <VideoWrapper>
        <VideoFeed initialContentId={contentId} />
      </VideoWrapper>
    </PageShell>
  );
}
