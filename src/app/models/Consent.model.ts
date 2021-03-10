import { Record } from './RecordWithLocation.model';

export class Consent extends Record {

  public understoodSheet = true;
  public questionsOpportunity = true;
  public questionsAnswered = true;
  public understandWithdrawal = true;
  public understandCoding = true;
  public secondary = {
    agreeArchiving: true,
    awareRisks: true,
    agreeTakePart: true,
  };
  public photography = {
    agreePhotoTaken: true,
    agreePhotoPublished: true,
    agreePhotoFutureUse: true,
  };
  public name: string;
  public date = new Date();

  public static deserialize(serializedConsent: string): Consent {
    const consent = JSON.parse(serializedConsent);
    consent.date = new Date(consent.date);
    return consent as Consent;
  }

  constructor() {
    super();
  }

  public isComplete(): boolean {
    return (
      this.understoodSheet &&
      this.questionsOpportunity &&
      this.questionsAnswered &&
      this.understandWithdrawal &&
      this.understandCoding &&
      this.secondary.agreeArchiving &&
      this.secondary.awareRisks &&
      this.secondary.agreeTakePart &&
      this.name &&
      this.date != null
    );
  }

  public getDateString(format: 'ISO' | 'local' = 'ISO'): string {
    return Consent.dateToString(this.date, format);
  }

  public serialize(): string {
    return JSON.stringify(this);
  }

}
