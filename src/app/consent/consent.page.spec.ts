import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { ConsentPage } from './consent.page';

describe('ConsentPage', () => {
  let component: ConsentPage;
  let fixture: ComponentFixture<ConsentPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ConsentPage ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(ConsentPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
