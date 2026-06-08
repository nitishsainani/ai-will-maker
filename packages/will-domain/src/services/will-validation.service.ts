import { Will } from '../entities/will.entity';
import { createDefaultSpecifications } from '../validation/default-validation-specifications';
import { ValidationEngine } from '../validation/validation-engine';
import {
  ValidationIssue,
  ValidationReport,
  ValidationSpecification,
} from '../validation/validation-specification.port';

export type { ValidationIssue, ValidationReport };
export type ValidationResult = ValidationReport;

export class WillValidationService {
  private readonly engine: ValidationEngine;

  constructor(specifications: ValidationSpecification[] = createDefaultSpecifications()) {
    this.engine = new ValidationEngine(specifications);
  }

  validateForReview(will: Will): ValidationReport {
    return this.engine.validate(will, 'review');
  }

  validateForFinalize(will: Will): ValidationReport {
    return this.engine.validate(will, 'finalize');
  }
}
