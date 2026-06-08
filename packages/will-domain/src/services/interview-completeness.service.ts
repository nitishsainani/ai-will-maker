import { Will } from '../entities/will.entity';
import { MIN_WITNESSES } from '../validation/validation-utils';

export interface InterviewField {
  key: string;
  label: string;
  priority: number;
  satisfied: boolean;
}

type RequiredField = {
  key: string;
  label: string;
  priority: number;
  isSatisfied: (will: Will) => boolean;
};

const REQUIRED_FIELDS: RequiredField[] = [
  {
    key: 'testator.name',
    label: 'Testator full legal name',
    priority: 1,
    isSatisfied: (will) => Boolean(will.testatorName?.trim()),
  },
  {
    key: 'beneficiary.',
    label: 'At least one beneficiary',
    priority: 2,
    isSatisfied: (will) => will.beneficiaries.length >= 1,
  },
  {
    key: 'executor.',
    label: 'At least one executor',
    priority: 3,
    isSatisfied: (will) => will.executors.length >= 1,
  },
  {
    key: 'asset.',
    label: 'Specific assets to bequeath',
    priority: 4,
    isSatisfied: (will) => will.assetAllocations.length >= 1,
  },
  {
    key: 'guardian.',
    label: 'Guardian for minor beneficiaries',
    priority: 5,
    isSatisfied: (will) => will.guardians.length >= 1,
  },
  {
    key: 'witness.',
    label: `At least ${MIN_WITNESSES} witnesses`,
    priority: 6,
    isSatisfied: (will) => will.witnesses.length >= MIN_WITNESSES,
  },
];

export class InterviewCompletenessService {
  getMissingFields(will: Will): InterviewField[] {
    return REQUIRED_FIELDS.map((field) => ({
      key: field.key,
      label: field.label,
      priority: field.priority,
      satisfied: field.isSatisfied(will),
    })).filter((f) => !f.satisfied);
  }

  getAllFields(will: Will): InterviewField[] {
    return REQUIRED_FIELDS.map((field) => ({
      key: field.key,
      label: field.label,
      priority: field.priority,
      satisfied: field.isSatisfied(will),
    }));
  }

  getNextTopic(will: Will): string {
    const missing = this.getMissingFields(will);
    if (missing.length === 0) {
      return 'review';
    }
    return missing.sort((a, b) => a.priority - b.priority)[0].key;
  }

  isComplete(will: Will): boolean {
    const coreFields = REQUIRED_FIELDS.filter((f) => f.priority <= 4);
    return coreFields.every((field) => field.isSatisfied(will));
  }

  getProgressPercent(will: Will): number {
    const all = this.getAllFields(will);
    const satisfied = all.filter((f) => f.satisfied).length;
    return Math.round((satisfied / all.length) * 100);
  }

  getQuestionForTopic(topic: string, will: Will): string {
    if (topic.startsWith('witness.')) {
      const witnessCount = will.witnesses.length;
      if (witnessCount === 0) {
        return 'Who will serve as the first witness to your will? Please provide their full legal name and address (street, city, and state).';
      }
      if (witnessCount < MIN_WITNESSES) {
        return 'Who will serve as the second witness? Please provide their full legal name and address (street, city, and state).';
      }
    }

    const questions: Record<string, string> = {
      'testator.name': 'What is your full legal name as it should appear on your will?',
      'beneficiary.': 'Who would you like to name as a beneficiary of your estate?',
      'executor.':
        'Who would you like to appoint as the primary executor of your will? Please provide their full legal name.',
      'asset.': 'Are there any specific assets you would like to leave to someone in particular?',
      'guardian.': 'Do any of your beneficiaries require a guardian? If so, who should serve as guardian?',
      review: 'We have collected the core information. Would you like to review or add anything else?',
    };

    for (const [key, question] of Object.entries(questions)) {
      if (topic.startsWith(key) || topic === key) {
        return question;
      }
    }

    return 'Could you tell me more about your wishes for your will?';
  }
}
