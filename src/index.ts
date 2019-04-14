import { SyncCompositeRedactor, SyncCompositeRedactorOptions } from './SyncCompositeRedactor';
import { AsyncCompositeRedactor, AsyncCompositeRedactorOptions } from './AsyncCompositeRedactor';
import { GoogleDLPRedactor, GoogleDLPRedactorOptions } from './custom/GoogleDLPRedactor';

export {
  SyncCompositeRedactor as SyncRedactor,
  SyncCompositeRedactorOptions,
  AsyncCompositeRedactor as AsyncRedactor,
  AsyncCompositeRedactorOptions,
  GoogleDLPRedactor,
  GoogleDLPRedactorOptions
};
