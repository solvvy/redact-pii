import { IAsyncRedactor } from '../types';
// Load the AWS SDK for Node.js
var AWS = require('aws-sdk');


/** @public */
export interface AwsComprehendMedicalRedactorOptions {
  /** options to pass down to the AWS Comprehend Medical client.  */
  apiVersion?: string;
  aws_region?: string;
}

/** @public */
export class AwsComprehendMedicalRedactor implements IAsyncRedactor {

  comprehendmedical: typeof AWS.ComprehendMedical;

  constructor(private opts: AwsComprehendMedicalRedactorOptions = {}) {
    // Set region, default to eu-west-1
    AWS.config.update({region: opts.aws_region ? opts.aws_region : 'eu-west-1'});
    //Create Comprehend Medical
    this.comprehendmedical = new AWS.ComprehendMedical(opts.apiVersion ? {apiVersion: opts.apiVersion} : {});
  }

  async redactAsync(textToRedact: string): Promise<string> {
      return this.doRedactAsync(textToRedact);
  }

  async doRedactAsync(textToRedact: string): Promise<string> {
    var p = {
      Text: textToRedact
    };
    var promise = new Promise<string>((resolve, reject) =>{
      this.comprehendmedical.detectEntities(p, (err:any, data:any) => {
        if (err) {
          console.log(err, err.stack); // an error occurred
          reject(err);
        } else {
          //console.log(data);
          var res = textToRedact;
          if (data.Entities){
            data.Entities.map( (entity:any) => {
              res = res.replace(entity.Text, entity.Type);
            });
            resolve(res);
          } else {
            resolve(res);
          }
        }
      });
    });
    return await promise;
  }
}
