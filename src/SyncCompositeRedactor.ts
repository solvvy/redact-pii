import { composeChildRedactors } from './composition';
import { CompositeRedactorOptions, ISyncRedactor, SyncCustomRedactorConfig } from './types';

/** @public */
export interface SyncCompositeRedactorOptions extends CompositeRedactorOptions<SyncCustomRedactorConfig> {}

/** @public */
export class SyncCompositeRedactor implements ISyncRedactor {
  private childRedactors: ISyncRedactor[] = [];

  constructor(opts?: SyncCompositeRedactorOptions) {
    this.childRedactors = composeChildRedactors(opts);
  }

  redact = (textToRedact: string) => {
    for (const redactor of this.childRedactors) {
      textToRedact = redactor.redact(textToRedact);
    }
    return textToRedact;
  };
}
