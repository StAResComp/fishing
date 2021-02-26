import { RecordWithLocationAndDate } from './RecordWithLocation.model'

export type FisheryOffice = {
  name: string
  address: string
  phone?: string
  email: string
};

export type F1FormEntrySummary = {
  id: number
  activityDate: Date
  species: string
};

export class F1FormEntry extends RecordWithLocationAndDate {

  private id: number;
  public activityDate: Date;
  public gear: string;
  public meshSize: string;
  public species: string;
  public state: string;
  public presentation: string;
  public weight: number;
  public DIS: boolean = false;
  public BMS: boolean = false;
  public numPotsHauled: number;
  public landingDiscardDate: Date;
  public buyerTransporterRegLandedToKeeps: string;

  private localeDateFormat = {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }

  constructor(id?: number) {
    super();
    this.id = id;
  }

  public getId() {
    return this.id;
  }

  public getActivityDateString(format: 'ISO' | 'local' = 'ISO'): string {
    if (this.activityDate) {
      return F1FormEntry.dateToString(this.activityDate, format);
    }
    return "";
  }

  public getLandingDiscardDateString(format: 'ISO' | 'local' = 'ISO'): string {
    if (this.landingDiscardDate) {
      return F1FormEntry.dateToString(this.landingDiscardDate, format);
    }
    return "";
  }

  /* As per
   * http://www.ices.dk/marine-data/maps/Pages/ICES-statistical-rectangles.aspx

       ICES rectangle should be a 4-character string of the form "digit, digit,
       letter, digit"

       ICES statistical rectangles provide a grid covering the area between
       36°N and 85°30'N and 44°W and 68°30'E.

       Latitudinal rows, with intervals of 30', are numbered (two-digits) from
       01 at the southern boundary (latitude 36°00'N) and increasing northwards
       to 99. The northern boundary of the statistical rectangle system is,
       thus, latitude 85°30'N.

       Longitudinal columns, with intervals of 1°, are coded according to an
       alphanumeric system, beginning with A0 at the western boundary
       (longitude 44°00'W), continuing A1, A2, A3 to longitude 40°W (due to
       historical reasons, codes A4, A5, A6, A7, A8, and A9 are omitted from
       the alphanumeric codes for longitude referencing). East of 40°W, the
       coding continues B0, B1, B2, ..., B9, C0, C1, C2, ..., C9, etc., using a
       different letter for each 10° block, to the eastern boundary of the area
       covered. Note that the letter I is omitted.

       When designating an ICES rectangle, the northern coordinate is stated
       first. Thus, the rectangle of which the south-west corner is 54°00'N
       03°00'E is designated 37F3.
    */
  public getIcesRectangle(): string {
    const lat = this.getLatitude();
    const lng = this.getLongitude();
    if (lat && lng) {
      let icesRect = "";
      if (lat < 36.0 || lat >= 85.5 || lng < -44.0 || lng >= 68.5) {
        return icesRect;
      }

      //Latitudinal row
      const latval = Math.floor((lat - 36.0) * 2) +1;
      icesRect += (latval <= 9 ? `0${latval}` : latval);

      //Longitudinal Column
      const letterString = "ABCDEFGHJKLM";
      const letters = Array.from(letterString);
      icesRect += letters[(Math.floor(lng / 10)) + 5];
      if (lng < -40.0) {
        icesRect += Math.floor(Math.abs(-44.0 - lng));
      }
      else if (lng < 0.0) {
        icesRect += (9 + Math.ceil(lng % 10));
      }
      else {
        icesRect += Math.floor(lng % 10);
      }
      return icesRect;
    }
    return '';
  }

  public isComplete(): boolean {
    return (
      this.activityDate != null &&
      this.getLatitude() != null &&
      this.getLongitude() != null &&
      this.gear != null &&
      this.species != null &&
      this.state != null &&
      this.presentation != null &&
      this.weight != null &&
      this.landingDiscardDate != null
    );
  }

  public getSummary(): F1FormEntrySummary {
    return {
      id: this.id,
      activityDate: this.activityDate,
      species: this.species
    }
  }

  public static getSpeciesList() {
    return [
      { id: 'CRE', name: 'Brown Crab' },
      { id: 'LBE', name: 'Lobster' },
      { id: 'NEP', name: 'Nephrops' },
      { id: 'CRS', name: 'Velvet Crab' },
      { id: 'SQC', name: 'Squid' }
    ];
  }

  public static getGearList() {
    return [
      { id: "1", name: 'Pots/traps FPO' },
      { id: "2", name: 'Handlines FPO' },
      { id: "3", name: 'Single trawl' },
      { id: "4", name: 'Deredge' }
    ];
  }

  public static getMeshSizes() {
    return [
      { id: "1", name: '80mm' },
      { id: "2", name: '120mm' }
    ];
  }

  public static getStates() {
    return [
      { id: "1", name: 'Live' },
      { id: "2", name: 'Fresh' },
      { id: "3", name: 'Ungraded' }
    ];
  }

  public static getPresentations() {
    return [
      { id: "1", name: 'Whole' },
      { id: "2", name: 'Head on, gutted' }
    ];
  }
}

export class F1Form {

  private id: number;
  public fisheryOffice: FisheryOffice;
  public pln: string;
  public vesselName: string;
  public portOfDeparture: string;
  public portOfLanding: string;
  public ownerMaster: string;
  public address: string;
  public totalPotsFishing: number;
  public entries: Array<F1FormEntry>;
  public comments: string;
  public weekStart: Date;

  constructor(id?: number) {
    this.id = id;
  }

  public getId() {
    return this.id;
  }

  public serializeWithouEntries(): string {
    const copyOfThis = {
      id: this.id,
      fisheryOffice: this.fisheryOffice,
      pln: this.pln,
      vesselName: this.vesselName,
      portOfDeparture: this.portOfDeparture,
      portOfLanding: this.portOfLanding,
      ownerMaster: this.ownerMaster,
      address: this.address,
      totalPotsFishing: this.totalPotsFishing,
      comments: this.comments,
      weekStart: this.weekStart
    };
    return JSON.stringify(copyOfThis);
  }

  public static deserialize(serializedForm: string): F1Form {
    const f1Form = JSON.parse(serializedForm) as F1Form;
    if (f1Form.weekStart) {
      f1Form.weekStart = new Date(f1Form.weekStart);
    }
    return f1Form;
  }
}

