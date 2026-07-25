import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CompilerWorkbenchComponent } from './components/compiler-workbench/compiler-workbench.component';

@Component({
  selector: 'af-root',
  standalone: true,
  imports: [CompilerWorkbenchComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {}
