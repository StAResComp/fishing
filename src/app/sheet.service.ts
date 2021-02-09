import { Injectable } from "@angular/core";
import * as XLSX from 'xlsx';
import { File } from '@ionic-native/file/ngx';
import { FileOpener } from '@ionic-native/file-opener/ngx';

type Fish1FormEntry = {
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

export type Fish1Form = {
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
  entries: Array<Fish1FormEntry>
  comments?: string
};

@Injectable()
export class SheetService {

  private wopts: XLSX.WritingOptions = { bookType: 'xlsx', type: 'array' };
  private wb: XLSX.WorkBook;
  private wsName: string = "FISH1";
  public form: Fish1Form;

  //27 columns
  private header: Array<Array<string | number>> = [
    [
      null, null, null, null, null, null, null, null, null, null, null, null,
      null, null, null, null, null, null, null, null, null, null, null, null,
      null, null, "FSF1-2016.02"
    ],
    [
      null, null, null, "MARINE SCOTLAND COMPLIANCE", null, null, null, null,
      null, null, null,
      "ALL SPECIES 10M AND UNDER WEEKLY LANDING DECLARATION FORM"
    ],
    [
      null, null, null, "Fishery Office", null, null, "FO name goes here (2,6)"
    ],
    [
      null, null, null, null, null, null, "FO address and tel goes here (3,6)"
    ],
    [],
    [],
    [
      null, null, null, "Email", null, null, "FO email goes here (6,6)"
    ],
    [
      null, null, null, null, null, null, null, null, null, null, null, "PLN",
      null, "PLN goes here (7,13)", null, null, null, null, null, null, null,
      "Vessel Name", null,null, "Vessel name goes here (7,24)"
    ],
    [
      "Port of Departure", null, null, "Port of Departure goes here (8,3)",
      null, null, null, null, null, null, null, "Owner/Master", null,
      "Owner/master goes here (8,13)", null, null, null, null, null, null,
      null, null, null, null, "Signed"
    ],
    [
      "Port of Landing", null, null, "Port of Landing goes here (9,3)",
      null, null, null, null, null, null, null, "Address", null,
      "Address goes here (9,13)", null, null, null, null, null, null,
      null, null, null, null, "Total Pots Fishing",
      "Total Pots Fishing goes here (9,25)"
    ],
    [],
    [
      "Fishing Activity Date", "Lat", null, "Lon", null, null, "Stat Rect",
      null, "Gear", "Mesh Size", null, "Species", "State", null,
      "Presentation", null, "Weight", null, "DIS", null, "BMS", null,
      "Number of Pots Hauled", null, "Landing or Discard Date",
      "Buyer, Transporter Reg. or Landed to Keeps"
    ],
    [
      null, "DD", "MM", "DD", "MM", "W/E"
    ]
  ];

  private footer =[
    [
      "Comments", null, null, "Comments go here (0,3)"
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
    this.header[2][6] = this.form.fisheryOffice.name;
    if (this.form.fisheryOffice.phone) {
      this.header[3][6] =
        `${this.form.fisheryOffice.address}
        Tel: ${this.form.fisheryOffice.phone}`;
    }
    else {
      this.header[3][6] = this.form.fisheryOffice.address;
    }
    this.header[6][6] = this.form.fisheryOffice.email;
    this.header[7][13] = this.form.pln;
    this.header[7][24] = this.form.vesselName;
    this.header[8][3] = this.form.portOfDeparture;
    this.header[8][13] = this.form.ownerMaster;
    this.header[9][3] = this.form.portOfLanding;
    this.header[9][13] = this.form.address;
    this.header[9][25] = this.form.totalPotsFishing;
    this.footer[0][3] = this.form.comments;
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
          null,
          entry.gear,
          entry.meshSize,
          null,
          entry.species,
          entry.state,
          null,
          entry.presentation,
          null,
          entry.weight,
          null,
          entry.DIS,
          null,
          entry.BMS,
          null,
          entry.numberOfPotsHauled,
          null,
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
    const fileName = `fish1-${now.getTime()}.xlsx`;
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
