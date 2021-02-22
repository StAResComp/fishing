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
  weight: number
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
};

export type Observation = {
  id?: number
  animal: string
  species?: string
  description?: string
  num: number
  date: Date
  location: {
    lat: number
    lng: number
  }
  behaviour: Array<string>
  notes: string
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
        num_pots_hauled INTEGER NOT NULL,
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
      );`
    ];
    queries.forEach((query) => this.db.executeSql(query, []).catch(
      e => console.log(`Error executing SQL: ${JSON.stringify(e)}`)
    ));
  }

  public async selectCatches(unsubmitted = false): Promise<CompleteCatch[]> {
    let query = 'SELECT * FROM catches ORDER BY id DESC LIMIT 50;'
    if (unsubmitted) {
      query = 'SELECT * FROM catches WHERE submitted IS NULL;'
    }
    return this.db.executeSql(query, []).then(
      res => {
        const catches = [];
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
        return catches;
      }
    ).catch(e => {
      console.log(`Error executing SQL: ${JSON.stringify(e)}`);
      return [] as CompleteCatch[];
    });
  }

  public async selectUnsubmittedCatches(): Promise<CompleteCatch[]> {
    return this.selectCatches(true);
  }

  public async insertOrUpdateCatch(caught: CompleteCatch) {
    let query = `INSERT INTO catches (date, species, caught, retained)
      VALUES (?, ?, ?, ?);`;
    const params =[
      caught.date.toISOString(),
      caught.species.trim(),
      caught.caught,
      caught.retained
    ];
    if (caught.id) {
      query = `UPDATE catches SET
          date = ?, species = ?, caught = ?, retained = ?
        WHERE id = ?;`;
      params.push(caught.id);
    }
    this.db.executeSql(query, params).catch(
      e => console.log(`Error executing SQL: ${JSON.stringify(e)}`)
    );
  }

  public async selectEntry(id: number): Promise<CompleteEntry> {
    return this.db.executeSql(
      'SELECT * FROM entries WHERE id = ?;', [id]
    ).then(
      res => {
        const entry = {};
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
        entry['weight'] = row.weight;
        entry['DIS'] = !!row.DIS;
        entry['BMS'] = !!row.BMS;
        entry['numPotsHauled'] = row.num_pots_hauled;
        entry['landingDiscardDate'] = new Date(row.landing_discard_date);
        entry['buyerTransporterRegLandedToKeeps'] = row.buyer_transporter_reg_landed_to_keeps;
        return entry;
      }
    ).catch(e => {
      console.log(`Error executing SQL: ${JSON.stringify(e)}`)
      return null;
    });
  }

  public async selectEntrySummaries(
    startDate: Date = null,
    endDate: Date = null
  ): Promise<EntrySummary[]> {
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
        const entries: EntrySummary[] = [];
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
        return entries;
      }
    ).catch(e => {
      console.log(`Error executing SQL: ${JSON.stringify(e)}`)
      return [] as EntrySummary[];
    });
  }

  public async selectEntrySummariesBetweenDates(
    startDate: Date,
    endDate:Date = new Date()
  ): Promise<EntrySummary[]> {
    return this.selectEntrySummaries(startDate, endDate);
  }

  public async selectFullEntriesBetweenDates(
    startDate: Date,
    endDate:Date = new Date()
  ): Promise<CompleteEntry[]> {
    return this.db.executeSql(
      `SELECT * FROM entries
       WHERE activity_date >= ? AND activity_date < ?
       ORDER BY activity_date ASC`,
      [startDate.toISOString(), endDate.toISOString()]
    ).then(
      res => {
        const entries: Array<CompleteEntry> = [];
        for(let i = 0; i < res.rows.length; i ++) {
          const row = res.rows.item(i);
          const activityDate = new Date(row.activity_date);
          const landingDiscardDate = new Date(row.landing_discard_date);
          entries.push(
            {
              id: row.id,
              activityDate: activityDate,
              latitude: row.latitude,
              longitude: row.longitude,
              gear: row.gear,
              meshSize: row.mesh_size,
              species: row.species,
              state: row.state,
              presentation: row.presentation,
              weight: row.weight,
              DIS: !!row.DIS,
              BMS: !!row.BMS,
              numPotsHauled: row.num_pots_hauled,
              landingDiscardDate: landingDiscardDate,
              buyerTransporterRegLandedToKeeps: row.buyer_transporter_reg_landed_to_keeps
            }
          );
        }
        return entries;
      }
    ).catch(e => {
      console.log(`Error executing SQL: ${JSON.stringify(e)}`)
      return [] as CompleteEntry[];
    });
  }

  public async selectUnsubmittedEntries(): Promise<CompleteEntry[]> {
    return this.db.executeSql(
      `SELECT * FROM entries WHERE submitted IS NULL`, []
    ).then(
      res => {
        const entries: Array<CompleteEntry> = [];
        for(let i = 0; i < res.rows.length; i ++) {
          const row = res.rows.item(i);
          const activityDate = new Date(row.activity_date);
          const landingDiscardDate = new Date(row.landing_discard_date);
          entries.push(
            {
              id: row.id,
              activityDate: activityDate,
              latitude: row.latitude,
              longitude: row.longitude,
              gear: row.gear,
              meshSize: row.mesh_size,
              species: row.species,
              state: row.state,
              presentation: row.presentation,
              weight: row.weight,
              DIS: !!row.DIS,
              BMS: !!row.BMS,
              numPotsHauled: row.num_pots_hauled,
              landingDiscardDate: landingDiscardDate,
              buyerTransporterRegLandedToKeeps: row.buyer_transporter_reg_landed_to_keeps
            }
          );
        }
        return entries;
      }
    ).catch(e => {
      console.log(`Error executing SQL: ${JSON.stringify(e)}`);
      return [] as CompleteEntry[];
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

  public async insertOrUpdateEntry(entry: CompleteEntry) {
    let query = `INSERT INTO entries
        (activity_date, latitude, longitude, gear, mesh_size, species,
        state, presentation, weight, DIS, BMS, num_pots_hauled,
        landing_discard_date, buyer_transporter_reg_landed_to_keeps)
      VALUES
        (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`;
    const params = [
      entry.activityDate.toISOString(),
      entry.latitude,
      entry.longitude,
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
          weight = ?,
          DIS = ?,
          BMS = ?,
          num_pots_hauled = ?,
          landing_discard_date = ?,
          buyer_transporter_reg_landed_to_keeps = ?
        WHERE id = ?;`;
      params.push(entry.id);
    }
    this.db.executeSql(query, params).catch(
      e => console.log(`Error executing SQL: ${JSON.stringify(e)}`)
    );
  }

  public async selectObservations(unsubmitted = false): Promise<Observation[]>{
    let query = 'SELECT * FROM observations ORDER BY id DESC LIMIT 50;';
    if (unsubmitted) {
      query = `SELECT * FROM observations WHERE submitted IS NULL;`;
    }
    return this.db.executeSql(
      query, []
    ).then(res => {
      const observations = [];
      for(let i = 0; i < res.rows.length; i++) {
        const row = res.rows.item(i);
        const date = new Date(row.date);
        const observation = {
          id: row.id,
          animal: row.animal.trim(),
          species: row.species.trim(),
          description: row.description.trim(),
          num: row.num,
          date: date,
          location: {
            lat: row.latitude,
            lng: row.longitude
          },
          behaviour: [],
          notes: row.notes.trim()
        }
        this.db.executeSql(
          'SELECT * FROM behaviours WHERE observation_id = ?;', [row.id]
        ).then(
          result => {
            for(let j = 0; j < result.rows.length; j++) {
              const beRow = result.rows.item(j);
              observation.behaviour.push(beRow.behaviour.trim());
            }
          }
        ).catch(
          e => console.log(`Error executing SQL: ${JSON.stringify(e)}`)
        );
        observations.push(observation);
      }
      return observations;
    }).catch(e => {
      console.log(`Error executing SQL: ${JSON.stringify(e)}`);
      return [] as Observation[];
    });
  }

  public async selectUnsubmittedObservations(): Promise<Observation[]> {
    return this.selectObservations(true);
  }

  public async insertObservation(observation: Observation) {
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
      observation.date.toISOString(),
      observation.location.lat,
      observation.location.lng,
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
              e => console.log(`Error executing SQL: ${JSON.stringify(e)}`)
            );
          }
        );
      }
    ).catch(
      e => console.log(`Error executing SQL: ${JSON.stringify(e)}`)
    );
  }

  public async markAsSubmitted(table: string, ids: Array<number>) {
    if (ids.length > 0) {
      const now = new Date();
      this.db.transaction(tx => {
        for (let i = 0; i < ids.length; i++) {
          tx.executeSql(
            `UPDATE ${table} SET submitted = ?1 WHERE id = ?2;`,
            [now.toISOString(), ids[i]],
            (tx, result) => console.log(JSON.stringify(result)),
            (tx, e) => console.log(`Error executing SQL: ${JSON.stringify(e)}`)
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

