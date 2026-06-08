import { ValidationSpecification } from './validation-specification.port';
import { AllocationPercentageSpecification } from './specifications/allocation-percentage.specification';
import { BeneficiaryExistsSpecification } from './specifications/beneficiary-exists.specification';
import { DuplicateBeneficiaryNameSpecification } from './specifications/duplicate-beneficiary-name.specification';
import { ExecutorExistsSpecification } from './specifications/executor-exists.specification';
import { GuardianSpecification } from './specifications/guardian.specification';
import { PrimaryExecutorSpecification } from './specifications/primary-executor.specification';
import { TestatorNameSpecification } from './specifications/testator-name.specification';
import { WitnessBeneficiaryConflictSpecification } from './specifications/witness-beneficiary-conflict.specification';
import { WitnessCountSpecification } from './specifications/witness-count.specification';

export function createDefaultSpecifications(): ValidationSpecification[] {
  return [
    new BeneficiaryExistsSpecification(),
    new AllocationPercentageSpecification(),
    new GuardianSpecification(),
    new DuplicateBeneficiaryNameSpecification(),
    new ExecutorExistsSpecification(),
    new PrimaryExecutorSpecification(),
    new WitnessCountSpecification(),
    new TestatorNameSpecification(),
    new WitnessBeneficiaryConflictSpecification(),
  ];
}
