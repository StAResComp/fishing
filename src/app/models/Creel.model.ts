import { RecordWithLocation } from './RecordWithLocation.model';

export class Creel extends RecordWithLocation {

  public date: Date;
  public notes: string;

  constructor(id?: number) {
    super(id);
    this.date = new Date();
  }

  public getDateString(format: 'ISO' | 'local' = 'ISO'): string {
    if (this.date) {
      return Creel.dateToString(this.date, format);
    }
    return '';
  }

  public isComplete(): boolean {
    return (
      this.date && this.getLatitude() != null && this.getLongitude() != null
    );
  }

}
