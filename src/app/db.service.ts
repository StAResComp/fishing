import { Injectable } from '@angular/core';
import { Platform } from '@ionic/angular';
import { SQLite, SQLiteObject } from '@ionic-native/sqlite/ngx';
import { BehaviorSubject, Observable } from 'rxjs';
import {
  F1Form,
  F1FormEntry,
  F1FormEntrySummary,
  FisheryOffice,
  Catch
} from './models/F1Form.model';
import { WildlifeObservation } from './models/WildlifeObservation.model';
import { Creel } from './models/Creel.model';

type EntryRow = {
  id: number
  activity_date: string
  latitude: number
  longitude: number
  gear: string
  mesh_size?: string
  species: string
  state: string
  presentation: string
  weight: number
  DIS: 0 | 1
  BMS: 0 | 1
  num_pots_hauled?: number
  landing_discard_date: string
  buyer_transporter_reg_landed_to_keeps: string
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
        retained REAL NOT NULL,
        submitted TEXT
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
        weight REAL NOT NULL,
        DIS INTEGER NOT NULL DEFAULT 0,
        BMS INTEGER NOT NULL DEFAULT 0,
        num_pots_hauled INTEGER,
        landing_discard_date TEXT NOT NULL,
        buyer_transporter_reg_landed_to_keeps TEXT,
        submitted TEXT
      );`,
      `CREATE TABLE IF NOT EXISTS observations (
        id INTEGER PRIMARY KEY,
        animal TEXT NOT NULL,
        species TEXT,
        description TEXT,
        num INTEGER,
        date TEXT NOT NULL,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        notes TEXT,
        submitted TEXT
      );`,
      `CREATE TABLE IF NOT EXISTS behaviours (
        id INTEGER PRIMARY KEY,
        behaviour TEXT NOT NULL,
        observation_id INTEGER NOT NULL,
        FOREIGN KEY(observation_id) REFERENCES observations(id)
      );`,
      `CREATE TABLE IF NOT EXISTS creels (
        id INTEGER PRIMARY KEY,
        date TEXT NOT NULL,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        notes TEXT,
        submitted TEXT
      );`
    ];
    queries.forEach((query) => this.db.executeSql(query, []).catch(
      e => console.log(`Error executing SQL: ${JSON.stringify(e)}`)
    ));
  }

  public async selectCatches(unsubmitted = false): Promise<Catch[]> {
    let query = 'SELECT * FROM catches ORDER BY id DESC LIMIT 50;';
    if (unsubmitted) {
      query = 'SELECT * FROM catches WHERE submitted IS NULL;';
    }
    return this.db.executeSql(query, []).then(
      res => {
        const catches = [];
        for (let i = 0; i < res.rows.length; i ++) {
          const row = res.rows.item(i);
          const caught = new Catch(row.id);
          caught.date = new Date(row.date);
          caught.species = row.species.trim();
          caught.caught = row.caught;
          caught.retained = row.retained;
          catches.push(caught);
        }
        return catches;
      }
    ).catch(e => {
      console.log(`Error executing SQL: ${JSON.stringify(e)}`);
      return [] as Catch[];
    });
  }

  public async selectUnsubmittedCatches(): Promise<Catch[]> {
    return this.selectCatches(true);
  }

  public async insertOrUpdateCatch(caught: Catch) {
    let query = `INSERT INTO catches (date, species, caught, retained)
      VALUES (?, ?, ?, ?);`;
    const params = [
      caught.date.toISOString(),
      caught.species.trim(),
      caught.caught,
      caught.retained
    ];
    if (caught.getId()) {
      query = `UPDATE catches SET
          date = ?, species = ?, caught = ?, retained = ?
        WHERE id = ?;`;
      params.push(caught.getId());
    }
    this.db.executeSql(query, params).catch(
      e => console.log(`Error executing SQL: ${JSON.stringify(e)}`)
    );
  }

  private buildEntry(row: EntryRow): F1FormEntry {
    const entry = new F1FormEntry(row.id);
    entry.activityDate = new Date(row.activity_date);
    entry.setLatitude(row.latitude);
    entry.setLongitude(row.longitude);
    entry.gear = row.gear;
    entry.meshSize = row.mesh_size;
    entry.species = row.species;
    entry.state = row.state;
    entry.presentation = row.presentation;
    entry.weight = row.weight;
    entry.DIS = !!row.DIS;
    entry.BMS = !!row.BMS;
    entry.numPotsHauled = row.num_pots_hauled;
    entry.landingDiscardDate = new Date(row.landing_discard_date);
    entry.buyerTransporterRegLandedToKeeps = row.buyer_transporter_reg_landed_to_keeps;
    return entry;
  }

  public async selectEntry(id: number): Promise<F1FormEntry> {
    return this.db.executeSql(
      'SELECT * FROM entries WHERE id = ?;', [id]
    ).then(
      res => {
        const row = res.rows.item(0);
        return this.buildEntry(row);
      }
    ).catch(e => {
      console.log(`Error executing SQL: ${JSON.stringify(e)}`);
      return null;
    });
  }

  public async selectEntrySummaries(
    startDate: Date = null,
    endDate: Date = null
  ): Promise<F1FormEntrySummary[]> {
    let query = `SELECT id, activity_date, species FROM entries
       ORDER BY id DESC LIMIT 50`;
    let params = [];
    if (startDate && endDate) {
      query = `SELECT id, activity_date, species FROM entries
               WHERE activity_date >= ? AND activity_date < ?
               ORDER BY activity_date DESC;`;
      params = [startDate.toISOString(), endDate.toISOString()];
    }
    return this.db.executeSql(query, params).then(
      res => {
        const entries: F1FormEntrySummary[] = [];
        for (let i = 0; i < res.rows.length; i ++) {
          const row = res.rows.item(i);
          const activityDate = new Date(row.activity_date);
          entries.push(
            {
              id: row.id,
              activityDate,
              species: row.species,
            }
          );
        }
        return entries;
      }
    ).catch(e => {
      console.log(`Error executing SQL: ${JSON.stringify(e)}`);
      return [] as F1FormEntrySummary[];
    });
  }

  public async selectEntrySummariesBetweenDates(
    startDate: Date,
    endDate: Date = new Date()
  ): Promise<F1FormEntrySummary[]> {
    return this.selectEntrySummaries(startDate, endDate);
  }

  public async selectFullEntriesBetweenDates(
    startDate: Date,
    endDate: Date = new Date()
  ): Promise<F1FormEntry[]> {
    return this.db.executeSql(
      `SELECT * FROM entries
       WHERE activity_date >= ? AND activity_date < ?
       ORDER BY activity_date ASC`,
      [startDate.toISOString(), endDate.toISOString()]
    ).then(
      res => {
        const entries: Array<F1FormEntry> = [];
        for (let i = 0; i < res.rows.length; i ++) {
          const row = res.rows.item(i);
          entries.push(this.buildEntry(row));
        }
        return entries;
      }
    ).catch(e => {
      console.log(`Error executing SQL: ${JSON.stringify(e)}`);
      return [] as F1FormEntry[];
    });
  }

  public async selectUnsubmittedEntries(): Promise<F1FormEntry[]> {
    return this.db.executeSql(
      `SELECT * FROM entries WHERE submitted IS NULL`, []
    ).then(
      res => {
        const entries: Array<F1FormEntry> = [];
        for (let i = 0; i < res.rows.length; i ++) {
          const row = res.rows.item(i);
          entries.push(this.buildEntry(row));
        }
        return entries;
      }
    ).catch(e => {
      console.log(`Error executing SQL: ${JSON.stringify(e)}`);
      return [] as F1FormEntry[];
    });
  }

  public async selectEarliestEntryDate(): Promise<Date> {
    return this.db.executeSql(
      'SELECT MIN(activity_date) AS min_date FROM entries;',
      []
    ).then(res => {
        return new Date(res.rows.item(0).min_date);
    }).catch(e => {
      console.log(`Error executing SQL: ${JSON.stringify(e)}`);
      return new Date();
    });
  }

  public async insertOrUpdateEntry(entry: F1FormEntry) {
    let query = `INSERT INTO entries
        (activity_date, latitude, longitude, gear, mesh_size, species,
        state, presentation, weight, DIS, BMS, num_pots_hauled,
        landing_discard_date, buyer_transporter_reg_landed_to_keeps)
      VALUES
        (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`;
    const params = [
      entry.activityDate.toISOString(),
      entry.getLatitude(),
      entry.getLongitude(),
      entry.gear,
      entry.meshSize,
      entry.species,
      entry.state,
      entry.presentation,
      entry.weight,
      (entry.DIS ? 1 : 0),
      (entry.BMS ? 1 : 0),
      entry.numPotsHauled,
      entry.landingDiscardDate,
      entry.buyerTransporterRegLandedToKeeps
    ];
    if (entry.getId()) {
      query = `UPDATE entries SET
          activity_date = ?,
          latitude = ?,
          longitude = ?,
          gear = ?,
          mesh_size = ?,
          species = ?,
          state = ?,
          presentation = ?,
          weight = ?,
          DIS = ?,
          BMS = ?,
          num_pots_hauled = ?,
          landing_discard_date = ?,
          buyer_transporter_reg_landed_to_keeps = ?
        WHERE id = ?;`;
      params.push(entry.getId());
    }
    this.db.executeSql(query, params).catch(
      e => console.log(`Error executing SQL: ${JSON.stringify(e)}`)
    );
  }

  public async deleteEntry(id: number) {
    this.db.executeSql(
      'DELETE FROM entries WHERE id =?;', [id]
    ).catch(e => {
      console.log(`Error executing SQL: ${JSON.stringify(e)}`);
    });
  }

  public async selectObservations(unsubmitted = false): Promise<WildlifeObservation[]>{
    let query = 'SELECT * FROM observations ORDER BY id DESC LIMIT 50;';
    if (unsubmitted) {
      query = `SELECT * FROM observations WHERE submitted IS NULL;`;
    }
    return this.db.executeSql(
      query, []
    ).then(res => {
      const observations = [];
      for (let i = 0; i < res.rows.length; i++) {
        const row = res.rows.item(i);
        const observation = new WildlifeObservation(row.id);
        observation.animal = row.animal.trim();
        observation.species = row.species?.trim();
        observation.description = row.description?.trim();
        observation.num = row.num;
        observation.date = new Date(row.date);
        observation.setLatitude(row.latitude);
        observation.setLongitude(row.longitude);
        observation.behaviour = [];
        observation.notes = row.notes?.trim();
        this.db.executeSql(
          'SELECT * FROM behaviours WHERE observation_id = ?;', [row.id]
        ).then(
          result => {
            for (let j = 0; j < result.rows.length; j++) {
              const beRow = result.rows.item(j);
              observation.behaviour.push(beRow.behaviour.trim());
            }
          }
        ).catch(
          e => console.log(`Error executing SQL (selecting behaviours): ${JSON.stringify(e)}`)
        );
        observations.push(observation);
      }
      return observations;
    }).catch(e => {
      console.log(`Error executing SQL (selecting observations): ${JSON.stringify(e)}`);
      return [] as WildlifeObservation[];
    });
  }

  public async selectUnsubmittedObservations(): Promise<WildlifeObservation[]> {
    return this.selectObservations(true);
  }

  public async insertObservation(observation: WildlifeObservation) {
    const observationQuery = `INSERT INTO observations
        (animal, species, description, num, date, latitude, longitude, notes)
      VALUES (? ,?, ?, ?, ?, ?, ?, ?);`;
    const behaviourQuery = `INSERT INTO behaviours (behaviour, observation_id)
      VALUES (?, ?);`;
    const observationParams = [
      observation.animal,
      observation.species,
      observation.description,
      observation.num,
      observation.getDateString(),
      observation.getLatitude(),
      observation.getLongitude(),
      observation.notes
    ];
    this.db.executeSql(
      observationQuery, observationParams
    ).then(
      result => {
        observation.behaviour.forEach(
          behaviour => {
            const behaviourParams = [
              behaviour,
              result.insertId
            ];
            this.db.executeSql(
              behaviourQuery, behaviourParams
            ).catch(
              e => console.log(`Error executing SQL (inserting behaviour): ${JSON.stringify(e)}`)
            );
          }
        );
      }
    ).catch(
      e => console.log(`Error executing SQL (inserting observation): ${JSON.stringify(e)}`)
    );
  }

  public async selectCreels(unsubmitted = false): Promise<Creel[]>{
    let query = 'SELECT * FROM creels ORDER BY id DESC LIMIT 50;';
    if (unsubmitted) {
      query = `SELECT * FROM creels WHERE submitted IS NULL;`;
    }
    return this.db.executeSql(
      query, []
    ).then(res => {
      const creels = [];
      for (let i = 0; i < res.rows.length; i++) {
        const row = res.rows.item(i);
        const creel = new Creel(row.id);
        creel.date = new Date(row.date);
        creel.setLatitude(row.latitude);
        creel.setLongitude(row.longitude);
        creel.notes = row.notes?.trim();
        creels.push(creel);
      }
      return creels;
    }).catch(e => {
      console.log(`Error executing SQL (selecting creels): ${JSON.stringify(e)}`);
      return [] as Creel[];
    });
  }

  public async selectUnsubmittedCreels(): Promise<Creel[]> {
    return this.selectCreels(true);
  }

  public async insertCreel(creel: Creel) {
    const creelQuery = `INSERT INTO creels
        (date, latitude, longitude, notes) VALUES (?, ?, ?, ?);`;
    const creelParams = [
      creel.getDateString(),
      creel.getLatitude(),
      creel.getLongitude(),
      creel.notes
    ];
    this.db.executeSql(
      creelQuery, creelParams
    ).catch(
      e => console.log(`Error executing SQL (inserting creel): ${JSON.stringify(e)}`)
    );
  }

  public async markAsSubmitted(table: string, ids: Array<number>) {
    if (ids.length > 0) {
      const now = new Date();
      this.db.transaction(tx => {
        for (const id of ids) {
          tx.executeSql(
            `UPDATE ${table} SET submitted = ?1 WHERE id = ?2;`,
            [now.toISOString(), id],
            (_, result) => console.log(JSON.stringify(result)),
            (_, e) => console.log(`Error executing SQL: ${JSON.stringify(e)}`)
          );
        }
      }).then(
        response => console.log(response)
      ).catch(
        e => console.log(`Error executing SQL: ${JSON.stringify(e)}`)
      );
    }
  }
}
