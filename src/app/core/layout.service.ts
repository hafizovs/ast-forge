import { Injectable } from '@angular/core';
import { computeLayout } from '../domain/compiler/layout-engine';
import type { Program } from '../features/workbench/compiler.types';

@Injectable({ providedIn: 'root' })
export class LayoutService {
  compute(program: Program) {
    return computeLayout(program);
  }
}
