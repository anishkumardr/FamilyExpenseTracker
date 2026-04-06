import { Component, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { UpdateService } from '../../services/update.service';

@Component({
  selector: 'app-update-prompt',
  standalone: true,
  imports: [MatIconModule, MatButtonModule],
  templateUrl: './update-prompt.component.html',
  styleUrls: ['./update-prompt.component.scss']
})
export class UpdatePromptComponent implements OnInit {

  constructor(private updateService: UpdateService) { }

  ngOnInit(): void {
  }

  updateNow() {
    this.updateService.forceUpdate();
  }
}