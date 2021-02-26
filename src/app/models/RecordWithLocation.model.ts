export type LatLng = {
  latDeg: number
  latMin: number
  latDir: 'N' | 'S'
  lngDeg: number
  lngMin: number
  lngDir: 'E' | 'W'
};

export abstract class RecordWithLocationAndDate {

  private latitude: number;
  private longitude: number;

  private static localeDateFormat = {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }

  public setLatitude(latVal: number) {
    if (latVal >= -90 && latVal <= 90) {
      this.latitude = latVal;
    }
    else {
      console.log(`Supplied latitude value (${latVal}) out of bounds`);
    }
  }

  public getLatitude() {
    return this.latitude;
  }

  public setLongitude(lngVal: number) {
    if (lngVal >= -180 && lngVal <= 180) {
      this.longitude = lngVal;
    }
    else {
      console.log(`Supplied longitude value (${lngVal}) out of bounds`);
    }
  }

  public getLongitude() {
    return this.longitude;
  }

  public getLatLng(): LatLng {
    if (this.latitude != null && this.longitude != null) {
      const absLat = Math.abs(this.latitude);
      const latDeg = Math.floor(absLat);
      const latMin = Math.floor((absLat - latDeg) * 60);
      const latDir = ((this.latitude > 0) ? "N" : "S");

      const absLng = Math.abs(this.longitude);
      const lngDeg = Math.floor(absLng);
      const lngMin = Math.floor((absLng - lngDeg) * 60);
      const lngDir = ((this.longitude > 0) ? "E" : "W");

      return {
        latDeg: latDeg,
        latMin: latMin,
        latDir: latDir,
        lngDeg: lngDeg,
        lngMin: lngMin,
        lngDir: lngDir
      };
    }
    return null;
  }

  public getLocation(): string {
    if (this.latitude != null && this.longitude != null) {
      const latLng = this.getLatLng();
      if (latLng) {
        return `${latLng.latDeg}° ${latLng.latMin}' ${latLng.latDir},
                ${latLng.lngDeg}° ${latLng.lngMin}' ${latLng.lngDir}`;
      }
    }
    return '';
  }

  static dateToString(date: Date, format: 'ISO' | 'local' = 'ISO'): string {
    if (format == 'ISO') {
      return date.toISOString();
    }
    else {
      return date.toLocaleDateString(
        'en-gb', this.localeDateFormat
      );
    }
  }

}
