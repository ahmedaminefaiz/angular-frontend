import { ChangeDetectionStrategy, Component, Input, Output, EventEmitter } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ProblemResponse } from '../../../models/problem.models';

@Component({
  selector: 'app-problem-detail-modal',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './problem-detail-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProblemDetailModalComponent {
  @Input({ required: true }) problem!: ProblemResponse;
  @Output() readonly close = new EventEmitter<void>();
}
