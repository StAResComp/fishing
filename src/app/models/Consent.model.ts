import { Record } from './RecordWithLocation.model';

export class Consent extends Record {

  public understoodSheet = false;
  public questionsOpportunity = false;
  public questionsAnswered = false;
  public understandWithdrawal = false;
  public understandCoding = false;
  public secondary = {
    agreeArchiving: false,
    awareRisks: false,
    agreeTakePart: false,
  };
  public photography = {
    agreePhotoTaken: false,
    agreePhotoPublished: false,
    agreePhotoFutureUse: false,
  };
  public name: string;
  public date = new Date();

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

  public static deserialize(serializedConsent: string): Consent {
    const consent = JSON.parse(serializedConsent);
    consent.date = new Date(consent.date);
    return consent as Consent;
  }
}
