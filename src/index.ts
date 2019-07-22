import { SyncCompositeRedactor, SyncCompositeRedactorOptions } from './SyncCompositeRedactor';
import { AsyncCompositeRedactor, AsyncCompositeRedactorOptions } from './AsyncCompositeRedactor';
import { GoogleDLPRedactor, GoogleDLPRedactorOptions } from './custom/GoogleDLPRedactor';
import { AwsComprehendMedicalRedactor, AwsComprehendMedicalRedactorOptions } from './custom/AwsComprehendMedicalRedactor';

import {
  AsyncCustomRedactorConfig,
  CompositeRedactorOptions,
  IAsyncRedactor,
  ISyncRedactor,
  IRedactor,
  SimpleRegexpCustomRedactorConfig
} from './types';

export {
  SyncCompositeRedactor as SyncRedactor,
  SyncCompositeRedactorOptions,
  AsyncCompositeRedactor as AsyncRedactor,
  AsyncCompositeRedactorOptions,
  GoogleDLPRedactor,
  GoogleDLPRedactorOptions,
  AwsComprehendMedicalRedactor,
  AwsComprehendMedicalRedactorOptions,
  AsyncCustomRedactorConfig,
  CompositeRedactorOptions,
  IAsyncRedactor,
  ISyncRedactor,
  IRedactor,
  SimpleRegexpCustomRedactorConfig
};
