import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { Page } from './page.page';

describe('Page', () => {
  let component: Page;
  let fixture: ComponentFixture<Page>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ Page ],
      imports: [IonicModule.forRoot(), RouterModule.forRoot([], { relativeLinkResolution: 'legacy' })]
    }).compileComponents();

    fixture = TestBed.createComponent(Page);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
