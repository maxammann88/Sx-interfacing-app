import prisma from '../prismaClient';

export interface ValidationRuleConfig {
  id?: number;
  configId: string;
  revision: number;
  enableDuplicateCheck: boolean;
  enableStatusCheck: boolean;
  enableMandantCheck: boolean;
  enableChannelCheck: boolean;
  validStatuses: string[]; // ["invoice", "no show", "open"]
  duplicateStrategy: 'first' | 'all' | 'latest';
  validFrom: Date;
  validTo: Date | null;
  createdBy: string;
  createdAt?: Date;
  notes?: string | null;
}

export class ValidationRuleConfigService {
  /**
   * Get the validation rule configuration that is valid at a specific date
   */
  async getConfigAtDate(date: Date): Promise<ValidationRuleConfig> {
    const configRaw = await (prisma as any).validationRuleConfigHistory.findFirst({
      where: {
        configId: 'default',
        validFrom: { lte: date },
        OR: [
          { validTo: null },
          { validTo: { gte: date } },
        ],
      },
      orderBy: { validFrom: 'desc' },
    });

    if (!configRaw) {
      // Return default config if none found
      return this.getDefaultConfig();
    }

    return this.deserializeConfig(configRaw);
  }

  /**
   * Get the current (most recent) validation rule configuration
   */
  async getCurrentConfig(): Promise<ValidationRuleConfig> {
    return this.getConfigAtDate(new Date());
  }

  /**
   * Get all configurations for history display
   */
  async getAllConfigs(): Promise<ValidationRuleConfig[]> {
    const configs = await (prisma as any).validationRuleConfigHistory.findMany({
      where: { configId: 'default' },
      orderBy: { validFrom: 'desc' },
    });

    return configs.map((c: any) => this.deserializeConfig(c));
  }

  /**
   * Save a new revision of the validation rule configuration
   */
  async saveRevision(
    config: Omit<ValidationRuleConfig, 'id' | 'revision' | 'createdAt'>,
    validFrom: Date,
    validTo: Date | null,
    createdBy: string,
    notes?: string
  ): Promise<ValidationRuleConfig> {
    // Get the current highest revision
    const latestConfig = await (prisma as any).validationRuleConfigHistory.findFirst({
      where: { configId: config.configId },
      orderBy: { revision: 'desc' },
    });

    const nextRevision = latestConfig ? latestConfig.revision + 1 : 1;

    // Close any overlapping configurations
    const overlapping = await (prisma as any).validationRuleConfigHistory.findMany({
      where: {
        configId: config.configId,
        validFrom: { lt: validFrom },
        OR: [
          { validTo: null },
          { validTo: { gt: validFrom } },
        ],
      },
    });

    for (const old of overlapping) {
      await (prisma as any).validationRuleConfigHistory.update({
        where: { id: old.id },
        data: { validTo: new Date(validFrom.getTime() - 1) }, // Set to 1ms before new validFrom
      });
    }

    // Create new revision
    const newConfig = await (prisma as any).validationRuleConfigHistory.create({
      data: {
        configId: config.configId,
        revision: nextRevision,
        enableDuplicateCheck: config.enableDuplicateCheck,
        enableStatusCheck: config.enableStatusCheck,
        enableMandantCheck: config.enableMandantCheck,
        enableChannelCheck: config.enableChannelCheck,
        validStatuses: JSON.stringify(config.validStatuses),
        duplicateStrategy: config.duplicateStrategy,
        validFrom,
        validTo,
        createdBy,
        notes: notes || null,
      },
    });

    return this.deserializeConfig(newConfig);
  }

  /**
   * Delete a future configuration (validFrom > today)
   */
  async deleteFutureConfig(configId: string, revision: number): Promise<void> {
    const config = await (prisma as any).validationRuleConfigHistory.findUnique({
      where: {
        configId_revision: {
          configId,
          revision,
        },
      },
    });

    if (!config) {
      throw new Error('Configuration not found');
    }

    const now = new Date();
    if (config.validFrom <= now) {
      throw new Error('Cannot delete past or current configurations');
    }

    await (prisma as any).validationRuleConfigHistory.delete({
      where: { id: config.id },
    });
  }

  /**
   * Deserialize database record to ValidationRuleConfig
   */
  private deserializeConfig(raw: any): ValidationRuleConfig {
    return {
      id: raw.id,
      configId: raw.configId,
      revision: raw.revision,
      enableDuplicateCheck: raw.enableDuplicateCheck,
      enableStatusCheck: raw.enableStatusCheck,
      enableMandantCheck: raw.enableMandantCheck,
      enableChannelCheck: raw.enableChannelCheck,
      validStatuses: JSON.parse(raw.validStatuses),
      duplicateStrategy: raw.duplicateStrategy,
      validFrom: new Date(raw.validFrom),
      validTo: raw.validTo ? new Date(raw.validTo) : null,
      createdBy: raw.createdBy,
      createdAt: new Date(raw.createdAt),
      notes: raw.notes,
    };
  }

  /**
   * Get default configuration (used when no config exists)
   */
  private getDefaultConfig(): ValidationRuleConfig {
    return {
      configId: 'default',
      revision: 0,
      enableDuplicateCheck: true,
      enableStatusCheck: true,
      enableMandantCheck: true,
      enableChannelCheck: true,
      validStatuses: ['invoice', 'no show', 'open'],
      duplicateStrategy: 'first',
      validFrom: new Date('2025-01-01'),
      validTo: null,
      createdBy: 'System',
    };
  }
}

export const validationRuleConfigService = new ValidationRuleConfigService();
