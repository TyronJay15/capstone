import { useCallback, useEffect, useState } from 'react';
import { getCmsContent, subscribeCmsStore } from '../services/cmsStore';

export function useCmsContent() {
  const [content, setContent] = useState(() => getCmsContent());

  const refresh = useCallback(() => {
    setContent(getCmsContent());
  }, []);

  useEffect(() => {
    refresh();
    return subscribeCmsStore(refresh);
  }, [refresh]);

  return content;
}
