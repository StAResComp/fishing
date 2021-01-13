import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { MapModalPage } from './map-modal.page';

describe('MapModalPage', () => {
  let component: MapModalPage;
  let fixture: ComponentFixture<MapModalPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MapModalPage ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(MapModalPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
