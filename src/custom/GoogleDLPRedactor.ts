import { IAsyncRedactor } from '../types';
import DLP from '@google-cloud/dlp';

const minLikelihood = 'LIKELIHOOD_UNSPECIFIED';
const maxFindings = 0;
export const defaultInfoTypes = [
  { name: 'AMERICAN_BANKERS_CUSIP_ID' },
  { name: 'AUSTRALIA_MEDICARE_NUMBER' },
  { name: 'AUSTRALIA_TAX_FILE_NUMBER' },
  { name: 'BRAZIL_CPF_NUMBER' },
  { name: 'CANADA_BC_PHN' },
  { name: 'CANADA_DRIVERS_LICENSE_NUMBER' },
  { name: 'CANADA_OHIP' },
  { name: 'CANADA_PASSPORT' },
  { name: 'CANADA_QUEBEC_HIN' },
  { name: 'CANADA_SOCIAL_INSURANCE_NUMBER' },
  { name: 'CHINA_PASSPORT' },
  { name: 'CREDIT_CARD_NUMBER' },
  { name: 'EMAIL_ADDRESS' },
  { name: 'ETHNIC_GROUP' },
  { name: 'FEMALE_NAME' },
  { name: 'FIRST_NAME' },
  { name: 'FRANCE_CNI' },
  { name: 'FRANCE_NIR' },
  { name: 'FRANCE_PASSPORT' },
  { name: 'GCP_CREDENTIALS' },
  { name: 'GERMANY_PASSPORT' },
  { name: 'IBAN_CODE' },
  { name: 'IMEI_HARDWARE_ID' },
  { name: 'INDIA_PAN_INDIVIDUAL' },
  { name: 'IP_ADDRESS' },
  { name: 'JAPAN_INDIVIDUAL_NUMBER' },
  { name: 'JAPAN_PASSPORT' },
  { name: 'KOREA_PASSPORT' },
  { name: 'KOREA_RRN' },
  { name: 'LAST_NAME' },
  { name: 'MAC_ADDRESS_LOCAL' },
  { name: 'MAC_ADDRESS' },
  { name: 'MALE_NAME' },
  { name: 'MEXICO_CURP_NUMBER' },
  { name: 'MEXICO_PASSPORT' },
  { name: 'NETHERLANDS_BSN_NUMBER' },
  { name: 'PHONE_NUMBER' },
  { name: 'SPAIN_NIE_NUMBER' },
  { name: 'SPAIN_NIF_NUMBER' },
  { name: 'SPAIN_PASSPORT' },
  { name: 'SWIFT_CODE' },
  { name: 'UK_DRIVERS_LICENSE_NUMBER' },
  { name: 'UK_NATIONAL_HEALTH_SERVICE_NUMBER' },
  { name: 'UK_NATIONAL_INSURANCE_NUMBER' },
  { name: 'UK_PASSPORT' },
  { name: 'UK_TAXPAYER_REFERENCE' },
  { name: 'US_ADOPTION_TAXPAYER_IDENTIFICATION_NUMBER' },
  { name: 'US_BANK_ROUTING_MICR' },
  { name: 'US_DEA_NUMBER' },
  { name: 'US_DRIVERS_LICENSE_NUMBER' },
  { name: 'US_HEALTHCARE_NPI' },
  { name: 'US_INDIVIDUAL_TAXPAYER_IDENTIFICATION_NUMBER' },
  { name: 'US_PASSPORT' },
  { name: 'US_PREPARER_TAXPAYER_IDENTIFICATION_NUMBER' },
  { name: 'US_SOCIAL_SECURITY_NUMBER' },
  { name: 'US_TOLLFREE_PHONE_NUMBER' },
  { name: 'US_VEHICLE_IDENTIFICATION_NUMBER' },
  { name: 'US_STATE' },
  { name: 'FDA_CODE' },
  { name: 'ICD9_CODE' },
  { name: 'ICD10_CODE' },
  { name: 'US_EMPLOYER_IDENTIFICATION_NUMBER' },
  { name: 'LOCATION' },
  { name: 'DATE' },
  { name: 'DATE_OF_BIRTH' },
  { name: 'TIME' },
  { name: 'PERSON_NAME' },
  { name: 'AGE' },
  { name: 'GENDER' },
  { name: 'ARGENTINA_DNI_NUMBER' },
  { name: 'CHILE_CDI_NUMBER' },
  { name: 'COLOMBIA_CDC_NUMBER' },
  { name: 'NETHERLANDS_PASSPORT' },
  { name: 'PARAGUAY_CIC_NUMBER' },
  { name: 'PERU_DNI_NUMBER' },
  { name: 'PORTUGAL_CDC_NUMBER' },
  { name: 'URUGUAY_CDI_NUMBER' },
  { name: 'VENEZUELA_CDI_NUMBER' }
];
const customInfoTypes = [
  {
    infoType: {
      name: 'URL'
    },
    regex: {
      pattern: '([^\\s:/?#]+):\\/\\/([^/?#\\s]*)([^?#\\s]*)(\\?([^#\\s]*))?(#([^\\s]*))?'
    }
  }
];

const likelihoodPriority: { [likelyHoodName: string]: number } = {
  LIKELIHOOD_UNSPECIFIED: 0,
  VERY_UNLIKELY: 1,
  UNLIKELY: 2,
  POSSIBLE: 3,
  LIKELY: 4,
  VERY_LIKELY: 5
};

const includeQuote = true;

/** @public */
export interface GoogleDLPRedactorOptions {
  /** options to pass down to the Google Cloud DLP client. Check https://cloud.google.com/nodejs/docs/reference/dlp/0.10.x/v2.DlpServiceClient for the available options */
  clientOptions?: any;
  /** object containing `inspectConfig` options that should override the default `inspectConfig` options.
   * For example, this can be used to set `customInfoTypes` or define a `ruleSet` to modify behavior of info types (e.g. exclude certain patterns).
   * Check https://cloud.google.com/nodejs/docs/reference/dlp/0.10.x/v2.DlpServiceClient#inspectContent for details. */
  inspectConfig?: any;
  /** Array of extra DLP info type names to also include in addition to the default set */
  includeInfoTypes?: string[];
  /** Array of DLP info type names from the default set that should be excluded */
  excludeInfoTypes?: string[];
}

/** @public */
export class GoogleDLPRedactor implements IAsyncRedactor {
  dlpClient: typeof DLP.DlpServiceClient;

  constructor(private opts: GoogleDLPRedactorOptions = {}) {
    this.dlpClient = new DLP.DlpServiceClient(this.opts.clientOptions);
  }

  async redactAsync(textToRedact: string): Promise<string> {
    const projectId = await this.dlpClient.getProjectId();

    // handle info type excludes and includes
    const infoTypes = defaultInfoTypes
      .filter(infoType => !this.opts.excludeInfoTypes || !this.opts.excludeInfoTypes.includes(infoType.name))
      .concat((this.opts.includeInfoTypes || []).map(infoTypeName => ({ name: infoTypeName })));

    const response = await this.dlpClient.inspectContent({
      parent: this.dlpClient.projectPath(projectId),
      inspectConfig: Object.assign(
        {
          infoTypes,
          customInfoTypes,
          minLikelihood,
          includeQuote,
          limits: {
            maxFindingsPerRequest: maxFindings
          }
        },
        this.opts.inspectConfig
      ),
      item: { value: textToRedact }
    });
    const findings = response[0].result.findings;

    if (findings.length > 0) {
      // sort findings by highest likelihood first
      findings.sort(function(a: any, b: any) {
        return likelihoodPriority[b.likelihood] - likelihoodPriority[a.likelihood];
      });

      // in order of highest likelihood replace finding with info type name
      findings.forEach((finding: any) => {
        let find = finding.quote;
        if (find !== finding.infoType.name) {
          let numSearches = 0;
          while (numSearches++ < 1000 && textToRedact.indexOf(find) >= 0) {
            textToRedact = textToRedact.replace(find, finding.infoType.name);
          }
        }
      });
    }

    return textToRedact;
  }
}
