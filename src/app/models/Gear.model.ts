import { RecordWithLocation } from './RecordWithLocation.model';

export class Gear extends RecordWithLocation {

  public date: Date;
  public notes: string;
  public incidentType: 'lost' | 'found' | 'unmarkedCreel' = 'unmarkedCreel';
  public gearType: 'creel' | 'other' = 'creel';
  public num?: number;

  constructor(id?: number) {
    super(id);
    this.date = new Date();
  }

  public getDateString(format: 'ISO' | 'local' = 'ISO', time = false): string {
    if (this.date) {
      return Gear.dateToString(this.date, format, time);
    }
    return '';
  }

  public isComplete(): boolean {
    return (
      this.date && this.getLatitude() != null && this.getLongitude() != null
    );
  }

  public get description() {
    let description = '';
    if (this.incidentType === 'lost') {
      description += 'Lost gear';
    }
    else if (this.incidentType === 'found') {
      description += 'Found gear';
    }
    else {
      description += 'Unmarked creel';
    }
    if (this.incidentType === 'lost' || this.incidentType === 'found') {
      if (this.gearType === 'creel' && this.num) {
        description += ` (${this.gearType} x ${this.num})`;
      }
      else {
        description += ` (${this.gearType})`;
      }
    }
    return description;
  }

}
