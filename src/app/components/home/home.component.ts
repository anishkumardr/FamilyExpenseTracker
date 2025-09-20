import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-home',
  imports: [CommonModule, MatCardModule, MatIconModule, MatButtonModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {
legend = [
    {label:'Personal care', color:'#ff5a5f'},
    {label:'Groceries', color:'#00b894'},
    {label:'Clothing', color:'#0984e3'},
    {label:'Eating out', color:'#fdcb6e'}
  ];

  topExpenses = [
    {date: '16 Sep', category:'Groceries', amount: 1200, desc: 'Weekly groceries'},
    {date: '15 Sep', category:'Transport', amount: 450, desc: 'Cab to airport'},
    {date: '13 Sep', category:'Coffee', amount: 200, desc: 'Cafe'}
  ];
}
