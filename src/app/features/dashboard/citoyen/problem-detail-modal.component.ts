import { Component, Input, Output, EventEmitter } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ProblemResponse } from '../../../models/problem.models';

@Component({
  selector: 'app-problem-detail-modal',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './problem-detail-modal.component.html'
})
export class ProblemDetailModalComponent {
  @Input({ required: true }) problem!: ProblemResponse;
  @Output() readonly close = new EventEmitter<void>();

  getAssignedName(): string {
    if (!this.problem.assignedTo) return 'Non assigné';
    return `${this.problem.assignedTo.firstName} ${this.problem.assignedTo.lastName}`;
  }
}
