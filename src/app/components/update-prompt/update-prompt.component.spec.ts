import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UpdatePromptComponent } from './update-prompt.component';

describe('UpdatePromptComponent', () => {
  let component: UpdatePromptComponent;
  let fixture: ComponentFixture<UpdatePromptComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UpdatePromptComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UpdatePromptComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});