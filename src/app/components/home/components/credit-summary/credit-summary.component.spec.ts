import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreditSummaryComponent } from './credit-summary.component';

describe('CreditSummaryComponent', () => {
  let component: CreditSummaryComponent;
  let fixture: ComponentFixture<CreditSummaryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreditSummaryComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreditSummaryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
