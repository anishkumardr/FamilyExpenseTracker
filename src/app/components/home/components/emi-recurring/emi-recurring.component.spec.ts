import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmiRecurringComponent } from './emi-recurring.component';

describe('EmiRecurringComponent', () => {
  let component: EmiRecurringComponent;
  let fixture: ComponentFixture<EmiRecurringComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmiRecurringComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EmiRecurringComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
