import { Injectable } from "@angular/core";
import { Platform } from '@ionic/angular';
import { SQLite, SQLiteObject } from '@ionic-native/sqlite/ngx';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable()
export class DbService {

  private storage: SQLiteObject;
  message: BehaviorSubject<string> = new BehaviorSubject("Message not set");

  constructor(
    private platform: Platform,
    private sqlite: SQLite
  ) {
    this.platform.ready().then(() => {
      this.sqlite.create({
        name: 'fishing.db',
        location: 'default'
      }).then((db: SQLiteObject) => {
        this.storage = db;
        this.setupDatabase();
      });
    });
  }

  getContents() {
    this.storage?.executeSql(
      'SELECT * FROM test_table;',
      []
    ).then(
      res => {
        this.message.next(res.rows.item(0).description);
        console.log(res.rows.item(0).description);
      }
    ).catch(
      e => {
        console.log('Error executing SQL: ' + JSON.stringify(e))
        this.message.next("Error");
      }
    );
  }

  getMessage() {
    return this.message.asObservable();
  }

  setupDatabase() {
    const queries = [
      'CREATE TABLE IF NOT EXISTS test_table (id int NOT NULL, description varchar NOT NULL);',
      'INSERT INTO test_table VALUES (1, "First test value");'
    ];
    queries.forEach((query) => this.executeNoReturnQuery(query));
  }

  private executeNoReturnQuery(query: string, params: Array<string> = []) {
    this.storage.executeSql(query, params).catch(
      e => console.log(`Error executing SQL: ${JSON.stringify(e)}`)
    )
  }
}

