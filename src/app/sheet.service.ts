import { Injectable } from "@angular/core";
import * as XLSX from 'xlsx';
import { File } from '@ionic-native/file/ngx';
import { FileOpener } from '@ionic-native/file-opener/ngx';

type F1FormEntry = {
  fishingActivityDate: Date
  latitudeDegrees: number
  latitudeMinutes: number
  longitudeDegrees: number
  longitudeMinutes: number
  longitudeDirection: string
  statRect: string
  gear: string
  meshSize?: string
  species: string
  state: string
  presentation: string
  weight: number
  DIS: boolean
  BMS: boolean
  numberOfPotsHauled?: number
  landingOrDiscardDate: Date
  buyerTransporterRegOrLandedToKeeps?: string
}

export type F1Form = {
  fisheryOffice: {
    name: string
    address: string
    phone?: string
    email: string
  }
  pln: string
  vesselName: string
  ownerMaster: string
  address: string
  portOfDeparture: string
  portOfLanding: string
  totalPotsFishing: number
  entries: Array<F1FormEntry>
  comments?: string
};

@Injectable()
export class SheetService {

  private wopts: XLSX.WritingOptions = { bookType: 'xlsx', type: 'array' };
  private wb: XLSX.WorkBook;
  private wsName: string = "Fishing";
  public form: F1Form;

  //27 columns
  private header: Array<Array<string | number>> = [
    [
      "Fishery Office:", "FO name goes here (0,1)"
    ],
    [
      null, "FO address and tel goes here (1,1)"
    ],
    [
      "Email:", "FO email goes here (2,1)"
    ],
    [
      "PLN:", "PLN goes here (3,1)", null,
      "Vessel Name:", "Vessel name goes here (3,4)"
    ],
    [
      "Port of Departure:", "Port of Departure goes here (4,1)",null,
      "Owner/Master:", "Owner/master goes here (4,4)", null, "Signed:"
    ],
    [
      "Port of Landing:", "Port of Landing goes here (5,1)", null,
      "Address:", "Address goes here (5,4)", null,
      "Total Pots Fishing:", "Total Pots Fishing goes here (5,7)"
    ],
    [],
    [
      "Fishing Activity Date", "Lat", null, "Lon", null, null, "Stat Rect",
      "Gear", "Mesh Size", "Species", "State", "Presentation", "Weight", "DIS",
      "BMS", "Number of Pots Hauled", "Landing or Discard Date",
      "Buyer, Transporter Reg. or Landed to Keeps"
    ],
    [
      null, "DD", "MM", "DD", "MM", "W/E"
    ]
  ];

  private footer =[
    [
      "Comments:", "Comments go here (0,3)"
    ]
  ];

  constructor(private file: File, private fileOpener: FileOpener) {};

  private createWorkbookIfNeeded() {
    if (!this.wb) {
      this.wb = XLSX.utils.book_new();
      this.wb.SheetNames.push(this.wsName);
    }
  }

  public createWorkbook() {
    this.createWorkbookIfNeeded();
    this.header[0][1] = this.form.fisheryOffice.name;
    if (this.form.fisheryOffice.phone) {
      this.header[1][1] =
        `${this.form.fisheryOffice.address}
        Tel: ${this.form.fisheryOffice.phone}`;
    }
    else {
      this.header[1][1] = this.form.fisheryOffice.address;
    }
    this.header[2][1] = this.form.fisheryOffice.email;
    this.header[3][1] = this.form.pln;
    this.header[3][4] = this.form.vesselName;
    this.header[4][1] = this.form.portOfDeparture;
    this.header[4][4] = this.form.ownerMaster;
    this.header[5][1] = this.form.portOfLanding;
    this.header[5][4] = this.form.address;
    this.header[5][7] = this.form.totalPotsFishing;
    this.footer[0][1] = this.form.comments;
    const entries = [];
    this.form.entries.forEach(entry => {
      entries.push(
        [
          entry.fishingActivityDate.toLocaleDateString(
            'en-gb', {
              weekday: 'short',
              year: 'numeric',
              month: 'short',
              day: 'numeric'}
          ),
          entry.latitudeDegrees,
          entry.latitudeMinutes,
          entry.longitudeDegrees,
          entry.longitudeMinutes,
          entry.longitudeDirection,
          entry.statRect,
          entry.gear,
          entry.meshSize,
          entry.species,
          entry.state,
          entry.presentation,
          entry.weight,
          entry.DIS,
          entry.BMS,
          entry.numberOfPotsHauled,
          entry.landingOrDiscardDate.toLocaleDateString(
            'en-gb', {
              weekday: 'short',
              year: 'numeric',
              month: 'short',
              day: 'numeric'}
          ),
          entry.buyerTransporterRegOrLandedToKeeps
        ]
      );
    });
    const completeSheet = [...this.header, ...entries, ...this.footer];
    const ws = XLSX.utils.aoa_to_sheet(completeSheet);
    this.wb.Sheets[this.wsName] = ws;
    const wbOut = XLSX.write(this.wb, {bookType:'xlsx',  type: 'binary'});
    const buf = new ArrayBuffer(wbOut.length);
    const filePath = this.file.dataDirectory;
    const now = new Date();
    const fileName = `f1-${now.getTime()}.xlsx`;
    const view = new Uint8Array(buf);
    for (let i = 0; i < wbOut.length; i++) view[i] = wbOut.charCodeAt(i) & 0xFF;
    this.file.writeFile(filePath, fileName, buf).then(_ => {
      this.fileOpener.open(
        `${filePath}/${fileName}`,
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
    });
  }
}
