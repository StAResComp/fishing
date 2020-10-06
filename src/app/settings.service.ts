import { Injectable } from "@angular/core";
import { Storage } from "@ionic/storage";

@Injectable()
export class SettingsService {

  private allowedKeys: Array<string> = ["pln", "vessel_name"];

  constructor(private storage: Storage) {}

  public getKeys() {
    return this.allowedKeys;
  }

  public async get(key: string) : Promise<string> {
    return this.storage.get(this.fullKey(key));
  }

  public set(key: string, value: string) {
    return this.storage.set(this.fullKey(key), value);
  }

  private fullKey(key: string) : string{
    const keyPrefix = "setting";
    if (this.allowedKeys.includes(key)) {
      return `${keyPrefix}:${key}`;
    }
    else {
      throw new Error('Invalid settings key');
    }
  }
}
