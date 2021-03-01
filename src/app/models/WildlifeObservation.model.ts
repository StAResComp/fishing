import { RecordWithLocation } from './RecordWithLocation.model';

export class WildlifeObservation extends RecordWithLocation {

  public animal: string;
  public species: string;
  public description: string;
  public num: number = 0;
  public date: Date;
  public behaviour: Array<string>;
  public notes: string;

  constructor(id?: number) {
    super(id);
    this.behaviour = [];
    this.date = new Date();
  }

  public getDateString(format: 'ISO' | 'local' = 'ISO'): string {
    if (this.date) {
      return WildlifeObservation.dateToString(this.date, format);
    }
    return "";
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

  public static getWildlifeAnimals() {
    return [
      { name: "Seal", subspecies: ["Harbour (Common) Seal", "Grey Seal"]},
      { name: "Porpoise", subspecies: ["Harbour Porpoise"]},
      { name: "Dolphin", subspecies: [
        "Bottlenose Dolphin",
        "Common Dolphin",
        "Risso's Dolphin",
        "White-beaked Dolphin",
        "Atlantic White-sided Dolphin",
        "Killer Whale (Orca)",
        "Pilot Whale"
      ]},
      { name: "Whale", subspecies: [
        "Minke Whale",
        "Humpback Whale",
        "Sperm Whale",
        "Fin Whale",
        "Sei Whale"
      ]},
      { name: "Shark", subspecies: ["Basking Shark", "Porbeagle Shark"]}
    ];
  }

  public static getWildlifeSpecies(species: string) {
    const allSpecies = WildlifeObservation.getWildlifeAnimals();
    for (let i = 0; i < allSpecies.length; i++) {
      if (species?.toLowerCase().trim() ==
          allSpecies[i].name.toLowerCase().trim()) {
        return allSpecies[i].subspecies;
      }
    }
    return [];
  }

  public static getWildlifeBehaviours() {
    return [
      "Approaching the vessel",
      "Feeding",
      "Interacting with fishing gear",
      "Bow-riding",
      "Breaching",
      "Travelling"
    ];
  }

}
