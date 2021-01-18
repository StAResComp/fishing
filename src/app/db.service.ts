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
  meshSize: number
  species: string
  state: string
  presentation: string
  DIS: boolean
  BMS: boolean
  numPotsHauled: number
  landingDiscardDate: Date
  buyerTransporterRegLandedToKeeps?: string
};

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
        mesh_size INTEGER NOT NULL,
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
      'SELECT * FROM catches ORDER BY id DESC LIMIT 20', []
    ).then(
      res => {
        console.log(res);
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
    console.log('Inserting/Updating...');
    if (!caught.id) {
      this.db?.executeSql(
        `INSERT INTO catches
          (date, species, caught, retained)
        VALUES
          (?, ?, ?, ?);`,
        [
          caught.date.toISOString(),
          caught.species,
          caught.caught,
          caught.retained
        ]
      ).then(
        (res) => { console.log(res); }
      ).catch(
        e => console.log(`Error executing SQL: ${JSON.stringify(e)}`)
      );
    }
    else {
      this.db?.executeSql(
        `UPDATE catches SET
          date = ?
          species = ?,
          caught = ?,
          retained = ?
        WHERE id = ?;`,
        [
          caught.date.toISOString(),
          caught.species,
          caught.caught,
          caught.retained,
          caught.id
        ]
      );
    }
  }
}

