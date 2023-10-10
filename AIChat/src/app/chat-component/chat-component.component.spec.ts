import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChatComponentComponent } from './chat-component.component';

describe('ChatComponentComponent', () => {
  let component: ChatComponentComponent;
  let fixture: ComponentFixture<ChatComponentComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ChatComponentComponent]
    });
    fixture = TestBed.createComponent(ChatComponentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
