import { composeChildRedactors } from './composition';
import { AsyncCustomRedactorConfig, CompositeRedactorOptions, IAsyncRedactor, ISyncRedactor } from './types';
import { isSyncRedactor } from './utils';

/** @public */
export interface AsyncCompositeRedactorOptions extends CompositeRedactorOptions<AsyncCustomRedactorConfig> {}

/** @public */
export class AsyncCompositeRedactor implements IAsyncRedactor {
  private childRedactors: Array<ISyncRedactor | IAsyncRedactor> = [];

  constructor(opts?: AsyncCompositeRedactorOptions) {
    this.childRedactors = composeChildRedactors(opts);
  }

  redactAsync = async (textToRedact: string) => {
    for (const redactor of this.childRedactors) {
      if (isSyncRedactor(redactor)) {
        textToRedact = redactor.redact(textToRedact);
      } else {
        textToRedact = await redactor.redactAsync(textToRedact);
      }
    }
    return textToRedact;
  };
}
