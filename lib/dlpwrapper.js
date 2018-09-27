const DLP = require('@google-cloud/dlp');

const callingProjectId = 'solvvy-dev';
const SERVICE_TIMEOUT = 1500;

let dlp;

const minLikelihood = 'LIKELIHOOD_UNSPECIFIED';
const maxFindings = 0;
const defaultInfoTypes = [
  {name: 'AMERICAN_BANKERS_CUSIP_ID'},
  {name: 'AUSTRALIA_MEDICARE_NUMBER'},
  {name: 'AUSTRALIA_TAX_FILE_NUMBER'},
  {name: 'BRAZIL_CPF_NUMBER'},
  {name: 'CANADA_BC_PHN'},
  {name: 'CANADA_DRIVERS_LICENSE_NUMBER'},
  {name: 'CANADA_OHIP'},
  {name: 'CANADA_PASSPORT'},
  {name: 'CANADA_QUEBEC_HIN'},
  {name: 'CANADA_SOCIAL_INSURANCE_NUMBER'},
  {name: 'CHINA_PASSPORT'},
  {name: 'CREDIT_CARD_NUMBER'},
  {name: 'EMAIL_ADDRESS'},
  {name: 'ETHNIC_GROUP'},
  {name: 'FEMALE_NAME'},
  {name: 'FIRST_NAME'},
  {name: 'FRANCE_CNI'},
  {name: 'FRANCE_NIR'},
  {name: 'FRANCE_PASSPORT'},
  {name: 'GCP_CREDENTIALS'},
  {name: 'GERMANY_PASSPORT'},
  {name: 'IBAN_CODE'},
  {name: 'IMEI_HARDWARE_ID'},
  {name: 'INDIA_PAN_INDIVIDUAL'},
  {name: 'IP_ADDRESS'},
  {name: 'JAPAN_INDIVIDUAL_NUMBER'},
  {name: 'JAPAN_PASSPORT'},
  {name: 'KOREA_PASSPORT'},
  {name: 'KOREA_RRN'},
  {name: 'LAST_NAME'},
  {name: 'MAC_ADDRESS_LOCAL'},
  {name: 'MAC_ADDRESS'},
  {name: 'MALE_NAME'},
  {name: 'MEXICO_CURP_NUMBER'},
  {name: 'MEXICO_PASSPORT'},
  {name: 'NETHERLANDS_BSN_NUMBER'},
  {name: 'PHONE_NUMBER'},
  {name: 'SPAIN_NIE_NUMBER'},
  {name: 'SPAIN_NIF_NUMBER'},
  {name: 'SPAIN_PASSPORT'},
  {name: 'SWIFT_CODE'},
  {name: 'UK_DRIVERS_LICENSE_NUMBER'},
  {name: 'UK_NATIONAL_HEALTH_SERVICE_NUMBER'},
  {name: 'UK_NATIONAL_INSURANCE_NUMBER'},
  {name: 'UK_PASSPORT'},
  {name: 'UK_TAXPAYER_REFERENCE'},
  {name: 'US_ADOPTION_TAXPAYER_IDENTIFICATION_NUMBER'},
  {name: 'US_BANK_ROUTING_MICR'},
  {name: 'US_DEA_NUMBER'},
  {name: 'US_DRIVERS_LICENSE_NUMBER'},
  {name: 'US_HEALTHCARE_NPI'},
  {name: 'US_INDIVIDUAL_TAXPAYER_IDENTIFICATION_NUMBER'},
  {name: 'US_PASSPORT'},
  {name: 'US_PREPARER_TAXPAYER_IDENTIFICATION_NUMBER'},
  {name: 'US_SOCIAL_SECURITY_NUMBER'},
  {name: 'US_TOLLFREE_PHONE_NUMBER'},
  {name: 'US_VEHICLE_IDENTIFICATION_NUMBER'},
  {name: 'US_STATE'},
  {name: 'FDA_CODE'},
  {name: 'ICD9_CODE'},
  {name: 'ICD10_CODE'},
  {name: 'US_EMPLOYER_IDENTIFICATION_NUMBER'},
  {name: 'LOCATION'},
  {name: 'DATE'},
  {name: 'DATE_OF_BIRTH'},
  {name: 'TIME'},
  {name: 'PERSON_NAME'},
  {name: 'AGE'},
  {name: 'GENDER'},
  {name: 'ARGENTINA_DNI_NUMBER'},
  {name: 'CHILE_CDI_NUMBER'},
  {name: 'COLOMBIA_CDC_NUMBER'},
  {name: 'NETHERLANDS_PASSPORT'},
  {name: 'PARAGUAY_CIC_NUMBER'},
  {name: 'PERU_DNI_NUMBER'},
  {name: 'PORTUGAL_CDC_NUMBER'},
  {name: 'URUGUAY_CDI_NUMBER'},
  {name: 'VENEZUELA_CDI_NUMBER'},
];
const customInfoTypes = [{
  infoType: {
    name: 'URL'
  },
  regex: {
    pattern: '([^\\s:/?#]+):\\/\\/([^/?#\\s]*)([^?#\\s]*)(\\?([^#\\s]*))?(#([^\\s]*))?'
  }
}];

const includeQuote = true;

function DlpRedactor(googleCloudDLPOptions) {
    if (!dlp) {
        dlp = new DLP.DlpServiceClient(googleCloudDLPOptions);
    }

    return {
        redactText: function (originalText) {

            return Promise.race([dlp.inspectContent({
                parent: dlp.projectPath(callingProjectId),
                inspectConfig: {
                    infoTypes: defaultInfoTypes,
                    customInfoTypes: customInfoTypes,
                    minLikelihood: minLikelihood,
                    includeQuote: includeQuote,
                    limits: {
                        maxFindingsPerRequest: maxFindings,
                    },
                },
                item: {value: originalText},
            }).then(response => {
                const findings = response[0].result.findings;
                if (findings.length > 0) {
                    findings.forEach(finding => {
                        let find = finding.quote;
                        let re = new RegExp(find, 'g');
                        originalText = originalText.replace(re, finding.infoType.name);
                    });
                }
                return originalText;
            }), new Promise(resolve => setTimeout(resolve, SERVICE_TIMEOUT, originalText))
            ]).catch(err => {
                console.log(`Error in inspectString: ${err.message || err}`);
            });
        }
    }
}

module.exports = DlpRedactor;

