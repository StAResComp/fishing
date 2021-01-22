import { Injectable } from "@angular/core";
import { Platform } from '@ionic/angular';
import { SQLite, SQLiteObject } from '@ionic-native/sqlite/ngx';
import { BehaviorSubject, Observable } from 'rxjs';

export type CompleteCatch = {
  id?: number
  date: Date
  species: string
  caught: number
  retained: number
};

export type CompleteEntry = {
  id?: number
  activityDate: Date
  latitude: number
  longitude: number
  gear: string
  meshSize?: string
  species: string
  state: string
  presentation: string
  DIS: boolean
  BMS: boolean
  numPotsHauled: number
  landingDiscardDate: Date
  buyerTransporterRegLandedToKeeps?: string
};

export type EntrySummary = {
  id: number
  activityDate: Date
  species: string
}

@Injectable()
export class DbService {

  private db: SQLiteObject;

  constructor(
    private platform: Platform,
    private sqlite: SQLite
  ) {
    this.platform.ready().then(() => {
      this.sqlite.create({
        name: 'fishing.db',
        location: 'default'
      }).then((db: SQLiteObject) => {
        this.db = db;
        this.setupDatabase();
      });
    });
  }

  setupDatabase() {
    const queries = [
      `CREATE TABLE IF NOT EXISTS catches (
        id INTEGER PRIMARY KEY,
        species TEXT NOT NULL,
        date TEXT NOT NULL,
        caught REAL NOT NULL,
        retained REAL NOT NULL
      );`,
      `CREATE TABLE IF NOT EXISTS entries (
        id INTEGER PRIMARY KEY,
        activity_date TEXT NOT NULL,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        gear TEXT NOT NULL,
        mesh_size TEXT,
        species TEXT NOT NULL,
        state TEXT NOT NULL,
        presentation TEXT NOT NULL,
        DIS INTEGER NOT NULL DEFAULT 0,
        BMS INTEGER NOT NULL DEFAULT 0,
        num_pots_hauled INTEGER NOT NULL,
        landing_discard_date TEXT NOT NULL,
        buyer_transporter_reg_landed_to_keeps TEXT
      );`
    ];
    queries.forEach((query) => this.db?.executeSql(query, []).catch(
      e => console.log(`Error executing SQL: ${JSON.stringify(e)}`)
    ));
  }

  public async selectCatches(): Promise<CompleteCatch[]> {
    const catches = [];
    this.db?.executeSql(
      'SELECT * FROM catches ORDER BY id DESC LIMIT 50', []
    ).then(
      res => {
        for(let i = 0; i < res.rows.length; i ++) {
          const row = res.rows.item(i);
          const catchDate = new Date(row.date);
          catches.push(
            {
              id: row.id,
              date: catchDate,
              species: row.species,
              caught: row.caught,
              retained: row.retained
            }
          );
        }
      }
    );
    return catches;
  }

  public async insertOrUpdateCatch(caught: CompleteCatch) {
    let query = `INSERT INTO catches (date, species, caught, retained)
      VALUES (?, ?, ?, ?);`;
    const params =[
      caught.date.toISOString(),
      caught.species,
      caught.caught,
      caught.retained
    ];
    if (caught.id) {
      query = `UPDATE catches SET
          date = ?
          species = ?,
          caught = ?,
          retained = ?
        WHERE id = ?;`;
      params.push(caught.id);
    }
    this.db?.executeSql(
      query, params
    ).catch(
      e => console.log(`Error executing SQL: ${JSON.stringify(e)}`)
    );
  }

  public async selectEntry(id: number): Promise<CompleteEntry> {
    const entry = {};
    this.db?.executeSql(
      'SELECT * FROM entries WHERE id = ?;', [id]
    ).then(
      res => {
        const row = res.rows.item(0);
        entry['id'] = row.id;
        entry['activityDate'] = new Date(row.activity_date);
        entry['latitude'] = row.latitude;
        entry['longitude'] = row.longitude;
        entry['gear'] = row.gear;
        entry['meshSize'] = row.mesh_size;
        entry['species'] = row.species;
        entry['state'] = row.state;
        entry['presentation'] = row.presentation;
        entry['DIS'] = !!row.DIS;
        entry['BMS'] = !!row.BMS;
        entry['numPotsHauled'] = row.num_pots_hauled;
        entry['landingDiscardDate'] = new Date(row.landing_discard_date);
        entry['buyerTransporterRegLandedToKeeps'] = row.buyer_transporter_reg_landed_to_keeps;
      }
    ).catch(
      e => alert(`Error executing SQL: ${JSON.stringify(e)}`)
    );
    return entry as CompleteEntry;
  }

  public async selectEntrySummaries(): Promise<EntrySummary[]> {
    const entries = [];
    this.db?.executeSql(
      `SELECT id, activity_date, species
       FROM entries
       ORDER BY id DESC
       LIMIT 50`,
      []
    ).then(
      res => {
        for(let i = 0; i < res.rows.length; i ++) {
          const row = res.rows.item(i);
          const activityDate = new Date(row.activity_date);
          entries.push(
            {
              id: row.id,
              activityDate: activityDate,
              species: row.species,
            }
          );
        }
      }
    ).catch(
      e => console.log(`Error executing SQL: ${JSON.stringify(e)}`)
    );
    return entries;
  }

  public async selectEntrySummarieBetweenDates(
    startDate: Date,
    endDate:Date = new Date()
  ): Promise<EntrySummary[]> {
    const entries = [];
    this.db?.executeSql(
      `SELECT id, activity_date, species
       FROM entries
       WHERE activity_date >= ?
       AND activity_date < ?
       ORDER BY id DESC
       LIMIT 50`,
      [startDate.toISOString(), endDate.toISOString()]
    ).then(
      res => {
        for(let i = 0; i < res.rows.length; i ++) {
          const row = res.rows.item(i);
          const activityDate = new Date(row.activity_date);
          entries.push(
            {
              id: row.id,
              activityDate: activityDate,
              species: row.species,
            }
          );
        }
      }
    ).catch(
      e => console.log(`Error executing SQL: ${JSON.stringify(e)}`)
    );
    return entries;
  }

  public async selectEarliestEntryDate(): Promise<Date> {
    let date = new Date();
    this.db?.executeSql(
      'SELECT MIN(activity_date) AS min_date FROM entries;',
      []
    ).then(
      res => date = new Date(res.rows.item(0).min_date)
    ).catch(
      e => console.log(`Error executing SQL: ${JSON.stringify(e)}`)
    );
    return date;
  }

  public async insertOrUpdateEntry(entry: CompleteEntry) {
    let query = `INSERT INTO entries
        (activity_date, latitude, longitude, gear, mesh_size, species,
        state, presentation, DIS, BMS, num_pots_hauled, landing_discard_date,
        buyer_transporter_reg_landed_to_keeps)
      VALUES
        (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`;
    const params = [
      entry.activityDate.toISOString(),
      entry.latitude,
      entry.longitude,
      entry.gear,
      entry.meshSize,
      entry.species,
      entry.state,
      entry.presentation,
      (entry.DIS ? 1 : 0),
      (entry.BMS ? 1 : 0),
      entry.numPotsHauled,
      entry.landingDiscardDate,
      entry.buyerTransporterRegLandedToKeeps
    ];
    if (entry.id) {
      query = `UPDATE entries SET
          activity_date = ?,
          latitude = ?,
          longitude = ?,
          gear = ?,
          mesh_size = ?,
          species = ?,
          state = ?,
          presentation = ?,
          DIS = ?,
          BMS = ?,
          num_pots_hauled = ?,
          landing_discard_date = ?,
          buyer_transporter_reg_landed_to_keeps = ?
        WHERE id = ?;`;
      params.push(entry.id);
    }
    this.db?.executeSql(
      query, params
    ).then(
      (res) => { console.log(res); }
    ).catch(
      e => console.log(`Error executing SQL: ${JSON.stringify(e)}`)
    );
  }
}

