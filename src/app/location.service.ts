import { Injectable } from "@angular/core";
import {
  BackgroundGeolocation,
  BackgroundGeolocationConfig,
  BackgroundGeolocationEvents,
  BackgroundGeolocationResponse
} from '@ionic-native/background-geolocation/ngx';
import { DbService } from "./db.service";

/**
 * Service to handle location tracking and logging.
 */
@Injectable()
export class LocationService {

  private static readonly config: BackgroundGeolocationConfig = {
    desiredAccuracy: 10,
    stationaryRadius: 20,
    distanceFilter: 30,
    debug: true,
    stopOnTerminate: false
  };

  constructor(
    private backgroundGeolocation: BackgroundGeolocation,
    private db: DbService
  ) {
    this.backgroundGeolocation.configure(LocationService.config).then(() => {
      this.backgroundGeolocation.on(
        BackgroundGeolocationEvents.location
      ).subscribe((location: BackgroundGeolocationResponse) => {
        this.backgroundGeolocation.finish();
      });
    });
  }

  public startTracking() {
    this.backgroundGeolocation.start();
  }

  public stopTracking() {
    this.backgroundGeolocation.stop();
  }

  public isTracking(): boolean {
    let tracking = false;
    this.backgroundGeolocation.checkStatus().then(
      status => tracking = status.isRunning
    );
    return tracking;
  }

}
