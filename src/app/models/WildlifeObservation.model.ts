import { RecordWithLocation } from './RecordWithLocation.model';

export class WildlifeObservation extends RecordWithLocation {

  public animal: string;
  public species: string;
  public description: string;
  public num = 0;
  public date: Date;
  public behaviour: Array<string>;
  public notes: string;

  public static getWildlifeAnimals() {
    return [
      { name: 'Seal', subspecies: ['Harbour (Common) Seal', 'Grey Seal']},
      { name: 'Porpoise', subspecies: ['Harbour Porpoise']},
      { name: 'Dolphin', subspecies: [
        'Bottlenose Dolphin',
        'Common Dolphin',
        'Risso\'s Dolphin',
        'White-beaked Dolphin',
        'Atlantic White-sided Dolphin',
        'Killer Whale (Orca)',
        'Pilot Whale'
      ]},
      { name: 'Whale', subspecies: [
        'Minke Whale',
        'Humpback Whale',
        'Sperm Whale',
        'Fin Whale',
        'Sei Whale'
      ]},
      { name: 'Shark', subspecies: ['Basking Shark', 'Porbeagle Shark']}
    ];
  }

  public static getWildlifeSpecies(animal: string) {
    for (const species of WildlifeObservation.getWildlifeAnimals()) {
      if (animal?.toLowerCase().trim() === species.name.toLowerCase().trim()) {
        return species.subspecies;
      }
    }
    return [];
  }

  public static getWildlifeBehaviours() {
    return [
      'Approaching the vessel',
      'Feeding',
      'Interacting with fishing gear',
      'Bow-riding',
      'Breaching',
      'Travelling'
    ];
  }

  constructor(id?: number) {
    super(id);
    this.behaviour = [];
    this.date = new Date();
  }

  public getDateString(format: 'ISO' | 'local' = 'ISO', time = false): string {
    if (this.date) {
      return WildlifeObservation.dateToString(this.date, format, time);
    }
    return '';
  }

  public isComplete(): boolean {
    return (
      this.animal &&
      (this.species || this.description) &&
      this.num &&
      this.date &&
      this.behaviour.length > 0
    );
  }

}
